import type { SVGAttributes } from 'react'

type LogoProps = SVGAttributes<SVGSVGElement> & {
	size?: number
}

export function LogoIcon({ ...props }: LogoProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 32 32"
			fill="none"
			{...props}
		>
			<path
				d="M7 28L19 4"
				stroke="currentColor"
				strokeWidth={4}
				strokeLinecap="square"
			/>
			<path
				d="M13 28L25 4"
				stroke="currentColor"
				strokeWidth={2}
				strokeLinecap="square"
			/>
		</svg>
	)
}

export function LogoIcon2({ ...props }: LogoProps) {
	return (
		<svg
			viewBox="0 0 32 32"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path
				d="M7 28L19 4"
				stroke="currentColor"
				strokeWidth="4"
				strokeLinecap="square"
			/>
			<path
				d="M13 28L25 4"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="square"
			/>
			<path
				d="M6 6L26 26"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="square"
			/>
		</svg>
	)
}
