<script lang="ts">
	import './styles.css'

	import type { FormEventHandler } from 'svelte/elements'

	let input = ''
	let words: string[] = []

	const handleInput: FormEventHandler<HTMLInputElement> = (e) => {
		const value = e.currentTarget.value
		if (value.endsWith(' ') && input.trim().length > 0) {
			words = [...words, input.trim()]
			input = ''
		} else input = value
	}
</script>

<span class="wrapper">
	{#if words.length > 0}
		<span class="words">
			{#each words as word}
				<span>#{word}</span>
			{/each}
		</span>
	{/if}
	<input type="text" placeholder="Tags" bind:value={input} on:input={handleInput} />
</span>
