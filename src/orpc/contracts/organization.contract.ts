import { z } from 'zod'

import { orpcBaseContract as baseContract } from '#/orpc/contracts/base.contract'

const metadataSchema = z.record(z.string(), z.unknown())

const organizationFields = {
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	logo: z.string().nullable().optional(),
	createdAt: z.date(),
	metadata: z.unknown().optional(),
}

export const organizationBaseSchema = z.looseObject(organizationFields)

const organizationRelationSchema = z.looseObject({})

export const fullOrganizationSchema = z.looseObject({
	...organizationFields,
	members: z.array(organizationRelationSchema),
	invitations: z.array(organizationRelationSchema),
	teams: z.array(organizationRelationSchema),
})

export const createOrganizationInputSchema = z.object({
	name: z.string().min(1),
	slug: z.string().min(1),
	logo: z.string().nullable().optional(),
	metadata: metadataSchema.optional(),
	keepCurrentActiveOrganization: z.boolean().optional(),
})

export const updateOrganizationInputSchema = z.object({
	organizationId: z.string().optional(),
	data: z.object({
		name: z.string().min(1).optional(),
		slug: z.string().min(1).optional(),
		logo: z.string().nullable().optional(),
		metadata: metadataSchema.optional(),
	}),
})

export const getOrganizationInputSchema = z.object({
	organizationId: z.string().optional(),
	organizationSlug: z.string().optional(),
	membersLimit: z.number().int().positive().optional(),
})

export const setActiveOrganizationInputSchema = z.object({
	organizationId: z.string().nullable().optional(),
	organizationSlug: z.string().optional(),
})

export const deleteOrganizationInputSchema = z.object({
	organizationId: z.string(),
})

export const checkOrganizationSlugInputSchema = z.object({
	slug: z.string().min(1),
})

export const organizationContract = {
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
		.output(z.array(organizationBaseSchema)),
	get: baseContract
		.route({
			path: '/organization/get',
			method: 'GET',
			summary: 'Get organization',
			description:
				'Get the active organization or an organization by id or slug.',
			tags: ['Organization'],
			operationId: 'getOrganization',
			successStatus: 200,
			successDescription: 'Organization found',
		})
		.input(getOrganizationInputSchema)
		.output(fullOrganizationSchema.nullable()),
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
		.output(
			z.looseObject({
				...organizationFields,
				members: z.array(organizationRelationSchema.optional()),
			})
		),
	update: baseContract
		.route({
			path: '/organization/update',
			method: 'POST',
			summary: 'Update organization',
			description: 'Update an organization.',
			tags: ['Organization'],
			operationId: 'updateOrganization',
			successStatus: 200,
			successDescription: 'Organization updated',
		})
		.input(updateOrganizationInputSchema)
		.output(organizationBaseSchema.nullable()),
	delete: baseContract
		.route({
			path: '/organization/delete',
			method: 'POST',
			summary: 'Delete organization',
			description: 'Delete an organization.',
			tags: ['Organization'],
			operationId: 'deleteOrganization',
			successStatus: 200,
			successDescription: 'Organization deleted',
		})
		.input(deleteOrganizationInputSchema)
		.output(organizationBaseSchema),
	checkSlug: baseContract
		.route({
			path: '/organization/check-slug',
			method: 'POST',
			summary: 'Check organization slug',
			description: 'Check whether an organization slug is available.',
			tags: ['Organization'],
			operationId: 'checkOrganizationSlug',
			successStatus: 200,
			successDescription: 'Slug checked',
		})
		.input(checkOrganizationSlugInputSchema)
		.output(
			z.object({
				status: z.boolean(),
			})
		),
	setActive: baseContract
		.route({
			path: '/organization/set-active',
			method: 'POST',
			summary: 'Set active organization',
			description: 'Set or unset the active organization for the session.',
			tags: ['Organization'],
			operationId: 'setActiveOrganization',
			successStatus: 200,
			successDescription: 'Active organization updated',
		})
		.input(setActiveOrganizationInputSchema)
		.output(organizationBaseSchema.nullable()),
} as const
