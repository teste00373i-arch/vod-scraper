import { chromium } from 'playwright'

async function debugScraping() {
  const browser = await chromium.launch({ headless: false }) // headless: false para ver o navegador
  const page = await browser.newPage()
  
  console.log('📄 Acessando vodvod.top...')
  await page.goto('https://vodvod.top/channel/UCMwjHg3kgnHMLQ5IPxRDPKQ/VODs', {
    waitUntil: 'networkidle',
    timeout: 30000
  })
  
  await page.waitForTimeout(5000)
  
  console.log('🔍 Buscando links m3u8...')
  const links = await page.evaluate(() => {
    const allLinks = Array.from(document.querySelectorAll('a'))
    const m3u8 = allLinks
      .filter(a => (a.href || '').includes('m3u8'))
      .map(a => ({
        href: a.href,
        text: a.textContent?.trim().substring(0, 50),
        parent: a.parentElement?.tagName
      }))
    return {
      totalLinks: allLinks.length,
      m3u8Links: m3u8.length,
      examples: m3u8.slice(0, 5)
    }
  })
  
  console.log('📊 Resultados:')
  console.log(JSON.stringify(links, null, 2))
  
  console.log('\n⏸️  Navegador vai ficar aberto por 30 segundos...')
  await page.waitForTimeout(30000)
  
  await browser.close()
}

debugScraping()
