# Somni Creator — Backend

NestJS-based REST API service for Somni Creator.

## Architecture & Layering

The backend follows strict domain-driven layering per architectural guidelines:
```
Controller -> Service -> Repository -> Database
```

- **Controller**: Dedicated strictly to HTTP concerns (DTO validation, routing, status codes).
- **Service**: Business logic, domain rules, state machine validation, authorization checks.
- **Repository**: Encapsulated data access (Prisma). Services must never directly query foreign repositories.

## Requirements

- Node.js 22+
- npm 10+

## Getting Started

1. Copy the example environment variables:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run start:dev
   ```

The service runs at `http://localhost:4000` by default.

## Available Scripts

- `npm run build`: Compile TypeScript with strict typechecking into `dist/`.
- `npm run start`: Run production build.
- `npm run start:dev`: Run with hot-reloading file watch.
- `npm run lint`: Run ESLint across source and test files.
- `npm run lint:fast`: Run Oxlint for fast syntax/linter checks.
- `npm run format`: Format code with Prettier.
- `npm run test`: Run unit tests using Vitest.
- `npm run test:e2e`: Run end-to-end integration tests.
