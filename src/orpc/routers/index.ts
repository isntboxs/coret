import type {
	InferRouterInputs,
	InferRouterOutputs,
	RouterClient,
} from '@orpc/server'

import { orpcBase } from '#/orpc/base'
import { healthRouter } from '#/orpc/routers/health.router'
import { workspaceRouter } from '#/orpc/routers/workspace.router'

export const orpcRouters = orpcBase.router({
	health: healthRouter,
	workspace: workspaceRouter,
})

export type ORPCRouterClient = RouterClient<typeof orpcRouters>

export type RouterInputs = InferRouterInputs<typeof orpcRouters>
export type RouterOutputs = InferRouterOutputs<typeof orpcRouters>
