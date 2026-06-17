import { z } from 'zod'

import { teamOutputSchema } from '#/orpc/schemas/team'

const workspaceSlugInput = {
	workspaceSlug: z.string().min(1),
}

export const welcomeGetInputSchema = z.object(workspaceSlugInput)

export const welcomeProgressOutputSchema = z.object({
	id: z.uuid(),
	organizationId: z.uuid(),
	userId: z.uuid(),
	currentStep: z.number().int().min(1).max(5),
	profileCompletedAt: z.date().nullable(),
	invitationsCompletedAt: z.date().nullable(),
	githubCompletedAt: z.date().nullable(),
	githubSkippedAt: z.date().nullable(),
	slackSkippedAt: z.date().nullable(),
	subscriptionsCompletedAt: z.date().nullable(),
	finishedAt: z.date().nullable(),
	inviteEmails: z.array(z.string()).nullable(),
	invitationIds: z.array(z.string()).nullable(),
	githubStatus: z.string(),
	changelogOptIn: z.boolean().nullable(),
	onboardingEmailOptIn: z.boolean().nullable(),
	followActionCompletedAt: z.date().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
})

export const welcomeGetOutputSchema = z.object({
	workspace: z.object({
		id: z.uuid(),
		name: z.string(),
		slug: z.string(),
	}),
	activeTeam: teamOutputSchema,
	profile: z.object({
		name: z.string(),
		username: z.string().nullable(),
		image: z.string().nullable(),
		title: z.string().nullable(),
	}),
	progress: welcomeProgressOutputSchema,
	inviteLink: z.string(),
	githubConnected: z.boolean(),
	redirectTo: z.string().nullable(),
})

export const welcomeUpdateProfileInputSchema = z.object({
	...workspaceSlugInput,
	image: z.url().nullable().optional(),
	name: z.string().min(1),
	username: z
		.string()
		.min(1)
		.max(40)
		.regex(/^[a-z0-9_]+$/i, {
			error: 'Username can only include letters, numbers, and underscores',
		}),
	title: z.string().max(120),
})

export const welcomeInviteTeammatesInputSchema = z.object({
	...workspaceSlugInput,
	emailsText: z.string(),
})

export const welcomeConnectGithubInputSchema = z.object({
	...workspaceSlugInput,
	action: z.enum(['started', 'skip']),
})

export const welcomeSkipSlackInputSchema = z.object(workspaceSlugInput)

export const welcomeUpdateSubscriptionsInputSchema = z.object({
	...workspaceSlugInput,
	changelogOptIn: z.boolean(),
	onboardingEmailOptIn: z.boolean(),
	followActionCompleted: z.boolean(),
})

export const welcomeMutationOutputSchema = z.object({
	progress: welcomeProgressOutputSchema,
	redirectTo: z.string().nullable(),
})

export const welcomeInviteTeammatesOutputSchema =
	welcomeMutationOutputSchema.extend({
		inviteEmails: z.array(z.string()),
		invitationIds: z.array(z.string()),
	})
