import { sql } from 'drizzle-orm'
import {
	pgTable,
	text,
	timestamp,
	jsonb,
	index,
	uuid,
} from 'drizzle-orm/pg-core'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'

import { userTable } from '#/db/schemas/auth'
import { issueTable } from '#/db/schemas/issues'

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
			.references(() => userTable.id, { onDelete: 'cascade' }),
		body: jsonb('body').notNull(),
		derivedText: text('derived_text'),
		parentCommentId: uuid('parent_comment_id').references(
			(): AnyPgColumn => commentTable.id,
			{ onDelete: 'cascade' }
		),
		resolvedAt: timestamp('resolved_at'),
		resolvedBy: uuid('resolved_by').references(() => userTable.id, {
			onDelete: 'set null',
		}),
		createdAt: timestamp('created_at').notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index('comment_issueId_idx').on(table.issueId),
		index('comment_authorId_idx').on(table.authorId),
		index('comment_parentCommentId_idx').on(table.parentCommentId),
		index('comment_resolvedBy_idx').on(table.resolvedBy),
	]
)

export const issueActivityTable = pgTable(
	'issue_activity',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		issueId: uuid('issue_id')
			.notNull()
			.references(() => issueTable.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		type: text('type').notNull(),
		data: jsonb('data'),
		createdAt: timestamp('created_at').notNull(),
	},
	(table) => [
		index('issueActivity_issueId_idx').on(table.issueId),
		index('issueActivity_userId_idx').on(table.userId),
		index('issueActivity_type_idx').on(table.type),
	]
)
