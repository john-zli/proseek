# ProSeek Server

The server consists of two independent processes that run side by side:

- **Web Server** (`proseek-web`) — Express API that handles HTTP requests from the client
- **Workflow Server** (`proseek-workflow`) — BullMQ worker that processes background jobs

Both are started together via PM2 in development.

## Running

```bash
# Start both servers (web + workflow) via PM2
bun run dev

# Stop both servers
bun run stop

# Run tests (each file in isolation)
bun run test

# Run tests filtered by keyword
bun run test church

# Type checking (not done by default in dev)
bun run type-check
```

## Architecture Overview

```
src/
├── web-server/        → Express app entry point
├── workflow-server/   → BullMQ worker entry point
├── routes/            → Route definitions (HTTP layer)
├── controllers/       → Complex request handlers extracted from routes
├── middleware/        → Express middleware (auth, session, validation, etc.)
├── schemas/           → Zod validation schemas for request payloads
├── models/            → Data access layer (Postgres queries)
├── services/          → Shared services (DB, geocoding, captcha, logging)
├── workflows/         → Individual workflow handler implementations
├── types/             → TypeScript type definitions
├── common/            → Constants, error types, status codes
└── sql/               → Raw SQL schema and migration files
```

### Request flow (Web Server)

```
Client → Route → [Middleware chain] → Controller/Handler → Storage (model) → Postgres
```

- **Routes** (`routes/`) define the HTTP endpoints and wire together middleware + handlers. Simple endpoints have their logic inline in the route. More complex ones delegate to a controller.
- **Controllers** (`controllers/`) contain multi-step request logic that's too involved for a route handler (e.g. creating a prayer request involves geocoding, church matching, and storage).
- **Middleware** (`middleware/`) handles cross-cutting concerns: authentication (`auth.ts`), session management (`session.ts`), Zod validation (`validate.ts`), CAPTCHA verification (`verify_captcha.ts`), IP geolocation (`ip_geolocation.ts`), and error handling (`error_handler.ts`).
- **Schemas** (`schemas/`) define Zod schemas for validating request bodies and params. Used by the `validate` middleware.
- **Models/Storage** (`models/`) are the data access layer. Each `*_storage.ts` file contains raw SQL queries and functions that talk to Postgres via `db_query_helper.ts`. No ORMs — just parameterized SQL.
- **Services** (`services/`) are shared dependencies injected via `ServicesBuilder`: geocoding, CAPTCHA, DB connection, and logging (Pino).

### Workflow Server

The workflow server is a separate process that connects to the same Redis instance as the web server. It uses BullMQ to process background jobs.

```
Redis Queue ← Job Schedulers (queue_manager.ts)
     ↓
BullMQ Worker (workflow-server/index.ts)
     ↓
WorkflowDefinitions map → Workflow handler function (workflows/*.ts)
     ↓
Storage layer (models/) → Postgres
```

- **Queue Manager** (`workflow-server/queue_manager.ts`) — Sets up recurring job schedulers via `upsertJobScheduler`. On shutdown, cancels active workflow runs in the DB.
- **Workflow Definitions** (`workflow-server/workflow_definitions.ts`) — Maps `WorkflowName` enum values to handler functions.
- **Workflow Handlers** (`workflows/`) — The actual logic for each job. Each handler receives a `ServicesBuilder` and the job payload.
- **Workflow Storage** (`models/workflows_storage.ts`) — Tracks workflow run lifecycle in Postgres (unprocessed → queued → running → completed/failed/cancelled).

## Adding a New Workflow

### 1. Define the workflow name and payload

In `src/types/workflows.ts`:

```ts
export enum WorkflowName {
  SendChurchMatchNotifications = 'SendChurchMatchNotifications',
  MyNewWorkflow = 'MyNewWorkflow', // Add here
}
```

Add a payload interface (even if empty):

```ts
export interface MyNewWorkflowPayload extends Record<string, unknown> {
  someField: string;
}
```

Register it in the payload map:

```ts
export interface WorkflowParamsForWorkflowName {
  [WorkflowName.SendChurchMatchNotifications]: SendChurchMatchNotificationsPayload;
  [WorkflowName.MyNewWorkflow]: MyNewWorkflowPayload; // Add here
}
```

### 2. Add a schedule (for recurring workflows)

In the same file, add to `RECURRING_WORKFLOW_SCHEDULES`:

