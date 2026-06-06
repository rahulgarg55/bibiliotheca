FROM node:20.11-alpine@sha256:d45d7a6e1d7d11deff045618b76c8cb81c7e9f3b55c2bf96a6f1d2cf1d11ff9b

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && npm run db:seed && npm start"]
# Note: we use 'prisma db push' here instead of 'prisma migrate dev' for simpler automated compose execution
