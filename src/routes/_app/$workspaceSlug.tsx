import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/$workspaceSlug')({
	component: RouteComponent,
})

function RouteComponent() {
	const { workspaceSlug } = Route.useParams()

	return <div>Hello "/_app/{workspaceSlug}"!</div>
}
