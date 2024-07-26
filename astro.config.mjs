import { defineConfig } from 'astro/config'

import cloudflare from '@astrojs/cloudflare'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import svelte, { vitePreprocess } from '@astrojs/svelte'
import tailwind from '@astrojs/tailwind'
import expressiveCode from 'astro-expressive-code'
import pagefind from 'astro-pagefind'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeMermaid from 'rehype-mermaid'

// https://astro.build/config
export default defineConfig({
	site: "https://bhargawananbhuyan.github.io",
	output: 'hybrid',
	markdown: {
		rehypePlugins: [
			[
				rehypeMermaid,
				{
					strategy: 'img-svg'
				}
			],
			[
				rehypeExternalLinks,
				{
					target: '_blank',
					rel: ['noopener', 'noreferrer']
				}
			]
		]
	},
	integrations: [
		tailwind(),
		sitemap(),
		expressiveCode({
			styleOverrides: {
				frames: {
					shadowColor: 'none'
				}
			}
		}),
		mdx(),
		pagefind(),
		svelte({
			preprocess: vitePreprocess()
		})
	]
})
