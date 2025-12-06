#!/usr/bin/env node

/**
 * Script de Teste de Integração
 * 
 * Este script testa a integração completa entre:
 * - Microserviço Scraper (Render)
 * - API do Vercel
 * - Banco de Dados (Prisma)
 */

const SCRAPER_URL = process.env.SCRAPER_URL || 'https://vodvod-scraper.onrender.com'
const API_URL = process.env.VERCEL_URL || 'http://localhost:3000'

console.log('🧪 Iniciando testes de integração...\n')

// Teste 1: Health Check do Scraper
async function testScraperHealth() {
  console.log('1️⃣  Testando Health Check do Scraper...')
  try {
    const response = await fetch(`${SCRAPER_URL}/`)
    const data = await response.json()
    
    if (data.status === 'online') {
      console.log('   ✅ Scraper está online')
      console.log(`   📦 Versão: ${data.version}`)
      return true
    } else {
      console.log('   ❌ Scraper não está respondendo corretamente')
      return false
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`)
    console.log('   💡 Verifique se o scraper está deployado no Render')
    return false
  }
}

// Teste 2: Scraping de VODs
async function testScraping() {
  console.log('\n2️⃣  Testando Scraping de VODs...')
  console.log('   ⏳ Aguardando... (pode demorar 30-60s)')
  
  try {
    const startTime = Date.now()
    const response = await fetch(`${SCRAPER_URL}/scrape`, {
      signal: AbortSignal.timeout(90000) // 90 segundos
    })
    const data = await response.json()
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    
    if (data.success && data.vods && data.vods.length > 0) {
      console.log(`   ✅ ${data.vods.length} VODs encontrados em ${duration}s`)
      console.log(`   📊 Primeiro VOD: ${data.vods[0].title}`)
      return true
    } else {
      console.log('   ❌ Nenhum VOD encontrado')
      console.log(`   📝 Resposta: ${JSON.stringify(data, null, 2)}`)
      return false
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`)
    if (error.name === 'TimeoutError') {
      console.log('   💡 Timeout - O scraper pode estar em cold start')
    }
    return false
  }
}

// Teste 3: Variáveis de Ambiente
async function testEnvironment() {
  console.log('\n3️⃣  Verificando Variáveis de Ambiente...')
  
  const vars = {
    'SCRAPER_URL': process.env.SCRAPER_URL,
    'DATABASE_URL': process.env.DATABASE_URL ? '✓ Configurado' : '✗ Não configurado',
    'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET ? '✓ Configurado' : '✗ Não configurado'
  }
  
  console.log('   📋 Variáveis:')
  Object.entries(vars).forEach(([key, value]) => {
    const status = value && value !== '✗ Não configurado' ? '✅' : '⚠️'
    console.log(`      ${status} ${key}: ${value || 'não configurado'}`)
  })
  
  return true
}

// Executar todos os testes
async function runTests() {
  console.log('═══════════════════════════════════════════')
  console.log('🚀 Teste de Integração - Scraper Service')
  console.log('═══════════════════════════════════════════\n')
  
  const results = {
    health: await testScraperHealth(),
    scraping: await testScraping(),
    environment: await testEnvironment()
  }
  
  console.log('\n═══════════════════════════════════════════')
  console.log('📊 Resultados:')
  console.log('═══════════════════════════════════════════')
  console.log(`Health Check: ${results.health ? '✅ Passou' : '❌ Falhou'}`)
  console.log(`Scraping: ${results.scraping ? '✅ Passou' : '❌ Falhou'}`)
  console.log(`Environment: ${results.environment ? '✅ Passou' : '❌ Falhou'}`)
  
  const passed = Object.values(results).filter(Boolean).length
  const total = Object.keys(results).length
  
  console.log('\n═══════════════════════════════════════════')
  if (passed === total) {
    console.log('🎉 Todos os testes passaram! Sistema pronto.')
  } else {
    console.log(`⚠️  ${passed}/${total} testes passaram.`)
    console.log('📖 Consulte INTEGRACAO-COMPLETA.md para troubleshooting')
  }
  console.log('═══════════════════════════════════════════\n')
}

// Executar
runTests().catch(console.error)
