import { orpcBaseContract as baseContract } from '#/orpc/contracts/base.contract'
import {
	welcomeConnectGithubInputSchema,
	welcomeGetInputSchema,
	welcomeGetOutputSchema,
	welcomeInviteTeammatesInputSchema,
	welcomeInviteTeammatesOutputSchema,
	welcomeMutationOutputSchema,
	welcomeUpdateProfileInputSchema,
	welcomeUpdateSubscriptionsInputSchema,
} from '#/orpc/schemas/welcome'

export const welcomeContract = {
	get: baseContract
		.route({
			path: '/welcome/get',
			method: 'GET',
			summary: 'Get Welcome Flow state',
			description:
				'Get Welcome Flow progress for an authenticated Workspace Member.',
			tags: ['Welcome'],
			operationId: 'getWelcome',
			successStatus: 200,
			successDescription: 'Welcome state loaded',
		})
		.input(welcomeGetInputSchema)
		.output(welcomeGetOutputSchema),

	updateProfile: baseContract
		.route({
			path: '/welcome/update-profile',
			method: 'POST',
			summary: 'Update Welcome profile step',
			description: 'Persist Welcome profile details.',
			tags: ['Welcome'],
			operationId: 'updateWelcomeProfile',
			successStatus: 200,
			successDescription: 'Welcome profile saved',
		})
		.input(welcomeUpdateProfileInputSchema)
		.output(welcomeMutationOutputSchema),

	inviteTeammates: baseContract
		.route({
			path: '/welcome/invite-teammates',
			method: 'POST',
			summary: 'Update Welcome invitations step',
			description: 'Persist Welcome teammate invitations or skip state.',
			tags: ['Welcome'],
			operationId: 'inviteWelcomeTeammates',
			successStatus: 200,
			successDescription: 'Welcome invitations saved',
		})
		.input(welcomeInviteTeammatesInputSchema)
		.output(welcomeInviteTeammatesOutputSchema),

	connectGithub: baseContract
		.route({
			path: '/welcome/connect-github',
			method: 'POST',
			summary: 'Update Welcome GitHub step',
			description: 'Persist GitHub start or skip state.',
			tags: ['Welcome'],
			operationId: 'connectWelcomeGithub',
			successStatus: 200,
			successDescription: 'Welcome GitHub step saved',
		})
		.input(welcomeConnectGithubInputSchema)
		.output(welcomeMutationOutputSchema),

	updateSubscriptions: baseContract
		.route({
			path: '/welcome/update-subscriptions',
			method: 'POST',
			summary: 'Finish Welcome Flow',
			description: 'Persist subscription preferences and finish Welcome Flow.',
			tags: ['Welcome'],
			operationId: 'updateWelcomeSubscriptions',
			successStatus: 200,
			successDescription: 'Welcome Flow finished',
		})
		.input(welcomeUpdateSubscriptionsInputSchema)
		.output(welcomeMutationOutputSchema),
}
