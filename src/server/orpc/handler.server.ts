import '@tanstack/react-start/server-only'
import { SmartCoercionPlugin } from '@orpc/json-schema'
import { OpenAPIHandler } from '@orpc/openapi/fetch'
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins'
import { onError } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import { ResponseHeadersPlugin } from '@orpc/server/plugins'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4'

import { createORPCContext } from '#/server/orpc/context.server'
import { createOrpcLoggingPlugin } from '#/server/orpc/logger.server'
import { orpcRouters } from '#/server/orpc/registry'
import { serverLogger } from '#/shared/logger/server'

const logger = serverLogger

const rpcHandler = new RPCHandler(orpcRouters, {
	interceptors: [
		onError((error) => {
			logger.error({ err: error }, 'RPC handler error')
		}),
	],
	plugins: [createOrpcLoggingPlugin(), new ResponseHeadersPlugin()],
})

const apiHandler = new OpenAPIHandler(orpcRouters, {
	interceptors: [
		onError((error) => {
			logger.error({ err: error }, 'OpenAPI handler error')
		}),
	],
	plugins: [
		createOrpcLoggingPlugin(),
		new ResponseHeadersPlugin(),
		new SmartCoercionPlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
			specGenerateOptions: {
				info: {
					title: 'Coret RPC API Reference',
					version: '1.0.0',
					description: 'API Reference for Coret',
				},
				commonSchemas: {
					UndefinedError: { error: 'UndefinedError' },
				},
				security: [{ apiKeyCookie: [] }],
				components: {
					securitySchemes: {
						apiKeyCookie: {
							type: 'apiKey',
							in: 'cookie',
							name: 'better-auth.session_token',
							description: 'Better Auth session cookie authentication',
						},
					},
				},
			},
		}),
	],
})

export async function handleORPCRequest({ request }: { request: Request }) {
	const context = await createORPCContext({ headers: request.headers })

	const rpcResult = await rpcHandler.handle(request, {
		prefix: '/api/rpc',
		context,
	})

	if (rpcResult.response) return rpcResult.response

	const apiResult = await apiHandler.handle(request, {
		prefix: '/api/rpc/reference',
		context,
	})

	if (apiResult.response) return apiResult.response

	return new Response('Not found', { status: 404 })
}
