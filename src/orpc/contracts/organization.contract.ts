import { orpcBaseContract as baseContract } from '#/orpc/contracts/base.contract'
import {
	createOrganizationInputSchema,
	createOrganizationOutputSchema,
	listOrganizationsOutputSchema,
} from '#/orpc/schemas/organization'

export const organizationContract = {
	create: baseContract
		.route({
			path: '/organization/create',
			method: 'POST',
			summary: 'Create organization',
			description: 'Create an organization for the authenticated user.',
			tags: ['Organization'],
			operationId: 'createOrganization',
			successStatus: 200,
			successDescription: 'Organization created',
		})
		.input(createOrganizationInputSchema)
		.output(createOrganizationOutputSchema),

	list: baseContract
		.route({
			path: '/organization/list',
			method: 'GET',
			summary: 'List organizations',
			description: 'List organizations for the authenticated user.',
			tags: ['Organization'],
			operationId: 'listOrganizations',
			successStatus: 200,
			successDescription: 'Organizations listed',
		})
		.output(listOrganizationsOutputSchema),
}
