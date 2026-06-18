import { createFileRoute, redirect } from '@tanstack/react-router'

import { WelcomeRoute } from '#/modules/welcome/components/welcome-route'

export const Route = createFileRoute('/$workspaceSlug/welcome')({
	loader: async ({ context, params }) => {
		if (!context.auth) {
			throw redirect({
				to: '/login',
				search: { callbackURL: `/${params.workspaceSlug}/welcome` },
			})
		}

		return context.orpc.welcome.get.call({
			workspaceSlug: params.workspaceSlug,
		})
	},
	component: RouteComponent,
})

function RouteComponent() {
	const initial = Route.useLoaderData()
	const params = Route.useParams()

	return <WelcomeRoute initial={initial} workspaceSlug={params.workspaceSlug} />
}
