import type { LoggerContext } from '@orpc/experimental-pino'

import { db } from '#/db'
import { auth } from '#/lib/auth'

export const createORPCContext = async ({ req }: { req: Request }) => {
	const session = await auth.api.getSession({ headers: req.headers })

	return {
		auth: session,
		db,
		req,
		resHeaders: undefined as Headers | undefined,
	}
}

type ORPCContext = Awaited<ReturnType<typeof createORPCContext>>

export interface ORPCContextWithLogger extends ORPCContext, LoggerContext {}
