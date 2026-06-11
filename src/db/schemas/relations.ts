import { relations } from 'drizzle-orm'

import {
	issueAttachmentTable,
	teamIssueCounterTable,
} from '#/db/schemas/attachments'
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
import { commentTable, issueActivityTable } from '#/db/schemas/comments'
import { cycleTable, issueViewTable } from '#/db/schemas/cycles-views'
import {
	issueLabelTable,
	issueRelationTable,
	issueSubscriptionTable,
	issueTemplateLabelTable,
} from '#/db/schemas/issue-relations'
import {
	issueTable,
	issueStatusTable,
	issueKeyHistoryTable,
	issueTemplateTable,
} from '#/db/schemas/issues'
import { labelTable, labelGroupTable } from '#/db/schemas/labels'
import {
	projectTable,
	projectTeamTable,
	projectStatusTable,
	projectMilestoneTable,
	projectMemberTable,
} from '#/db/schemas/projects'
import { issueViewOrderingTable } from '#/db/schemas/view-ordering'

export const userRelations = relations(userTable, ({ many }) => {
	return {
		sessions: many(sessionTable, { relationName: 'sessionUser' }),
		impersonatedSessions: many(sessionTable, {
			relationName: 'sessionImpersonator',
		}),
		accounts: many(accountTable),
		createdTeams: many(teamTable, { relationName: 'teamCreator' }),
		teamMembers: many(teamMemberTable),
		members: many(memberTable),
		invitationsSent: many(invitationTable, {
			relationName: 'invitationInviter',
		}),
		createdIssues: many(issueTable, { relationName: 'issueCreator' }),
		assignedIssues: many(issueTable, { relationName: 'issueAssignee' }),
		comments: many(commentTable, { relationName: 'commentAuthor' }),
		resolvedComments: many(commentTable, { relationName: 'commentResolver' }),
		activities: many(issueActivityTable),
		issueAttachments: many(issueAttachmentTable),
		projectLeads: many(projectTable, { relationName: 'projectLead' }),
		projectMemberships: many(projectMemberTable),
		createdIssueViews: many(issueViewTable),
		createdIssueRelations: many(issueRelationTable),
	}
})

