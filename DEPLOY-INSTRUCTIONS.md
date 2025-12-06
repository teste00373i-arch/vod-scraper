# Deploy do Scraper Service no Render

## Passo 1: Preparar o Repositório

1. Crie um novo repositório no GitHub (ex: `vodvod-scraper`)
2. Copie os arquivos desta pasta para o novo repositório:
   ```bash
   cd scraper-service
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/SEU-USUARIO/vodvod-scraper.git
   git push -u origin main
   ```

## Passo 2: Deploy no Render

1. Acesse [render.com](https://render.com) e faça login
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório `vodvod-scraper`
4. Configure:
   - **Name**: `vodvod-scraper`
   - **Region**: Oregon (US West)
   - **Branch**: main
   - **Root Directory**: (deixe vazio)
   - **Environment**: Node
   - **Build Command**: 
     ```
     npm install && npx playwright install --with-deps chromium
     ```
   - **Start Command**: 
     ```
     npm start
     ```
   - **Plan**: Free

5. Clique em **"Create Web Service"**

## Passo 3: Aguardar Deploy

O primeiro deploy leva ~5-10 minutos porque precisa instalar o Chromium.

Quando terminar, você terá uma URL tipo: `https://vodvod-scraper.onrender.com`

## Passo 4: Testar o Serviço

```bash
curl https://vodvod-scraper.onrender.com/
# Deve retornar: {"status":"online","service":"vodvod-scraper","version":"2.0.0"}

curl https://vodvod-scraper.onrender.com/scrape
# Deve retornar os VODs
```

## Passo 5: Configurar no Projeto Principal

No seu projeto `odudutips`, adicione no `.env.local`:

```env
SCRAPER_SERVICE_URL=https://vodvod-scraper.onrender.com
```

## Passo 6: Atualizar a API

A API `/api/vodvod/route.ts` já está configurada para usar a variável de ambiente `SCRAPER_SERVICE_URL`.

## Importante

⚠️ **Render Free Plan**: O serviço entra em "sleep" após 15 minutos de inatividade. A primeira requisição após o sleep leva ~30 segundos para acordar.

💡 **Solução**: Use o Render Cron Jobs (gratuito) para fazer ping a cada 10 minutos e manter o serviço acordado.

## Manter Serviço Ativo (Opcional)

Crie outro Web Service no Render com este código Node.js simples:

```javascript
// ping-service.js
setInterval(() => {
  fetch('https://vodvod-scraper.onrender.com/')
    .then(() => console.log('✅ Ping sent'))
    .catch(err => console.error('❌ Ping failed:', err))
}, 10 * 60 * 1000) // A cada 10 minutos

console.log('🏓 Ping service started')
```

Ou use um serviço externo como [cron-job.org](https://cron-job.org) para fazer requisições HTTP a cada 10 minutos.
