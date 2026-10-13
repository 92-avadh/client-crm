# ─── Retentio Frontend ───────────────────────────────────────────
# Node 20 Alpine — lightweight base
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (layer caching — only re-installs when deps change)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Expose Vite dev server port
EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5173 || exit 1

# Start Vite dev server — host 0.0.0.0 makes it accessible outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
