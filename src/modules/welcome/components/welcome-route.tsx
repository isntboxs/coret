import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'

import {
	IconArrowRight,
	IconBrandGithub,
	IconCheck,
	IconCopy,
	IconMail,
	IconUser,
} from '@tabler/icons-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '#/components/ui/card'
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Progress } from '#/components/ui/progress'
import { Switch } from '#/components/ui/switch'
import { Textarea } from '#/components/ui/textarea'
import { linkGithubAccount } from '#/modules/auth/auth-actions'
import type { WelcomeGetOutput } from '#/modules/welcome/schemas'
import { orpc } from '#/server/orpc/client'
import { cn } from '#/shared/utils'

interface WelcomeRouteProps {
	initial: WelcomeGetOutput
	workspaceSlug: string
}

export function WelcomeRoute({ initial, workspaceSlug }: WelcomeRouteProps) {
	const navigate = useNavigate()
	const router = useRouter()
	const queryClient = useQueryClient()
	const currentStep = initial.progress.currentStep
	const progressValue = (currentStep / 4) * 100

	const invalidate = async () => {
		await queryClient.invalidateQueries()
		await router.invalidate({ sync: true })
	}

	const profileMutation = useMutation(
		orpc.welcome.updateProfile.mutationOptions({
			onSuccess: async () => {
				await invalidate()
			},
			onError: (error) => toast.error(error.message),
		})
	)
	const inviteMutation = useMutation(
		orpc.welcome.inviteTeammates.mutationOptions({
			onSuccess: async () => {
				await invalidate()
			},
			onError: (error) => toast.error(error.message),
		})
	)
	const githubMutation = useMutation(
		orpc.welcome.connectGithub.mutationOptions({
			onSuccess: async () => {
				await invalidate()
			},
			onError: (error) => toast.error(error.message),
		})
	)
	const subscriptionsMutation = useMutation(
		orpc.welcome.updateSubscriptions.mutationOptions({
			onSuccess: async (result) => {
				await invalidate()
				if (result.redirectTo) {
					await navigate({ href: result.redirectTo })
				}
			},
			onError: (error) => toast.error(error.message),
		})
	)

	const profileForm = useForm({
		defaultValues: {
			name: initial.profile.name,
			username: initial.profile.username ?? '',
			image: initial.profile.image ?? '',
			title: initial.profile.title ?? '',
		},
		onSubmit: async ({ value }) => {
			await profileMutation.mutateAsync({
				workspaceSlug,
				name: value.name,
				username: value.username,
				image: value.image.length > 0 ? value.image : null,
				title: value.title,
			})
		},
	})

	const inviteForm = useForm({
		defaultValues: {
			emailsText: initial.progress.inviteEmails?.join(', ') ?? '',
		},
		onSubmit: async ({ value }) => {
			await inviteMutation.mutateAsync({
				workspaceSlug,
				emailsText: value.emailsText,
			})
		},
	})

	const subscriptionsForm = useForm({
		defaultValues: {
			changelogOptIn: initial.progress.changelogOptIn ?? true,
			onboardingEmailOptIn: initial.progress.onboardingEmailOptIn ?? true,
			followActionCompleted: Boolean(initial.progress.followActionCompletedAt),
		},
		onSubmit: async ({ value }) => {
			await subscriptionsMutation.mutateAsync({
				workspaceSlug,
				changelogOptIn: value.changelogOptIn,
				onboardingEmailOptIn: value.onboardingEmailOptIn,
				followActionCompleted: value.followActionCompleted,
			})
		},
	})

	const copyInviteLink = async () => {
		await navigator.clipboard.writeText(initial.inviteLink)
		toast.success('Invitation link copied')
	}

	const skipInvites = async () => {
		await inviteMutation.mutateAsync({
			workspaceSlug,
			emailsText: '',
		})
	}

	const startGithub = async () => {
		await githubMutation.mutateAsync({
			workspaceSlug,
			action: 'started',
		})
		const response = await linkGithubAccount(`/${workspaceSlug}/welcome`)
		const url = response?.data?.url
		if (url) {
			window.location.href = url
			return
		}
		toast.message('GitHub linking started. Skip is available for now.')
	}

	const skipGithub = async () => {
		await githubMutation.mutateAsync({
			workspaceSlug,
			action: 'skip',
		})
	}

	return (
		<main className="min-h-svh bg-background">
			<div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 px-6 py-10">
				<header className="flex flex-col gap-4">
					<div className="flex items-center justify-between gap-4">
						<div>
							<p className="text-sm text-muted-foreground">
								{initial.workspace.name}
							</p>
							<h1 className="text-3xl font-semibold tracking-normal">
								Welcome Flow
							</h1>
						</div>
						<div className="text-right text-sm text-muted-foreground">
							Step {currentStep} of 4
						</div>
					</div>
					<Progress value={progressValue} />
				</header>

				<div className="grid gap-5 lg:grid-cols-[220px_1fr]">
					<nav className="flex flex-col gap-2">
						<StepMarker step={1} current={currentStep} label="Profile" />
						<StepMarker step={2} current={currentStep} label="Invite" />
						<StepMarker step={3} current={currentStep} label="GitHub" />
						<StepMarker step={4} current={currentStep} label="Updates" />
					</nav>

					<div className="flex flex-col gap-5">
						{currentStep === 1 ? (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2 text-lg">
										<IconUser data-icon="inline-start" />
										Profile
									</CardTitle>
									<CardDescription>
										Set the identity other Workspace Members will see.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<form
										id="welcome-profile-form"
										onSubmit={(event) => {
											event.preventDefault()
											event.stopPropagation()
											void profileForm.handleSubmit()
										}}
									>
										<FieldGroup>
											<profileForm.Field
												name="image"
												children={(field) => (
													<Field>
														<FieldLabel htmlFor={field.name}>
															Profile picture URL
														</FieldLabel>
														<div className="flex items-center gap-3">
															<Avatar size="lg">
																{field.state.value ? (
																	<AvatarImage src={field.state.value} alt="" />
																) : null}
																<AvatarFallback>
																	{initial.profile.name
																		.slice(0, 2)
																		.toUpperCase()}
																</AvatarFallback>
															</Avatar>
															<Input
																id={field.name}
																value={field.state.value}
																onChange={(event) => {
																	field.handleChange(event.target.value)
																}}
																placeholder="https://example.com/avatar.png"
															/>
														</div>
													</Field>
												)}
											/>
											<profileForm.Field
												name="name"
												children={(field) => (
													<Field>
														<FieldLabel htmlFor={field.name}>Name</FieldLabel>
														<Input
															id={field.name}
															value={field.state.value}
															onChange={(event) => {
																field.handleChange(event.target.value)
															}}
														/>
													</Field>
												)}
											/>
											<profileForm.Field
												name="username"
												children={(field) => {
													const invalid =
														field.state.meta.isTouched &&
														!field.state.meta.isValid
													return (
														<Field data-invalid={invalid}>
															<FieldLabel htmlFor={field.name}>
																Username
															</FieldLabel>
															<Input
																id={field.name}
																value={field.state.value}
																onChange={(event) => {
																	field.handleChange(event.target.value)
																}}
																aria-invalid={invalid}
															/>
															{invalid ? (
																<FieldError errors={field.state.meta.errors} />
															) : null}
														</Field>
													)
												}}
											/>
											<profileForm.Field
												name="title"
												children={(field) => (
													<Field>
														<FieldLabel htmlFor={field.name}>Title</FieldLabel>
														<Input
															id={field.name}
															value={field.state.value}
															onChange={(event) => {
																field.handleChange(event.target.value)
															}}
															placeholder="Product lead"
														/>
													</Field>
												)}
											/>
										</FieldGroup>
									</form>
								</CardContent>
								<CardFooter className="justify-end">
									<Button
										form="welcome-profile-form"
										disabled={profileMutation.isPending}
									>
										Next
										<IconArrowRight data-icon="inline-end" />
									</Button>
								</CardFooter>
							</Card>
						) : null}

						{currentStep === 2 ? (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2 text-lg">
										<IconMail data-icon="inline-start" />
										Invite teammates
									</CardTitle>
									<CardDescription>
										Invite by email or skip this step with an empty list.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<form
										id="welcome-invite-form"
										onSubmit={(event) => {
											event.preventDefault()
											event.stopPropagation()
											void inviteForm.handleSubmit()
										}}
									>
										<FieldGroup>
											<Field>
												<FieldLabel>Invitation link</FieldLabel>
												<div className="flex gap-2">
													<Input value={initial.inviteLink} readOnly />
													<Button
														type="button"
														variant="outline"
														onClick={() => void copyInviteLink()}
													>
														<IconCopy data-icon="inline-start" />
														Copy
													</Button>
												</div>
											</Field>
											<inviteForm.Field
												name="emailsText"
												children={(field) => (
													<Field>
														<FieldLabel htmlFor={field.name}>Emails</FieldLabel>
														<Textarea
															id={field.name}
															value={field.state.value}
															onChange={(event) => {
																field.handleChange(event.target.value)
															}}
															placeholder="ada@example.com, grace@example.com"
														/>
														<FieldDescription>
															Separate multiple emails with commas.
														</FieldDescription>
													</Field>
												)}
											/>
										</FieldGroup>
									</form>
								</CardContent>
								<CardFooter className="justify-between gap-2">
									<Button
										type="button"
										variant="outline"
										onClick={() => void skipInvites()}
										disabled={inviteMutation.isPending}
									>
										Skip
									</Button>
									<Button
										form="welcome-invite-form"
										disabled={inviteMutation.isPending}
									>
										Next
										<IconArrowRight data-icon="inline-end" />
									</Button>
								</CardFooter>
							</Card>
						) : null}

						{currentStep === 3 ? (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2 text-lg">
										<IconBrandGithub data-icon="inline-start" />
										GitHub
									</CardTitle>
									<CardDescription>
										Authenticate GitHub now, or skip it for this setup pass.
									</CardDescription>
								</CardHeader>
								<CardFooter className="justify-between gap-2">
									<Button
										type="button"
										variant="outline"
										onClick={() => void skipGithub()}
										disabled={githubMutation.isPending}
									>
										Skip
									</Button>
									<Button
										type="button"
										onClick={() => void startGithub()}
										disabled={
											githubMutation.isPending || initial.githubConnected
										}
									>
										{initial.githubConnected
											? 'GitHub connected'
											: 'Authenticate'}
										<IconArrowRight data-icon="inline-end" />
									</Button>
								</CardFooter>
							</Card>
						) : null}

						{currentStep === 4 ? (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2 text-lg">
										<IconCheck data-icon="inline-start" />
										Updates
									</CardTitle>
									<CardDescription>
										Choose product update preferences and enter the active Team.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<form
										id="welcome-subscriptions-form"
										onSubmit={(event) => {
											event.preventDefault()
											event.stopPropagation()
											void subscriptionsForm.handleSubmit()
										}}
									>
										<FieldGroup>
											<subscriptionsForm.Field
												name="changelogOptIn"
												children={(field) => (
													<Field orientation="horizontal">
														<div className="flex flex-col gap-1">
															<FieldLabel>Changelog updates</FieldLabel>
															<FieldDescription>
																Product changes and release notes.
															</FieldDescription>
														</div>
														<Switch
															checked={field.state.value}
															onCheckedChange={(checked) => {
																field.handleChange(checked)
															}}
														/>
													</Field>
												)}
											/>
											<subscriptionsForm.Field
												name="onboardingEmailOptIn"
												children={(field) => (
													<Field orientation="horizontal">
														<div className="flex flex-col gap-1">
															<FieldLabel>Onboarding emails</FieldLabel>
															<FieldDescription>
																Short setup notes for new workspaces.
															</FieldDescription>
														</div>
														<Switch
															checked={field.state.value}
															onCheckedChange={(checked) => {
																field.handleChange(checked)
															}}
														/>
													</Field>
												)}
											/>
											<subscriptionsForm.Field
												name="followActionCompleted"
												children={(field) => (
													<Field orientation="horizontal">
														<div className="flex flex-col gap-1">
															<FieldLabel>Follow Coret</FieldLabel>
															<FieldDescription>
																Marks the follow action as completed.
															</FieldDescription>
														</div>
														<Switch
															checked={field.state.value}
															onCheckedChange={(checked) => {
																field.handleChange(checked)
															}}
														/>
													</Field>
												)}
											/>
										</FieldGroup>
									</form>
								</CardContent>
								<CardFooter className="justify-end">
									<Button
										form="welcome-subscriptions-form"
										disabled={subscriptionsMutation.isPending}
									>
										Finish Welcome
										<IconArrowRight data-icon="inline-end" />
									</Button>
								</CardFooter>
							</Card>
						) : null}
					</div>
				</div>
			</div>
		</main>
	)
}

function StepMarker({
	step,
	current,
	label,
}: {
	step: number
	current: number
	label: string
}) {
	const isComplete = current > step
	const isCurrent = current === step

	return (
		<div
			className={cn(
				'flex items-center gap-3 rounded-md border px-3 py-2 text-sm',
				isCurrent && 'border-primary bg-accent text-foreground',
				isComplete && 'text-muted-foreground'
			)}
		>
			<span className="flex size-6 items-center justify-center rounded-full border text-xs">
				{isComplete ? <IconCheck data-icon="inline-start" /> : step}
			</span>
			<span>{label}</span>
		</div>
	)
}
