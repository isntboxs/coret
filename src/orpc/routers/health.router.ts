import { getOrpcLogger } from '#/orpc/logger'
import { publicProcedure } from '#/orpc/procedures'

const healthHandler = publicProcedure.health.handler(({ context }) => {
	getOrpcLogger(context)?.debug('health check requested')

	return {
		status: 'ok',
		message: 'Service is running',
	}
})

export const healthRouter = healthHandler
