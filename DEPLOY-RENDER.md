# Deploy no Render

## 1. Criar conta no Render
- Acesse: https://render.com
- Faça login com GitHub

## 2. Criar repositório no GitHub
```bash
cd C:\Users\Wesley\Desktop\odudutips\scraper-service
git init
git add .
git commit -m "Initial commit - VOD scraper service"
git remote add origin https://github.com/SEU_USUARIO/vodvod-scraper.git
git push -u origin main
```

## 3. Deploy no Render

### Opção A: Via Dashboard (Recomendado)
1. Acesse: https://dashboard.render.com
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub
4. Configure:
   - **Name**: `vodvod-scraper`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Runtime**: Node
   - **Build Command**: `npm install && npx playwright install --with-deps chromium`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Clique em **"Create Web Service"**

### Opção B: Via render.yaml (Automático)
O arquivo `render.yaml` já está configurado. O Render vai detectar automaticamente.

## 4. Após o Deploy
Você receberá uma URL tipo: `https://vodvod-scraper.onrender.com`

Teste a API:
```bash
curl https://vodvod-scraper.onrender.com/
curl https://vodvod-scraper.onrender.com/scrape
```

## 5. Configurar no Vercel
Adicione a variável de ambiente no Vercel:
```
SCRAPER_SERVICE_URL=https://vodvod-scraper.onrender.com
```

## ⚠️ Importante
- **Primeira requisição** pode demorar 30-60s (cold start)
- **Serviço gratuito** dorme após 15 minutos sem uso
- **Recomendado**: Usar um cron job para manter ativo
