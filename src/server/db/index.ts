import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { env } from '#/env'
import * as schema from '#/server/db/schemas'

export const dbPool = new Pool({ connectionString: env.DATABASE_URL })

export const db = drizzle({ client: dbPool, schema })
