<script>
	import DragDrop from "./DragDrop.svelte";

	let data = new Array(6).fill(0).map((x, i) => ("Item " + (i + 1)));
	data[6] = ({"id": "lorem","html": "<p style='color: red;'>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>"});
</script>

<main>
	<h1>DragDrop</h1>
	<p>Data: {data}</p>
	<div>
		<DragDrop bind:data={data}/>
	</div>
</main>

<style>
	:global(body) {
		padding: 0;
		width: 100%;
	}

	main {
		text-align: center;
		margin: 0;
		padding: 2em 1em;
		min-height: 100%;
		background-color: #eef2f3;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 3em;
		font-weight: 100;
		margin-top: 0;
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