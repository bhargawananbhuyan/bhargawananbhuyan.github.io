import { fontFamily } from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class',
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Geist Sans', ...fontFamily.sans],
				serif: ['Lora', ...fontFamily.serif],
				mono: ['Geist Mono', ...fontFamily.mono]
			}
		}
	},
	plugins: [require('@tailwindcss/typography')]
}
