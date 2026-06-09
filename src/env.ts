import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

const isServer = typeof window === 'undefined'

const logLevelSchema = z.enum([
	'fatal',
	'error',
	'warn',
	'info',
	'debug',
	'trace',
	'silent',
])

const booleanEnvSchema = z.preprocess((value) => {
	if (typeof value !== 'string') {
		return value
	}

	const normalized = value.trim().toLowerCase()

	if (['1', 'true', 'yes', 'on'].includes(normalized)) {
		return true
	}

	if (['0', 'false', 'no', 'off'].includes(normalized)) {
		return false
	}

	return value
}, z.boolean())

export const env = createEnv({
	server: {
		NODE_ENV: z
			.enum(['development', 'production', 'test'])
			.default('development'),
		LOG_LEVEL: logLevelSchema.optional(),
		LOG_PRETTY: booleanEnvSchema.optional(),
		LOG_REQUEST_RESPONSE: booleanEnvSchema.default(false),
		LOG_REQUEST_ABORT: booleanEnvSchema.default(false),
	},

	clientPrefix: 'VITE_',

	client: {
		VITE_APP_NAME: z.string(),
		VITE_APP_URL: z.url(),
		VITE_LOG_LEVEL: logLevelSchema.optional(),
	},

	runtimeEnv: isServer ? process.env : import.meta.env,

	isServer,

	emptyStringAsUndefined: true,
})
