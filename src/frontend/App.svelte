<script>
	import Dashboard from './dashboard/Dashboard.svelte';

	export let bar;
	console.log('enter App.svelte!!');
</script>

<main>
	bar!: {bar}
	<Dashboard />
</main>

<style>
	main {
		background: black;
		color: darkgoldenrod;
	}
</style>
