import '@tanstack/react-start/server-only'
import pino from 'pino'
import type { DestinationStream, Logger, LoggerOptions } from 'pino'

import { env } from '#/env'

export type LogLevel =
	| 'trace'
	| 'debug'
	| 'info'
	| 'warn'
	| 'error'
	| 'fatal'
	| 'silent'

export type LogPrettyMode = 'auto' | 'true' | 'false'

export type LoggerBindings = Record<string, unknown>

export type AppLogger = Logger

export type CreateLoggerOptions = {
	name?: string
	level?: LogLevel
	pretty?: LogPrettyMode | boolean
	bindings?: LoggerBindings
	destination?: DestinationStream
}

const redactionPaths = [
	'password',
	'*.password',
	'**.password',
	'secret',
	'*.secret',
	'**.secret',
	'token',
	'*.token',
	'**.token',
	'accessToken',
	'*.accessToken',
	'**.accessToken',
	'refreshToken',
	'*.refreshToken',
	'**.refreshToken',
	'idToken',
	'*.idToken',
	'**.idToken',
	'apiKey',
	'*.apiKey',
	'**.apiKey',
	'cookie',
	'*.cookie',
	'**.cookie',
	'headers.authorization',
	'headers.Authorization',
	'headers.cookie',
	'headers.Cookie',
	'request.headers.authorization',
	'request.headers.Authorization',
	'request.headers.cookie',
	'request.headers.Cookie',
]

function resolvePrettyMode(pretty: CreateLoggerOptions['pretty']) {
	if (typeof pretty === 'boolean') {
		return pretty ? 'true' : 'false'
	}

	return pretty ?? env.LOG_PRETTY
}

function shouldUsePrettyTransport(pretty: CreateLoggerOptions['pretty']) {
	const prettyMode = resolvePrettyMode(pretty)

	if (prettyMode === 'false' || process.env.NODE_ENV === 'production') {
		return false
	}

	if (prettyMode === 'true') {
		return true
	}

	return Boolean(process.stdout.isTTY)
}

export function createLoggerOptions({
	name = 'coret',
	level = env.LOG_LEVEL,
	pretty,
	bindings = {},
}: CreateLoggerOptions = {}): LoggerOptions {
	return {
		name,
		level,
		base: {
			app: env.VITE_APP_NAME,
			environment: process.env.NODE_ENV ?? 'development',
			...bindings,
		},
		timestamp: pino.stdTimeFunctions.isoTime,
		redact: {
			paths: redactionPaths,
			censor: '[Redacted]',
		},
		transport: shouldUsePrettyTransport(pretty)
			? {
					target: 'pino-pretty',
					options: {
						colorize: true,
						ignore: 'pid,hostname',
						translateTime: 'SYS:standard',
					},
				}
			: undefined,
	}
}

export function createLogger(options: CreateLoggerOptions = {}) {
	const loggerOptions = createLoggerOptions(options)

	if (options.destination) {
		return pino(loggerOptions, options.destination)
	}

	return pino(loggerOptions)
}

export const logger = createLogger()

export function createChildLogger(
	scope: string,
	bindings: LoggerBindings = {}
) {
	return logger.child({ scope, ...bindings })
}
