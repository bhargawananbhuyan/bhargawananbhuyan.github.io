<script lang="ts">
	import { onMount } from 'svelte'

	let theme = ''

	onMount(() => {
		theme =
			window.localStorage.getItem('theme') ??
			(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
		toggleTheme(theme)
	})

	function toggleMetaTheme() {
		let metaTheme = document.querySelector('meta[name="theme-color"]')
		if (!metaTheme) {
			metaTheme = document.createElement('meta')
			metaTheme.setAttribute('name', 'theme-color')
			document.head.appendChild(metaTheme)
		}
		const dark = document.documentElement.classList.contains('dark')
		if (dark) metaTheme?.setAttribute('content', '#171717')
		else metaTheme?.setAttribute('content', '#f5f5f5')
	}

	const toggleTheme = (th: string) => {
		theme = th

		const css = document.createElement('style')

		css.appendChild(
			document.createTextNode(
				`* {
             -webkit-transition: none !important;
             -moz-transition: none !important;
             -o-transition: none !important;
             -ms-transition: none !important;
             transition: none !important;
          }
        `
			)
		)

		document.head.appendChild(css)

		document.documentElement.classList.toggle('dark', th === 'dark')
		window.localStorage.setItem('theme', th)

		window.getComputedStyle(css).opacity
		document.head.removeChild(css)

		toggleMetaTheme()
	}
</script>

<button
	on:click={() => toggleTheme(theme === 'dark' ? 'light' : 'dark')}
	class="border border-black/15 py-1.5 px-2 rounded-md transition-colors duration-300 ease-in-out hover:bg-black/5 hover:text-black focus-visible:bg-black/5 focus-visible:text-black dark:border-white/20 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:bg-white/5 dark:focus-visible:text-white"
	title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
>
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
	>
		{#if theme === 'dark'}
			<circle cx="12" cy="12" r="5"></circle>
			<line x1="12" y1="1" x2="12" y2="3"></line>
			<line x1="12" y1="21" x2="12" y2="23"></line>
			<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
			<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
			<line x1="1" y1="12" x2="3" y2="12"></line>
			<line x1="21" y1="12" x2="23" y2="12"></line>
			<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
			<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
		{:else}
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
		{/if}
	</svg>
</button>
