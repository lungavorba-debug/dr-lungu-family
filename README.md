# MedScreen Festival & Event Suite

Production-ready medical screening platform for public festivals and events. Built as an offline-first PWA with an enterprise Express API backend.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, TypeScript, TailwindCSS, React Router, React Query |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL |
| Auth | JWT |
| Storage | Local (S3-compatible later) |
| Deployment | Docker |

## Architecture

- **Monorepo** with npm workspaces
- **Clean Architecture** on the backend (presentation → application → domain ← infrastructure)
- **Feature-based** folder organization on the frontend
- **Shared package** for types, constants, and validation schemas

## Project Structure

```
medscreen-festival/
├── apps/
│   ├── web/          # React PWA client
│   └── api/          # Express API server
├── packages/
│   └── shared/       # Shared types, constants, schemas
├── docker/           # Dockerfiles and nginx config
├── documentatia/     # Project specifications (reference)
└── .github/          # CI/CD workflows
```

## Prerequisites

- Node.js >= 20
- npm >= 10
- Docker & Docker Compose (for containerized development)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Edit the `.env` files with your local values.

### 3. Start with Docker (recommended)

```bash
docker compose up -d
```

This starts PostgreSQL, the API, and the web client.

### 4. Start locally (without Docker)

```bash
# Terminal 1 — API
npm run dev:api

# Terminal 2 — Web
npm run dev:web

# Or both concurrently
npm run dev
```

| Service | URL |
|---------|-----|
| Web (PWA) | http://localhost:5173 |
| API | http://localhost:3001 |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start web + API concurrently |
| `npm run dev:web` | Start Vite dev server |
| `npm run dev:api` | Start Express dev server |
| `npm run build` | Build all packages |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run typecheck` | TypeScript check all packages |

## Documentation

Full functional and architectural specifications are in the `documentatia/` folder.

## License

Proprietary — MedScreen Festival & Event Suite
