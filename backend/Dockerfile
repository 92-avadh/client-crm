FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4000
# Use nodemon for live reload on file changes
CMD ["node_modules/.bin/nodemon", "server.js"]
