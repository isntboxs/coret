import { ORPCError } from '@orpc/server'
import { and, eq } from 'drizzle-orm'

import { accountTable, teamTable, userTable } from '#/db/schemas/auth'
import { welcomeProgressTable } from '#/db/schemas/welcome'
import { env } from '#/env'
import { auth } from '#/modules/auth/auth.server'
import {
	getCurrentWelcomeStep,
	isWelcomeFinished,
	parseInviteEmails,
} from '#/modules/welcome/server/progress'
import { findWorkspaceMembershipBySlug } from '#/modules/workspace/server/access.server'
import type { ORPCContext } from '#/server/orpc/context.server'
import { protectedProcedure } from '#/server/orpc/procedures'
import { withBetterAuthErrorHandling } from '#/server/orpc/utils'

type AuthenticatedContext = ORPCContext & {
	auth: NonNullable<ORPCContext['auth']>
}

async function requireWelcomeContext(
	context: AuthenticatedContext,
	workspaceSlug: string
) {
	const membership = await findWorkspaceMembershipBySlug(
		context.db,
		context.auth.user.id,
		workspaceSlug
	)

	if (!membership) {
		throw new ORPCError('NOT_FOUND')
	}

	const user = await context.db.query.userTable.findFirst({
		where: eq(userTable.id, context.auth.user.id),
	})

	if (!user) {
		throw new ORPCError('NOT_FOUND')
	}

	const activeTeamId = context.auth.session.activeTeamId
	const activeTeam =
		(activeTeamId
			? await context.db.query.teamTable.findFirst({
					where: and(
						eq(teamTable.id, activeTeamId),
						eq(teamTable.organizationId, membership.workspace.id)
					),
				})
			: undefined) ??
		(await context.db.query.teamTable.findFirst({
			where: eq(teamTable.organizationId, membership.workspace.id),
			orderBy: (table, { asc }) => [asc(table.createdAt)],
		}))

	if (!activeTeam) {
		throw new ORPCError('NOT_FOUND')
	}

	let progress = await context.db.query.welcomeProgressTable.findFirst({
		where: and(
			eq(welcomeProgressTable.organizationId, membership.workspace.id),
			eq(welcomeProgressTable.userId, context.auth.user.id)
		),
	})

	if (!progress) {
		const now = new Date()
		const [created] = await context.db
			.insert(welcomeProgressTable)
			.values({
				organizationId: membership.workspace.id,
				userId: context.auth.user.id,
				currentStep: 1,
				githubStatus: 'not_started',
				createdAt: now,
				updatedAt: now,
			})
			.returning()

		if (!created) {
			throw new ORPCError('INTERNAL_SERVER_ERROR')
		}
		progress = created
	}

	return {
		workspace: membership.workspace,
		membership: membership.membership,
		activeTeam,
		user,
		progress,
	}
}

function normalizeProgress(progress: typeof welcomeProgressTable.$inferSelect) {
	return {
		...progress,
		currentStep: getCurrentWelcomeStep(progress),
		inviteEmails: Array.isArray(progress.inviteEmails)
			? progress.inviteEmails.filter(
					(email): email is string => typeof email === 'string'
				)
			: null,
		invitationIds: Array.isArray(progress.invitationIds)
			? progress.invitationIds.filter(
					(id): id is string => typeof id === 'string'
				)
			: null,
	}
}

function getTeamActivePath(workspaceSlug: string, teamKey: string) {
	return `/${workspaceSlug}/team/${teamKey}/active`
}

function getWelcomeRedirectTo(
	progress: typeof welcomeProgressTable.$inferSelect,
	workspaceSlug: string,
	teamKey: string
) {
	return isWelcomeFinished(progress)
		? getTeamActivePath(workspaceSlug, teamKey)
		: null
}

function getInviteLink(workspaceSlug: string) {
	return `${env.VITE_APP_URL}/${workspaceSlug}/invite`
}

