import { createFileRoute } from '@tanstack/react-router'

import { SmartCoercionPlugin } from '@orpc/json-schema'
import { OpenAPIHandler } from '@orpc/openapi/fetch'
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins'
import { onError } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4'

import { serverLogger } from '#/lib/logger/server'
import { createOrpcLoggingPlugin } from '#/orpc/logger'
import { orpcRouters } from '#/orpc/routers'

const logger = serverLogger

const rpcHandler = new RPCHandler(orpcRouters, {
	interceptors: [
		onError((error) => {
			logger.error({ err: error }, 'RPC handler error')
		}),
	],

	plugins: [createOrpcLoggingPlugin()],
})

const apiHandler = new OpenAPIHandler(orpcRouters, {
	interceptors: [
		onError((error) => {
			logger.error({ err: error }, 'OpenAPI handler error')
		}),
	],

	plugins: [
		createOrpcLoggingPlugin(),
		new SmartCoercionPlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
			specGenerateOptions: {
				info: {
					title: 'trid RPC API Reference',
					version: '1.0.0',
					description: 'API Reference for trid',
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

async function handle({ request }: { request: Request }) {
	logger.info(
		{ method: request.method, path: new URL(request.url).pathname },
		'Request received'
	)

	const rpcResult = await rpcHandler.handle(request, {
		prefix: '/api/rpc',
	})
	if (rpcResult.response) return rpcResult.response

	const apiResult = await apiHandler.handle(request, {
		prefix: '/api/rpc/reference',
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
