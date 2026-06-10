import { getOrpcLogger } from '#/orpc/logger'
import { publicProcedure } from '#/orpc/procedures'

const healthHandler = publicProcedure.health.handler(({ context }) => {
	const logger = getOrpcLogger(context)

	logger?.debug('health check requested')

	return {
		status: 'ok',
		message: 'Service is running',
	}
})

export const healthRouter = healthHandler
