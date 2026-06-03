import { sql } from 'drizzle-orm'
import {
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core'

import { teamTable, userTable } from '#/server/db/schemas/auth'

export const issuePriorityEnum = pgEnum('issue_priority', [
	'none',
	'low',
	'medium',
	'high',
	'urgent',
])

export const issueStatusCategoryEnum = pgEnum('issue_status_category', [
	'backlog',
	'unstarted',
	'started',
	'completed',
	'canceled',
])

export const issueStatusTable = pgTable(
	'issue_status',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		teamId: uuid('team_id')
			.notNull()
			.references(() => teamTable.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		category: issueStatusCategoryEnum('category').notNull(),
		position: integer('position').default(0).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index('issueStatus_teamId_idx').on(table.teamId),
		index('issueStatus_teamId_category_idx').on(table.teamId, table.category),
		uniqueIndex('issueStatus_teamId_name_uidx').on(table.teamId, table.name),
	]
)

export const teamIssueCounterTable = pgTable(
	'team_issue_counter',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		teamId: uuid('team_id')
			.notNull()
			.references(() => teamTable.id, { onDelete: 'cascade' }),
		nextNumber: integer('next_number').default(1).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [uniqueIndex('teamIssueCounter_teamId_uidx').on(table.teamId)]
)

export const projectTable = pgTable(
	'project',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		teamId: uuid('team_id')
			.notNull()
			.references(() => teamTable.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		slug: text('slug').notNull(),
		description: text('description').default('').notNull(),
		leadId: uuid('lead_id').references(() => userTable.id, {
			onDelete: 'set null',
		}),
		status: text('status').default('active').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		archivedAt: timestamp('archived_at'),
	},
	(table) => [
		index('project_teamId_idx').on(table.teamId),
		index('project_teamId_archivedAt_idx').on(table.teamId, table.archivedAt),
		uniqueIndex('project_teamId_slug_uidx').on(table.teamId, table.slug),
	]
)

export const issueTable = pgTable(
	'issue',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		teamId: uuid('team_id')
			.notNull()
			.references(() => teamTable.id, { onDelete: 'cascade' }),
		projectId: uuid('project_id').references(() => projectTable.id, {
			onDelete: 'set null',
		}),
		statusId: uuid('status_id')
			.notNull()
			.references(() => issueStatusTable.id, { onDelete: 'restrict' }),
		assigneeId: uuid('assignee_id').references(() => userTable.id, {
			onDelete: 'set null',
		}),
		creatorId: uuid('creator_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'restrict' }),
		issueNumber: integer('issue_number').notNull(),
		issueKey: text('issue_key').notNull(),
		title: text('title').notNull(),
		description: jsonb('description')
			.$type<Array<Record<string, unknown>>>()
			.default(sql`'[]'::jsonb`)
			.notNull(),
		searchText: text('search_text').default('').notNull(),
		priority: issuePriorityEnum('priority').default('none').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		archivedAt: timestamp('archived_at'),
	},
	(table) => [
		index('issue_teamId_idx').on(table.teamId),
		index('issue_teamId_archivedAt_idx').on(table.teamId, table.archivedAt),
		index('issue_teamId_statusId_idx').on(table.teamId, table.statusId),
		index('issue_teamId_assigneeId_idx').on(table.teamId, table.assigneeId),
		index('issue_teamId_projectId_idx').on(table.teamId, table.projectId),
		index('issue_teamId_priority_idx').on(table.teamId, table.priority),
		uniqueIndex('issue_teamId_issueNumber_uidx').on(
			table.teamId,
			table.issueNumber
		),
		uniqueIndex('issue_teamId_issueKey_uidx').on(table.teamId, table.issueKey),
	]
)

export const commentTable = pgTable(
	'comment',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		issueId: uuid('issue_id')
			.notNull()
			.references(() => issueTable.id, { onDelete: 'cascade' }),
		authorId: uuid('author_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'restrict' }),
		body: jsonb('body')
			.$type<Array<Record<string, unknown>>>()
			.default(sql`'[]'::jsonb`)
			.notNull(),
		searchText: text('search_text').default('').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		deletedAt: timestamp('deleted_at'),
		deletedById: uuid('deleted_by_id').references(() => userTable.id, {
			onDelete: 'set null',
		}),
	},
	(table) => [
		index('comment_issueId_idx').on(table.issueId),
		index('comment_authorId_idx').on(table.authorId),
		index('comment_deletedById_idx').on(table.deletedById),
	]
)
