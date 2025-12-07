import express from 'express'
import cors from 'cors'
import { chromium } from 'playwright'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import FormData from 'form-data'
import axios from 'axios'

const app = express()
const PORT = process.env.PORT || 3002

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  try {
    console.log('📥 Request recebido no /')
    res.json({ 
      status: 'online',
      service: 'vodvod-scraper',
      version: '2.0.0'
    })
  } catch (error) {
    console.error('❌ Erro no health check:', error)
    res.status(500).json({ error: error.message })
  }
})

app.get('/scrape', async (req, res) => {
  let browser = null
  const startTime = Date.now()
  
  try {
    console.log('🚀 Iniciando scraping...')
    console.log('🔧 Ambiente:', process.env.NODE_ENV)
    console.log('🔧 Playwright executável:', process.env.PLAYWRIGHT_BROWSERS_PATH || 'padrão')
    
    // Configuração otimizada para Render
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      timeout: 60000
    }).catch(err => {
      console.error('❌ Erro detalhado ao iniciar browser:', err)
      throw new Error(`Falha ao iniciar navegador: ${err.message}`)
    })

    console.log('✅ Browser iniciado com sucesso')

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })

    const page = await context.newPage()
    
    // Capturar requisições de API
    const apiResponses = []
    page.on('response', async (response) => {
      const url = response.url()
      if (url.includes('api') || url.includes('vod') || url.includes('m3u8')) {
        try {
          const body = await response.text()
          apiResponses.push({ url, status: response.status(), body: body.substring(0, 500) })
        } catch {}
      }
    })
    
    console.log('📄 Acessando vodvod.top...')
    await page.goto('https://vodvod.top/channels/@odudutips', {
      waitUntil: 'networkidle',
      timeout: 30000
    }).catch(err => {
      console.error('❌ Erro ao carregar página:', err.message)
      throw new Error('Falha ao carregar vodvod.top')
    })

    console.log('⏳ Aguardando VODs carregarem (10 segundos)...')
    await page.waitForTimeout(10000)

    console.log('📡 Requisições de API capturadas:', apiResponses.length)

    console.log('🔍 Extraindo dados...')
    
    // Se capturamos API responses, tentar extrair VODs delas
    if (apiResponses.length > 0) {
      console.log('📦 Processando API responses...')
      apiResponses.forEach(resp => {
        console.log(`  - ${resp.url}`)
      })
    }
    
    const vods = await page.evaluate(() => {
      const results = []
      
      // Buscar todos os links de m3u8
      const allLinks = Array.from(document.querySelectorAll('a'))
      const m3u8Links = allLinks.filter(a => {
        const href = a.href || a.getAttribute('href') || ''
        return href.includes('api.vodvod.top/m3u8/') || href.includes('/m3u8/')
      })
      
      console.log(`Encontrados ${m3u8Links.length} links m3u8`)
      
      m3u8Links.forEach(link => {
        const href = link.href || link.getAttribute('href')
        const match = href.match(/\/m3u8\/(\d+)\/(\d+)\//)
        if (!match) return
        
        const channelId = match[1]
        const vodId = match[2]
        
        // Tentar encontrar elementos pai
        const parent = link.closest('div, article, li') || link.parentElement
        
        // Buscar título
        let title = link.textContent?.trim() || 
                    link.title || 
                    parent?.querySelector('[class*="title"], h1, h2, h3, h4')?.textContent?.trim() ||
                    `VOD ${vodId}`
        
        // Limpar título
        title = title
          .replace(/TRL\s*\+/gi, '')
          .replace(/PRIME\s+(ON|OFF)/gi, '')
          .replace(/🔥/g, '')
          .trim()
        
        // Buscar thumbnail (não usar vodvod.top pois não funciona)
        const img = parent?.querySelector('img')
        const thumbnail = img?.src || img?.dataset?.src || '/videos/thumbnails/odudutips-thumbnail.png'
        
        // Buscar duração
        const durationEl = parent?.querySelector('[class*="duration"]')
        const duration = durationEl?.textContent?.trim() || 'N/A'
        
        // Buscar views
        const viewsEl = parent?.querySelector('[class*="views"], [class*="view"]')
        const views = viewsEl?.textContent?.trim()?.match(/\d+/)?.[0] || '0'
        
        // Buscar data
        const dateEl = parent?.querySelector('[class*="date"], time, [datetime]')
        const date = dateEl?.textContent?.trim() || dateEl?.dateTime || dateEl?.getAttribute('datetime') || new Date().toISOString()
        
        results.push({
          id: vodId,
          vodId: vodId,
          channelId: channelId,
          title: title,
          thumbnail: thumbnail,
          duration: duration,
          views: views,
          date: date,
          url: `https://vodvod.top/vod/${vodId}`,
          m3u8Url: href,
          isPrivate: title.toLowerCase().includes('private') || title.includes('🔒'),
          source: 'vodvod-playwright'
        })
      })
      
      return results
    })

    await browser.close()
    browser = null

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`✅ Scraping completo em ${elapsed}s - ${vods.length} VODs encontrados`)

    if (vods.length === 0) {
      return res.json({
        success: false,
        vods: [],
        count: 0,
        error: 'Nenhum VOD encontrado',
        elapsed: `${elapsed}s`
      })
    }

    res.json({
      success: true,
      vods: vods,
      count: vods.length,
      elapsed: `${elapsed}s`
    })

  } catch (error) {
    console.error('❌ Erro no scraping:', error.message)
    console.error('Stack:', error.stack)
    
    if (browser) {
      try { 
        await browser.close() 
        console.log('✅ Browser fechado')
      } catch (e) {
        console.error('❌ Erro ao fechar browser:', e.message)
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        vods: [],
        count: 0,
        error: error.message,
        elapsed: `${elapsed}s`
      })
    }
  }
})

