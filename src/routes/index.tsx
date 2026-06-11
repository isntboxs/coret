import { createFileRoute } from '@tanstack/react-router'

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
			<main>
				<h1>Landing</h1>
			</main>
		)
	}

	return (
		<main>
			<h1>Home - PWA update test</h1>
			<p>Must be got toast message for PWA update</p>
		</main>
	)
}
