# 🚀 Guia Completo de Deploy e Integração

## Passo 1: Deploy do Scraper no Render

### 1.1 Criar Repositório no GitHub
```bash
cd C:\Users\Wesley\Desktop\odudutips\scraper-service
git init
git add .
git commit -m "VOD Scraper Service with Playwright"

# Criar repositório no GitHub primeiro, depois:
git remote add origin https://github.com/SEU_USUARIO/vodvod-scraper.git
git branch -M main
git push -u origin main
```

### 1.2 Deploy no Render
1. Acesse: https://dashboard.render.com
2. Clique em **"New +"** → **"Web Service"**
3. Conecte ao repositório GitHub: `vodvod-scraper`
4. Configure:
   ```
   Name: vodvod-scraper
   Region: Oregon (US West)
   Branch: main
   Runtime: Node
   Build Command: npm install && npx playwright install --with-deps chromium
   Start Command: npm start
   Instance Type: Free
   ```
5. Clique em **"Create Web Service"**
6. Aguarde o deploy (~5-10 minutos na primeira vez)

### 1.3 Anotar a URL
Após o deploy, você receberá uma URL como:
```
https://vodvod-scraper.onrender.com
```
**Guarde essa URL!**

---

## Passo 2: Configurar Variáveis de Ambiente no Vercel

### 2.1 Via Dashboard do Vercel
1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto `odudutips`
3. Vá em **Settings** → **Environment Variables**
4. Adicione:
   ```
   Name: SCRAPER_URL
   Value: https://vodvod-scraper.onrender.com
   Environment: Production, Preview, Development
   ```
5. Clique em **"Save"**

### 2.2 Via CLI do Vercel (Alternativo)
```bash
cd C:\Users\Wesley\Desktop\odudutips
vercel env add SCRAPER_URL
# Cole a URL: https://vodvod-scraper.onrender.com
# Selecione: Production, Preview, Development
```

### 2.3 Localmente (.env.local)
Adicione no arquivo `.env.local`:
```env
SCRAPER_URL=https://vodvod-scraper.onrender.com
```

---

## Passo 3: Fazer Deploy no Vercel

### 3.1 Commit e Push
```bash
cd C:\Users\Wesley\Desktop\odudutips
git add .
git commit -m "Integração com microserviço de scraping"
git push origin main
```

### 3.2 Deploy Automático
O Vercel vai detectar o push e fazer deploy automaticamente.

### 3.3 Deploy Manual (se necessário)
```bash
vercel --prod
```

---

## Passo 4: Testar a Integração

### 4.1 Testar o Scraper Direto
```bash
# Health check
curl https://vodvod-scraper.onrender.com/

# Scraping (pode demorar 20-40s na primeira vez)
curl https://vodvod-scraper.onrender.com/scrape
```

### 4.2 Testar no Vercel
1. Acesse: https://SEU_SITE.vercel.app/vods
2. Faça login
3. Os VODs devem carregar automaticamente

---

## Passo 5: Manter o Serviço Ativo (Opcional)

### 5.1 Problema: Cold Start
O plano gratuito do Render coloca o serviço para dormir após 15 minutos sem uso.
Primeira requisição após "acordar" pode demorar 30-60 segundos.

### 5.2 Solução: Cron Job
Use o **Cron Jobs** do Vercel ou um serviço externo como **UptimeRobot**:

#### Via UptimeRobot (Gratuito)
1. Acesse: https://uptimerobot.com
2. Crie um monitor HTTP(S)
3. URL: `https://vodvod-scraper.onrender.com/`
4. Intervalo: 5 minutos
5. Isso mantém o serviço sempre ativo

#### Via Vercel Cron (Recomendado)
Adicione em `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/keep-scraper-alive",
    "schedule": "*/5 * * * *"
  }]
}
```

Crie o arquivo `src/app/api/cron/keep-scraper-alive/route.ts`:
```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const scraperUrl = process.env.SCRAPER_URL || 'https://vodvod-scraper.onrender.com'
    await fetch(`${scraperUrl}/`, { cache: 'no-store' })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Scraper mantido ativo',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro'
    })
  }
}
```

---

## ✅ Checklist Final

- [ ] Scraper deployado no Render
- [ ] URL do Render anotada
- [ ] Variável `SCRAPER_URL` configurada no Vercel
- [ ] Deploy no Vercel realizado
- [ ] Teste de carregamento de VODs funcionando
- [ ] (Opcional) Cron job configurado

---

## 🔧 Troubleshooting

### Problema: "Failed to fetch VODs from scraper"
**Solução**: 
1. Verifique se o scraper está online: `curl https://vodvod-scraper.onrender.com/`
2. Verifique os logs no Render Dashboard
3. Teste o scraping direto: `curl https://vodvod-scraper.onrender.com/scrape`

### Problema: VODs demoram muito para carregar
**Causa**: Cold start do Render (serviço estava dormindo)
**Solução**: Configure um cron job (veja Passo 5)

### Problema: "SCRAPER_URL is not defined"
**Solução**: 
1. Verifique se a variável está no Vercel: Settings → Environment Variables
2. Faça redeploy no Vercel
3. Localmente, adicione no `.env.local`

### Problema: Playwright não instala no Render
**Solução**: O comando de build deve ser exatamente:
```
npm install && npx playwright install --with-deps chromium
```

---

## 📊 Fluxo Completo

```
Usuário → Vercel (/api/vodvod)
           ↓
       [Verificar auth/subscription]
           ↓
       [Chamar Scraper no Render]
           ↓
       Render → Playwright → vodvod.top
           ↓
       [Extrair VODs]
           ↓
       Render → JSON com VODs
           ↓
       Vercel → Adicionar proxy M3U8
           ↓
       Usuário recebe VODs
```

---

## 💰 Custos

- **Render Free**: 750 horas/mês (suficiente para 1 serviço 24/7)
- **Vercel Hobby**: Gratuito (100GB bandwidth/mês)
- **Total**: R$ 0,00 💚
