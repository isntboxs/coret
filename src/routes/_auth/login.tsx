import { createFileRoute, Link } from '@tanstack/react-router'

import { useMemo, useState } from 'react'

import { FaGithub } from 'react-icons/fa'
import { FcGoogle } from 'react-icons/fc'
import { toast } from 'sonner'
import { z } from 'zod'
import type { IconType } from 'react-icons/lib'

import { LogoIcon2 } from '#/components/logo'
import { Button } from '#/components/ui/button'
import { Spinner } from '#/components/ui/spinner'
import { env } from '#/env'
import { sanitizeAuthCallbackURL } from '#/lib/auth-redirect'
import { authClient } from '#/server/auth/client'

interface SocialButton {
	provider: 'google' | 'github'
	icon: IconType
	label: string
	onSignIn: (provider: SocialButton['provider']) => Promise<void>
}

const loginSearchParamsSchema = z.object({
	callbackURL: z.unknown().optional(),
})

export const Route = createFileRoute('/_auth/login')({
	validateSearch: loginSearchParamsSchema,
	component: RouteComponent,
})

function RouteComponent() {
	const [loadingProvider, setLoadingProvider] = useState<
		SocialButton['provider'] | null
	>(null)

	const search = Route.useSearch()
	const callbackURL = sanitizeAuthCallbackURL(search.callbackURL)

	const handleSignIn = async (provider: SocialButton['provider']) => {
		await authClient.signIn.social({
			provider,
			callbackURL,
			fetchOptions: {
				onRequest: () => {
					setLoadingProvider(provider)
				},
				onSuccess: () => {
					setLoadingProvider(null)
				},
				onError: (ctx) => {
					setLoadingProvider(null)
					toast.error(ctx.error.message)
				},
			},
		})
	}

	const socialButtons = useMemo<Array<SocialButton>>(
		() => [
			{
				provider: 'google',
				icon: FcGoogle,
				label: 'Continue with Google',
				onSignIn: handleSignIn,
			},
			{
				provider: 'github',
				icon: FaGithub,
				label: 'Continue with GitHub',
				onSignIn: handleSignIn,
			},
		],
		// oxlint-disable-next-line react-hooks/exhaustive-deps
		[]
	)

	return (
		<div className="mx-auto flex flex-col gap-8 sm:w-sm">
			<LogoIcon2 className="size-8 lg:hidden" />

			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-bold tracking-wide">
					Get started with Coret
				</h1>

				<p className="text-base text-muted-foreground">
					Sign in or create your {env.VITE_APP_NAME} account to continue.
				</p>
			</div>

			<div className="flex flex-col gap-4">
				{socialButtons.map((button) => (
					<Button
						key={button.provider}
						size="lg"
						className="w-full"
						onClick={() => button.onSignIn(button.provider)}
						disabled={loadingProvider === button.provider}
					>
						{loadingProvider === button.provider ? (
							<Spinner data-icon="inline-start" />
						) : (
							<button.icon data-icon="inline-start" />
						)}
						{button.label}
					</Button>
				))}
			</div>

			<p className="mt-8 text-sm text-muted-foreground">
				By clicking continue, you agree to our{' '}
				<Link
					to="."
					className="underline underline-offset-4 hover:text-primary"
				>
					Terms of Service
				</Link>{' '}
				and{' '}
				<Link
					to="."
					className="underline underline-offset-4 hover:text-primary"
				>
					Privacy Policy
				</Link>
				.
			</p>
		</div>
	)
}
