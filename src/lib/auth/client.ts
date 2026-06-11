import {
	adminClient,
	inferAdditionalFields,
	inferOrgAdditionalFields,
	multiSessionClient,
	usernameClient,
	organizationClient,
} from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

import { env } from '#/env'
import type { auth } from '#/lib/auth'

export const authClient = createAuthClient({
	baseURL: env.VITE_APP_URL,
	plugins: [
		adminClient(),
		inferAdditionalFields<typeof auth>(),
		multiSessionClient(),
		usernameClient(),
		organizationClient({
			teams: {
				enabled: true,
			},
			schema: inferOrgAdditionalFields<typeof auth>(),
		}),
	],
})
