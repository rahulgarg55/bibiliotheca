FROM node:20.11-alpine@sha256:d45d7a6e1d7d11deff045618b76c8cb81c7e9f3b55c2bf96a6f1d2cf1d11ff9b

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]
