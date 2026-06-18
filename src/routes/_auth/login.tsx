import { createFileRoute } from '@tanstack/react-router'

import { z } from 'zod'

import { LoginRoute } from '#/modules/auth/components/login-route'

const loginSearchSchema = z.object({
	callbackURL: z.string().optional(),
})

export const Route = createFileRoute('/_auth/login')({
	validateSearch: loginSearchSchema,
	component: LoginRoute,
})
