import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'

import limax from 'limax'
import { toast } from 'sonner'

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
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from '#/components/ui/input-group'
import { Spinner } from '#/components/ui/spinner'
import { env } from '#/env'
import { orpc } from '#/orpc/client'
import { createWorkspaceWithDefaultTeamInputSchema } from '#/orpc/schemas/workspace'

const formSchema = createWorkspaceWithDefaultTeamInputSchema

export const CreateWorkspaceForm = () => {
	const router = useRouter()
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const createWorkspaceMutation = useMutation(
		orpc.workspace.createWithDefaultTeam.mutationOptions({
			onError: (error) => {
				toast.error('Failed to create workspace. Please try again later.', {
					description: error.message,
				})
			},
		})
	)

	const form = useForm({
		defaultValues: {
			name: '',
			slug: '',
		},
		validators: {
			onChange: formSchema,
			onSubmit: formSchema,
		},
		onSubmit: async ({ value }) => {
			const result = await createWorkspaceMutation.mutateAsync(value)
			await queryClient.invalidateQueries()
			await router.invalidate({ sync: true })
			await navigate({ href: result.redirectTo })
		},
	})

	return (
		<Card className="w-full max-w-md bg-transparent ring-0">
			<CardHeader>
				<CardTitle className="text-xl font-semibold">
					Create a Workspace
				</CardTitle>
				<CardDescription className="text-sm text-muted-foreground">
					Your Default Team and starter workflow are created automatically.
				</CardDescription>
			</CardHeader>

			<CardContent>
				<form
					id="create-workspace-form"
					onSubmit={(e) => {
						e.preventDefault()
						e.stopPropagation()
						void form.handleSubmit()
					}}
				>
					<FieldGroup>
						<form.Field
							name="name"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Workspace name</FieldLabel>

										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => {
												field.handleChange(e.target.value)
											}}
											aria-invalid={isInvalid}
											placeholder="Acme Product"
											autoComplete="organization"
										/>

										<FieldDescription>
											The Default Team will use this name.
										</FieldDescription>

										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								)
							}}
						/>

						<form.Subscribe
							selector={(state) => state.values.name}
							children={(name) => (
								<form.Field
									name="slug"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid
										const value = field.state.value || limax(name)
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>
													Workspace URL
												</FieldLabel>

												<InputGroup>
													<InputGroupAddon>
														<InputGroupText>{env.VITE_APP_URL}/</InputGroupText>
													</InputGroupAddon>

													<InputGroupInput
														id={field.name}
														name={field.name}
														value={value}
														onBlur={field.handleBlur}
														onChange={(e) => {
															field.handleChange(e.target.value)
														}}
														aria-invalid={isInvalid}
														placeholder="acme-product"
														autoComplete="off"
														className="pl-0.5"
													/>
												</InputGroup>

												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										)
									}}
								/>
							)}
						/>
					</FieldGroup>
				</form>
			</CardContent>

			<CardFooter>
				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
					children={([canSubmit, isSubmitting]) => {
						const isPending = isSubmitting
							? true
							: createWorkspaceMutation.isPending

						return (
							<Button
								form="create-workspace-form"
								type="submit"
								className="w-full"
								size="lg"
								disabled={!canSubmit || isPending}
							>
								{isPending ? <Spinner data-icon="inline-start" /> : null}
								Create Workspace
							</Button>
						)
					}}
				/>
			</CardFooter>
		</Card>
	)
}
