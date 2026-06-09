import '@tanstack/react-start/client-only'
import pino from 'pino'

import { env } from '#/env'
import type { AppLogger, LoggerBindings } from '#/lib/logger/shared'
import {
	createLoggerOptions,
	normalizeLoggerBindings,
} from '#/lib/logger/shared'

export const clientLogger = pino(
	createLoggerOptions({
		appName: env.VITE_APP_NAME,
		runtime: 'client',
		nodeEnv: import.meta.env.DEV ? 'development' : 'production',
		clientLevel: env.VITE_LOG_LEVEL,
	})
)

export function createClientLogger(bindings: LoggerBindings): AppLogger {
	return clientLogger.child(normalizeLoggerBindings(bindings))
}
