import limax from 'limax'
import { z } from 'zod'

const metadataSchema = z.record(z.string(), z.unknown())

const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/

const organizationFields = {
	id: z.uuid(),
	name: z.string(),
	slug: z.string(),
	logo: z.string().nullable().optional(),
	createdAt: z.date(),
	metadata: z.any().optional(),
}

const organizationMemberFields = {
	id: z.uuid(),
	organizationId: z.uuid(),
	userId: z.uuid(),
	role: z.string(),
	createdAt: z.date(),
}

const organizationBaseSchema = z.object(organizationFields)

export const createOrganizationInputSchema = z.object({
	name: z.string().min(1),
	slug: z
		.string()
		.min(1)
		.max(100)
		.regex(slugRegex, {
			error:
				'Slug must be lowercase alphanumeric with hyphens between segments, no leading/trailing/consecutive hyphens',
		})
		.transform((val) => limax(val)),
	logo: z.string().nullable().optional(),
	metadata: metadataSchema.optional(),
	keepCurrentActiveOrganization: z.boolean().optional(),
})

export const createOrganizationOutputSchema = z.object({
	...organizationFields,
	members: z.array(z.object(organizationMemberFields).optional()),
})

export type CreateOrganizationOutput = z.infer<
	typeof createOrganizationOutputSchema
>

export const listOrganizationsOutputSchema = z.array(organizationBaseSchema)
