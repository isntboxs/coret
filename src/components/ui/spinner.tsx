import { IconLoader } from '@tabler/icons-react'

import { cn } from '@/lib/utils'

function Spinner({
	className,
	...props
}: Omit<React.ComponentProps<'span'>, 'children'>) {
	return (
		<span aria-label="Loading" className={className} {...props}>
			<IconLoader className={cn('animate-spin', className)} />
		</span>
	)
}

export { Spinner }
