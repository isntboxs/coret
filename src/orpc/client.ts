import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

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
			context: async () => createORPCContext({ headers: getRequestHeaders() }),
		})
	)
	.client((): ORPCRouterClient => {
		const link = new RPCLink({
			url: `${window.location.origin}/api/rpc`,
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
