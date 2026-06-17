import { Link, createFileRoute, redirect } from '@tanstack/react-router'

import { IconArrowRight } from '@tabler/icons-react'

import { LogoIcon } from '#/components/logo'
import { Button, buttonVariants } from '#/components/ui/button'
import { env } from '#/env'
import { CreateWorkspaceForm } from '#/features/workspace/components/create-workspace-form'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/')({
	loader: async ({ context }) => {
		if (!context.auth) {
			return { state: 'public' as const }
		}

		const homeState = await context.orpc.workspace.homeState.call()
		if (homeState.state === 'redirect') {
			throw redirect({ href: homeState.redirectTo })
		}

		return homeState
	},
	component: Home,
})

function Home() {
	const loaderData = Route.useLoaderData()

	if (loaderData.state === 'needs_workspace') {
		return (
			<main className="min-h-svh bg-background">
				<div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col justify-center gap-10 px-6 py-10">
					<div className="flex items-center gap-3">
						<LogoIcon className="size-7" />
						<span className="font-medium">{env.VITE_APP_NAME}</span>
					</div>
					<div className="grid items-start gap-10 lg:grid-cols-[1fr_420px]">
						<section className="flex flex-col gap-5 pt-6">
							<p className="text-sm text-muted-foreground">
								Workspace Creation
							</p>
							<h1 className="max-w-xl text-4xl font-semibold tracking-normal">
								Create the Workspace that will hold your first Team.
							</h1>
							<p className="max-w-lg text-base text-muted-foreground">
								Coret creates a public Default Team, a starter workflow, and a
								team issue counter in one step.
							</p>
						</section>
						<CreateWorkspaceForm />
					</div>
				</div>
			</main>
		)
	}

	return (
		<main className="min-h-svh bg-background">
			<div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col justify-center gap-10 px-6 py-10">
				<div className="flex items-center gap-3">
					<LogoIcon className="size-7" />
					<span className="font-medium">{env.VITE_APP_NAME}</span>
				</div>
				<section className="flex max-w-2xl flex-col gap-6">
					<p className="text-sm text-muted-foreground">
						Product work, organized
					</p>
					<h1 className="text-5xl font-semibold tracking-normal">
						Track issues with teams, workflows, and a workspace that stays
						focused.
					</h1>
					<p className="text-base text-muted-foreground">
						Start with a Workspace, create the Default Team, and move into the
						active issue loop.
					</p>
					<div>
						<Link
							to="/login"
							className={cn(
								buttonVariants({ size: 'lg', variant: 'default' }),
								'gap-2'
							)}
							viewTransition
						>
							Get started
							<IconArrowRight data-icon="inline-end" />
						</Link>
					</div>
				</section>
				<div className="grid gap-3 sm:grid-cols-3">
					<Button variant="outline" className="justify-start" disabled>
						Workspace
					</Button>
					<Button variant="outline" className="justify-start" disabled>
						Default Team
					</Button>
					<Button variant="outline" className="justify-start" disabled>
						Welcome Flow
					</Button>
				</div>
			</div>
		</main>
	)
}
