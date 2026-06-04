import { implement } from '@orpc/server'

import type { ORPCContextWithLogger } from '#/server/orpc/context'
import { orpcContracts } from '#/server/orpc/contracts'

export const orpcBase =
	implement(orpcContracts).$context<ORPCContextWithLogger>()
