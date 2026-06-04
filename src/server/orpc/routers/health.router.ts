import { publicProcedure } from '#/server/orpc/middlewares'

const healthHandler = publicProcedure.health.handler(() => {
	return {
		status: 'ok',
		message: 'Service is running',
	}
})

export const healthRouter = healthHandler
