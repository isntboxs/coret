import type {
	InferRouterInputs,
	InferRouterOutputs,
	RouterClient,
} from '@orpc/server'

import { orpcBase } from '#/server/orpc/base'
import { appContextRouter } from '#/server/orpc/routers/app-context.router'
import { healthRouter } from '#/server/orpc/routers/health.router'

export const orpcRouters = orpcBase.router({
	appContext: appContextRouter,
	health: healthRouter,
})

export type ORPCRouterClient = RouterClient<typeof orpcRouters>

export type RouterInputs = InferRouterInputs<typeof orpcRouters>
export type RouterOutputs = InferRouterOutputs<typeof orpcRouters>
