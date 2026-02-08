# ProSeek

ProSeek is a web application that connects people seeking prayer with churches and religious communities. It provides a platform for individuals to submit prayer requests and get matched with nearby churches for spiritual support.

## Key Features

- **Prayer Request System** — Chat-like interface for submitting prayer requests with location-based church matching
- **Communication** — Real-time chat interface with video call capabilities
- **Security** — CAPTCHA verification, secure session handling, protected API endpoints

## Architecture

This is a Bun monorepo with three packages:

```
proseek/
├── client/     — React SPA (Vite, Less modules, Google Maps)
├── server/     — Express API + BullMQ workflow server
├── common/     — Shared TypeScript types
```

**Server** runs two processes via PM2:

- `proseek-web` — Express API server (port 3000)
- `proseek-workflow` — BullMQ worker for background jobs (e.g. church match notifications)

**Client** is a React 18 app with Vite, react-router-dom, and Less CSS modules.

**Common** (`common/server-api/types/`) contains shared TypeScript types used by both client and server — user types, session types, prayer request chat types, gender enums, etc. The server includes it via `tsconfig.json` (`"../common/**/*"`), and the client imports it via the `@common` path alias in `vite.config.ts`. This keeps API contracts in sync between the two sides.

## Prerequisites

- [Homebrew](https://brew.sh/) — the bootstrap script uses it to install everything else
- A Google Maps API key (for the client map and server geocoding)

## Getting Started

### 1. Bootstrap

From the `server/` directory:

```bash
make bootstrap
```

This handles the full setup, installing anything that's missing:

1. **Doppler** (secrets management) — via Homebrew
2. **PostgreSQL 14** — via Homebrew, starts the service
3. **Redis** — via Homebrew, starts the service
4. **Bun** (JS runtime) — via curl
5. **PM2** (process manager) — via Bun
6. Installs all npm packages via `bun install`
7. Creates the `proseek` and `proseek_test` databases
8. Creates the `proseek_admin` DB user
9. Runs schema migrations (`setup.sql` → users, churches, prayer_requests, workflows)
10. Sets up the test database

The script is idempotent — safe to re-run if anything was already installed.

### 3. Configure environment

**Server** — Environment files live in `server/config/`:

- `.env.development` — dev server config (port, host)
- `.env.test` — test config (includes `DATABASE_CONNECTION_STRING`)
- `.env.production` — production config

Secrets (DB connection string, API keys, Redis password) are managed via Doppler in dev. If not using Doppler, add them to your `.env.development`:

```
DATABASE_CONNECTION_STRING=postgres://proseek_admin:password@localhost:5432/proseek
GOOGLE_MAPS_API_KEY=your_key_here
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Client** — Create `client/.env`:

```
GOOGLE_MAPS_API_KEY=your_key_here
```

### 4. Run the app

**Server** (both web + workflow servers via PM2):

```bash
cd server
bun run dev
```

**Client** (Vite dev server):

```bash
cd client
bun run dev
```

Or from the root, to run just the web server without PM2:

```bash
bun run dev
```

## Testing

Tests use Bun's built-in test runner. From the project root:

```bash
bun test
```

Or from the `server/` directory with the custom test runner (runs each file in isolation):

```bash
bun run test              # all tests
bun run test church       # filter by keyword
```

## Linting and Formatting

```bash
bun run lint              # check for lint errors
bun run lint:fix          # auto-fix lint errors
bun run format            # format all files with Prettier
bun run format:check      # check formatting without writing
```

Formatting is also enforced on commit via Husky + lint-staged.
