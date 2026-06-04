import { Writable } from 'node:stream'
import { describe, expect, it } from 'vitest'

import {
	createChildLogger,
	createLogger,
	createLoggerOptions,
} from '#/server/logger'

class MemoryDestination extends Writable {
	chunks: Array<string> = []

	_write(
		chunk: Buffer | string,
		_encoding: BufferEncoding,
		callback: (error?: Error | null) => void
	) {
		this.chunks.push(chunk.toString())
		callback()
	}

	readLines() {
		return this.chunks
			.join('')
			.split('\n')
			.filter((line) => line.length > 0)
	}
}

function createMemoryDestination() {
	return new MemoryDestination()
}

function parseLogLine(line: string | undefined) {
	if (!line) {
		throw new Error('Expected a log line')
	}

	return JSON.parse(line) as Record<string, unknown>
}

describe('logger', () => {
	it('emits parseable JSON with app metadata and child bindings', () => {
		const destination = createMemoryDestination()
		const logger = createLogger({
			pretty: false,
			destination,
			bindings: { service: 'tests' },
		})

		logger.child({ scope: 'unit' }).info({ feature: 'logger' }, 'ready')

		const [line] = destination.readLines()
		const entry = parseLogLine(line)

		expect(entry.msg).toBe('ready')
		expect(entry.level).toBe(30)
		expect(entry.name).toBe('coret')
		expect(entry.app).toBe('coret')
		expect(entry.environment).toBe('test')
		expect(entry.service).toBe('tests')
		expect(entry.scope).toBe('unit')
		expect(entry.feature).toBe('logger')
		expect(typeof entry.time).toBe('string')
	})

	it('redacts sensitive fields from nested log objects', () => {
		const destination = createMemoryDestination()
		const logger = createLogger({ pretty: false, destination })

		logger.warn(
			{
				password: 'plain-text',
				headers: {
					Authorization: 'Bearer secret-token',
					Cookie: 'session=secret',
				},
				account: {
					refreshToken: 'refresh-token',
				},
			},
			'sensitive values hidden'
		)

		const [line] = destination.readLines()
		const entry = parseLogLine(line)
		const headers = entry.headers as Record<string, string> | undefined
		const account = entry.account as Record<string, string> | undefined

		expect(entry.password).toBe('[Redacted]')
		expect(headers?.Authorization).toBe('[Redacted]')
		expect(headers?.Cookie).toBe('[Redacted]')
		expect(account?.refreshToken).toBe('[Redacted]')
	})

	it('keeps explicit JSON mode independent from pino-pretty', () => {
		const destination = createMemoryDestination()
		const logger = createLogger({ pretty: false, destination })

		logger.info('json output')

		const [line] = destination.readLines()

		expect(() => parseLogLine(line)).not.toThrow()
		expect(line).toContain('"msg":"json output"')
	})

	it('creates scoped child loggers from the shared app logger', () => {
		const childLogger = createChildLogger('auth', { feature: 'oauth' })

		expect(childLogger.bindings()).toMatchObject({
			scope: 'auth',
			feature: 'oauth',
		})
	})

	it('uses LOG_PRETTY as the default pretty mode', () => {
		const options = createLoggerOptions()

		expect(options.transport).toBeUndefined()
	})

	it('forces pino-pretty outside production when pretty is true', () => {
		const originalNodeEnv = process.env.NODE_ENV

		process.env.NODE_ENV = 'development'

		try {
			const options = createLoggerOptions({ pretty: true })

			expect(options.transport).toMatchObject({
				target: 'pino-pretty',
			})
		} finally {
			process.env.NODE_ENV = originalNodeEnv
		}
	})

	it('keeps JSON output when pretty is false', () => {
		const options = createLoggerOptions({ pretty: false })

		expect(options.transport).toBeUndefined()
	})

	it('uses TTY detection for auto pretty mode', () => {
		const originalIsTTY = process.stdout.isTTY

		try {
			Object.defineProperty(process.stdout, 'isTTY', {
				configurable: true,
				value: false,
			})
			expect(createLoggerOptions({ pretty: 'auto' }).transport).toBeUndefined()

			Object.defineProperty(process.stdout, 'isTTY', {
				configurable: true,
				value: true,
			})
			expect(createLoggerOptions({ pretty: 'auto' }).transport).toMatchObject({
				target: 'pino-pretty',
			})
		} finally {
			Object.defineProperty(process.stdout, 'isTTY', {
				configurable: true,
				value: originalIsTTY,
			})
		}
	})

	it('keeps production logs in JSON mode', () => {
		const originalNodeEnv = process.env.NODE_ENV

		process.env.NODE_ENV = 'production'

		try {
			const options = createLoggerOptions({ pretty: true })

			expect(options.transport).toBeUndefined()
		} finally {
			process.env.NODE_ENV = originalNodeEnv
		}
	})
})
