# 🎬 VOD Scraper Service

Microserviço de scraping de VODs usando **Playwright** para o projeto odudutips.

## 🚀 Quick Start

### Deploy no Render (Recomendado)
```bash
# 1. Criar repositório no GitHub
git init
git add .
git commit -m "VOD Scraper Service"
git remote add origin https://github.com/SEU_USUARIO/vodvod-scraper.git
git push -u origin main

# 2. Deploy no Render Dashboard
# Siga as instruções detalhadas em INTEGRACAO-COMPLETA.md
```

### Executar Localmente
```bash
npm install
npm start
# Serviço estará disponível em http://localhost:3002
```

## 📡 Endpoints

### `GET /`
Health check do serviço
```json
{
  "status": "online",
  "service": "vodvod-scraper",
  "version": "2.0.0"
}
```

### `GET /scrape`
Faz scraping de VODs do vodvod.top
```json
{
  "success": true,
  "vods": [
    {
      "id": "2343658974",
      "vodId": "2343658974",
      "channelId": "316567091317",
      "title": "Título do VOD",
      "thumbnail": "https://...",
      "duration": "2:34:15",
      "views": 1234,
      "date": "2025-12-06T...",
      "m3u8Url": "https://api.vodvod.top/m3u8/.../index.m3u8",
      "isPrivate": false
    }
  ],
  "count": 50,
  "timestamp": "2025-12-06T..."
}
```

## 🔧 Configuração

### Variáveis de Ambiente
```env
PORT=3002                    # Porta do servidor (Render define automaticamente)
NODE_ENV=production          # Ambiente
```

### Integração com Vercel
No projeto principal (odudutips), configure a variável:
```env
SCRAPER_URL=https://vodvod-scraper.onrender.com
```

## 📦 Tecnologias

- **Express.js**: Framework web minimalista
- **Playwright**: Automação de navegador (Chromium)
- **CORS**: Permitir requisições cross-origin

## 🧪 Testes

```bash
# Health check
curl https://vodvod-scraper.onrender.com/

# Scraping completo (pode demorar 30-60s na primeira vez)
curl https://vodvod-scraper.onrender.com/scrape

# Teste de integração completo
node test-integration.js
```

## 📚 Documentação Completa

- **[INTEGRACAO-COMPLETA.md](./INTEGRACAO-COMPLETA.md)** - Guia passo a passo de deploy e integração
- **[DEPLOY-RENDER.md](./DEPLOY-RENDER.md)** - Instruções específicas para Render

## ⚙️ Como Funciona

1. Recebe requisição no endpoint `/scrape`
2. Playwright abre navegador Chromium headless
3. Navega para vodvod.top/channels/@odudutips
4. Aguarda carregamento completo da página (JavaScript)
5. Extrai dados dos VODs (título, thumbnail, duração, views, etc)
6. Retorna JSON com todos os VODs encontrados

## 🔥 Vantagens sobre Cheerio

- ✅ Executa JavaScript da página
- ✅ Aguarda carregamento dinâmico
- ✅ Funciona com SPAs (Single Page Applications)
- ✅ Mais confiável para sites modernos

## ⚠️ Notas Importantes

- **Cold Start**: Primeira requisição pode demorar 30-60s (Render iniciando)
- **Timeout**: Configurado para 90 segundos
- **Cache**: Não implementado (sempre retorna dados frescos)
- **Rate Limit**: Não implementado (use com responsabilidade)

## 📞 Troubleshooting

### Erro: "Failed to launch browser"
- Verifique se o comando de build está correto:
  ```
  npm install && npx playwright install --with-deps chromium
  ```

### Erro: "Timeout"
- Cold start do Render demora ~30-60s
- Configure cron job para manter serviço ativo (veja INTEGRACAO-COMPLETA.md)

### Erro: "CORS"
- Verifique se `cors()` está habilitado no `server.js`
- Confirme que a requisição vem de um domínio autorizado

## 📈 Monitoramento

Logs disponíveis no Dashboard do Render:
- https://dashboard.render.com → Selecione o serviço → Logs

## 💰 Custo

- **Render Free Tier**: 750 horas/mês
- **Suficiente para**: 1 serviço rodando 24/7
- **Custo**: R$ 0,00 💚
