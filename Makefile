.PHONY: install dev-backend dev-frontend docker-up docker-down

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

# `make ingest`, `make score`, and `make prioritize` land with the Phase 1-5
# data pipeline (see README) — not implemented yet; Phase 0 ships an
# in-memory seed dataset instead so the API and dashboard have something to
# render.
