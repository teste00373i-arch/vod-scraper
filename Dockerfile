FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# Copiar package files primeiro
COPY package.json package-lock.json ./

# Instalar dependências (usar install em vez de ci)
RUN npm install --omit=dev

# Copiar resto do código
COPY . .

# Expor porta
EXPOSE 10000

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=10000
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Comando de inicialização
CMD ["node", "server.js"]
