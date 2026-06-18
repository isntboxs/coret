import { createFileRoute } from '@tanstack/react-router'

import { handleORPCRequest } from '#/server/orpc/handler.server'

export const Route = createFileRoute('/api/rpc/$')({
	server: {
		handlers: {
			ANY: handleORPCRequest,
		},
	},
})
