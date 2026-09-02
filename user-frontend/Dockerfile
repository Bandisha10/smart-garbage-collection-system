############################
# 1️⃣ Dependencies stage
############################
# Changed from alpine to slim
FROM node:24-alpineAS deps

WORKDIR /app

# Install build essentials if onnxruntime needs to compile during npm ci
# Often not needed for -slim, but good to have if you see "node-gyp" errors
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci


############################
# 2️⃣ Build stage
############################
FROM node:24-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build


############################
# 3️⃣ Production runtime
############################
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy only required files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3021

CMD ["npm", "start"]
