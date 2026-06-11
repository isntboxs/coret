import { createFileRoute, Link } from '@tanstack/react-router'

import { useMemo, useState } from 'react'

import { IconChevronLeft } from '@tabler/icons-react'
import { FaGithub } from 'react-icons/fa'
import { FcGoogle } from 'react-icons/fc'
import { toast } from 'sonner'
import { z } from 'zod'
import type { IconType } from 'react-icons/lib'

import { LogoIcon } from '#/components/logo'
import { Button, buttonVariants } from '#/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '#/components/ui/card'
import { Spinner } from '#/components/ui/spinner'
import { env } from '#/env'
import { sanitizeAuthCallbackURL } from '#/lib/auth-redirect'
import { authClient } from '#/lib/auth/client'
import { cn } from '#/lib/utils'

interface SocialButton {
	provider: 'google' | 'github'
	icon: IconType
	label: string
	onSignIn: (provider: SocialButton['provider']) => Promise<void>
}

const loginSearchSchema = z.object({
	callbackURL: z.string().optional(),
})

export const Route = createFileRoute('/_auth/login')({
	validateSearch: loginSearchSchema,
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
			newUserCallbackURL: '/',
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
		<main className="flex h-svh items-center justify-center">
			<Link
				to="/"
				className={cn(
					buttonVariants({ variant: 'ghost', size: 'lg' }),
					'absolute top-7 left-5'
				)}
				viewTransition
			>
				<IconChevronLeft />
				Back
			</Link>

			<Card className="w-full max-w-sm gap-8 bg-transparent ring-0">
				<CardHeader>
					<LogoIcon className="mb-6 size-8" />

					<CardTitle className="text-2xl font-bold tracking-wide">
						Get started with {env.VITE_APP_NAME}
					</CardTitle>

					<CardDescription className="text-base text-muted-foreground">
						Sign in or create your {env.VITE_APP_NAME} account to continue.
					</CardDescription>
				</CardHeader>

				<CardContent>
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
				</CardContent>

				<CardFooter className="text-center">
					<p className="text-xs text-muted-foreground">
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
				</CardFooter>
			</Card>
		</main>
	)
}
