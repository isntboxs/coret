import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
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

import { env } from '#/env'
import { db } from '#/server/db'
import * as schema from '#/server/db/schemas/auth'

export const auth = betterAuth({
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
		enabled: true,
		autoSignIn: false,
		disableSignUp: true,
		minPasswordLength: 8,
		maxPasswordLength: 128,
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
		organizationPlugin({
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
		}),
		testUtilsPlugin(),
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
	trustedOrigins: env.CORS_ORIGIN,
})
