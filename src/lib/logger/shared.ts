import type { Bindings, Logger, LoggerOptions, SerializerFn } from 'pino'

export const LOG_LEVELS = [
	'fatal',
	'error',
	'warn',
	'info',
	'debug',
	'trace',
	'silent',
] as const

export type LogLevel = (typeof LOG_LEVELS)[number]
export type LoggerBindings = Bindings
export type AppLogger = Logger
export type LoggerRuntime = 'server' | 'client'
export type NodeEnv = 'development' | 'production' | 'test'

export interface LoggerSettings {
	level: LogLevel
	pretty: boolean
	requestResponse: boolean
	requestAbort: boolean
}

export interface LoggerSettingsInput {
	nodeEnv: NodeEnv
	level?: LogLevel
	pretty?: boolean
	requestResponse?: boolean
	requestAbort?: boolean
}

export interface LoggerOptionsInput extends LoggerSettingsInput {
	appName: string
	runtime: LoggerRuntime
	clientLevel?: LogLevel
}

export const REDACTED_VALUE = '[REDACTED]'
const SAFE_HEADER_NAMES = [
	'content-type',
	'content-length',
	'content-disposition',
] as const

export const LOGGER_REDACT_PATHS = [
	'password',
	'*.password',
	'*.*.password',
	'currentPassword',
	'newPassword',
	'token',
	'*.token',
	'*.*.token',
	'accessToken',
	'refreshToken',
	'idToken',
	'apiKey',
	'secret',
	'*.secret',
	'*.*.secret',
	'authorization',
	'cookie',
	'headers.authorization',
	'headers.Authorization',
	'headers.cookie',
	'headers.Cookie',
	'req.headers.authorization',
	'req.headers.Authorization',
	'req.headers.cookie',
	'req.headers.Cookie',
	'request.headers.authorization',
	'request.headers.Authorization',
	'request.headers.cookie',
	'request.headers.Cookie',
	'response.headers.authorization',
	'response.headers.Authorization',
	'response.headers.cookie',
	'response.headers.Cookie',
] as const

export const loggerSerializers: Record<string, SerializerFn> = {
	err: serializeError,
	error: serializeError,
	req: serializeRequest,
	request: serializeRequest,
	res: serializeResponse,
	response: serializeResponse,
}

export function resolveLoggerSettings({
	nodeEnv,
	level,
	pretty,
	requestResponse,
	requestAbort,
}: LoggerSettingsInput): LoggerSettings {
	return {
		level: level ?? (nodeEnv === 'development' ? 'debug' : 'info'),
		pretty: pretty ?? nodeEnv === 'development',
		requestResponse: requestResponse ?? false,
		requestAbort: requestAbort ?? false,
	}
}

export function resolveClientLogLevel(level?: LogLevel): LogLevel {
	return level ?? 'info'
}

export function createLoggerOptions({
	appName,
	runtime,
	clientLevel,
	...settingsInput
}: LoggerOptionsInput): LoggerOptions {
	const settings = resolveLoggerSettings(settingsInput)
	const level =
		runtime === 'client' ? resolveClientLogLevel(clientLevel) : settings.level

	const options: LoggerOptions = {
		base: {
			app: appName,
			runtime,
		},
		browser:
			runtime === 'client'
				? {
						asObject: true,
						serialize: true,
					}
				: undefined,
		level,
		redact: {
			paths: [...LOGGER_REDACT_PATHS],
			censor: REDACTED_VALUE,
		},
		serializers: loggerSerializers,
		timestamp: isoTimestamp,
	}

	if (runtime === 'server' && settings.pretty) {
		options.transport = {
			target: 'pino-pretty',
			options: {
				colorize: true,
				ignore: 'pid,hostname',
				singleLine: false,
				translateTime: 'SYS:standard',
			},
		}
	}

	return options
}

export function normalizeLoggerBindings(
	bindings: LoggerBindings = {}
): LoggerBindings {
	return Object.fromEntries(
		Object.entries(bindings).filter(([, value]) => value !== undefined)
	)
}

function isoTimestamp() {
	return `,"time":"${new Date().toISOString()}"`
}

function serializeError(value: unknown, seen = new WeakSet<Error>()) {
	if (!(value instanceof Error)) {
		return value
	}

	if (seen.has(value)) {
		return {
			type: value.name,
			message: value.message,
			cause: '[Circular]',
		}
	}

	seen.add(value)

	const serialized: Record<string, unknown> = {
		type: value.name,
		message: value.message,
		stack: value.stack,
	}

	if ('cause' in value) {
		serialized.cause = serializeError(value.cause, seen)
	}

	return serialized
}

function serializeRequest(value: unknown) {
	if (!isRecord(value)) {
		return value
	}

	return normalizeLoggerBindings({
		method: readStringProperty(value, 'method'),
		url: serializeUrl(value.url),
		headers: serializeHeaders(value.headers),
	})
}

function serializeResponse(value: unknown) {
	if (!isRecord(value)) {
		return value
	}

	return normalizeLoggerBindings({
		status:
			readNumberProperty(value, 'status') ??
			readNumberProperty(value, 'statusCode'),
		headers: serializeHeaders(value.headers),
	})
}

function serializeHeaders(value: unknown) {
	const headers: Record<string, string | Array<string>> = {}

	for (const name of SAFE_HEADER_NAMES) {
		const header = readHeaderValue(value, name)

		if (header !== undefined) {
			headers[name] = header
		}
	}

	return headers
}

function readHeaderValue(
	headers: unknown,
	name: (typeof SAFE_HEADER_NAMES)[number]
) {
	if (!isRecord(headers)) {
		return undefined
	}

	const fromGetter = readHeaderFromGetter(headers, name)
	if (fromGetter !== undefined) {
		return fromGetter
	}

	return normalizeHeaderValue(
		headers[name] ?? headers[toHeaderCase(name)] ?? headers[name.toUpperCase()]
	)
}

function readHeaderFromGetter(
	headers: Record<string, unknown>,
	name: (typeof SAFE_HEADER_NAMES)[number]
) {
	if (!hasHeaderGetter(headers)) {
		return undefined
	}

	return normalizeHeaderValue(headers.get(name))
}

function normalizeHeaderValue(
	value: unknown
): string | Array<string> | undefined {
	if (Array.isArray(value)) {
		const normalizedValues = value
			.map((item) => normalizeHeaderValue(item))
			.filter((item): item is string => typeof item === 'string')

		return normalizedValues.length > 0 ? normalizedValues : undefined
	}

	if (typeof value === 'string') {
		return value
	}

	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value)
	}

	return undefined
}

function serializeUrl(value: unknown) {
	if (typeof value === 'string') {
		return stripQueryAndHash(value)
	}

	if (value instanceof URL) {
		return value.pathname
	}

	if (isRecord(value) && typeof value.href === 'string') {
		return stripQueryAndHash(value.href)
	}

	return undefined
}

function stripQueryAndHash(raw: string) {
	try {
		return new URL(raw).pathname
	} catch {
		return raw.split('?')[0]?.split('#')[0] ?? raw
	}
}

function readStringProperty(record: Record<string, unknown>, key: string) {
	const value = record[key]

	return typeof value === 'string' ? value : undefined
}

function readNumberProperty(record: Record<string, unknown>, key: string) {
	const value = record[key]

	return typeof value === 'number' ? value : undefined
}

function toHeaderCase(value: string) {
	return value
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('-')
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null
}

function hasHeaderGetter(
	value: Record<string, unknown>
): value is Record<string, unknown> & { get: (name: string) => unknown } {
	return typeof value.get === 'function'
}
