import { sql } from 'drizzle-orm'
import {
	pgTable,
	pgEnum,
	text,
	timestamp,
	jsonb,
	integer,
	index,
	uniqueIndex,
	uuid,
	check,
} from 'drizzle-orm/pg-core'

import { teamTable, userTable } from '#/db/schemas/auth'
import { commentTable } from '#/db/schemas/comments'
import { issueTable } from '#/db/schemas/issues'

export const attachmentTypeEnum = pgEnum('attachment_type', ['file', 'link'])

export const issueAttachmentTable = pgTable(
	'issue_attachment',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		issueId: uuid('issue_id').references(() => issueTable.id, {
			onDelete: 'cascade',
		}),
		commentId: uuid('comment_id').references(() => commentTable.id, {
			onDelete: 'cascade',
		}),
		type: attachmentTypeEnum('type').notNull(),
		storageKey: text('storage_key'),
		fileName: text('file_name'),
		fileSize: integer('file_size'),
		mimeType: text('mime_type'),
		url: text('url'),
		linkTitle: text('link_title'),
		linkSource: text('link_source'),
		previewData: jsonb('preview_data'),
		creatorId: uuid('creator_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index('issueAttachment_issueId_idx').on(table.issueId),
		index('issueAttachment_commentId_idx').on(table.commentId),
		index('issueAttachment_creatorId_idx').on(table.creatorId),
		index('issueAttachment_storageKey_idx').on(table.storageKey),
		check(
			'issueAttachment_owner_ck',
			sql`(${table.issueId} is not null) or (${table.commentId} is not null)`
		),
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
		nextNumber: integer('next_number').notNull().default(1),
		createdAt: timestamp('created_at').notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [uniqueIndex('teamIssueCounter_teamId_uidx').on(table.teamId)]
)
