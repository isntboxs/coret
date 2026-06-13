import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'

import { buttonVariants } from '#/components/ui/button'
import { env } from '#/env'
import { CreateWorkspaceForm } from '#/features/workspace/components/create-workspace-form'

export const Route = createFileRoute('/')({
	beforeLoad: ({ context }) => {
		return { context: context.auth }
	},

	component: Home,
})

function Home() {
	const { auth, orpc } = Route.useRouteContext()

	const workspaces = useSuspenseQuery(orpc.workspace.list.queryOptions())
	const activeWorkspaceId = auth?.session.activeOrganizationId

	if (auth && !activeWorkspaceId && workspaces.data.length <= 1) {
		return (
			<main className="flex h-svh flex-col items-center justify-center gap-6">
				<CreateWorkspaceForm />
			</main>
		)
	}

	return (
		<main className="flex h-svh flex-col items-center justify-center gap-6">
			<h1 className="text-4xl font-bold">
				Login to get started with {env.VITE_APP_NAME}
			</h1>

			<Link
				to="/login"
				className={buttonVariants({ size: 'lg', variant: 'default' })}
				viewTransition
			>
				Get started
			</Link>
		</main>
	)
}
