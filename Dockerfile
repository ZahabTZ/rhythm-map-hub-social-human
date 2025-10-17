# Production stage - Node.js server with static files
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Cache buster - forces Docker to rebuild from this point
ARG CACHEBUST=1760685130
RUN echo "Cache bust: $CACHEBUST"

# Copy package files
COPY package*.json ./

# Install all dependencies (we need tsx to run TypeScript in production)
RUN npm ci

# Copy built frontend
COPY /dist ./dist

# Copy server code
COPY /server ./server
COPY /shared ./shared

# Set environment to production
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start the Node.js server (it serves both API and static files)
CMD ["npx", "tsx", "server/index.ts"]