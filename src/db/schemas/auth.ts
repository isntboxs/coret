import { sql } from 'drizzle-orm'
import {
	pgEnum,
	pgTable,
	text,
	timestamp,
	boolean,
	uuid,
	index,
	uniqueIndex,
} from 'drizzle-orm/pg-core'

export const workspaceRoleEnum = pgEnum('workspace_role', [
	'owner',
	'admin',
	'member',
])

export const teamVisibilityEnum = pgEnum('team_visibility', [
	'public',
	'private',
])

export const invitationStatusEnum = pgEnum('invitation_status', [
	'pending',
	'accepted',
	'rejected',
	'canceled',
	'expired',
])

export const userTable = pgTable('user', {
	id: uuid('id')
		.default(sql`pg_catalog.gen_random_uuid()`)
		.primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false).notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at')
		.$onUpdate(() => new Date())
		.notNull(),
	role: text('role'),
	banned: boolean('banned').default(false),
	banReason: text('ban_reason'),
	banExpires: timestamp('ban_expires'),
	username: text('username').unique(),
	displayUsername: text('display_username'),
})

export const organizationTable = pgTable(
	'organization',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		name: text('name').notNull(),
		slug: text('slug').notNull().unique(),
		logo: text('logo'),
		createdAt: timestamp('created_at').notNull(),
		metadata: text('metadata'),
	},
	(table) => [uniqueIndex('organization_slug_uidx').on(table.slug)]
)

export const teamTable = pgTable(
	'team',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		name: text('name').notNull(),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organizationTable.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').notNull(),
		updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
		key: text('key').notNull(),
		visibility: teamVisibilityEnum('visibility').default('public').notNull(),
		creatorId: uuid('creator_id').references(() => userTable.id, {
			onDelete: 'set null',
		}),
		timezone: text('timezone').default('UTC').notNull(),
		metadata: text('metadata'),
		archivedAt: timestamp('archived_at'),
	},
	(table) => [
		index('team_organizationId_idx').on(table.organizationId),
		index('team_creatorId_idx').on(table.creatorId),
		index('team_archivedAt_idx').on(table.archivedAt),
		uniqueIndex('team_organizationId_key_uidx').on(
			table.organizationId,
			table.key
		),
	]
)

export const sessionTable = pgTable(
	'session',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		expiresAt: timestamp('expires_at').notNull(),
		token: text('token').notNull().unique(),
		createdAt: timestamp('created_at').notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		userId: uuid('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		impersonatedBy: uuid('impersonated_by').references(() => userTable.id, {
			onDelete: 'set null',
		}),
		activeOrganizationId: uuid('active_organization_id').references(
			() => organizationTable.id,
			{ onDelete: 'set null' }
		),
		activeTeamId: uuid('active_team_id').references(() => teamTable.id, {
			onDelete: 'set null',
		}),
	},
	(table) => [
		index('session_userId_idx').on(table.userId),
		index('session_activeOrganizationId_idx').on(table.activeOrganizationId),
		index('session_activeTeamId_idx').on(table.activeTeamId),
	]
)

export const accountTable = pgTable(
	'account',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: uuid('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at'),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
		scope: text('scope'),
		password: text('password'),
		createdAt: timestamp('created_at').notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index('account_userId_idx').on(table.userId),
		uniqueIndex('account_providerId_accountId_uidx').on(
			table.providerId,
			table.accountId
		),
	]
)

export const verificationTable = pgTable(
	'verification',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: timestamp('expires_at').notNull(),
		createdAt: timestamp('created_at').notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index('verification_identifier_idx').on(table.identifier)]
)

export const teamMemberTable = pgTable(
	'team_member',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		teamId: uuid('team_id')
			.notNull()
			.references(() => teamTable.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at'),
	},
	(table) => [
		index('teamMember_teamId_idx').on(table.teamId),
		index('teamMember_userId_idx').on(table.userId),
		uniqueIndex('teamMember_teamId_userId_uidx').on(table.teamId, table.userId),
	]
)

export const memberTable = pgTable(
	'member',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organizationTable.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		role: workspaceRoleEnum('role').default('member').notNull(),
		createdAt: timestamp('created_at').notNull(),
	},
	(table) => [
		index('member_organizationId_idx').on(table.organizationId),
		index('member_userId_idx').on(table.userId),
		uniqueIndex('member_organizationId_userId_uidx').on(
			table.organizationId,
			table.userId
		),
	]
)

export const invitationTable = pgTable(
	'invitation',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organizationTable.id, { onDelete: 'cascade' }),
		email: text('email').notNull(),
		role: workspaceRoleEnum('role'),
		teamId: uuid('team_id').references(() => teamTable.id, {
			onDelete: 'set null',
		}),
		status: invitationStatusEnum('status').default('pending').notNull(),
		expiresAt: timestamp('expires_at').notNull(),
		createdAt: timestamp('created_at').notNull(),
		inviterId: uuid('inviter_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
	},
	(table) => [
		index('invitation_organizationId_idx').on(table.organizationId),
		index('invitation_email_idx').on(table.email),
		index('invitation_teamId_idx').on(table.teamId),
		index('invitation_inviterId_idx').on(table.inviterId),
	]
)
