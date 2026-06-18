import { implement } from '@orpc/server'

import type { ORPCContext } from '#/server/orpc/context.server'
import { orpcContracts } from '#/server/orpc/contracts'

export const orpcBase = implement(orpcContracts).$context<ORPCContext>()
