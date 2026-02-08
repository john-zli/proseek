# CLAUDE.md

## What is ProSeek?

ProSeek connects people seeking prayer with local churches and religious communities. A user submits a prayer request through a chat-like interface, provides their location, and gets matched with nearby churches that can offer spiritual support. Churches sign up, manage incoming prayer requests, and follow up with individuals via chat or video. The goal is to bridge the gap between people in need of prayer and the communities that want to help — making it easy, private, and accessible.

## Ground Rules

- **Do only what is asked.** Do not add extra features, refactors, tests, PRs, or improvements beyond the scope of the request.
- **Do NOT automatically create PRs, run tests, commit, push, or perform any action outside of what was explicitly asked.**
- **Double and triple check your work.** Before considering something done, verify: types compile, lint passes, functionality is correct, and the change matches existing patterns.
- **Know when to stop.** If you find yourself iterating repeatedly trying to fix something that isn't working, stop. Revert back to the initial change before you started iterating and explain what you tried. Do not tunnel vision — the user will manually tweak it forward from there.

## Project Overview

Bun monorepo with three packages: `client/` (React SPA), `server/` (Express API + BullMQ workflow server), `common/` (shared types). Only `client` and `server` are Bun workspaces.

## Project Structure

```
proseek/
├── client/                          — React SPA
│   └── src/
│       ├── components/              — Page-level and feature components
│       │   └── modals/              — Modal components (contact info, confirmation, verification)
│       ├── shared-components/       — Reusable UI primitives (Button, TextInput, Modal, etc.)
│       ├── contexts/                — React Context providers (session, modals)
│       ├── hooks/                   — Custom React hooks
│       ├── widget/                  — Standalone widget utilities (e.g. CAPTCHA)
│       ├── api/                     — Fetch wrappers for server API calls
│       ├── types/                   — Client-specific TypeScript types
│       ├── styles/                  — Global styles
│       ├── App.tsx                  — Router and top-level layout
│       └── main.tsx                 — Entry point
│
├── server/                          — Express API + Workflow server
│   ├── config/                      — Environment files (.env.development, .env.test, .env.production)
│   ├── scripts/                     — Shell scripts (bootstrap, migrations, test runner)
│   └── src/
│       ├── web-server/              — Express app entry point (index.ts, server.ts)
│       ├── workflow-server/         — BullMQ worker entry point + queue manager
│       ├── routes/                  — HTTP route definitions
│       │   └── test/                — Route tests
│       ├── controllers/             — Complex multi-step request handlers
│       ├── middleware/              — Express middleware (auth, session, validation, captcha, etc.)
│       │   └── test/                — Middleware tests
│       ├── schemas/                 — Zod validation schemas for request payloads
│       ├── models/                  — Data access layer (SQL queries, storage functions)
│       │   └── test/                — Storage tests
│       ├── services/                — Shared services (DB, geocoding, captcha, logging)
│       │   └── test/                — Service test helpers (FakeServicesBuilder)
│       ├── workflows/               — Individual workflow handler implementations
│       ├── types/                   — Server-specific TypeScript types
│       ├── common/                  — Constants, error types, status codes
│       ├── sql/                     — Raw SQL schema and migration files
│       └── test/                    — Shared test helpers (db_test_helper, request_test_helper)
│
├── common/                          — Shared TypeScript types (used by both client and server)
│   └── server-api/types/            — API contract types (users, session, gender, prayer_request_chats)
│
├── CLAUDE.md                        — This file
├── package.json                     — Root workspace config, lint/format/dev scripts
├── tsconfig.json                    — Root TS config with path aliases (@server, @client, @common)
├── .eslintrc.json                   — Shared ESLint config
└── .prettierrc                      — Prettier config
```

## Code Style & Conventions

### General

- **File naming:** `snake_case.ts` for all files (not camelCase, not kebab-case)
- **Variable/function naming:** `camelCase` for variables and functions, `PascalCase` for types/interfaces/enums/classes
- **Path aliases:** `@server/*` → `server/src/*`, `@client/*` → `client/src/*`, `@common/*` → `common/*`
- **No ORMs.** Raw parameterized SQL via `db_query_helper.ts`
- **Formatting:** Prettier with 120 char width, single quotes, trailing commas (ES5), 2-space indent. Enforced on commit via Husky + lint-staged
- **Imports:** Alphabetically ordered, enforced by ESLint. `bun:test` imports come first
- **Unused variables:** Prefix with `_` (e.g. `_services`, `_payload`)

### Server Patterns

#### Storage files (`models/*_storage.ts`)

Every storage file follows this exact structure:

