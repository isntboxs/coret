import { teamContract } from '#/modules/team/contract'
import { welcomeContract } from '#/modules/welcome/contract'
import { workspaceContract } from '#/modules/workspace/contract'
import { healthContract } from '#/server/orpc/health.contract'

export const orpcContracts = {
	health: healthContract,
	team: teamContract,
	welcome: welcomeContract,
	workspace: workspaceContract,
} as const
