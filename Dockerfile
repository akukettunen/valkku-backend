# ./Dockerfile
# --- development stage ---
FROM --platform=linux/amd64 node:22-alpine AS development
WORKDIR /app

# pnpm
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# install ALL deps including dev dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# copy necessary files for running in dev mode
COPY .sequelizerc ./
COPY sequelize.config.cjs ./
COPY migrations ./migrations
COPY seeders ./seeders
COPY sql ./sql
COPY tsconfig.json ./
COPY nodemon.json ./
COPY src ./src
COPY scripts/entrypoint.sh ./scripts/
COPY scripts/create-db.js ./scripts/

# Source code will be mounted as volume in docker-compose.dev.yml
# This COPY is for initial build, but will be overridden by volume mount

RUN chmod +x ./scripts/*.sh

EXPOSE 8333
ENTRYPOINT ["./scripts/entrypoint.sh"]
CMD ["pnpm", "run", "dev"]

# --- build stage ---
FROM --platform=linux/amd64 node:22-alpine AS build
WORKDIR /app

# pnpm
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# install deps (cached)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# build
COPY . .
RUN pnpm run build

# --- production runtime stage ---
FROM --platform=linux/amd64 node:22-alpine AS production
WORKDIR /app
ENV PORT=8333

# pnpm runtime (optional, if you run pnpm in final image)
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# copy only needed bits
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json pnpm-lock.yaml ./
COPY .sequelizerc ./
COPY sequelize.config.cjs ./
COPY migrations ./migrations
COPY seeders ./seeders
COPY sql ./sql
COPY src/templates ./dist/templates
COPY scripts/entrypoint.sh ./scripts/
COPY scripts/create-db.js ./scripts/

# non-root
RUN addgroup -S app && adduser -S app -G app && chmod +x ./scripts/*.sh
USER app

EXPOSE 8333
ENTRYPOINT ["./scripts/entrypoint.sh"]
CMD ["node", "dist/server.js"]
