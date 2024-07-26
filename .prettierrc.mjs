/** @type {import("prettier").Config} */
export default {
	plugins: [
		'prettier-plugin-astro',
		'prettier-plugin-organize-imports',
		'prettier-plugin-tailwindcss'
	],
	overrides: [{ files: '*.astro', options: { parser: 'astro' } }],
	semi: false,
	singleQuote: true,
	useTabs: true,
	tabWidth: 2,
	printWidth: 100,
	trailingComma: 'none'
}
