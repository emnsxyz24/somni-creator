# Somni Creator

Somni Creator is a personal CRM and deal management operating system designed for an individual content creator to manage brand deals from initial contact to getting paid.

## Architecture & Layout

This repository is organized as a monorepo containing decoupled frontend and backend applications:

```
creator-crm-platform/
├── backend/                  # NestJS REST API service
│   ├── src/
│   ├── test/
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── frontend/                 # Next.js App Router web client
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── package.json              # Monorepo workspace configuration
└── README.md
```

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, TanStack Query, Zustand, strict TypeScript.
- **Backend**: NestJS, REST API (`/api/v1`), strict domain layering (`Controller -> Service -> Repository`), PostgreSQL via Prisma, strict TypeScript.

## Prerequisites

- Node.js 22.x or later
- npm 10.x or later

## Setup

1. Copy environment variables for each package:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

2. Install dependencies across the workspace:
   ```bash
   npm install
   ```

## Development

Run development servers independently:

```bash
# Start backend (runs on http://localhost:4000)
npm run start:dev --workspace=backend

# Start frontend (runs on http://localhost:3000)
npm run dev --workspace=frontend
```

## Quality Checks & Testing

```bash
# Typecheck and build both packages
npm run build

# Run linting across both packages
npm run lint

# Run backend unit tests
npm run test
```
