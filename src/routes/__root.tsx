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
import appCss from '#/styles.css?url'

export const Route = createRootRoute({
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
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<ClientOnly>
					<AppUpdateToast />
					<Toaster position="bottom-right" richColors />
				</ClientOnly>
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
