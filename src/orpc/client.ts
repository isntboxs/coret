import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createRouterClient } from '@orpc/server'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'

import { createORPCContext } from '#/orpc/context'
import { orpcRouters } from '#/orpc/routers'
import type { ORPCRouterClient } from '#/orpc/routers'

const getORPCClient = createIsomorphicFn()
	.server(() =>
		createRouterClient(orpcRouters, {
			context: async () => createORPCContext({ req: getRequest() }),
		})
	)
	.client((): ORPCRouterClient => {
		const link = new RPCLink({
			url: '/api/rpc',
			fetch(url, options) {
				return fetch(url, {
					...options,
					credentials: 'include',
				})
			},
		})

		return createORPCClient(link)
	})

const client: ORPCRouterClient = getORPCClient()
export const orpc = createTanstackQueryUtils(client)
