import { Link, createFileRoute } from '@tanstack/react-router'

import { buttonVariants } from '#/components/ui/button'
import { env } from '#/env'

export const Route = createFileRoute('/')({
	beforeLoad: ({ context }) => {
		return { context: context.auth }
	},

	component: Home,
})

function Home() {
	const { auth } = Route.useRouteContext()

	if (!auth) {
		return (
			<main className="flex h-svh flex-col items-center justify-center gap-6">
				<h1 className="text-4xl font-bold">
					Login to get started with {env.VITE_APP_NAME}
				</h1>

				<Link
					to="/login"
					className={buttonVariants({ size: 'lg', variant: 'default' })}
				>
					Get started
				</Link>
			</main>
		)
	}

	return (
		<main>
			<h1>Welcome, {auth.user.name}</h1>
			<pre>
				<code>{JSON.stringify(auth, null, 2)}</code>
			</pre>
		</main>
	)
}