1. **ColumnKeyMappings** — Object mapping camelCase TS field names to snake_case DB column names
2. **SqlCommands** — Object containing all SQL strings as template literals, using `$1`, `$2` etc. for params
3. **Exported functions** — Each wraps a call to `queryRows`, `querySingleRow`, `queryScalar`, or `nonQuery` from `db_query_helper.ts`

```ts
const ColumnKeyMappings = {
  MyEntity: {
    entityId: 'entity_id',
    name: 'name',
  },
};

const SqlCommands = {
  GetMyEntity: `
    SELECT ...
    FROM   core.my_table
    WHERE  ...;`,
};

export async function getMyEntity(id: string): Promise<MyEntity> {
  return querySingleRow<MyEntity>({
    commandIdentifier: 'GetMyEntity',
    query: SqlCommands.GetMyEntity,
    params: [id],
    mapping: ColumnKeyMappings.MyEntity,
  });
}
```

- `commandIdentifier` must match the key in `SqlCommands`
- Types for storage results go in `models/storage_types.ts` (server-only types) or `common/server-api/types/` (shared types)
- Timestamps: use `EXTRACT(EPOCH FROM ...)::bigint` in SQL, represented as `number | null` in TS
- Soft deletes: filter with `deletion_timestamp IS NULL`

#### Routes (`routes/*_routes.ts`)

- Each route file exports a function that takes `ServicesBuilder` and returns a `Router`
- Simple handlers go inline in the route
- Complex multi-step handlers go in `controllers/`
- Middleware chain order: `validate(Schema)` → `verifyCaptcha(services)` → `ensureAuthenticated` → handler
- Errors: throw or `next()` a `RouteError(HttpStatusCodes.XXX, message)`

#### Schemas (`schemas/*.ts`)

- Zod schemas that validate `{ body, query, params }` shape
- Used with `validate()` middleware

#### Services

- `ServicesBuilder` is the DI container. Add new services there
- Tests use `FakeServicesBuilder` for mocking

#### Workflows

To add a new workflow:

1. Add to `WorkflowName` enum in `types/workflows.ts`
2. Add payload interface + register in `WorkflowParamsForWorkflowName`
3. Add schedule in `RECURRING_WORKFLOW_SCHEDULES`
4. Create handler in `workflows/`
5. Register in `workflow-server/workflow_definitions.ts`

### Client Patterns

- **Styling:** Co-located `.module.less` files per component
- **State:** React Context only (no Redux/Zustand). Session in `SessionContextProvider`, modals in `ModalContextProvider`
- **API calls:** Thin fetch wrappers in `api/` directory, organized by resource
- **Shared components:** Generic UI primitives in `shared-components/`, feature components in `components/`

## Testing

### How to run

```bash
# From server/ directory — runs each file in isolation
bun run test

# Filter by keyword
bun run test church

# Single file
bun test src/models/test/workflows_storage.test.ts
```

### Critical: Tests must run one file at a time

The test runner (`scripts/test_runner.sh`) runs each test file as a separate `bun test` process. This prevents:

- **Mock leakage** between files
- **DB transaction conflicts** from parallel execution against the shared test database

Do NOT run `bun test` without a file path from `server/` — it will run files in parallel and cause flaky failures.

### Test file location

Tests go in `test/` subdirectories next to the code:

```
src/models/test/workflows_storage.test.ts
src/middleware/test/auth.test.ts
src/routes/test/church_routes.test.ts
```

### DB test pattern

Storage and route tests use transaction rollback:

```ts
beforeEach(async () => {
  await setupTestDb();
}); // BEGIN
afterEach(async () => {
  await teardownTestDb();
}); // ROLLBACK
```

### Middleware test pattern

Pure unit tests with mock helpers, no DB:

```ts
const req = createMockRequest({ body: {...}, session: {...} });
const res = createMockResponse();
const next = createMockNext();
```

Call `mock.restore()` in `afterEach`.

### Route test pattern

Combines DB transactions + mock request helpers + `FakeServicesBuilder`.

## SQL

- All tables live in the `core` schema
- Schema files in `server/src/sql/`, included via `setup.sql`
- Use parameterized queries (`$1::type`) — never string interpolation
- Column naming: `snake_case`
- Standard columns: `creation_timestamp`, `modification_timestamp`, `deletion_timestamp` (soft delete)
- UUIDs for primary keys, auto-generated via `gen_random_uuid()` defaults

## Linting & Type Checking

```bash
bun run lint          # from root
bun run type-check    # from server/
```

ESLint enforces import ordering, no unused vars (prefix unused with `_`), and React hooks rules.
