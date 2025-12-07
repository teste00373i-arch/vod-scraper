# Usar imagem base do Ubuntu com Node
FROM node:20-bookworm

# Instalar dependências do sistema necessárias para Playwright
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libatspi2.0-0 \
    libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar package files
COPY package.json package-lock.json ./

# Instalar dependências do Node
RUN npm install

# Instalar browsers do Playwright
RUN npx playwright install chromium --with-deps

# Copiar código
COPY . .

# Expor porta
EXPOSE 10000

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=10000

# Comando de inicialização
CMD ["node", "server.js"]
