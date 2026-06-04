import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

import { getQueryClient } from '#/lib/react-query'
import { routeTree } from '#/routeTree.gen'

export function getRouter() {
	const queryClient = getQueryClient()
	const router = createTanStackRouter({
		context: {
			queryClient,
		},
		routeTree,
		scrollRestoration: true,
		defaultPreload: 'intent',
		defaultPreloadStaleTime: 0,
	})

	setupRouterSsrQueryIntegration({
		router,
		queryClient,
	})

	return router
}

declare module '@tanstack/react-router' {
	interface Register {
		router: ReturnType<typeof getRouter>
	}
}
