# Logging

Server logging uses `pino` with `pino-pretty` for local readable output.
Application code should import from `src/server/logger.ts`, which is marked
server-only for TanStack Start.

## Configuration

- `LOG_LEVEL`: `trace`, `debug`, `info`, `warn`, `error`, `fatal`, or `silent`.
  Defaults to `info`.
- `LOG_PRETTY`: `auto`, `true`, or `false`. Defaults to `auto`.

Pretty output is only enabled outside production when stdout is a TTY. Production
and non-TTY processes keep structured JSON output for log ingestion.

## Usage

```ts
import { logger } from '#/server/logger'

logger.info({ issueId: 'issue-123' }, 'Issue opened')
```

Use child loggers for features or long-lived modules:

```ts
import { createChildLogger } from '#/server/logger'

const authLogger = createChildLogger('auth', { feature: 'oauth' })

authLogger.warn({ provider: 'github' }, 'OAuth callback failed')
```

Server scripts can create an isolated logger when they need test destinations or
custom bindings:

```ts
import { createLogger } from '#/server/logger'

const seedLogger = createLogger({
	name: 'coret-seed',
	bindings: { script: 'db:seed' },
})

seedLogger.info('Seed complete')
```

## Request Logs

Future request logging should record only safe metadata:

- `requestId`
- `method`
- `path`
- `status`
- `durationMs`
- optional non-sensitive user identifier

Do not log request bodies, cookies, bearer tokens, raw session tokens, passwords,
OAuth tokens, or unfiltered headers.
