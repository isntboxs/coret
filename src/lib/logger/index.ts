import pino from 'pino'

import { env } from '#/env'
import type { AppLogger, LoggerBindings, LogLevel } from '#/lib/logger/shared'
import {
	createLoggerOptions,
	normalizeLoggerBindings,
} from '#/lib/logger/shared'

const runtime = typeof window === 'undefined' ? 'server' : 'client'
const nodeEnv = import.meta.env.DEV ? 'development' : 'production'

export const logger = pino(
	runtime === 'server'
		? createLoggerOptions({
				appName: env.VITE_APP_NAME,
				runtime,
				nodeEnv: env.NODE_ENV,
				level: env.LOG_LEVEL,
				pretty: env.LOG_PRETTY,
				requestResponse: env.LOG_REQUEST_RESPONSE,
				requestAbort: env.LOG_REQUEST_ABORT,
			})
		: createLoggerOptions({
				appName: env.VITE_APP_NAME,
				runtime,
				nodeEnv,
				clientLevel: env.VITE_LOG_LEVEL,
			})
)

export function createLogger(bindings: LoggerBindings): AppLogger {
	return logger.child(normalizeLoggerBindings(bindings))
}

export type { AppLogger, LoggerBindings, LogLevel }
