import { sql } from 'drizzle-orm'
import {
	pgTable,
	pgEnum,
	boolean,
	text,
	timestamp,
	integer,
	jsonb,
	uniqueIndex,
	index,
	uuid,
} from 'drizzle-orm/pg-core'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'

import { organizationTable, teamTable, userTable } from '#/db/schemas/auth'
import { cycleTable } from '#/db/schemas/cycles-views'
import { projectMilestoneTable, projectTable } from '#/db/schemas/projects'

export const statusCategoryEnum = pgEnum('status_category', [
	'backlog',
	'unstarted',
	'started',
	'completed',
	'canceled',
	'duplicate',
])

export const issuePriorityEnum = pgEnum('issue_priority', [
	'none',
	'low',
	'medium',
	'high',
	'urgent',
])

export const issueEstimateEnum = pgEnum('issue_estimate', [
	'none',
	'1',
	'2',
	'3',
	'5',
	'8',
	'13',
	'21',
])

export const issueStatusTable = pgTable(
	'issue_status',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		name: text('name').notNull(),
		color: text('color').notNull(),
		description: text('description'),
		category: statusCategoryEnum('category').notNull(),
		position: integer('position').notNull(),
		isDefault: boolean('is_default').default(false).notNull(),
		teamId: uuid('team_id')
			.notNull()
			.references(() => teamTable.id, { onDelete: 'cascade' }),
		archivedAt: timestamp('archived_at'),
		createdAt: timestamp('created_at').notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index('issueStatus_teamId_idx').on(table.teamId),
		index('issueStatus_archivedAt_idx').on(table.archivedAt),
		uniqueIndex('issueStatus_teamId_name_uidx').on(table.teamId, table.name),
		uniqueIndex('issueStatus_teamId_default_uidx')
			.on(table.teamId)
			.where(sql`${table.isDefault} = true`),
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
		projectMilestoneId: uuid('project_milestone_id').references(
			() => projectMilestoneTable.id,
			{ onDelete: 'set null' }
		),
		cycleId: uuid('cycle_id').references(() => cycleTable.id, {
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
			.references(() => userTable.id, { onDelete: 'cascade' }),
		parentIssueId: uuid('parent_issue_id').references(
			(): AnyPgColumn => issueTable.id,
			{ onDelete: 'set null' }
		),
		issueNumber: integer('issue_number').notNull(),
		issueKey: text('issue_key').notNull(),
		title: text('title').notNull(),
		description: jsonb('description'),
		derivedText: text('derived_text'),
		priority: issuePriorityEnum('priority').default('none').notNull(),
		estimate: issueEstimateEnum('estimate'),
		dueDate: timestamp('due_date'),
		startedAt: timestamp('started_at'),
		completedAt: timestamp('completed_at'),
		canceledAt: timestamp('canceled_at'),
		archivedAt: timestamp('archived_at'),
		createdAt: timestamp('created_at').notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index('issue_teamId_idx').on(table.teamId),
		index('issue_projectId_idx').on(table.projectId),
		index('issue_projectMilestoneId_idx').on(table.projectMilestoneId),
		index('issue_statusId_idx').on(table.statusId),
		index('issue_assigneeId_idx').on(table.assigneeId),
		index('issue_creatorId_idx').on(table.creatorId),
		index('issue_parentIssueId_idx').on(table.parentIssueId),
		index('issue_cycleId_idx').on(table.cycleId),
		index('issue_archivedAt_idx').on(table.archivedAt),
		uniqueIndex('issue_teamId_issueNumber_uidx').on(
			table.teamId,
			table.issueNumber
		),
		uniqueIndex('issue_issueKey_uidx').on(table.issueKey),
	]
)

export const issueKeyHistoryTable = pgTable(
	'issue_key_history',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		issueId: uuid('issue_id')
			.notNull()
			.references(() => issueTable.id, { onDelete: 'cascade' }),
		oldIssueKey: text('old_issue_key').notNull(),
		oldTeamId: uuid('old_team_id')
			.notNull()
			.references(() => teamTable.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').notNull(),
	},
	(table) => [
		index('issueKeyHistory_issueId_idx').on(table.issueId),
		index('issueKeyHistory_oldTeamId_idx').on(table.oldTeamId),
		uniqueIndex('issueKeyHistory_oldIssueKey_uidx').on(table.oldIssueKey),
	]
)

export const issueTemplateTable = pgTable(
	'issue_template',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		name: text('name').notNull(),
		description: jsonb('description'),
		defaultStatusId: uuid('default_status_id').references(
			() => issueStatusTable.id,
			{ onDelete: 'set null' }
		),
		defaultPriority: issuePriorityEnum('default_priority'),
		defaultEstimate: issueEstimateEnum('default_estimate'),
		defaultAssigneeId: uuid('default_assignee_id').references(
			() => userTable.id,
			{ onDelete: 'set null' }
		),
		defaultProjectId: uuid('default_project_id').references(
			() => projectTable.id,
			{ onDelete: 'set null' }
		),
		defaultCycleId: uuid('default_cycle_id').references(() => cycleTable.id, {
			onDelete: 'set null',
		}),
		teamId: uuid('team_id').references(() => teamTable.id, {
			onDelete: 'cascade',
		}),
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
		index('issueTemplate_teamId_idx').on(table.teamId),
		index('issueTemplate_organizationId_idx').on(table.organizationId),
		index('issueTemplate_defaultStatusId_idx').on(table.defaultStatusId),
		index('issueTemplate_defaultAssigneeId_idx').on(table.defaultAssigneeId),
		index('issueTemplate_defaultProjectId_idx').on(table.defaultProjectId),
		index('issueTemplate_defaultCycleId_idx').on(table.defaultCycleId),
		index('issueTemplate_archivedAt_idx').on(table.archivedAt),
	]
)
