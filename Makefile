.PHONY: install dev-backend dev-frontend docker-up docker-down migrate ingest score prioritize seed test

install:
	cd backend && npm install
	cd frontend && npm install

dev-backend:
	cd backend && npm run dev

dev-frontend:
	cd frontend && npm run dev

docker-up:
	docker compose up -d postgres

docker-down:
	docker compose down

migrate:
	cd backend && npx prisma migrate deploy

ingest:
	cd backend && npm run ingest

score:
	cd backend && npm run score

prioritize:
	cd backend && npm run prioritize

seed:
	cd backend && npm run seed:users

test:
	cd backend && npm test
