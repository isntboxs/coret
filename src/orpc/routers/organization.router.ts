import { auth } from '#/lib/auth'
import { getOrpcLogger } from '#/orpc/logger'
import { protectedProcedure } from '#/orpc/procedures'
import { withBetterAuthErrorHandling } from '#/orpc/utils'

export const organizationRouter = {
	create: protectedProcedure.organization.create.handler(
		async ({ context, input }) => {
			const logger = getOrpcLogger(context)

			const org = await withBetterAuthErrorHandling(() =>
				auth.api.createOrganization({
					headers: context.headers,
					body: { ...input, userId: context.auth.user.id },
					returnHeaders: true,
				})
			)

			org.headers.forEach((value, key) => {
				if (key.toLowerCase() === 'set-cookie') {
					logger?.debug('setting cookie header')
					context.resHeaders?.append('Set-Cookie', value)
					return
				}

				logger?.debug({ key, value }, 'setting header')
				context.resHeaders?.set(key, value)
			})

			logger?.debug('organization created')
			return org.response
		}
	),

	list: protectedProcedure.organization.list.handler(async ({ context }) => {
		const logger = getOrpcLogger(context)

		const orgs = await withBetterAuthErrorHandling(() =>
			auth.api.listOrganizations({
				headers: context.headers,
				returnHeaders: true,
			})
		)

		orgs.headers.forEach((value, key) => {
			if (key.toLowerCase() === 'set-cookie') {
				logger?.debug('setting cookie header')
				context.resHeaders?.append('Set-Cookie', value)
				return
			}

			logger?.debug({ key, value }, 'setting header')
			context.resHeaders?.set(key, value)
		})

		logger?.debug('organization list requested')
		return orgs.response
	}),
}
