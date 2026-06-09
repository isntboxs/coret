import { healthContract } from '#/orpc/contracts/health.contract'

export const orpcContracts = {
	health: healthContract,
} as const
