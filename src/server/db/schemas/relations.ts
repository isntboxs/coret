import { relations } from 'drizzle-orm'

import {
	accountTable,
	invitationTable,
	memberTable,
	organizationTable,
	sessionTable,
	teamMemberTable,
	teamTable,
	userTable,
} from '#/server/db/schemas/auth'
import {
	commentTable,
	issueStatusTable,
	issueTable,
	projectTable,
	teamIssueCounterTable,
} from '#/server/db/schemas/domain'

export const userRelations = relations(userTable, ({ many }) => {
	return {
		sessions: many(sessionTable),
		accounts: many(accountTable),
		teamMembers: many(teamMemberTable),
		members: many(memberTable),
		invitations: many(invitationTable),
		ledProjects: many(projectTable, { relationName: 'projectLead' }),
		assignedIssues: many(issueTable, { relationName: 'issueAssignee' }),
		createdIssues: many(issueTable, { relationName: 'issueCreator' }),
		comments: many(commentTable, { relationName: 'commentAuthor' }),
		deletedComments: many(commentTable, {
			relationName: 'commentDeletedBy',
		}),
	}
})

export const sessionRelations = relations(sessionTable, ({ one }) => {
	return {
		user: one(userTable, {
			fields: [sessionTable.userId],
			references: [userTable.id],
		}),
		activeTeam: one(teamTable, {
			fields: [sessionTable.activeTeamId],
			references: [teamTable.id],
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
		issueStatuses: many(issueStatusTable),
		issueCounter: one(teamIssueCounterTable),
		projects: many(projectTable),
		issues: many(issueTable),
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
		team: one(teamTable, {
			fields: [invitationTable.teamId],
			references: [teamTable.id],
		}),
		inviter: one(userTable, {
			fields: [invitationTable.inviterId],
			references: [userTable.id],
		}),
	}
})

export const issueStatusRelations = relations(
	issueStatusTable,
	({ one, many }) => {
		return {
			team: one(teamTable, {
				fields: [issueStatusTable.teamId],
				references: [teamTable.id],
			}),
			issues: many(issueTable),
		}
	}
)

export const teamIssueCounterRelations = relations(
	teamIssueCounterTable,
	({ one }) => {
		return {
			team: one(teamTable, {
				fields: [teamIssueCounterTable.teamId],
				references: [teamTable.id],
			}),
		}
	}
)

export const projectRelations = relations(projectTable, ({ one, many }) => {
	return {
		team: one(teamTable, {
			fields: [projectTable.teamId],
			references: [teamTable.id],
		}),
		lead: one(userTable, {
			fields: [projectTable.leadId],
			references: [userTable.id],
			relationName: 'projectLead',
		}),
		issues: many(issueTable),
	}
})

export const issueRelations = relations(issueTable, ({ one, many }) => {
	return {
		team: one(teamTable, {
			fields: [issueTable.teamId],
			references: [teamTable.id],
		}),
		project: one(projectTable, {
			fields: [issueTable.projectId],
			references: [projectTable.id],
		}),
		status: one(issueStatusTable, {
			fields: [issueTable.statusId],
			references: [issueStatusTable.id],
		}),
		assignee: one(userTable, {
			fields: [issueTable.assigneeId],
			references: [userTable.id],
			relationName: 'issueAssignee',
		}),
		creator: one(userTable, {
			fields: [issueTable.creatorId],
			references: [userTable.id],
			relationName: 'issueCreator',
		}),
		comments: many(commentTable),
	}
})

export const commentRelations = relations(commentTable, ({ one }) => {
	return {
		issue: one(issueTable, {
			fields: [commentTable.issueId],
			references: [issueTable.id],
		}),
		author: one(userTable, {
			fields: [commentTable.authorId],
			references: [userTable.id],
			relationName: 'commentAuthor',
		}),
		deletedBy: one(userTable, {
			fields: [commentTable.deletedById],
			references: [userTable.id],
			relationName: 'commentDeletedBy',
		}),
	}
})
