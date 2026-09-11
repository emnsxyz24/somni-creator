# Somni Creator — Frontend

Next.js (App Router) web client for Somni Creator.

## Architecture

- Next.js 16 (App Router + React 19)
- Tailwind CSS (v4)
- TypeScript Strict Mode
- ESLint + Prettier

## Getting Started

1. Copy the example environment variables:
   ```bash
   cp .env.example .env.local
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev`: Start Next.js development server with hot-reload.
- `npm run build`: Compile and generate production build with strict typechecks.
- `npm run start`: Start production server.
- `npm run lint`: Run ESLint checks.
- `npm run format`: Format source files with Prettier.
