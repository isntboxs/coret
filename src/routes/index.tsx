import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
	component: Home,
})

function Home() {
	return (
		<main>
			<h1>Home - PWA update test</h1>
			<p>Must be got toast message</p>
		</main>
	)
}