```ts
export const RECURRING_WORKFLOW_SCHEDULES: Record<WorkflowName, WorkflowSchedule> = {
  // ...existing
  [WorkflowName.MyNewWorkflow]: {
    every: 10 * 60 * 1000, // Every 10 minutes
    name: WorkflowName.MyNewWorkflow,
  },
};
```

### 3. Implement the handler

Create `src/workflows/my_new_workflow.ts`:

```ts
import { ServicesBuilder } from '@server/services/services_builder';
import { WorkflowName, WorkflowParams } from '@server/types/workflows';

export async function myNewWorkflow(
  services: ServicesBuilder,
  payload: WorkflowParams<WorkflowName.MyNewWorkflow>
) {
  // Your workflow logic here
}
```

### 4. Register in workflow definitions

In `src/workflow-server/workflow_definitions.ts`:

```ts
import { myNewWorkflow } from '@server/workflows/my_new_workflow';

export const WorkflowDefinitions = {
  [WorkflowName.SendChurchMatchNotifications]: sendChurchMatchNotifications,
  [WorkflowName.MyNewWorkflow]: myNewWorkflow, // Add here
};
```

### 5. Add the SQL migration (if needed)

If your workflow needs new tables, add a SQL file in `src/sql/` and include it in `setup.sql`.

## Unit Testing

Tests use Bun's built-in test runner and run against a real `proseek_test` Postgres database (no mocking the DB layer).

### Running tests

```bash
# Run all tests (each file individually for isolation)
bun run test

# Filter by keyword
bun run test church

# Run a single file directly
bun test src/models/test/workflows_storage.test.ts
```

### Why tests run one file at a time

The custom test runner (`scripts/test_runner.sh`) runs each test file as a **separate `bun test` invocation**. This is intentional — Bun runs tests within a single file in parallel by default, and running multiple test files in the same process causes two problems:

1. **Mock leakage** — `mock()` state from one file can bleed into another. The test runner calls each file separately so mocks are fully isolated.
2. **Database transaction conflicts** — Tests that touch the database use a shared connection pool. If multiple test files run concurrently against the same DB, their transactions can interleave and cause flaky failures.

Do **not** run `bun test` without a path from the `server/` directory — it will discover all test files and run them in parallel, which will likely cause failures. Always use `bun run test` (which invokes the test runner script) or pass a specific file path.

### Test patterns

**Storage/model tests** use transaction rollback for isolation:

```ts
import { setupTestDb, teardownTestDb } from '@server/test/db_test_helper';

describe('my_storage', () => {
  beforeEach(async () => {
    await setupTestDb();   // BEGIN transaction
  });

  afterEach(async () => {
    await teardownTestDb(); // ROLLBACK — all DB changes are undone
  });

  test('should do something', async () => {
    // Insert, query, assert — everything rolls back after
  });
});
```

`setupTestDb()` begins a transaction, `teardownTestDb()` rolls it back. Every test starts with a clean database state without needing to truncate tables.

**Route tests** combine the DB transaction pattern with mock request/response helpers and `FakeServicesBuilder`:

```ts
import { createMockRequest, createMockResponse, createMockNext } from '@server/test/request_test_helper';
import { FakeServicesBuilder } from '@server/services/test/fake_services_builder';

const services = new FakeServicesBuilder();
const res = createMockResponse();
const next = createMockNext();
const req = createMockRequest({ body: { ... }, session: { ... } });
```

**Middleware tests** are pure unit tests — no DB, just mock request/response/next. Use `mock.restore()` in `afterEach` to clean up.

### Where to put tests

Tests live in `test/` subdirectories next to the code they test:

```
src/models/test/workflows_storage.test.ts    → tests for src/models/workflows_storage.ts
src/middleware/test/auth.test.ts              → tests for src/middleware/auth.ts
src/routes/test/church_routes.test.ts        → tests for src/routes/church_routes.ts
```

## Environment

Server config is loaded from `config/.env.{NODE_ENV}` via dotenv. Secrets are managed via Doppler in development (see `ecosystem.config.js`).

Key environment variables:

| Variable | Description |
|---|---|
| `PORT` | Web server port (default: 3000) |
| `DATABASE_CONNECTION_STRING` | Postgres connection string |
| `GOOGLE_MAPS_API_KEY` | For geocoding services |
| `REDIS_HOST` | Redis host (default: localhost) |
| `REDIS_PORT` | Redis port (default: 6379) |
| `REDIS_PASSWORD` | Redis password (optional) |
