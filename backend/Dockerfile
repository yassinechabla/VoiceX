FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (use npm install if package-lock.json doesn't exist)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only (use npm install if package-lock.json doesn't exist)
RUN if [ -f package-lock.json ]; then npm ci --only=production; else npm install --production; fi

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy certificates directory (should be mounted in production)
RUN mkdir -p /app/certs

# Expose HTTPS port
EXPOSE 3443

# Start server
CMD ["node", "dist/server.js"]

