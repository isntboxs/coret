import type { LoggerContext } from '@orpc/experimental-pino'
import type { ResponseHeadersPluginContext } from '@orpc/server/plugins'

import { db } from '#/db'
import { auth } from '#/lib/auth'

interface BaseORPCContext extends ResponseHeadersPluginContext, LoggerContext {
	headers: Headers
}

export const createORPCContext = async (opts: BaseORPCContext) => {
	const session = await auth.api.getSession({ headers: opts.headers })

	return {
		...opts,
		auth: session,
		db,
	}
}

export type ORPCContext = Awaited<ReturnType<typeof createORPCContext>>
