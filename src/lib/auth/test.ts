import { betterAuth } from 'better-auth'
import { testUtils as testUtilsPlugin } from 'better-auth/plugins'

import { createSharedAuthOptions } from '#/lib/auth/shared'

export const testAuth = betterAuth({
	...createSharedAuthOptions(),
	plugins: [testUtilsPlugin()],
})
