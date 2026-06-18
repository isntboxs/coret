import '@tanstack/react-start/server-only'
import { LoggingHandlerPlugin, getLogger } from '@orpc/experimental-pino'
import type { LoggerContext } from '@orpc/experimental-pino'
import type { Context } from '@orpc/server'

import { env } from '#/env'
import { serverLogger } from '#/shared/logger/server'
import { resolveLoggerSettings } from '#/shared/logger/shared'

export function getOrpcLogger(context: LoggerContext) {
	return getLogger(context)
}

export function createOrpcLoggingPlugin<TContext extends Context>() {
	const settings = resolveLoggerSettings({
		nodeEnv: env.NODE_ENV,
		level: env.LOG_LEVEL,
		pretty: env.LOG_PRETTY,
		requestResponse: env.LOG_REQUEST_RESPONSE,
		requestAbort: env.LOG_REQUEST_ABORT,
	})

	return new LoggingHandlerPlugin<TContext>({
		logger: serverLogger,
		generateId: () => crypto.randomUUID(),
		logRequestResponse: settings.requestResponse,
		logRequestAbort: settings.requestAbort,
	})
}

export const orpcLoggingPlugin = createOrpcLoggingPlugin()
