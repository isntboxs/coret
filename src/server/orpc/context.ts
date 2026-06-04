import type { LoggerContext } from '@orpc/experimental-pino'

import { auth } from '#/server/auth'
import { db } from '#/server/db'

export const createORPCContext = async ({ req }: { req: Request }) => {
	const session = await auth.api.getSession({ headers: req.headers })

	return {
		auth: session,
		db,
	}
}

export type ORPCContext = Awaited<ReturnType<typeof createORPCContext>>

export interface ORPCContextWithLogger extends ORPCContext, LoggerContext {}
