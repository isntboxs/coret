import '@tanstack/react-start/server-only'
import pino from 'pino'

import { env } from '#/env'
import type { AppLogger, LoggerBindings } from '#/lib/logger/shared'
import {
	createLoggerOptions,
	normalizeLoggerBindings,
} from '#/lib/logger/shared'

export const serverLogger = pino(
	createLoggerOptions({
		appName: env.VITE_APP_NAME,
		runtime: 'server',
		nodeEnv: env.NODE_ENV,
		level: env.LOG_LEVEL,
		pretty: env.LOG_PRETTY,
		requestResponse: env.LOG_REQUEST_RESPONSE,
		requestAbort: env.LOG_REQUEST_ABORT,
	})
)

export function createServerLogger(bindings: LoggerBindings): AppLogger {
	return serverLogger.child(normalizeLoggerBindings(bindings))
}
