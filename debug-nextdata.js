import { chromium } from 'playwright'

async function checkNextData() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  
  console.log('📄 Acessando vodvod.top...')
  await page.goto('https://vodvod.top/channel/UCMwjHg3kgnHMLQ5IPxRDPKQ/VODs', {
    waitUntil: 'networkidle',
    timeout: 30000
  })
  
  await page.waitForTimeout(5000)
  
  console.log('🔍 Procurando __NEXT_DATA__...')
  const hasNextData = await page.evaluate(() => {
    const el = document.getElementById('__NEXT_DATA__')
    if (!el) return { found: false }
    
    try {
      const data = JSON.parse(el.textContent)
      return {
        found: true,
        keys: Object.keys(data),
        props: data.props ? Object.keys(data.props) : []
      }
    } catch (e) {
      return { found: true, error: e.message }
    }
  })
  
  console.log('__NEXT_DATA__:', JSON.stringify(hasNextData, null, 2))
  
  console.log('\n🔍 Procurando elementos de VOD...')
  const elements = await page.evaluate(() => {
    const selectors = [
      'video', '[class*="vod"]', '[class*="VOD"]', 
      '[class*="stream"]', '[class*="card"]',
      '[data-vod]', '[data-video]'
    ]
    
    const results = {}
    selectors.forEach(sel => {
      const els = document.querySelectorAll(sel)
      if (els.length > 0) {
        results[sel] = els.length
      }
    })
    
    return results
  })
  
  console.log('Elementos encontrados:', elements)
  
  // Capturar requisições de API
  console.log('\n📡 Verificando requisições de rede...')
  await page.route('**/*', route => route.continue())
  
  page.on('response', response => {
    const url = response.url()
    if (url.includes('api') || url.includes('vod') || url.includes('m3u8')) {
      console.log('  📥', response.status(), url.substring(0, 80))
    }
  })
  
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  
  await browser.close()
}

checkNextData()
