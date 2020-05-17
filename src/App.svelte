<script>
    import DragDrop from "./DragDrop.svelte";

    let data1 = ["Apples", "Butter", "Charlie", "Duff", "Edward", "Freddy", "George", "Harry", "Ink", "Johnnie", "King", "London"];
	let data2 = [
			{"id": 0, "text": "Boston"}, 
			{"id": 1, "text": "Boston"}, 
			{"id": 2, "text": "Chicago"}, 
			{"id": 3, "text": "Denver"}];
	let data3 = [
			{"id": 0, "text": "Adams"},
			{"id": 1, "text": "Boston"}, 
			{"id": 2, "html": "<p style='color: red;'>Chicago</p>"}, 
			{"id": 3, "html": "<p style='color: blue;'>Denver</p>"}];

	let data = data1;
</script>

<style>
	:global(body) {
		background-color: #eef2f3;
	}

	main {
		text-align: center;
		max-width: 36em;
		margin: auto;
	}
</style>

<main>
	<h3>
		Svelte DragDropList!
	</h3>
	<p>
		<a href="https://github.com/jwlarocque/svelte-dragdroplist">github.com/jwlarocque/svelte-dragdroplist</a>
	</p>

	<button on:click={() => data = data1}>
		Text Data
	</button>
	<button on:click={() => data = data2}>
		Object Data
	</button>
	<button on:click={() => data = data3}>
		HTML Data
	</button>

	<p>
		Data: {JSON.stringify(data)}
	</p>

	<DragDrop bind:data={data}/>
</main>

