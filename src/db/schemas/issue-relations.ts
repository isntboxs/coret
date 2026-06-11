import { sql } from 'drizzle-orm'
import {
	pgTable,
	pgEnum,
	timestamp,
	index,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core'

import { memberTable, userTable } from '#/db/schemas/auth'
import { issueTemplateTable, issueTable } from '#/db/schemas/issues'
import { labelGroupTable, labelTable } from '#/db/schemas/labels'

export const issueRelationTypeEnum = pgEnum('issue_relation_type', [
	'related',
	'blocking',
	'blocked_by',
	'duplicate',
])

export const issueLabelTable = pgTable(
	'issue_label',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		issueId: uuid('issue_id')
			.notNull()
			.references(() => issueTable.id, { onDelete: 'cascade' }),
		labelId: uuid('label_id')
			.notNull()
			.references(() => labelTable.id, { onDelete: 'cascade' }),
		labelGroupId: uuid('label_group_id').references(() => labelGroupTable.id, {
			onDelete: 'set null',
		}),
		createdAt: timestamp('created_at').notNull(),
	},
	(table) => [
		index('issueLabel_issueId_idx').on(table.issueId),
		index('issueLabel_labelId_idx').on(table.labelId),
		index('issueLabel_labelGroupId_idx').on(table.labelGroupId),
		uniqueIndex('issueLabel_issueId_labelId_uidx').on(
			table.issueId,
			table.labelId
		),
		uniqueIndex('issueLabel_issueId_labelGroupId_uidx')
			.on(table.issueId, table.labelGroupId)
			.where(sql`${table.labelGroupId} is not null`),
	]
)

export const issueTemplateLabelTable = pgTable(
	'issue_template_label',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		issueTemplateId: uuid('issue_template_id')
			.notNull()
			.references(() => issueTemplateTable.id, { onDelete: 'cascade' }),
		labelId: uuid('label_id')
			.notNull()
			.references(() => labelTable.id, { onDelete: 'cascade' }),
		labelGroupId: uuid('label_group_id').references(() => labelGroupTable.id, {
			onDelete: 'set null',
		}),
		createdAt: timestamp('created_at').notNull(),
	},
	(table) => [
		index('issueTemplateLabel_issueTemplateId_idx').on(table.issueTemplateId),
		index('issueTemplateLabel_labelId_idx').on(table.labelId),
		index('issueTemplateLabel_labelGroupId_idx').on(table.labelGroupId),
		uniqueIndex('issueTemplateLabel_templateId_labelId_uidx').on(
			table.issueTemplateId,
			table.labelId
		),
		uniqueIndex('issueTemplateLabel_templateId_labelGroupId_uidx')
			.on(table.issueTemplateId, table.labelGroupId)
			.where(sql`${table.labelGroupId} is not null`),
	]
)

export const issueRelationTable = pgTable(
	'issue_relation',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		issueId: uuid('issue_id')
			.notNull()
			.references(() => issueTable.id, { onDelete: 'cascade' }),
		relatedIssueId: uuid('related_issue_id')
			.notNull()
			.references(() => issueTable.id, { onDelete: 'cascade' }),
		type: issueRelationTypeEnum('type').notNull(),
		createdAt: timestamp('created_at').notNull(),
		createdBy: uuid('created_by')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
	},
	(table) => [
		index('issueRelation_issueId_idx').on(table.issueId),
		index('issueRelation_relatedIssueId_idx').on(table.relatedIssueId),
		index('issueRelation_createdBy_idx').on(table.createdBy),
		uniqueIndex('issueRelation_issueId_relatedIssueId_type_uidx').on(
			table.issueId,
			table.relatedIssueId,
			table.type
		),
	]
)

export const issueSubscriptionTable = pgTable(
	'issue_subscription',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		issueId: uuid('issue_id')
			.notNull()
			.references(() => issueTable.id, { onDelete: 'cascade' }),
		memberId: uuid('member_id')
			.notNull()
			.references(() => memberTable.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').notNull(),
	},
	(table) => [
		index('issueSubscription_issueId_idx').on(table.issueId),
		index('issueSubscription_memberId_idx').on(table.memberId),
		uniqueIndex('issueSubscription_issueId_memberId_uidx').on(
			table.issueId,
			table.memberId
		),
	]
)
