import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import type { BetterAuthOptions } from 'better-auth'
import type { OrganizationOptions } from 'better-auth/plugins'

import { env } from '#/env'
import { db } from '#/server/db'
import * as schema from '#/server/db/schemas/auth'

export const organizationPluginOptions = {
	schema: {
		team: {
			additionalFields: {
				key: {
					type: 'string',
					required: true,
				},
			},
		},
	},
	teams: {
		enabled: true,
		defaultTeam: {
			enabled: false,
		},
	},
} satisfies OrganizationOptions

export function createSharedAuthOptions() {
	return {
		account: {
			accountLinking: {
				enabled: true,
				trustedProviders: ['github', 'google'],
			},
			encryptOAuthTokens: true,
		},
		advanced: {
			database: {
				generateId: 'uuid',
			},
		},
		appName: env.VITE_APP_NAME,
		baseURL: env.BETTER_AUTH_URL,
		database: drizzleAdapter(db, {
			provider: 'pg',
			schema: {
				account: schema.accountTable,
				member: schema.memberTable,
				organization: schema.organizationTable,
				session: schema.sessionTable,
				team: schema.teamTable,
				teamMember: schema.teamMemberTable,
				user: schema.userTable,
				invitation: schema.invitationTable,
				verification: schema.verificationTable,
			},
		}),
		emailAndPassword: {
			enabled: false,
		},
		logger: {
			disabled: false,
			disableColors: false,
			level: 'debug',
		},
		secret: env.BETTER_AUTH_SECRET,
		session: {
			expiresIn: 60 * 60 * 24 * 3,
		},
		socialProviders: {
			github: {
				enabled: true,
				clientId: env.GITHUB_CLIENT_ID,
				clientSecret: env.GITHUB_CLIENT_SECRET,
			},
			google: {
				enabled: true,
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET,
			},
		},
		trustedOrigins: env.CORS_ORIGIN,
	} satisfies BetterAuthOptions
}
