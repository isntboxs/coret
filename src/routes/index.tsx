import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
	beforeLoad: ({ context, location }) => {
		if (!context.auth && location.pathname === '/') {
			throw redirect({
				to: '/login',
				search: {
					callbackURL: location.href,
				},
			})
		}
	},
	component: Home,
})

function Home() {
	return (
		<main className="p-4">
			<h1 className="text-xl font-semibold">Coret</h1>
		</main>
	)
}
