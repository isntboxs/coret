import { createFileRoute } from '@tanstack/react-router'

import { SmartCoercionPlugin } from '@orpc/json-schema'
import { OpenAPIHandler } from '@orpc/openapi/fetch'
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins'
import { onError } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import { ResponseHeadersPlugin } from '@orpc/server/plugins'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4'

import { serverLogger } from '#/lib/logger/server'
import { createORPCContext } from '#/orpc/context'
import { createOrpcLoggingPlugin } from '#/orpc/logger'
import { orpcRouters } from '#/orpc/routers'

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

const createContext = async ({ headers }: { headers: Headers }) =>
	createORPCContext({ headers })

async function handle({ request }: { request: Request }) {
	const context = await createContext({ headers: request.headers })

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

export const Route = createFileRoute('/api/rpc/$')({
	server: {
		handlers: {
			ANY: handle,
		},
	},
})
