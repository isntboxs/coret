import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'

import limax from 'limax'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#/components/ui/card'
import {
	Field,
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
import { createWorkspaceInputSchema } from '#/orpc/schemas/workspace'

const formSchema = createWorkspaceInputSchema
	.omit({
		logo: true,
		metadata: true,
		keepCurrentActiveWorkspace: true,
	})
	.extend({
		keepCurrentActiveWorkspace: z.boolean(),
	})

export const CreateWorkspaceForm = () => {
	const createWorkspaceMutation = useMutation(
		orpc.workspace.create.mutationOptions({
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
			keepCurrentActiveWorkspace: false,
		},
		validators: {
			onChange: formSchema,
			onSubmit: formSchema,
		},
		onSubmit: async ({ value }) => {
			await createWorkspaceMutation.mutateAsync(value)
		},
	})

	return (
		<Card className="w-full max-w-md bg-transparent ring-0">
			<CardHeader className="text-center">
				<CardTitle className="text-xl font-bold">Create a workspace</CardTitle>
				<CardDescription className="text-sm text-muted-foreground">
					Move work across teams
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
										<FieldLabel htmlFor={field.name}>Name</FieldLabel>

										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											placeholder="Your workspace name"
											autoComplete="off"
										/>

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
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>URL</FieldLabel>

												<InputGroup>
													<InputGroupAddon>
														<InputGroupText>{env.VITE_APP_URL}/</InputGroupText>
													</InputGroupAddon>

													<InputGroupInput
														id={field.name}
														name={field.name}
														value={field.state.value || limax(name)}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														aria-invalid={isInvalid}
														placeholder="workspace-name"
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

					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
						children={([canSubmit, isSubmitting]) => (
							<Button
								form="create-workspace-form"
								type="submit"
								className="mt-8 w-full"
								size="lg"
								disabled={!canSubmit || isSubmitting}
							>
								{isSubmitting ? <Spinner /> : 'Create workspace'}
							</Button>
						)}
					/>
				</form>
			</CardContent>
		</Card>
	)
}
