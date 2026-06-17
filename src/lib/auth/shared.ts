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
import {
	afterAcceptInvitationHook,
	afterAddTeamMemberHook,
	afterCreateInvitationHook,
	afterCreateTeamHook,
	afterCreateWorkspaceHook,
	afterDeleteTeamHook,
	afterDeleteWorkspaceHook,
	afterRemoveTeamMemberHook,
	afterUpdateTeamHook,
	afterUpdateWorkspaceHook,
	beforeAcceptInvitationHook,
	beforeAddTeamMemberHook,
	beforeCreateInvitationHook,
	beforeCreateTeamHook,
	beforeCreateWorkspaceHook,
	beforeDeleteTeamHook,
	beforeDeleteWorkspaceHook,
	beforeRemoveTeamMemberHook,
	beforeUpdateTeamHook,
	beforeUpdateWorkspaceHook,
} from '#/features/workspace/server/organization-hooks.server'

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
			enabled: true,
		},
	},
	organizationHooks: {
		beforeCreateOrganization: beforeCreateWorkspaceHook,
		afterCreateOrganization: afterCreateWorkspaceHook,
		beforeUpdateOrganization: beforeUpdateWorkspaceHook,
		afterUpdateOrganization: afterUpdateWorkspaceHook,
		beforeDeleteOrganization: beforeDeleteWorkspaceHook,
		afterDeleteOrganization: afterDeleteWorkspaceHook,
		beforeCreateTeam: beforeCreateTeamHook,
		afterCreateTeam: afterCreateTeamHook,
		beforeUpdateTeam: beforeUpdateTeamHook,
		afterUpdateTeam: afterUpdateTeamHook,
		beforeDeleteTeam: beforeDeleteTeamHook,
		afterDeleteTeam: afterDeleteTeamHook,
		beforeAddTeamMember: beforeAddTeamMemberHook,
		afterAddTeamMember: afterAddTeamMemberHook,
		beforeRemoveTeamMember: beforeRemoveTeamMemberHook,
		afterRemoveTeamMember: afterRemoveTeamMemberHook,
		beforeCreateInvitation: beforeCreateInvitationHook,
		afterCreateInvitation: afterCreateInvitationHook,
		beforeAcceptInvitation: beforeAcceptInvitationHook,
		afterAcceptInvitation: afterAcceptInvitationHook,
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
