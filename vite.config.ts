import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const nitroExternalPackages = [
	/^@sentry\//,
	/^pino(?:\/.*)?$/,
	/^thread-stream(?:\/.*)?$/,
]

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools(),
		nitro({ preset: 'bun', rollupConfig: { external: nitroExternalPackages } }),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
		VitePWA({
			outDir: '.output/public',
			registerType: 'prompt',
			injectRegister: false,
			includeAssets: ['robots.txt'],
			manifest: {
				short_name: 'coret',
				name: 'coret',
				start_url: '.',
				display: 'standalone',
				theme_color: '#000000',
				background_color: '#ffffff',
				icons: [
					{
						src: 'favicon.ico',
						sizes: '64x64 32x32 24x24 16x16',
						type: 'image/x-icon',
					},
					{
						src: 'logo192.png',
						type: 'image/png',
						sizes: '192x192',
					},
					{
						src: 'logo512.png',
						type: 'image/png',
						sizes: '512x512',
					},
				],
			},
			workbox: {
				cleanupOutdatedCaches: true,
				clientsClaim: true,
				globPatterns: ['assets/**/*.{js,css,svg,webp,woff,woff2}'],
				navigateFallback: undefined,
				runtimeCaching: [],
			},
			pwaAssets: { disabled: false, config: true },
			devOptions: { enabled: true, suppressWarnings: true },
		}),
	],
})

export default config
