import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import {
	HeadContent,
	Scripts,
	createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import type { ReactNode } from 'react'

import { Toaster } from '#/components/ui/sonner'
import { getAuthFn } from '#/server/functions/get-auth-Fn'
import appCss from '#/styles.css?url'

type RootRouterContext = {
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RootRouterContext>()({
	beforeLoad: async () => {
		const auth = await getAuthFn()
		return { auth }
	},
	head: () => {
		return {
			meta: [
				{
					charSet: 'utf-8',
				},
				{
					name: 'viewport',
					content: 'width=device-width, initial-scale=1',
				},
				{
					title: 'coret',
				},
			],
			links: [
				{
					rel: 'stylesheet',
					href: appCss,
				},
			],
		}
	},
	shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Toaster />
				<TanStackDevtools
					config={{
						position: 'bottom-right',
					}}
					plugins={[
						{
							name: 'Tanstack Router',
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	)
}
