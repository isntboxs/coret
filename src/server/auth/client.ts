import {
	adminClient,
	inferAdditionalFields,
	multiSessionClient,
	usernameClient,
	organizationClient,
} from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

import { env } from '#/env'
import type { auth } from '#/server/auth'

export const authClient = createAuthClient({
	baseURL: env.VITE_APP_URL,
	plugins: [
		adminClient(),
		inferAdditionalFields<typeof auth>(),
		multiSessionClient(),
		usernameClient(),
		organizationClient(),
	],
})
