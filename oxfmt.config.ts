import { defineConfig } from 'oxfmt'

export default defineConfig({
	endOfLine: 'lf',
	semi: false,
	singleQuote: true,
	useTabs: true,
	tabWidth: 2,
	trailingComma: 'es5',
	printWidth: 80,
	sortTailwindcss: {
		stylesheet: 'src/styles.css',
		functions: ['clsx', 'cn', 'cva', 'tw'],
		preserveWhitespace: true,
	},
	sortPackageJson: {
		sortScripts: true,
	},
	sortImports: {
		newlinesBetween: false,
		customGroups: [
			{
				groupName: 'react-libs',
				elementNamePattern: ['react'],
			},
			{
				groupName: 'tanstack-libs',
				elementNamePattern: ['@tanstack', '@tanstack/**'],
			},
			{
				groupName: 'local-libs',
				elementNamePattern: ['#/**', '@/**'],
			},
		],
		groups: [
			'tanstack-libs',
			{ newlinesBetween: true },
			'react-libs',
			{ newlinesBetween: true },
			['value-builtin', 'value-external'],
			'unknown',
			{ newlinesBetween: true },
			'local-libs',
			['value-parent', 'value-sibling', 'value-index'],
		],
		internalPattern: ['#/', '@/'],
	},
	ignorePatterns: ['node_modules/**', '.tanstack/**', 'bun.lock'],
})
