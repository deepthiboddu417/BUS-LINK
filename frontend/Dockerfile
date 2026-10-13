# Build and run Node.js server
FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN node build.js

EXPOSE 5173
CMD ["node", "server.js"]
