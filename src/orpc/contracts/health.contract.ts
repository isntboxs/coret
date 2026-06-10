import { z } from 'zod'

import { orpcBaseContract as baseContract } from '#/orpc/contracts/base.contract'

export const healthContract = baseContract
	.route({
		path: '/health',
		method: 'GET',
		summary: 'Check server health',
		description: 'Check if the server is healthy.',
		tags: ['Health'],
		operationId: 'checkHealth',
		successStatus: 200,
		successDescription: 'Server is healthy',
	})
	.output(
		z.object({
			status: z.literal('ok'),
			message: z.string(),
		})
	)
