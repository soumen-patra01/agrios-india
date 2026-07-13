# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --prefer-offline

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine AS production

RUN npm install -g serve@14 && addgroup -S agrios && adduser -S agrios -G agrios

WORKDIR /app

COPY --from=builder --chown=agrios:agrios /app/dist ./dist
COPY --from=builder --chown=agrios:agrios /app/public ./public

USER agrios

# serve is a static file server — Vercel functions run separately
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health 2>/dev/null || exit 1

CMD ["serve", "-s", "dist", "-l", "3000", "--no-clipboard"]

# Labels
LABEL org.opencontainers.image.title="AgriOS India"
LABEL org.opencontainers.image.description="AI-powered farming assistant for Indian farmers"
LABEL org.opencontainers.image.source="https://github.com/agrios-india/agrios-india"
LABEL org.opencontainers.image.licenses="proprietary"
