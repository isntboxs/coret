import { orpcBase } from '#/orpc/base'

const requireAuth = orpcBase.middleware(({ context, errors, next }) => {
	if (!context.auth) {
		throw errors.UNAUTHORIZED
	}

	return next({ context: { ...context, auth: context.auth } })
})

export const publicProcedure = orpcBase
export const protectedProcedure = publicProcedure.use(requireAuth)
