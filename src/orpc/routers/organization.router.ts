import { ORPCError } from '@orpc/server'

import { auth } from '#/lib/auth'
import { protectedProcedure, publicProcedure } from '#/orpc/procedures'

type AuthApiResult<T> = {
	headers?: Headers
	response: T
}

type AuthApiError = Error & {
	body?: {
		code?: string
		message?: string
	}
	status?: number | string
	statusCode?: number
}

const statusToCode = {
	400: 'BAD_REQUEST',
	401: 'UNAUTHORIZED',
	403: 'FORBIDDEN',
	404: 'NOT_FOUND',
	409: 'CONFLICT',
	422: 'UNPROCESSABLE_CONTENT',
	429: 'TOO_MANY_REQUESTS',
} as const

function toOrpcError(error: unknown): ORPCError<string, unknown> {
	if (error instanceof ORPCError) {
		return error as ORPCError<string, unknown>
	}

	const authError = error as Partial<AuthApiError>
	const statusCode = authError.statusCode
	const code =
		typeof statusCode === 'number' && statusCode in statusToCode
			? statusToCode[statusCode as keyof typeof statusToCode]
			: 'INTERNAL_SERVER_ERROR'
	const message =
		authError.body?.message ??
		(error instanceof Error ? error.message : undefined)

	return new ORPCError(code, {
		message,
		status: statusCode,
		data: authError.body,
	})
}

function copyAuthHeaders(source: Headers | undefined, target: Headers | undefined) {
	if (!source || !target) return

	const getSetCookie = (source as Headers & { getSetCookie?: () => Array<string> })
		.getSetCookie
	const setCookies =
		typeof getSetCookie === 'function' ? getSetCookie.call(source) : []

	for (const cookie of setCookies) {
		target.append('set-cookie', cookie)
	}

	source.forEach((value, key) => {
		if (key.toLowerCase() === 'set-cookie' && setCookies.length > 0) return

		target.append(key, value)
	})
}

async function callAuthApi<T>(
	context: {
		req: Request
		resHeaders?: Headers
	},
	call: (headers: Headers) => Promise<AuthApiResult<T>>
) {
	try {
		const result = await call(context.req.headers)
		copyAuthHeaders(result.headers, context.resHeaders)
		return result.response
	} catch (error) {
		throw toOrpcError(error)
	}
}

export const organizationRouter = {
	list: protectedProcedure.organization.list.handler(({ context }) =>
		callAuthApi(context, (headers) =>
			auth.api.listOrganizations({
				headers,
				returnHeaders: true,
			})
		)
	),
	get: protectedProcedure.organization.get.handler(({ input, context }) =>
		callAuthApi(context, (headers) =>
			auth.api.getFullOrganization({
				query: input,
				headers,
				returnHeaders: true,
			})
		)
	),
	create: protectedProcedure.organization.create.handler(({ input, context }) =>
		callAuthApi(context, (headers) =>
			auth.api.createOrganization({
				body: input,
				headers,
				returnHeaders: true,
			})
		)
	),
	update: protectedProcedure.organization.update.handler(({ input, context }) =>
		callAuthApi(context, (headers) =>
			auth.api.updateOrganization({
				body: input,
				headers,
				returnHeaders: true,
			})
		)
	),
	delete: protectedProcedure.organization.delete.handler(({ input, context }) =>
		callAuthApi(context, (headers) =>
			auth.api.deleteOrganization({
				body: input,
				headers,
				returnHeaders: true,
			})
		)
	),
	checkSlug: publicProcedure.organization.checkSlug.handler(
		({ input, context }) =>
			callAuthApi(context, (headers) =>
				auth.api.checkOrganizationSlug({
					body: input,
					headers,
					returnHeaders: true,
				})
			)
	),
	setActive: protectedProcedure.organization.setActive.handler(
		({ input, context }) =>
			callAuthApi(context, (headers) =>
				auth.api.setActiveOrganization({
					body: input,
					headers,
					returnHeaders: true,
				})
			)
	),
}
