<script>
    import {onMount} from 'svelte';
    export let data = [];

    let ghost;
    let grabbed;

    let mouseY;
    let offsetY = 0;

    onMount(() => {
        ghost = document.getElementById("ghost");
    });

    function setGrabbed(ev, element) {
        // modify grabbed element
        grabbed = element;
        grabbed.id = "grabbed";
        grabbed.dataset.grabX = ev.clientX;
        grabbed.dataset.grabY = ev.clientY;

        // modify ghost element (which is actually dragged)
        ghost.innerHTML = grabbed.innerHTML;

        // record offset from cursor to top of element
        // (used for positioning ghost)
        offsetY = grabbed.getBoundingClientRect().y - ev.clientY;
    }

    function release(ev) {
        // undo modifications to grabbed element
        grabbed.id = "";
        // also re-hides ghost
        grabbed = null;
    }
</script>

<style>
    main {
        position: relative;
    }

    .list {
        z-index: 5;
        display: flex;
        flex-direction: column;
    }

    .item {
        display: inline-flex;
        width: 100%;
        min-height: 3em;
        margin-bottom: 0.5em;
        background-color: white;
        border: 1px solid rgba(0, 0, 0, 0.5);
        border-radius: 2px;
        user-select: none;
    }

    .item > * {
        margin: auto;
    }

    :global(#grabbed) {
        opacity: 0.0;
    }

    :global(#ghost) {
        pointer-events: none;
        z-index: -5;
        position: absolute;
        top: 0;
        left: 0;
        opacity: 0.0;
    }

    /* Svelte seems to be a bit overzealous about minifying away this rule, so it's
       set to global.  Consider submitting an issue/otherwise bringing it up. 
       The above rule must also be global so precedence works normally. */
    :global(.haunting#ghost) {
        z-index: 10;
        opacity: 1.0;
    }
</style>

<main>
    <div 
        id="ghost"
        class={grabbed ? "item haunting" : "item"}
        style={"top: " + (mouseY + offsetY) + "px"}></div>
    <div 
        class="list"
        on:mousemove={function(ev) {mouseY = ev.layerY;}}
        on:mouseup={function(ev) {release(ev)}}>
        {#each data as datum}
            <div 
                class="item"
                data-grabX="0"
                data-grabY="0"
                on:mousedown={function(ev) {setGrabbed(ev, this)}}>
                <p>{datum}</p>
            </div>
        {/each}
    </div>
</main>