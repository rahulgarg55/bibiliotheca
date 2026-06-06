FROM node:20.11-alpine@sha256:d45d7a6e1d7d11deff045618b76c8cb81c7e9f3b55c2bf96a6f1d2cf1d11ff9b

WORKDIR /app

# Copy dependency manifests first (stable layer — changes less frequently than source)
COPY app/package.json app/package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source and schema
COPY app/src ./src
COPY app/prisma ./prisma

# Generate Prisma client
RUN npx prisma generate \
    && rm -rf /tmp/*

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && node prisma/seed.js && node src/server.js"]