// Endpoint para gerar thumbnail usando Playwright (screenshot do player)
app.post('/generate-thumbnail', async (req, res) => {
  let browser = null
  let tempFilePath = null
  
  try {
    const { videoUrl, timestamp = 5 } = req.body
    
    if (!videoUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'videoUrl é obrigatório' 
      })
    }
    
    console.log('🖼️ Gerando thumbnail do vídeo:', videoUrl)
    console.log('⏱️ Timestamp:', timestamp, 'segundos')
    
    // Criar arquivo temporário único
    const tempDir = tmpdir()
    tempFilePath = path.join(tempDir, `thumb_${Date.now()}_${Math.random().toString(36).substring(7)}.png`)
    
    console.log('🌐 Abrindo navegador...')
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    })
    
    const page = await context.newPage()
    
    // HTML com player HLS.js
    const playerHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
      <style>
        body { margin: 0; background: #000; display: flex; align-items: center; justify-content: center; }
        video { width: 1280px; height: 720px; object-fit: cover; }
      </style>
    </head>
    <body>
      <video id="video" muted></video>
      <script>
        const video = document.getElementById('video');
        const hls = new Hls({ enableWorker: true });
        hls.loadSource('${videoUrl}');
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play();
        });
      </script>
    </body>
    </html>
    `
    
    console.log('📺 Carregando player...')
    await page.setContent(playerHtml)
    
    // Aguardar vídeo carregar e processar
    console.log('⏳ Aguardando vídeo carregar...')
    await page.waitForTimeout(3000)
    
    // Aguardar até o timestamp desejado
    if (timestamp > 0) {
      console.log(`⏩ Pulando para ${timestamp}s...`)
      await page.evaluate((t) => {
        const video = document.getElementById('video');
        video.currentTime = t;
      }, timestamp)
      
      // Aguardar seek completar
      await page.waitForTimeout(2000)
    }
    
    console.log('📸 Capturando screenshot do vídeo...')
    
    // Capturar apenas o elemento de vídeo (sem controles)
    const videoElement = await page.$('#video')
    if (!videoElement) {
      throw new Error('Elemento de vídeo não encontrado')
    }
    
    await videoElement.screenshot({ 
      path: tempFilePath,
      type: 'jpeg',
      quality: 85
    })
    
    await browser.close()
    browser = null
    
    console.log('✅ Screenshot capturada:', tempFilePath)
    
    // Verificar se arquivo foi criado
    try {
      await fs.access(tempFilePath)
    } catch {
      throw new Error('Screenshot não foi capturada')
    }
    
    console.log('☁️ Fazendo upload para ImgBB...')
    
    // Upload para ImgBB
    const imageBuffer = await fs.readFile(tempFilePath)
    const base64Image = imageBuffer.toString('base64')
    
    const formData = new FormData()
    formData.append('image', base64Image)
    
    const imgbbResponse = await axios.post(
      `https://api.imgbb.com/1/upload?key=2d2733ac18149b6571abee0faad687e9`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 20000 // 20 segundos timeout
      }
    )
    
    if (!imgbbResponse.data || !imgbbResponse.data.data || !imgbbResponse.data.data.url) {
      throw new Error('Resposta inválida do ImgBB')
    }
    
    const thumbnailUrl = imgbbResponse.data.data.url
    console.log('✅ Upload concluído! URL:', thumbnailUrl)
    
    // Limpar arquivo temporário
    try {
      await fs.unlink(tempFilePath)
      console.log('🗑️ Arquivo temporário removido')
    } catch (cleanupError) {
      console.error('⚠️ Erro ao limpar arquivo:', cleanupError)
    }
    
    return res.json({
      success: true,
      thumbnailUrl: thumbnailUrl
    })
    
  } catch (error) {
    console.error('❌ Erro ao gerar thumbnail:', error)
    
    // Fechar navegador se ainda estiver aberto
    if (browser) {
      try {
        await browser.close()
      } catch (e) {
        console.error('⚠️ Erro ao fechar navegador:', e)
      }
    }
    
    // Limpar arquivo temporário em caso de erro
    if (tempFilePath) {
      try {
        await fs.access(tempFilePath)
        await fs.unlink(tempFilePath)
        console.log('🗑️ Arquivo temporário removido após erro')
      } catch (cleanupError) {
        // Arquivo não existe, ignorar
      }
    }
    
    // Se falhar, retorna placeholder
    console.log('🖼️ Retornando placeholder devido ao erro')
    return res.json({
      success: true,
      thumbnailUrl: '/videos/thumbnails/odudutips-thumbnail.png',
      message: 'Erro ao gerar thumbnail, usando placeholder',
      error: error.message
    })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Scraper rodando na porta ${PORT}`)
  console.log(`📍 Test: http://localhost:${PORT}`)
  console.log(`📍 Scrape: http://localhost:${PORT}/scrape`)
  console.log(`📍 Generate Thumbnail: http://localhost:${PORT}/generate-thumbnail`)
})

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
})

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error)
})
