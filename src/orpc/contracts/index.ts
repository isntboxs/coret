import { healthContract } from '#/orpc/contracts/health.contract'
import { teamContract } from '#/orpc/contracts/team.contract'
import { welcomeContract } from '#/orpc/contracts/welcome.contract'
import { workspaceContract } from '#/orpc/contracts/workspace.contract'

export const orpcContracts = {
	health: healthContract,
	team: teamContract,
	welcome: welcomeContract,
	workspace: workspaceContract,
} as const
