# ✅ Checklist de Deploy

Use este checklist para garantir que tudo está configurado corretamente.

---

## 📋 Pré-Deploy

### Contas Necessárias
- [ ] Conta no GitHub (https://github.com)
- [ ] Conta no Render (https://render.com)
- [ ] Conta no Vercel (https://vercel.com)

### Testes Locais
- [ ] Scraper funciona localmente (`npm start` em scraper-service)
- [ ] Endpoint `/` retorna `{"status":"online"}`
- [ ] Endpoint `/scrape` retorna VODs (demora ~30s)

---

## 🚀 Deploy do Scraper no Render

### 1. Criar Repositório GitHub
- [ ] Criar repo "vodvod-scraper" no GitHub
- [ ] Push do código:
  ```bash
  cd scraper-service
  git init
  git add .
  git commit -m "Initial commit"
  git remote add origin https://github.com/SEU_USUARIO/vodvod-scraper.git
  git push -u origin main
  ```

### 2. Deploy no Render
- [ ] Acessar: https://dashboard.render.com
- [ ] Clicar: **New +** → **Web Service**
- [ ] Conectar ao repositório `vodvod-scraper`
- [ ] Configurar:
  - [ ] Name: `vodvod-scraper`
  - [ ] Region: Oregon (US West)
  - [ ] Branch: `main`
  - [ ] Build Command: `npm install && npx playwright install --with-deps chromium`
  - [ ] Start Command: `npm start`
  - [ ] Instance Type: **Free**
- [ ] Clicar: **Create Web Service**
- [ ] Aguardar deploy (~5-10 minutos)
- [ ] Anotar URL: `https://vodvod-scraper.onrender.com`

### 3. Testar Scraper no Render
- [ ] Acessar: `https://vodvod-scraper.onrender.com/`
- [ ] Deve retornar: `{"status":"online"}`
- [ ] Acessar: `https://vodvod-scraper.onrender.com/scrape`
- [ ] Aguardar 30-60s (cold start)
- [ ] Deve retornar JSON com VODs

---

## 🔧 Configurar Vercel

### 4. Adicionar Variável de Ambiente
**Opção A: Via Dashboard**
- [ ] Acessar: https://vercel.com/dashboard
- [ ] Selecionar projeto `odudutips`
- [ ] Ir em: **Settings** → **Environment Variables**
- [ ] Adicionar:
  - Name: `SCRAPER_URL`
  - Value: `https://vodvod-scraper.onrender.com`
  - Environment: Production, Preview, Development
- [ ] Clicar: **Save**

**Opção B: Via CLI**
- [ ] Executar:
  ```bash
  cd odudutips
  vercel env add SCRAPER_URL
  # Cole: https://vodvod-scraper.onrender.com
  ```

**Opção C: Localmente**
- [ ] Editar `.env.local`:
  ```env
  SCRAPER_URL=https://vodvod-scraper.onrender.com
  ```

### 5. Deploy no Vercel
- [ ] Commit das mudanças:
  ```bash
  cd odudutips
  git add .
  git commit -m "Integração com scraper service"
  git push origin main
  ```
- [ ] Aguardar deploy automático do Vercel (~2 min)
- [ ] Ou forçar deploy manual: `vercel --prod`

---

## ✅ Testes de Integração

### 6. Testar Sistema Completo
- [ ] Acessar: `https://SEU_SITE.vercel.app`
- [ ] Fazer login com sua conta
- [ ] Ir em: `/vods`
- [ ] VODs devem carregar automaticamente
- [ ] Clicar em um VOD para testar reprodução
- [ ] Verificar se thumbnail, duração e data aparecem

### 7. Testar Admin (se for admin)
- [ ] Acessar: `https://SEU_SITE.vercel.app/admin/monitor`
- [ ] Clicar em: **Buscar VODs**
- [ ] VODs devem carregar em ~30-40s
- [ ] Testar edição de um VOD
- [ ] Testar upload de thumbnail

---

## 🔄 Configurar Cron Job (Opcional)

### 8. Manter Scraper Ativo
**Opção A: Cron Job Vercel (Já configurado no código)**
- [ ] Verificar se `vercel.json` tem o cron:
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/keep-scraper-alive",
        "schedule": "*/5 * * * *"
      }
    ]
  }
  ```
- [ ] Deploy no Vercel Pro (crons não funcionam no Hobby)

**Opção B: UptimeRobot (Gratuito)**
- [ ] Acessar: https://uptimerobot.com
- [ ] Criar conta
- [ ] Adicionar monitor HTTP(S)
- [ ] URL: `https://vodvod-scraper.onrender.com/`
- [ ] Intervalo: 5 minutos
- [ ] Salvar

---

## 📊 Monitoramento

### 9. Verificar Logs
**Render:**
- [ ] Acessar: https://dashboard.render.com
- [ ] Selecionar serviço `vodvod-scraper`
- [ ] Clicar em: **Logs**
- [ ] Verificar se não há erros

**Vercel:**
- [ ] Acessar: https://vercel.com/dashboard
- [ ] Selecionar projeto `odudutips`
- [ ] Clicar em: **Logs**
- [ ] Verificar requisições para `/api/vodvod`

---

## 🎉 Conclusão

### Checklist Final
- [ ] Scraper deployado no Render
- [ ] URL anotada e testada
- [ ] Variável `SCRAPER_URL` no Vercel
- [ ] App deployado no Vercel
- [ ] VODs carregam na página `/vods`
- [ ] Reprodução de vídeo funciona
- [ ] (Opcional) Cron job configurado

---

## 🆘 Problemas Comuns

### ❌ "Failed to fetch VODs"
**Causa**: Scraper não está respondendo  
**Solução**: 
1. Teste direto: `curl https://vodvod-scraper.onrender.com/`
2. Veja logs no Render Dashboard
3. Verifique se deploy terminou com sucesso

### ❌ "SCRAPER_URL is not defined"
**Causa**: Variável não configurada no Vercel  
**Solução**:
1. Vercel Dashboard → Settings → Environment Variables
2. Adicionar `SCRAPER_URL`
3. Fazer redeploy

### ❌ Timeout / Demora muito
**Causa**: Cold start do Render  
**Solução**:
1. Configure cron job (UptimeRobot)
2. Primeira requisição sempre demora mais
3. Depois de "aquecer" fica rápido

### ❌ CORS Error
**Causa**: Configuração do CORS no Express  
**Solução**:
1. Verificar se `app.use(cors())` está no `server.js`
2. Já está configurado corretamente!

---

## 📞 Suporte

- **Documentação**: Leia `INTEGRACAO-COMPLETA.md`
- **Quick Start**: Veja `QUICK-START.md`
- **Status**: Confira `STATUS-FINAL.md`

---

**🎯 Objetivo**: Sistema 100% funcional em produção!  
**💰 Custo**: R$ 0,00  
**⏱️ Tempo**: ~15 minutos
