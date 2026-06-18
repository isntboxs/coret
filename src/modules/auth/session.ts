import { createServerFn } from '@tanstack/react-start'

export const getAuthFn = createServerFn({ method: 'GET' }).handler(async () => {
	const [{ getRequestHeaders }, { auth }] = await Promise.all([
		import('@tanstack/react-start/server'),
		import('#/modules/auth/auth.server'),
	])

	return auth.api.getSession({ headers: getRequestHeaders() })
})
