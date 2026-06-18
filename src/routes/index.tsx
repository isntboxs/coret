import { createFileRoute, redirect } from '@tanstack/react-router'

import { HomeRoute } from '#/modules/workspace/components/home-route'

export const Route = createFileRoute('/')({
	loader: async ({ context }) => {
		if (!context.auth) {
			return { state: 'public' as const }
		}

		const homeState = await context.orpc.workspace.homeState.call()
		if (homeState.state === 'redirect') {
			throw redirect({ href: homeState.redirectTo })
		}

		return homeState
	},
	component: RouteComponent,
})

function RouteComponent() {
	const homeState = Route.useLoaderData()

	return <HomeRoute homeState={homeState} />
}
