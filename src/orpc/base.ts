import { implement } from '@orpc/server'

import type { ORPCContext } from '#/orpc/context'
import { orpcContracts } from '#/orpc/contracts'

export const orpcBase = implement(orpcContracts).$context<ORPCContext>()
