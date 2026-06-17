import { orpcBaseContract as baseContract } from '#/orpc/contracts/base.contract'
import {
	teamByKeyInputSchema,
	teamByKeyOutputSchema,
} from '#/orpc/schemas/team'

export const teamContract = {
	getByKey: baseContract
		.route({
			path: '/team/get-by-key',
			method: 'GET',
			summary: 'Get team by key',
			description:
				'Get an accessible Team by Workspace slug and Team key for the authenticated user.',
			tags: ['Team'],
			operationId: 'getTeamByKey',
			successStatus: 200,
			successDescription: 'Team resolved',
		})
		.input(teamByKeyInputSchema)
		.output(teamByKeyOutputSchema),
}
