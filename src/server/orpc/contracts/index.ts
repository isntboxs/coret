import { appContextContract } from '#/server/orpc/contracts/app-context.contract'
import { healthContract } from '#/server/orpc/contracts/health.contract'

export const orpcContracts = {
	appContext: appContextContract,
	health: healthContract,
} as const