export const welcomeRouter = {
	get: protectedProcedure.welcome.get.handler(async ({ context, input }) => {
		const welcome = await requireWelcomeContext(context, input.workspaceSlug)

		const githubAccount = await context.db.query.accountTable.findFirst({
			where: and(
				eq(accountTable.userId, context.auth.user.id),
				eq(accountTable.providerId, 'github')
			),
			columns: { id: true },
		})
		let progress = welcome.progress

		if (
			githubAccount &&
			!progress.githubCompletedAt &&
			!progress.githubSkippedAt
		) {
			const now = new Date()
			const [updatedProgress] = await context.db
				.update(welcomeProgressTable)
				.set({
					githubStatus: 'connected',
					githubCompletedAt: now,
					currentStep: Math.max(getCurrentWelcomeStep(progress), 4),
					updatedAt: now,
				})
				.where(eq(welcomeProgressTable.id, progress.id))
				.returning()

			if (updatedProgress) {
				progress = updatedProgress
			}
		}

		return {
			workspace: {
				id: welcome.workspace.id,
				name: welcome.workspace.name,
				slug: welcome.workspace.slug,
			},
			activeTeam: welcome.activeTeam,
			profile: {
				name: welcome.user.name,
				username: welcome.user.username ?? null,
				image: welcome.user.image ?? null,
				title: welcome.user.title ?? null,
			},
			progress: normalizeProgress(progress),
			inviteLink: getInviteLink(welcome.workspace.slug),
			githubConnected: Boolean(githubAccount),
			redirectTo: getWelcomeRedirectTo(
				progress,
				welcome.workspace.slug,
				welcome.activeTeam.key
			),
		}
	}),

	updateProfile: protectedProcedure.welcome.updateProfile.handler(
		async ({ context, input, errors }) => {
			const welcome = await requireWelcomeContext(context, input.workspaceSlug)
			const now = new Date()

			await context.db
				.update(userTable)
				.set({
					name: input.name,
					username: input.username,
					displayUsername: input.username,
					image: input.image ?? null,
					title: input.title,
					updatedAt: now,
				})
				.where(eq(userTable.id, context.auth.user.id))

			const [progress] = await context.db
				.update(welcomeProgressTable)
				.set({
					profileCompletedAt: welcome.progress.profileCompletedAt ?? now,
					currentStep: Math.max(getCurrentWelcomeStep(welcome.progress), 2),
					updatedAt: now,
				})
				.where(eq(welcomeProgressTable.id, welcome.progress.id))
				.returning()

			if (!progress) {
				throw errors.NOT_FOUND
			}

			return {
				progress: normalizeProgress(progress),
				redirectTo: getWelcomeRedirectTo(
					progress,
					welcome.workspace.slug,
					welcome.activeTeam.key
				),
			}
		}
	),

	inviteTeammates: protectedProcedure.welcome.inviteTeammates.handler(
		async ({ context, input, errors }) => {
			const welcome = await requireWelcomeContext(context, input.workspaceSlug)
			const parsed = parseInviteEmails(input.emailsText)

			if (parsed.invalid.length > 0) {
				throw new ORPCError('BAD_REQUEST', {
					message: `Invalid invitation emails: ${parsed.invalid.join(', ')}`,
					status: 400,
				})
			}

			const invitationIds: Array<string> = []
			for (const email of parsed.emails) {
				const invitation = await withBetterAuthErrorHandling(() =>
					auth.api.createInvitation({
						headers: context.headers,
						body: {
							email,
							role: 'member',
							organizationId: welcome.workspace.id,
							teamId: welcome.activeTeam.id,
							resend: true,
						},
					})
				)
				invitationIds.push(invitation.id)
			}

			const now = new Date()
			const [progress] = await context.db
				.update(welcomeProgressTable)
				.set({
					invitationsCompletedAt:
						welcome.progress.invitationsCompletedAt ?? now,
					currentStep: Math.max(getCurrentWelcomeStep(welcome.progress), 3),
					inviteEmails: parsed.emails,
					invitationIds,
					updatedAt: now,
				})
				.where(eq(welcomeProgressTable.id, welcome.progress.id))
				.returning()

			if (!progress) {
				throw errors.NOT_FOUND
			}

			return {
				progress: normalizeProgress(progress),
				redirectTo: getWelcomeRedirectTo(
					progress,
					welcome.workspace.slug,
					welcome.activeTeam.key
				),
				inviteEmails: parsed.emails,
				invitationIds,
			}
		}
	),

	connectGithub: protectedProcedure.welcome.connectGithub.handler(
		async ({ context, input, errors }) => {
			const welcome = await requireWelcomeContext(context, input.workspaceSlug)
			const now = new Date()
			const isSkip = input.action === 'skip'

			const [progress] = await context.db
				.update(welcomeProgressTable)
				.set({
					githubStatus: isSkip ? 'skipped' : 'started',
					githubSkippedAt: isSkip
						? (welcome.progress.githubSkippedAt ?? now)
						: welcome.progress.githubSkippedAt,
					githubCompletedAt: welcome.progress.githubCompletedAt,
					currentStep: isSkip
						? Math.max(getCurrentWelcomeStep(welcome.progress), 4)
						: getCurrentWelcomeStep(welcome.progress),
					updatedAt: now,
				})
				.where(eq(welcomeProgressTable.id, welcome.progress.id))
				.returning()

			if (!progress) {
				throw errors.NOT_FOUND
			}

			return {
				progress: normalizeProgress(progress),
				redirectTo: getWelcomeRedirectTo(
					progress,
					welcome.workspace.slug,
					welcome.activeTeam.key
				),
			}
		}
	),

	updateSubscriptions: protectedProcedure.welcome.updateSubscriptions.handler(
		async ({ context, input, errors }) => {
			const welcome = await requireWelcomeContext(context, input.workspaceSlug)
			const now = new Date()
			const [progress] = await context.db
				.update(welcomeProgressTable)
				.set({
					changelogOptIn: input.changelogOptIn,
					onboardingEmailOptIn: input.onboardingEmailOptIn,
					followActionCompletedAt: input.followActionCompleted
						? (welcome.progress.followActionCompletedAt ?? now)
						: welcome.progress.followActionCompletedAt,
					subscriptionsCompletedAt:
						welcome.progress.subscriptionsCompletedAt ?? now,
					finishedAt: welcome.progress.finishedAt ?? now,
					currentStep: 4,
					updatedAt: now,
				})
				.where(eq(welcomeProgressTable.id, welcome.progress.id))
				.returning()

			if (!progress) {
				throw errors.NOT_FOUND
			}

			return {
				progress: normalizeProgress(progress),
				redirectTo: getTeamActivePath(
					welcome.workspace.slug,
					welcome.activeTeam.key
				),
			}
		}
	),
}
