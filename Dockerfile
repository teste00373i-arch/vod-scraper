FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# Copiar package files primeiro
COPY package.json package-lock.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar resto do código
COPY . .

# Expor porta
EXPOSE 10000

# Variável de ambiente
ENV NODE_ENV=production
ENV PORT=10000

# Comando de inicialização
CMD ["node", "server.js"]
