import { relations } from 'drizzle-orm'

import {
	accountTable,
	userTable,
	sessionTable,
	organizationTable,
	teamTable,
	teamMemberTable,
	memberTable,
	invitationTable,
} from '#/db/schemas/auth'

export const userRelations = relations(userTable, ({ many }) => {
	return {
		sessions: many(sessionTable),
		accounts: many(accountTable),
		teamMembers: many(teamMemberTable),
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
			teams: many(teamTable),
			members: many(memberTable),
			invitations: many(invitationTable),
		}
	}
)

export const teamRelations = relations(teamTable, ({ one, many }) => {
	return {
		organization: one(organizationTable, {
			fields: [teamTable.organizationId],
			references: [organizationTable.id],
		}),
		teamMembers: many(teamMemberTable),
	}
})

export const teamMemberRelations = relations(teamMemberTable, ({ one }) => {
	return {
		team: one(teamTable, {
			fields: [teamMemberTable.teamId],
			references: [teamTable.id],
		}),
		user: one(userTable, {
			fields: [teamMemberTable.userId],
			references: [userTable.id],
		}),
	}
})

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
