import { sql } from 'drizzle-orm'
import {
	pgTable,
	text,
	timestamp,
	index,
	uniqueIndex,
	uuid,
	check,
} from 'drizzle-orm/pg-core'

import { organizationTable, teamTable } from '#/db/schemas/auth'

export const labelGroupTable = pgTable(
	'label_group',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		name: text('name').notNull(),
		color: text('color'),
		teamId: uuid('team_id').references(() => teamTable.id, {
			onDelete: 'cascade',
		}),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organizationTable.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index('labelGroup_teamId_idx').on(table.teamId),
		index('labelGroup_organizationId_idx').on(table.organizationId),
		uniqueIndex('labelGroup_organizationId_name_workspace_uidx')
			.on(table.organizationId, table.name)
			.where(sql`${table.teamId} is null`),
		uniqueIndex('labelGroup_teamId_name_uidx')
			.on(table.teamId, table.name)
			.where(sql`${table.teamId} is not null`),
	]
)

export const labelTable = pgTable(
	'label',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		name: text('name').notNull(),
		color: text('color').notNull(),
		description: text('description'),
		groupId: uuid('group_id').references(() => labelGroupTable.id, {
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
		index('label_teamId_idx').on(table.teamId),
		index('label_organizationId_idx').on(table.organizationId),
		index('label_groupId_idx').on(table.groupId),
		index('label_archivedAt_idx').on(table.archivedAt),
		uniqueIndex('label_organizationId_name_workspace_uidx')
			.on(table.organizationId, table.name)
			.where(sql`${table.teamId} is null`),
		uniqueIndex('label_teamId_name_uidx')
			.on(table.teamId, table.name)
			.where(sql`${table.teamId} is not null`),
		check('label_scope_ck', sql`${table.organizationId} is not null`),
	]
)
