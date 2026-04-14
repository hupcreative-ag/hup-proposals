FROM node:20-alpine
WORKDIR /app

# Instala dependências primeiro (cache de layer)
COPY package*.json ./
RUN npm install --omit=dev

# Copia código e views
COPY server.js ./
COPY views/ ./views/
COPY proposals/ ./proposals/

# Assets ficam num volume externo (/app/assets)
# Tracking fica num volume externo (/app/data)

EXPOSE 3000
ENV NODE_ENV=production
ENV DATA_DIR=/app/data

CMD ["node", "server.js"]
