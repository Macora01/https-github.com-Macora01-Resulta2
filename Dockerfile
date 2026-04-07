FROM node:22-slim

WORKDIR /app

# Instalar dependencias necesarias para compilar algunos paquetes de node si fuera necesario
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

# Construir el frontend (Vite)
RUN npm run build

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Exponer el puerto 3000
EXPOSE 3000

# Comando para iniciar la aplicación (servidor Node.js)
CMD ["npm", "start"]
