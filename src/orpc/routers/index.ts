import type {
	InferRouterInputs,
	InferRouterOutputs,
	RouterClient,
} from '@orpc/server'

import { orpcBase } from '#/orpc/base'
import { healthRouter } from '#/orpc/routers/health.router'
import { organizationRouter } from '#/orpc/routers/organization.router'

export const orpcRouters = orpcBase.router({
	health: healthRouter,
	organization: organizationRouter,
})

export type ORPCRouterClient = RouterClient<typeof orpcRouters>

export type RouterInputs = InferRouterInputs<typeof orpcRouters>
export type RouterOutputs = InferRouterOutputs<typeof orpcRouters>
