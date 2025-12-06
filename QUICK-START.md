# ⚡ Guia Rápido - Deploy em 5 Minutos

## 📋 Pré-requisitos
- Conta no GitHub
- Conta no Render (https://render.com)
- Conta no Vercel (se ainda não tiver)

---

## 🚀 Passo a Passo

### 1️⃣ Subir Scraper para o GitHub (2 min)
```bash
cd C:\Users\Wesley\Desktop\odudutips\scraper-service
git init
git add .
git commit -m "VOD Scraper Service with Playwright"

# Crie um repositório no GitHub chamado "vodvod-scraper"
# Depois execute:
git remote add origin https://github.com/SEU_USUARIO/vodvod-scraper.git
git branch -M main
git push -u origin main
```

### 2️⃣ Deploy no Render (2 min)
1. Acesse: https://dashboard.render.com/
2. Clique: **New +** → **Web Service**
3. Conecte ao repo: `vodvod-scraper`
4. Configure:
   - **Name**: `vodvod-scraper`
   - **Build**: `npm install && npx playwright install --with-deps chromium`
   - **Start**: `npm start`
   - **Plan**: Free
5. Clique: **Create Web Service**
6. ⏳ Aguarde 5-10 minutos (primeira vez)
7. 📋 **Copie a URL**: `https://vodvod-scraper.onrender.com`

### 3️⃣ Configurar no Vercel (1 min)
```bash
cd C:\Users\Wesley\Desktop\odudutips

# Adicionar variável de ambiente
vercel env add SCRAPER_URL
# Cole: https://vodvod-scraper.onrender.com
# Selecione: Production, Preview, Development

# Ou adicione manualmente no .env.local:
echo SCRAPER_URL=https://vodvod-scraper.onrender.com >> .env.local
```

### 4️⃣ Deploy no Vercel (30 seg)
```bash
# Commit e push
git add .
git commit -m "Integração com scraper service"
git push origin main

# Vercel fará deploy automático
# Ou force manualmente:
vercel --prod
```

---

## ✅ Testar

### Teste 1: Scraper
```bash
curl https://vodvod-scraper.onrender.com/
# Deve retornar: {"status":"online"...}
```

### Teste 2: Scraping
```bash
curl https://vodvod-scraper.onrender.com/scrape
# Pode demorar 30-60s na primeira vez (cold start)
# Deve retornar: {"success":true,"vods":[...]...}
```

### Teste 3: No Navegador
1. Acesse: `https://SEU_SITE.vercel.app/vods`
2. Faça login
3. VODs devem carregar!

---

## 🔧 Se algo der errado

### Scraper não responde
```bash
# Ver logs no Render:
# https://dashboard.render.com → Seu serviço → Logs
```

### VODs não carregam no Vercel
```bash
# Verificar variável de ambiente:
vercel env ls

# Deve aparecer SCRAPER_URL
# Se não aparecer, adicione novamente:
vercel env add SCRAPER_URL
```

### Erro de CORS
- Verifique se `cors()` está no `server.js` (já está!)
- Tente acessar direto: `https://vodvod-scraper.onrender.com/scrape`

---

## 🎉 Pronto!

Seu sistema agora está rodando com:
- ✅ Scraper no Render (gratuito)
- ✅ App no Vercel (gratuito)
- ✅ VODs públicos e privados funcionando
- ✅ Total: R$ 0,00

---

## 📚 Próximos Passos (Opcional)

### Manter Scraper Sempre Ativo
- Configure cron job (já está no código!)
- Ou use UptimeRobot: https://uptimerobot.com

### Monitorar Erros
- Adicione Sentry ou LogRocket
- Configure alertas no Render

### Melhorar Performance
- Adicione cache Redis
- Implemente rate limiting
- Otimize queries do Prisma
