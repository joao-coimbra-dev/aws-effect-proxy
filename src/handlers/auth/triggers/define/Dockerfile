# Stage 1: Builder
FROM node:24-slim AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build:auth:define

# Stage 2: Production
FROM public.ecr.aws/lambda/nodejs:24

WORKDIR /var/task

# 1. Copy the built file and RENAME it to index.mjs
COPY --from=builder /app/dist/define.mjs ./index.mjs

# 3. Use index.handler
# 'index' refers to index.mjs, 'handler' refers to the exported function
CMD [ "index.handler" ]