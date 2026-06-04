import { createFileRoute, redirect } from '@tanstack/react-router'

import { ORPCError } from '@orpc/client'

import { orpc } from '#/lib/orpc-client'

export const Route = createFileRoute('/')({
	loader: async ({ context, location }) => {
		try {
			return await context.queryClient.ensureQueryData(
				orpc.appContext.queryOptions()
			)
		} catch (error) {
			if (error instanceof ORPCError && error.code === 'UNAUTHORIZED') {
				throw redirect({
					to: '/login',
					search: {
						callbackURL: location.href,
					},
				})
			}

			throw error
		}
	},
	component: Home,
})

function Home() {
	const appContext = Route.useLoaderData()
	const activeTeamName = appContext.activeTeam?.name ?? 'No active team'

	return (
		<main className="p-4">
			<h1 className="text-xl font-semibold">Coret</h1>
			<p className="text-sm text-muted-foreground">{activeTeamName}</p>
		</main>
	)
}
