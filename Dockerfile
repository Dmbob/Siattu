FROM node:20-alpine
WORKDIR /app

# python3/make/g++ are required to compile the better-sqlite3 native addon
RUN apk add --no-cache python3 make g++

COPY package*.json ./

# --force bypasses a known peer-dep conflict; see package.json notes
RUN npm install --force

COPY . .

RUN npx prisma generate
RUN npm run build

RUN mkdir -p /data

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
