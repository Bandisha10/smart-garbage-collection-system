# -----------------------------
# Base image (EXACT Node version)
# -----------------------------
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Install dependencies (production only)
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy application source
COPY . .

# Expose app port
EXPOSE 2035

# Start the Node app directly
CMD ["node", "server.js"]