import { createFileRoute, redirect } from '@tanstack/react-router'

import { ActiveTeamRoute } from '#/modules/team/components/active-team-route'

export const Route = createFileRoute('/$workspaceSlug/team/$teamKey/active')({
	loader: async ({ context, params }) => {
		if (!context.auth) {
			throw redirect({
				to: '/login',
				search: {
					callbackURL: `/${params.workspaceSlug}/team/${params.teamKey}/active`,
				},
			})
		}

		return context.orpc.team.getByKey.call({
			workspaceSlug: params.workspaceSlug,
			teamKey: params.teamKey,
		})
	},
	component: RouteComponent,
})

function RouteComponent() {
	const data = Route.useLoaderData()

	return <ActiveTeamRoute {...data} />
}
