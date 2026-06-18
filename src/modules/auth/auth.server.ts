import { betterAuth } from 'better-auth'

import { createSharedAuthOptions } from '#/modules/auth/auth-options.server'

export const auth = betterAuth(createSharedAuthOptions())
