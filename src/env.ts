import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

const isServer = typeof window === 'undefined'

export const env = createEnv({
	server: {
		DATABASE_URL: z.url(),
		BETTER_AUTH_SECRET: z.string(),
		BETTER_AUTH_URL: z.url(),
		CORS_ORIGIN: z
			.string()
			.refine((cors) => cors.split(',').length > 0, {
				message: 'CORS_ORIGIN must contain at least one origin',
			})
			.transform((cors) => cors.split(',')),
		GITHUB_CLIENT_ID: z.string(),
		GITHUB_CLIENT_SECRET: z.string(),
		GOOGLE_CLIENT_ID: z.string(),
		GOOGLE_CLIENT_SECRET: z.string(),
	},

	clientPrefix: 'VITE_',

	client: {
		VITE_APP_NAME: z.string(),
		VITE_APP_URL: z.url(),
	},

	runtimeEnv: isServer ? process.env : import.meta.env,

	isServer,

	emptyStringAsUndefined: true,
})
