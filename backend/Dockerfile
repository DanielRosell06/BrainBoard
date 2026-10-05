FROM node:20-alpine

# Install openssl and libc6-compat for Prisma engine compatibility
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy dependency definitions and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including prisma CLI and tsx)
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
COPY MCP_DOCUMENTATION.md* ./

# Copy entrypoint script
COPY entrypoint.sh ./
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

# Expose backend port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Use entrypoint to run prisma db push before starting the app
CMD ["./entrypoint.sh"]
