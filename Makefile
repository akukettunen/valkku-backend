# ./Makefile
SHELL := /bin/bash

.PHONY: dev up down logs reset build image run migrate

dev:        ## Run dev stack (app + MySQL) via Compose with hot reload
	docker compose -f docker-compose.dev.yml up --build

up:         ## Start dev stack without rebuilding
	docker compose -f docker-compose.dev.yml up

down:       ## Stop dev stack
	docker compose -f docker-compose.dev.yml down

logs:       ## View logs from dev stack
	docker compose -f docker-compose.dev.yml logs -f api

reset:      ## Reset dev DB and rebuild
	docker compose -f docker-compose.dev.yml down -v && docker compose -f docker-compose.dev.yml up --build

build:      ## Build local TS
	pnpm install --frozen-lockfile && pnpm run build

image:      ## Build container image for production
	docker build -t valkku-backend:latest --target production .

run:        ## Run production image (needs DATABASE_URL)
	docker run --rm -p 3000:3000 -e DATABASE_URL=$(DATABASE_URL) valkku-backend:latest

migrate:    ## Run migrations against DATABASE_URL
	NODE_ENV=production DATABASE_URL=$(DATABASE_URL) npx sequelize-cli db:migrate --env production
