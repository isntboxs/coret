import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
	throw new Error('DATABASE_URL is not defined')
}

export default defineConfig({
	schema: './src/db/schemas',
	out: './src/db/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: databaseUrl,
	},
})
