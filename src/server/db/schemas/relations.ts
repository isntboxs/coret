import { relations } from 'drizzle-orm'

import {
	invitationTable,
	memberTable,
	organizationTable,
	sessionTable,
	userTable,
	accountTable,
} from '#/server/db/schemas/auth'

export const userRelations = relations(userTable, ({ many }) => {
	return {
		sessions: many(sessionTable),
		accounts: many(accountTable),
		members: many(memberTable),
		invitations: many(invitationTable),
	}
})

export const sessionRelations = relations(sessionTable, ({ one }) => {
	return {
		user: one(userTable, {
			fields: [sessionTable.userId],
			references: [userTable.id],
		}),
	}
})

export const accountRelations = relations(accountTable, ({ one }) => {
	return {
		user: one(userTable, {
			fields: [accountTable.userId],
			references: [userTable.id],
		}),
	}
})

export const organizationRelations = relations(
	organizationTable,
	({ many }) => {
		return {
			members: many(memberTable),
			invitations: many(invitationTable),
		}
	}
)

export const memberRelations = relations(memberTable, ({ one }) => {
	return {
		organization: one(organizationTable, {
			fields: [memberTable.organizationId],
			references: [organizationTable.id],
		}),
		user: one(userTable, {
			fields: [memberTable.userId],
			references: [userTable.id],
		}),
	}
})

export const invitationRelations = relations(invitationTable, ({ one }) => {
	return {
		organization: one(organizationTable, {
			fields: [invitationTable.organizationId],
			references: [organizationTable.id],
		}),
		user: one(userTable, {
			fields: [invitationTable.inviterId],
			references: [userTable.id],
		}),
	}
})
