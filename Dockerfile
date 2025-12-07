FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código
COPY . .

# Expor porta
EXPOSE 10000

# Comando de inicialização
CMD ["node", "server.js"]
