import { createMiddleware } from '@tanstack/react-start'

import { auth } from '#/server/auth'

export const authMiddleware = createMiddleware().server(
	async ({ request, next }) => {
		const session = await auth.api.getSession({
			headers: request.headers,
		})

		return next({ context: { auth: session } })
	}
)
