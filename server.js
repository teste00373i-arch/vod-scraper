import express from 'express'
import cors from 'cors'
import { chromium } from 'playwright'

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
    
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    }).catch(err => {
      console.error('❌ Erro ao iniciar browser:', err.message)
      throw new Error('Falha ao iniciar navegador')
    })

    console.log('✅ Browser iniciado')

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
        
        // Buscar thumbnail
        const img = parent?.querySelector('img')
        const thumbnail = img?.src || img?.dataset?.src || `https://vodvod.top/thumbnail/${vodId}.jpg`
        
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

app.listen(PORT, () => {
  console.log(`🚀 Scraper rodando na porta ${PORT}`)
  console.log(`📍 Test: http://localhost:${PORT}`)
  console.log(`📍 Scrape: http://localhost:${PORT}/scrape`)
})

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
})

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error)
})
