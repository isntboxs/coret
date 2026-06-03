import { createFileRoute, Link, Outlet } from '@tanstack/react-router'

import { IconChevronLeft } from '@tabler/icons-react'

import { FloatingPaths } from '#/components/floating-path'
import { LogoIcon2 } from '#/components/logo'
import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_auth')({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<main className="relative md:h-svh md:overflow-hidden lg:grid lg:grid-cols-2">
			<div className="relative hidden h-full flex-col border-r bg-secondary p-10 lg:flex dark:bg-secondary/20">
				<div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
				<div className="mr-auto flex items-center justify-center">
					<LogoIcon2 className="size-8" />
				</div>

				<div className="z-10 mt-auto">
					<blockquote className="space-y-4">
						<p className="text-4xl font-bold">
							stop managing work. start shipping it.
						</p>

						<footer className="text-base">
							project management built for fast-moving teams.
						</footer>
					</blockquote>
				</div>

				<div className="absolute inset-0">
					<FloatingPaths position={1} />
					<FloatingPaths position={-1} />
				</div>
			</div>

			<div className="relative flex min-h-svh flex-col justify-center px-8">
				<div
					aria-hidden
					className="absolute inset-0 isolate -z-10 opacity-60 contain-strict"
				>
					<div className="absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)]" />
					<div className="absolute top-0 right-0 h-320 w-60 [translate:5%_-50%] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]" />
					<div className="absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]" />
				</div>

				<Link
					to="/"
					className={cn(
						buttonVariants({ variant: 'ghost', size: 'lg' }),
						'absolute top-7 left-5'
					)}
					viewTransition
				>
					<IconChevronLeft />
					Back
				</Link>

				<Outlet />
			</div>
		</main>
	)
}
