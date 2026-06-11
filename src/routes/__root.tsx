import { TanStackDevtools } from '@tanstack/react-devtools'
import {
	ClientOnly,
	HeadContent,
	Scripts,
	createRootRoute,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import type { ReactNode } from 'react'

import { Toaster } from 'sonner'

import { AppUpdateToast } from '#/components/app-update-toast'
import { ThemeProvider } from '#/components/providers/theme-provider'
import { getAuthFn } from '#/functions/get-auth-Fn'
import appCss from '#/styles.css?url'

export const Route = createRootRoute({
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
					name: 'theme-color',
					content: '#000000',
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
				{
					rel: 'manifest',
					href: '/manifest.webmanifest',
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
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					disableTransitionOnChange
					storageKey="coret-ui-theme"
				>
					{children}
					<ClientOnly>
						<AppUpdateToast />
						<Toaster position="bottom-right" richColors />
					</ClientOnly>
				</ThemeProvider>
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
