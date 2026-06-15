import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'

import { Button, buttonVariants } from '#/components/ui/button'
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
	const navigate = Route.useNavigate()

	const workspaces = useSuspenseQuery(orpc.workspace.list.queryOptions())
	const workspace = useSuspenseQuery(orpc.workspace.get.queryOptions())
	const activeWorkspaceId = auth?.session.activeOrganizationId

	const handleNavigate = () => {
		if (activeWorkspaceId && workspace.data?.slug) {
			void navigate({
				to: '/$workspaceSlug',
				params: { workspaceSlug: workspace.data.slug },
				viewTransition: true,
			})
		}
	}

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
				{!auth
					? `Login to get started with ${env.VITE_APP_NAME}`
					: `Welcome to ${env.VITE_APP_NAME}`}
			</h1>

			{!auth ? (
				<Link
					to="/login"
					className={buttonVariants({ size: 'lg', variant: 'default' })}
					viewTransition
				>
					Get started
				</Link>
			) : (
				<Button size="lg" onClick={handleNavigate}>
					Get started
				</Button>
			)}
		</main>
	)
}
