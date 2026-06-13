import { healthContract } from '#/orpc/contracts/health.contract'
import { organizationContract } from '#/orpc/contracts/organization.contract'

export const orpcContracts = {
	health: healthContract,
	organization: organizationContract,
} as const
