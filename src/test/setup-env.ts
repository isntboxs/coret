const defaultTestDatabaseUrl =
	'postgresql://postgres:password@localhost:5432/coret_test'

const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? defaultTestDatabaseUrl

process.env.NODE_ENV = 'test'
process.env.TEST_DATABASE_URL = testDatabaseUrl
process.env.DATABASE_URL = testDatabaseUrl
process.env.APP_ORIGIN ??= 'http://localhost:3002'
process.env.BETTER_AUTH_SECRET ??=
	'test-secret-for-coret-auth-at-least-32-chars'
process.env.BETTER_AUTH_URL ??= 'http://localhost:3002'
process.env.CORS_ORIGIN ??= 'http://localhost:3002'
process.env.GITHUB_CLIENT_ID ??= 'test-github-client-id'
process.env.GITHUB_CLIENT_SECRET ??= 'test-github-client-secret'
process.env.GOOGLE_CLIENT_ID ??= 'test-google-client-id'
process.env.GOOGLE_CLIENT_SECRET ??= 'test-google-client-secret'
process.env.RESEND_API_KEY ??= 'test-resend-api-key'
process.env.EMAIL_FROM ??= 'Coret Test <noreply@coret.local>'
process.env.VITE_APP_NAME ??= 'coret'
process.env.VITE_APP_URL ??= 'http://localhost:3002'
