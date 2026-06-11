import { sql } from 'drizzle-orm'
import {
	pgTable,
	text,
	timestamp,
	integer,
	index,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core'

import { issueViewTable } from '#/db/schemas/cycles-views'
import { issueTable } from '#/db/schemas/issues'

export const issueViewOrderingTable = pgTable(
	'issue_view_ordering',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		issueViewId: uuid('issue_view_id')
			.notNull()
			.references(() => issueViewTable.id, { onDelete: 'cascade' }),
		issueId: uuid('issue_id')
			.notNull()
			.references(() => issueTable.id, { onDelete: 'cascade' }),
		groupKey: text('group_key'),
		position: integer('position').notNull(),
		createdAt: timestamp('created_at').notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index('issueViewOrdering_issueViewId_idx').on(table.issueViewId),
		index('issueViewOrdering_issueId_idx').on(table.issueId),
		uniqueIndex('issueViewOrdering_viewId_issueId_groupKey_uidx').on(
			table.issueViewId,
			table.issueId,
			table.groupKey
		),
		uniqueIndex('issueViewOrdering_viewId_groupKey_position_uidx').on(
			table.issueViewId,
			table.groupKey,
			table.position
		),
	]
)
