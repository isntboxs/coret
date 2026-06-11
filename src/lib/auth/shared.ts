import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import {
	admin as adminPlugin,
	bearer as bearerPlugin,
	multiSession as multiSessionPlugin,
	openAPI as openAPIPlugin,
	username as usernamePlugin,
	organization as organizationPlugin,
} from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import type { BetterAuthOptions } from 'better-auth'
import type { OrganizationOptions } from 'better-auth/plugins'

import { db } from '#/db'
import * as schema from '#/db/schemas'
import { env } from '#/env'

export const organizationPluginOptions = {
	schema: {
		team: {
			additionalFields: {
				key: {
					type: 'string',
					required: true,
				},
				visibility: {
					type: ['public', 'private'],
					defaultValue: 'public',
					required: false,
				},
				creatorId: {
					type: 'string',
					input: false,
					required: false,
					references: {
						model: 'user',
						field: 'id',
						onDelete: 'set null',
					},
				},
				timezone: {
					type: 'string',
					defaultValue: 'UTC',
					required: false,
				},
				metadata: {
					type: 'string',
					required: false,
				},
				archivedAt: {
					type: 'date',
					input: false,
					required: false,
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
		appName: env.APP_NAME,
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
		plugins: [
			adminPlugin(),
			bearerPlugin(),
			multiSessionPlugin(),
			openAPIPlugin(),
			usernamePlugin(),
			organizationPlugin(organizationPluginOptions),
			tanstackStartCookies(),
		],
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
		trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS,
	} satisfies BetterAuthOptions
}
