# 🚀 Atualizar Scraper Service no Render

## ✅ Mudanças Feitas

Adicionada nova rota: `/api/instagram/:username`
- Faz scraping do Instagram usando Playwright
- Retorna último post do perfil
- Funciona mesmo sem token oficial

## 📋 Passos para Deploy

### 1. Fazer commit das mudanças

```bash
cd scraper-service
git add server.js
git commit -m "feat: adicionar rota de scraping do Instagram"
git push origin main
```

### 2. Deploy no Render

O Render vai detectar automaticamente o push e fazer o deploy.

**OU** você pode fazer deploy manual:
1. Acesse https://dashboard.render.com
2. Encontre o service `instagram-scraper-service`
3. Clique em "Manual Deploy" → "Deploy latest commit"

### 3. Testar

Após o deploy (leva ~2-5 minutos):

```bash
# Testar se está online
curl https://instagram-scraper-service-vvjc.onrender.com/

# Testar scraping do Instagram
curl https://instagram-scraper-service-vvjc.onrender.com/api/instagram/odudutips
```

## 🔗 URLs

- **Service URL**: https://instagram-scraper-service-vvjc.onrender.com
- **Dashboard**: https://dashboard.render.com
- **Repositório Git**: (checar com `git remote -v`)

## ⚠️ Importante

- O primeiro request pode demorar ~30s (cold start do Render)
- O scraper usa Playwright, consome mais memória
- Render free tier tem limite de 750h/mês

## 🐛 Se Der Erro

1. Verificar logs no Render Dashboard
2. Verificar se Playwright está instalado: `npm list playwright`
3. Testar localmente: `npm start` e acessar http://localhost:3002/api/instagram/odudutips
