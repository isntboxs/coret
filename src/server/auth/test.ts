import { betterAuth } from 'better-auth'
import {
	admin as adminPlugin,
	bearer as bearerPlugin,
	multiSession as multiSessionPlugin,
	openAPI as openAPIPlugin,
	username as usernamePlugin,
	organization as organizationPlugin,
	testUtils as testUtilsPlugin,
} from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

import {
	createSharedAuthOptions,
	organizationPluginOptions,
} from '#/server/auth/shared'

export const testAuth = betterAuth({
	...createSharedAuthOptions(),
	plugins: [
		adminPlugin(),
		bearerPlugin(),
		multiSessionPlugin(),
		openAPIPlugin(),
		usernamePlugin(),
		organizationPlugin(organizationPluginOptions),
		testUtilsPlugin(),
		tanstackStartCookies(),
	],
})
