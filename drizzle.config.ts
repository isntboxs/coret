// oxlint-disable typescript/no-unsafe-member-access typescript/no-unsafe-assignment
import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
	throw new Error('DATABASE_URL is not defined')
}

export default defineConfig({
	schema: './src/server/db/schemas',
	out: './src/server/db/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: databaseUrl,
	},
})
