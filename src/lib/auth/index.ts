import { betterAuth } from 'better-auth'

import { createSharedAuthOptions } from '#/lib/auth/shared'

export const auth = betterAuth(createSharedAuthOptions())
