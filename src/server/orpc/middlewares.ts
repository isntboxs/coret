import { orpcBase } from '#/server/orpc/base'

export const authenticated = orpcBase.middleware(
	async ({ next, context, errors }) => {
		if (!context.auth) {
			throw errors.UNAUTHORIZED({
				message: 'You are not authenticated',
			})
		}

		return next({
			context: {
				...context,
				auth: {
					...context.auth,
				},
			},
		})
	}
)

export const publicProcedure = orpcBase
export const protectedProcedure = publicProcedure.use(authenticated)