export const sessionRelations = relations(sessionTable, ({ one }) => {
	return {
		user: one(userTable, {
			fields: [sessionTable.userId],
			references: [userTable.id],
			relationName: 'sessionUser',
		}),
		impersonatedBy: one(userTable, {
			fields: [sessionTable.impersonatedBy],
			references: [userTable.id],
			relationName: 'sessionImpersonator',
		}),
		activeOrganization: one(organizationTable, {
			fields: [sessionTable.activeOrganizationId],
			references: [organizationTable.id],
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
			projectStatuses: many(projectStatusTable),
			projects: many(projectTable),
			labelGroups: many(labelGroupTable),
			labels: many(labelTable),
			issueTemplates: many(issueTemplateTable),
			issueViews: many(issueViewTable),
		}
	}
)

export const teamRelations = relations(teamTable, ({ one, many }) => {
	return {
		organization: one(organizationTable, {
			fields: [teamTable.organizationId],
			references: [organizationTable.id],
		}),
		creator: one(userTable, {
			fields: [teamTable.creatorId],
			references: [userTable.id],
			relationName: 'teamCreator',
		}),
		teamMembers: many(teamMemberTable),
		invitations: many(invitationTable),
		issues: many(issueTable),
		statuses: many(issueStatusTable),
		cycles: many(cycleTable),
		labels: many(labelTable),
		labelGroups: many(labelGroupTable),
		templates: many(issueTemplateTable),
		issueCounter: many(teamIssueCounterTable),
		projects: many(projectTeamTable),
		issueViews: many(issueViewTable),
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

export const memberRelations = relations(memberTable, ({ one, many }) => {
	return {
		organization: one(organizationTable, {
			fields: [memberTable.organizationId],
			references: [organizationTable.id],
		}),
		user: one(userTable, {
			fields: [memberTable.userId],
			references: [userTable.id],
		}),
		issueSubscriptions: many(issueSubscriptionTable),
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
			relationName: 'invitationInviter',
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
			templates: many(issueTemplateTable),
		}
	}
)

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
		projectMilestone: one(projectMilestoneTable, {
			fields: [issueTable.projectMilestoneId],
			references: [projectMilestoneTable.id],
		}),
		cycle: one(cycleTable, {
			fields: [issueTable.cycleId],
			references: [cycleTable.id],
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
		parentIssue: one(issueTable, {
			fields: [issueTable.parentIssueId],
			references: [issueTable.id],
			relationName: 'subIssues',
		}),
		subIssues: many(issueTable, { relationName: 'subIssues' }),
		keyHistory: many(issueKeyHistoryTable),
		labels: many(issueLabelTable),
		outgoingRelations: many(issueRelationTable, {
			relationName: 'outgoingIssueRelation',
		}),
		incomingRelations: many(issueRelationTable, {
			relationName: 'incomingIssueRelation',
		}),
		comments: many(commentTable),
		activities: many(issueActivityTable),
		subscriptions: many(issueSubscriptionTable),
		attachments: many(issueAttachmentTable),
		viewOrderings: many(issueViewOrderingTable),
	}
})

export const issueKeyHistoryRelations = relations(
	issueKeyHistoryTable,
	({ one }) => {
		return {
			issue: one(issueTable, {
				fields: [issueKeyHistoryTable.issueId],
				references: [issueTable.id],
			}),
			oldTeam: one(teamTable, {
				fields: [issueKeyHistoryTable.oldTeamId],
				references: [teamTable.id],
			}),
		}
	}
)

export const issueTemplateRelations = relations(
	issueTemplateTable,
	({ one, many }) => {
		return {
			organization: one(organizationTable, {
				fields: [issueTemplateTable.organizationId],
				references: [organizationTable.id],
			}),
			team: one(teamTable, {
				fields: [issueTemplateTable.teamId],
				references: [teamTable.id],
			}),
			defaultStatus: one(issueStatusTable, {
				fields: [issueTemplateTable.defaultStatusId],
				references: [issueStatusTable.id],
			}),
			defaultAssignee: one(userTable, {
				fields: [issueTemplateTable.defaultAssigneeId],
				references: [userTable.id],
			}),
			defaultProject: one(projectTable, {
				fields: [issueTemplateTable.defaultProjectId],
				references: [projectTable.id],
			}),
			defaultCycle: one(cycleTable, {
				fields: [issueTemplateTable.defaultCycleId],
				references: [cycleTable.id],
			}),
			labels: many(issueTemplateLabelTable),
		}
	}
)

export const labelGroupRelations = relations(
	labelGroupTable,
	({ one, many }) => {
		return {
			organization: one(organizationTable, {
				fields: [labelGroupTable.organizationId],
				references: [organizationTable.id],
			}),
			team: one(teamTable, {
				fields: [labelGroupTable.teamId],
				references: [teamTable.id],
			}),
			labels: many(labelTable),
			issueLabels: many(issueLabelTable),
			templateLabels: many(issueTemplateLabelTable),
		}
	}
)

export const labelRelations = relations(labelTable, ({ one, many }) => {
	return {
		organization: one(organizationTable, {
			fields: [labelTable.organizationId],
			references: [organizationTable.id],
		}),
		team: one(teamTable, {
			fields: [labelTable.teamId],
			references: [teamTable.id],
		}),
		group: one(labelGroupTable, {
			fields: [labelTable.groupId],
			references: [labelGroupTable.id],
		}),
		issueLabels: many(issueLabelTable),
		templateLabels: many(issueTemplateLabelTable),
	}
})

export const issueLabelRelations = relations(issueLabelTable, ({ one }) => {
	return {
		issue: one(issueTable, {
			fields: [issueLabelTable.issueId],
			references: [issueTable.id],
		}),
		label: one(labelTable, {
			fields: [issueLabelTable.labelId],
			references: [labelTable.id],
		}),
		labelGroup: one(labelGroupTable, {
			fields: [issueLabelTable.labelGroupId],
			references: [labelGroupTable.id],
		}),
	}
})

export const issueTemplateLabelRelations = relations(
	issueTemplateLabelTable,
	({ one }) => {
		return {
			issueTemplate: one(issueTemplateTable, {
				fields: [issueTemplateLabelTable.issueTemplateId],
				references: [issueTemplateTable.id],
			}),
			label: one(labelTable, {
				fields: [issueTemplateLabelTable.labelId],
				references: [labelTable.id],
			}),
			labelGroup: one(labelGroupTable, {
				fields: [issueTemplateLabelTable.labelGroupId],
				references: [labelGroupTable.id],
			}),
		}
	}
)

export const issueRelationSchemaRelations = relations(
	issueRelationTable,
	({ one }) => {
		return {
			issue: one(issueTable, {
				fields: [issueRelationTable.issueId],
				references: [issueTable.id],
				relationName: 'outgoingIssueRelation',
			}),
			relatedIssue: one(issueTable, {
				fields: [issueRelationTable.relatedIssueId],
				references: [issueTable.id],
				relationName: 'incomingIssueRelation',
			}),
			createdBy: one(userTable, {
				fields: [issueRelationTable.createdBy],
				references: [userTable.id],
			}),
		}
	}
)

export const issueSubscriptionRelations = relations(
	issueSubscriptionTable,
	({ one }) => {
		return {
			issue: one(issueTable, {
				fields: [issueSubscriptionTable.issueId],
				references: [issueTable.id],
			}),
			member: one(memberTable, {
				fields: [issueSubscriptionTable.memberId],
				references: [memberTable.id],
			}),
		}
	}
)

export const cycleRelations = relations(cycleTable, ({ one, many }) => {
	return {
		team: one(teamTable, {
			fields: [cycleTable.teamId],
			references: [teamTable.id],
		}),
		issues: many(issueTable),
		templates: many(issueTemplateTable),
	}
})

export const issueViewRelations = relations(issueViewTable, ({ one, many }) => {
	return {
		organization: one(organizationTable, {
			fields: [issueViewTable.organizationId],
			references: [organizationTable.id],
		}),
		team: one(teamTable, {
			fields: [issueViewTable.teamId],
			references: [teamTable.id],
		}),
		project: one(projectTable, {
			fields: [issueViewTable.projectId],
			references: [projectTable.id],
		}),
		creator: one(userTable, {
			fields: [issueViewTable.creatorId],
			references: [userTable.id],
		}),
		orderings: many(issueViewOrderingTable),
	}
})

export const issueViewOrderingRelations = relations(
	issueViewOrderingTable,
	({ one }) => {
		return {
			issueView: one(issueViewTable, {
				fields: [issueViewOrderingTable.issueViewId],
				references: [issueViewTable.id],
			}),
			issue: one(issueTable, {
				fields: [issueViewOrderingTable.issueId],
				references: [issueTable.id],
			}),
		}
	}
)

export const commentRelations = relations(commentTable, ({ one, many }) => {
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
		parentComment: one(commentTable, {
			fields: [commentTable.parentCommentId],
			references: [commentTable.id],
			relationName: 'commentReplies',
		}),
		replies: many(commentTable, { relationName: 'commentReplies' }),
		resolver: one(userTable, {
			fields: [commentTable.resolvedBy],
			references: [userTable.id],
			relationName: 'commentResolver',
		}),
		attachments: many(issueAttachmentTable),
	}
})

export const issueActivityRelations = relations(
	issueActivityTable,
	({ one }) => {
		return {
			issue: one(issueTable, {
				fields: [issueActivityTable.issueId],
				references: [issueTable.id],
			}),
			user: one(userTable, {
				fields: [issueActivityTable.userId],
				references: [userTable.id],
			}),
		}
	}
)

export const issueAttachmentRelations = relations(
	issueAttachmentTable,
	({ one }) => {
		return {
			issue: one(issueTable, {
				fields: [issueAttachmentTable.issueId],
				references: [issueTable.id],
			}),
			comment: one(commentTable, {
				fields: [issueAttachmentTable.commentId],
				references: [commentTable.id],
			}),
			creator: one(userTable, {
				fields: [issueAttachmentTable.creatorId],
				references: [userTable.id],
			}),
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

export const projectStatusRelations = relations(
	projectStatusTable,
	({ one, many }) => {
		return {
			organization: one(organizationTable, {
				fields: [projectStatusTable.organizationId],
				references: [organizationTable.id],
			}),
			projects: many(projectTable),
		}
	}
)

export const projectRelations = relations(projectTable, ({ one, many }) => {
	return {
		organization: one(organizationTable, {
			fields: [projectTable.organizationId],
			references: [organizationTable.id],
		}),
		lead: one(userTable, {
			fields: [projectTable.leadId],
			references: [userTable.id],
			relationName: 'projectLead',
		}),
		status: one(projectStatusTable, {
			fields: [projectTable.statusId],
			references: [projectStatusTable.id],
		}),
		projectTeams: many(projectTeamTable),
		projectMembers: many(projectMemberTable),
		milestones: many(projectMilestoneTable),
		issues: many(issueTable),
		issueViews: many(issueViewTable),
		templates: many(issueTemplateTable),
	}
})

export const projectTeamRelations = relations(projectTeamTable, ({ one }) => {
	return {
		project: one(projectTable, {
			fields: [projectTeamTable.projectId],
			references: [projectTable.id],
		}),
		team: one(teamTable, {
			fields: [projectTeamTable.teamId],
			references: [teamTable.id],
		}),
	}
})

export const projectMemberRelations = relations(
	projectMemberTable,
	({ one }) => {
		return {
			project: one(projectTable, {
				fields: [projectMemberTable.projectId],
				references: [projectTable.id],
			}),
			user: one(userTable, {
				fields: [projectMemberTable.userId],
				references: [userTable.id],
			}),
		}
	}
)

export const projectMilestoneRelations = relations(
	projectMilestoneTable,
	({ one, many }) => {
		return {
			project: one(projectTable, {
				fields: [projectMilestoneTable.projectId],
				references: [projectTable.id],
			}),
			issues: many(issueTable),
		}
	}
)
