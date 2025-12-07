import express from 'express'
import cors from 'cors'
import { chromium } from 'playwright'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import FormData from 'form-data'
import axios from 'axios'

// Configurar FFmpeg
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic)
}

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

// Endpoint para gerar thumbnail
app.post('/generate-thumbnail', async (req, res) => {
  let tempFilePath = null
  
  try {
    const { videoUrl, timestamp = '00:00:03' } = req.body
    
    if (!videoUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'videoUrl é obrigatório' 
      })
    }
    
    console.log('🖼️ Gerando thumbnail do vídeo:', videoUrl)
    console.log('⏱️ Timestamp:', timestamp)
    
    // Criar arquivo temporário único
    const tempDir = tmpdir()
    tempFilePath = path.join(tempDir, `thumb_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`)
    
    console.log('📁 Arquivo temporário:', tempFilePath)
    
    // Usar FFmpeg do sistema (instalado via apt-get no Docker)
    await new Promise((resolve, reject) => {
      const command = ffmpeg(videoUrl)
        .setFfmpegPath('/usr/bin/ffmpeg') // FFmpeg do sistema Debian
        .inputOptions([
          '-ss', timestamp,           // Seek antes de ler
          '-t', '3',                  // Lê apenas 3 segundos
          '-reconnect', '1',          // Reconectar se cair
          '-reconnect_streamed', '1', // Reconectar em streams
          '-reconnect_delay_max', '2' // Max 2s de delay
        ])
        .outputOptions([
          '-vframes', '1',            // Apenas 1 frame
          '-vf', 'scale=640:-1',      // Redimensionar para 640px largura
          '-q:v', '2'                 // Qualidade alta
        ])
        .output(tempFilePath)
        .on('start', (cmd) => {
          console.log('🎬 FFmpeg comando:', cmd)
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`📊 Progresso: ${Math.round(progress.percent)}%`)
          }
        })
        .on('error', (err, stdout, stderr) => {
          console.error('❌ FFmpeg erro:', err.message)
          console.error('📋 FFmpeg stderr:', stderr)
          reject(new Error(`FFmpeg falhou: ${err.message}`))
        })
        .on('end', () => {
          console.log('✅ Thumbnail gerada:', tempFilePath)
          resolve()
        })
      
      // Timeout de 30 segundos
      const timeout = setTimeout(() => {
        command.kill('SIGKILL')
        reject(new Error('Timeout: FFmpeg demorou mais de 30 segundos'))
      }, 30000)
      
      command.on('end', () => clearTimeout(timeout))
      command.on('error', () => clearTimeout(timeout))
      
      command.run()
    })
    
    // Verificar se arquivo foi criado
    try {
      await fs.access(tempFilePath)
    } catch {
      throw new Error('Thumbnail não foi gerada')
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
        timeout: 15000 // 15 segundos timeout
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
    
    // Limpar arquivo temporário em caso de erro
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath)
        console.log('🗑️ Arquivo temporário removido após erro')
      } catch (cleanupError) {
        console.error('⚠️ Erro ao limpar:', cleanupError)
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
