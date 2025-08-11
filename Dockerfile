# Dockerfile para aplicação NestJS
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN chmod +x ./start.sh
CMD ["./start.sh"]
