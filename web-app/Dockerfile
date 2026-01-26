FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

# Expose host for Vite to work in Docker
CMD ["npm", "run", "dev", "--", "--host"]
