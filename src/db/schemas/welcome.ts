import { sql } from 'drizzle-orm'
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core'

import { organizationTable, userTable } from '#/db/schemas/auth'

export const welcomeProgressTable = pgTable(
	'welcome_progress',
	{
		id: uuid('id')
			.default(sql`pg_catalog.gen_random_uuid()`)
			.primaryKey(),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organizationTable.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		currentStep: integer('current_step').default(1).notNull(),
		profileCompletedAt: timestamp('profile_completed_at'),
		invitationsCompletedAt: timestamp('invitations_completed_at'),
		githubCompletedAt: timestamp('github_completed_at'),
		githubSkippedAt: timestamp('github_skipped_at'),
		slackSkippedAt: timestamp('slack_skipped_at'),
		subscriptionsCompletedAt: timestamp('subscriptions_completed_at'),
		finishedAt: timestamp('finished_at'),
		inviteEmails: jsonb('invite_emails'),
		invitationIds: jsonb('invitation_ids'),
		githubStatus: text('github_status').default('not_started').notNull(),
		changelogOptIn: boolean('changelog_opt_in'),
		onboardingEmailOptIn: boolean('onboarding_email_opt_in'),
		followActionCompletedAt: timestamp('follow_action_completed_at'),
		createdAt: timestamp('created_at').notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index('welcomeProgress_organizationId_idx').on(table.organizationId),
		index('welcomeProgress_userId_idx').on(table.userId),
		uniqueIndex('welcomeProgress_organizationId_userId_uidx').on(
			table.organizationId,
			table.userId
		),
	]
)
