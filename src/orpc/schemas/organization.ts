import { z } from 'zod'

const metadataSchema = z.record(z.string(), z.unknown())

const organizationFields = {
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	logo: z.string().nullable().optional(),
	createdAt: z.date(),
	metadata: z.any().optional(),
}

export type OrganizationBaseSchema = z.infer<typeof organizationBaseSchema>

export const organizationBaseSchema = z.object(organizationFields)

export const listOrganizationsSchema = z.array(organizationBaseSchema)

export const organizationMembersSchema = z.looseObject({})

export const createOrganizationInputSchema = z.object({
	name: z.string().min(1),
	slug: z.string().min(1),
	logo: z.string().nullable().optional(),
	metadata: metadataSchema.optional(),
	keepCurrentActiveOrganization: z.boolean().optional(),
})
