<script lang="ts">
	import { page } from '$app/stores';
	import { error } from '@sveltejs/kit';

	let online: boolean;
</script>

<svelte:head>
	<title>Error {$page.status}</title>
</svelte:head>

<svelte:window bind:online />

<div>
	<h1>Error {$page.status}: {$page.error?.message}</h1>
</div>
