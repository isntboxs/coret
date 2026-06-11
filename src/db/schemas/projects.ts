import { sql } from 'drizzle-orm'
import {
	pgTable,
	pgEnum,
	text,
	timestamp,
	jsonb,
	boolean,
	integer,
	index,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core'

import { organizationTable, teamTable, userTable } from '#/db/schemas/auth'

export const projectStatusCategoryEnum = pgEnum('project_status_category', [
	'planned',
	'in_progress',
	'paused',
	'completed',
	'canceled',
])

export const projectPriorityEnum = pgEnum('project_priority', [
	'none',
	'low',
	'medium',
	'high',
	'urgent',
])

export const projectStatusTable = pgTable(
	'project_status',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		name: text('name').notNull(),
		color: text('color').notNull(),
		description: text('description'),
		category: projectStatusCategoryEnum('category').notNull(),
		position: integer('position').notNull(),
		isDefault: boolean('is_default').default(false).notNull(),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organizationTable.id, { onDelete: 'cascade' }),
		archivedAt: timestamp('archived_at'),
		createdAt: timestamp('created_at').notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index('projectStatus_organizationId_idx').on(table.organizationId),
		index('projectStatus_archivedAt_idx').on(table.archivedAt),
		uniqueIndex('projectStatus_organizationId_name_uidx').on(
			table.organizationId,
			table.name
		),
		uniqueIndex('projectStatus_organizationId_default_uidx')
			.on(table.organizationId)
			.where(sql`${table.isDefault} = true`),
	]
)

export const projectTable = pgTable(
	'project',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		name: text('name').notNull(),
		slug: text('slug').notNull(),
		summary: text('summary'),
		description: jsonb('description'),
		icon: text('icon'),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organizationTable.id, { onDelete: 'cascade' }),
		leadId: uuid('lead_id').references(() => userTable.id, {
			onDelete: 'set null',
		}),
		statusId: uuid('status_id').references(() => projectStatusTable.id, {
			onDelete: 'set null',
		}),
		priority: projectPriorityEnum('priority').default('none').notNull(),
		startDate: timestamp('start_date'),
		targetDate: timestamp('target_date'),
		completedAt: timestamp('completed_at'),
		canceledAt: timestamp('canceled_at'),
		archivedAt: timestamp('archived_at'),
		createdAt: timestamp('created_at').notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index('project_organizationId_idx').on(table.organizationId),
		index('project_leadId_idx').on(table.leadId),
		index('project_statusId_idx').on(table.statusId),
		index('project_archivedAt_idx').on(table.archivedAt),
		uniqueIndex('project_organizationId_slug_uidx').on(
			table.organizationId,
			table.slug
		),
	]
)

export const projectTeamTable = pgTable(
	'project_team',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		projectId: uuid('project_id')
			.notNull()
			.references(() => projectTable.id, { onDelete: 'cascade' }),
		teamId: uuid('team_id')
			.notNull()
			.references(() => teamTable.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').notNull(),
	},
	(table) => [
		index('projectTeam_projectId_idx').on(table.projectId),
		index('projectTeam_teamId_idx').on(table.teamId),
		uniqueIndex('projectTeam_projectId_teamId_uidx').on(
			table.projectId,
			table.teamId
		),
	]
)

export const projectMemberTable = pgTable(
	'project_member',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		projectId: uuid('project_id')
			.notNull()
			.references(() => projectTable.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').notNull(),
	},
	(table) => [
		index('projectMember_projectId_idx').on(table.projectId),
		index('projectMember_userId_idx').on(table.userId),
		uniqueIndex('projectMember_projectId_userId_uidx').on(
			table.projectId,
			table.userId
		),
	]
)

export const projectMilestoneTable = pgTable(
	'project_milestone',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		name: text('name').notNull(),
		projectId: uuid('project_id')
			.notNull()
			.references(() => projectTable.id, { onDelete: 'cascade' }),
		position: integer('position').notNull(),
		dueDate: timestamp('due_date'),
		completedAt: timestamp('completed_at'),
		createdAt: timestamp('created_at').notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index('projectMilestone_projectId_idx').on(table.projectId),
		uniqueIndex('projectMilestone_projectId_name_uidx').on(
			table.projectId,
			table.name
		),
	]
)
