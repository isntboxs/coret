import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pino from 'pino'
import { describe, expect, it } from 'vitest'

import {
	LOGGER_REDACT_PATHS,
	createLoggerOptions,
	loggerSerializers,
	normalizeLoggerBindings,
	resolveLoggerSettings,
} from '#/lib/logger/shared'

const testDirectory = dirname(fileURLToPath(import.meta.url))

describe('logger configuration', () => {
	it('defaults server logging to debug and pretty output in development', () => {
		const settings = resolveLoggerSettings({ nodeEnv: 'development' })

		expect(settings).toEqual({
			level: 'debug',
			pretty: true,
			requestResponse: false,
			requestAbort: false,
		})
	})

	it('defaults server logging to structured info output outside development', () => {
		const settings = resolveLoggerSettings({ nodeEnv: 'production' })

		expect(settings).toEqual({
			level: 'info',
			pretty: false,
			requestResponse: false,
			requestAbort: false,
		})
	})

	it('keeps client logging console-only without a transport', () => {
		const options = createLoggerOptions({
			appName: 'coret',
			runtime: 'client',
			nodeEnv: 'production',
		})

		expect(options.level).toBe('info')
		expect(options.transport).toBeUndefined()
		expect(options.browser).toEqual({
			asObject: true,
			serialize: true,
		})
	})

	it('adds pino-pretty only to server logger options when enabled', () => {
		const options = createLoggerOptions({
			appName: 'coret',
			runtime: 'server',
			nodeEnv: 'development',
		})

		expect(options.transport).toEqual({
			target: 'pino-pretty',
			options: {
				colorize: true,
				ignore: 'pid,hostname',
				singleLine: false,
				translateTime: 'SYS:standard',
			},
		})
	})

	it('redacts common credential and header fields', () => {
		expect(LOGGER_REDACT_PATHS).toContain('password')
		expect(LOGGER_REDACT_PATHS).toContain('headers.authorization')
		expect(LOGGER_REDACT_PATHS).toContain('req.headers.cookie')
		expect(LOGGER_REDACT_PATHS).toContain('refreshToken')
	})

	it('drops undefined logger bindings before creating child loggers', () => {
		expect(
			normalizeLoggerBindings({
				feature: 'health',
				requestId: undefined,
			})
		).toEqual({ feature: 'health' })
	})

	it('serializes request-like objects without walking circular references', () => {
		const serializeRequest = loggerSerializers.req
		const request: Record<string, unknown> = {
			method: 'POST',
			url: new URL('https://coret.test/api/rpc/health'),
			headers: new Headers({
				authorization: 'Bearer secret',
				'content-length': '18',
				'content-type': 'application/json',
				cookie: 'session=secret',
			}),
		}
		request.self = request

		expect(serializeRequest).toBeDefined()
		if (!serializeRequest) return

		expect(serializeRequest(request)).toEqual({
			method: 'POST',
			url: 'https://coret.test/api/rpc/health',
			headers: {
				'content-length': '18',
				'content-type': 'application/json',
			},
		})
	})

	it('serializes response-like objects with safe headers only', () => {
		const serializeResponse = loggerSerializers.res

		expect(serializeResponse).toBeDefined()
		if (!serializeResponse) return

		expect(
			serializeResponse({
				statusCode: 204,
				headers: {
					Cookie: 'session=secret',
					'Content-Disposition': 'attachment; filename="report.csv"',
					'Content-Type': 'text/csv',
				},
			})
		).toEqual({
			status: 204,
			headers: {
				'content-disposition': 'attachment; filename="report.csv"',
				'content-type': 'text/csv',
			},
		})
	})

	it('keeps circular request bindings serializable through pino child loggers', () => {
		const chunks: Array<string> = []
		const stream = {
			write: (chunk: string) => {
				chunks.push(chunk)
			},
		}
		const request: Record<string, unknown> = {
			method: 'GET',
			url: 'https://coret.test/api/rpc/health',
			headers: {
				'content-type': 'application/json',
				cookie: 'session=secret',
			},
		}
		request.self = request

		pino(
			createLoggerOptions({
				appName: 'coret',
				runtime: 'server',
				nodeEnv: 'production',
			}),
			stream
		)
			.child({ req: request })
			.info('health check requested')

		const log = JSON.parse(chunks.join('')) as unknown

		expect(isRecord(log)).toBe(true)
		if (!isRecord(log)) return
		expect(log.req).toEqual({
			method: 'GET',
			url: 'https://coret.test/api/rpc/health',
			headers: {
				'content-type': 'application/json',
			},
		})
		expect(chunks.join('')).not.toContain('unable to serialize')
		expect(chunks.join('')).not.toContain('session=secret')
	})

	it('does not let the client logger import server-only logger code', () => {
		const source = readFileSync(resolve(testDirectory, 'client.ts'), 'utf8')

		expect(source).not.toContain('./server')
		expect(source).not.toContain('#/lib/logger/server')
		expect(source).not.toContain('pino-pretty')
	})
})

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null
}
