import { implement } from '@orpc/server'

import { orpcContracts } from '#/orpc/contracts'
import type { ORPCLoggerContext } from '#/orpc/logger'

export const orpcBase = implement(orpcContracts).$context<ORPCLoggerContext>()
