import { ORPCError } from '@orpc/server'

import { orpcBase } from '#/orpc/base'

export const publicProcedure = orpcBase

export const protectedProcedure = publicProcedure.use(({ context, next }) => {
	if (!context.auth) {
		throw new ORPCError('UNAUTHORIZED')
	}

	return next({
		context: {
			auth: context.auth,
		},
	})
})
