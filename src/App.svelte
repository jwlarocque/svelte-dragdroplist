<script>
	import DragDrop from "./DragDrop.svelte";

	let data = new Array(6).fill(0).map((x, i) => ("Item " + (i + 1)));
	data[6] = ("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.");
</script>

<main>
	<h1>DragDrop</h1>
	<p>Data: {data}</p>
	<div>
		<DragDrop bind:data={data}/>
	</div>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 3em;
		font-weight: 100;
	}

	div {
		max-width: 30em;
		width: 100%;
		margin: auto;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>