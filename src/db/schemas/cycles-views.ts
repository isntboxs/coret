import { sql } from 'drizzle-orm'
import {
	pgTable,
	pgEnum,
	text,
	timestamp,
	jsonb,
	integer,
	boolean,
	index,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core'

import { organizationTable, teamTable, userTable } from '#/db/schemas/auth'
import { projectTable } from '#/db/schemas/projects'

export const issueViewTypeEnum = pgEnum('issue_view_type', [
	'personal',
	'team',
	'workspace',
	'project',
])

export const cycleTable = pgTable(
	'cycle',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		number: integer('number').notNull(),
		name: text('name').notNull(),
		teamId: uuid('team_id')
			.notNull()
			.references(() => teamTable.id, { onDelete: 'cascade' }),
		startDate: timestamp('start_date').notNull(),
		endDate: timestamp('end_date').notNull(),
		completedAt: timestamp('completed_at'),
		archivedAt: timestamp('archived_at'),
		createdAt: timestamp('created_at').notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index('cycle_teamId_idx').on(table.teamId),
		index('cycle_startDate_idx').on(table.startDate),
		index('cycle_endDate_idx').on(table.endDate),
		index('cycle_archivedAt_idx').on(table.archivedAt),
		uniqueIndex('cycle_teamId_number_uidx').on(table.teamId, table.number),
	]
)

export const issueViewTable = pgTable(
	'issue_view',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		name: text('name').notNull(),
		type: issueViewTypeEnum('type').notNull(),
		filters: jsonb('filters'),
		displayOptions: jsonb('display_options'),
		isSystem: boolean('is_system').default(false).notNull(),
		teamId: uuid('team_id').references(() => teamTable.id, {
			onDelete: 'cascade',
		}),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organizationTable.id, { onDelete: 'cascade' }),
		projectId: uuid('project_id').references(() => projectTable.id, {
			onDelete: 'cascade',
		}),
		creatorId: uuid('creator_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index('issueView_teamId_idx').on(table.teamId),
		index('issueView_organizationId_idx').on(table.organizationId),
		index('issueView_projectId_idx').on(table.projectId),
		index('issueView_creatorId_idx').on(table.creatorId),
		uniqueIndex('issueView_organizationId_type_name_uidx').on(
			table.organizationId,
			table.type,
			table.name
		),
	]
)
