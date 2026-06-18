import type {
	InferRouterInputs,
	InferRouterOutputs,
	RouterClient,
} from '@orpc/server'

import { teamRouter } from '#/modules/team/router'
import { welcomeRouter } from '#/modules/welcome/router'
import { workspaceRouter } from '#/modules/workspace/router'
import { orpcBase } from '#/server/orpc/base'
import { healthRouter } from '#/server/orpc/health.router'

export const orpcRouters = orpcBase.router({
	health: healthRouter,
	team: teamRouter,
	welcome: welcomeRouter,
	workspace: workspaceRouter,
})

export type ORPCRouterClient = RouterClient<typeof orpcRouters>

export type RouterInputs = InferRouterInputs<typeof orpcRouters>
export type RouterOutputs = InferRouterOutputs<typeof orpcRouters>
