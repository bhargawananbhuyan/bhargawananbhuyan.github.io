<script lang="ts">
	import './styles.css'

	import type { FormEventHandler, KeyboardEventHandler } from 'svelte/elements'

	let input = ''
	let words: string[] = []
	let uniqueWords: string[] = []
	$: uniqueWords = [...new Set(words)]

	const handleInput: FormEventHandler<HTMLInputElement> = (e) => {
		const value = e.currentTarget.value
		if (value.endsWith(' ') && input.trim().length > 0) {
			words = [...words, input.trim()]
			input = ''
		} else input = value
	}

	const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
		if (e.key === 'Backspace' && input.trim().length === 0 && words.length > 0)
			words = words.slice(0, -1)
	}
</script>

<span class="wrapper">
	{#if uniqueWords.length > 0}
		<span class="words">
			{#each uniqueWords as word}
				<span>#{word}</span>
			{/each}
		</span>
	{/if}
	<input
		type="text"
		placeholder="Tags"
		bind:value={input}
		on:input={handleInput}
		on:keydown={handleKeyDown}
	/>
</span>
