import { chromium } from 'playwright'

async function test() {
  console.log('🧪 Testando Playwright...')
  
  try {
    const browser = await chromium.launch({ headless: true })
    console.log('✅ Browser iniciado')
    
    const page = await browser.newPage()
    console.log('✅ Página criada')
    
    await page.goto('https://example.com')
    console.log('✅ Navegação funcionou')
    
    const title = await page.title()
    console.log('✅ Título:', title)
    
    await browser.close()
    console.log('✅ Teste completo!')
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

test()
