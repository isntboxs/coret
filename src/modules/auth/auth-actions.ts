import { createClientOnlyFn } from '@tanstack/react-start'

type SocialProvider = 'google' | 'github'

export const signInWithSocialProvider = createClientOnlyFn(
	async (input: {
		provider: SocialProvider
		callbackURL: string
		newUserCallbackURL: string
		onRequest: () => void
		onSuccess: () => void
		onError: (message: string) => void
	}) => {
		const { authClient } = await import('#/modules/auth/auth.client')

		await authClient.signIn.social({
			provider: input.provider,
			callbackURL: input.callbackURL,
			newUserCallbackURL: input.newUserCallbackURL,
			fetchOptions: {
				onRequest: input.onRequest,
				onSuccess: input.onSuccess,
				onError: (ctx) => {
					input.onError(ctx.error.message)
				},
			},
		})
	}
)

export const linkGithubAccount = createClientOnlyFn(
	async (callbackURL: string) => {
		const { authClient } = await import('#/modules/auth/auth.client')
		const client = authClient as unknown as {
			linkSocial?: (input: {
				provider: 'github'
				callbackURL: string
			}) => Promise<{ data?: { url?: string } | null }>
		}

		return client.linkSocial?.({
			provider: 'github',
			callbackURL,
		})
	}
)
