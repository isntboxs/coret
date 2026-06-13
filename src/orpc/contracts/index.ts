import { healthContract } from '#/orpc/contracts/health.contract'
import { workspaceContract } from '#/orpc/contracts/workspace.contract'

export const orpcContracts = {
	health: healthContract,
	workspace: workspaceContract,
} as const
