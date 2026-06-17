import { createFileRoute, redirect } from '@tanstack/react-router'

import {
	IconCircleDashed,
	IconLayoutKanban,
	IconUsersGroup,
} from '@tabler/icons-react'

import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '#/components/ui/empty'

export const Route = createFileRoute('/$workspaceSlug/team/$teamKey/active')({
	loader: async ({ context, params }) => {
		if (!context.auth) {
			throw redirect({
				to: '/login',
				search: {
					callbackURL: `/${params.workspaceSlug}/team/${params.teamKey}/active`,
				},
			})
		}

		return context.orpc.team.getByKey.call({
			workspaceSlug: params.workspaceSlug,
			teamKey: params.teamKey,
		})
	},
	component: ActiveTeamRoute,
})

function ActiveTeamRoute() {
	const { workspace, team } = Route.useLoaderData()

	return (
		<main className="min-h-svh bg-background">
			<div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-8 px-6 py-8">
				<header className="flex flex-col gap-5 border-b pb-6 md:flex-row md:items-end md:justify-between">
					<div className="flex flex-col gap-2">
						<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
							<span>{workspace.name}</span>
							<span>/</span>
							<Badge variant="secondary">{team.key}</Badge>
						</div>
						<h1 className="text-3xl font-semibold tracking-normal">
							{team.name}
						</h1>
					</div>
					<div className="flex flex-wrap gap-2">
						<Badge variant="outline">{team.visibility}</Badge>
					</div>
				</header>

				<section className="grid gap-4 md:grid-cols-3">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-sm font-medium">
								<IconLayoutKanban data-icon="inline-start" />
								Workflow
							</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-muted-foreground">
							Default issue statuses are ready for this Team.
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-sm font-medium">
								<IconUsersGroup data-icon="inline-start" />
								Team context
							</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-muted-foreground">
							Issues created here will use the {team.key} counter.
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-sm font-medium">
								<IconCircleDashed data-icon="inline-start" />
								Active issues
							</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-muted-foreground">
							No active issue list has been added yet.
						</CardContent>
					</Card>
				</section>

				<Empty className="flex-1 rounded-lg border">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<IconCircleDashed />
						</EmptyMedia>
						<EmptyTitle>No active issues</EmptyTitle>
						<EmptyDescription>
							This is the protected landing target for the first Core Issue Loop
							slice.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</div>
		</main>
	)
}
