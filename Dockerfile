FROM oven/bun:1-alpine

WORKDIR /app

# deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

# source
COPY tsconfig.json ./
COPY src ./src

ENV NODE_ENV=production
ENV PORT=3013

EXPOSE 3013

CMD ["bun", "run", "start"]
