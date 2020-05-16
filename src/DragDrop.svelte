<script>
    import {onMount} from "svelte";
    import {flip} from "svelte/animate";
    export let data = [];

    let ghost;
    let grabbed;

    let mouseY = 0;
    let offsetY = 0;
    let layerY = 0;

    onMount(() => {
        ghost = document.getElementById("ghost");
        // TODO: DOM changes on the rest of the page could break this
        layerY = ghost.getBoundingClientRect().y;
    });

    // from Underscore.js

    function grab(ev, element) {
        // modify grabbed element
        grabbed = element;
        grabbed.id = "grabbed";
        grabbed.dataset.grabY = ev.clientY;

        // modify ghost element (which is actually dragged)
        ghost.innerHTML = grabbed.innerHTML;

        // record offset from cursor to top of element
        // (used for positioning ghost)
        mouseY = ev.clientY;
        offsetY = grabbed.getBoundingClientRect().y - ev.clientY;
    }

    function drag(ev) {
        if (grabbed) {
            mouseY = ev.clientY;
        }
    }

    function dragEnter(ev) {
        drag(ev);
        if (grabbed) {
            // swap items in data
            // TODO: FIXME: undesired/multiple triggers when moving a short element over a tall one
            // (because the swap doesn't move the tall element out from under the short ghost)
            if (ev.target != grabbed && ev.target.classList.contains("item")) {
                moveDatum(parseInt(grabbed.dataset.index), parseInt(ev.target.dataset.index));
            }
        }
    }

    function moveDatum(from, to) {
        let temp = data.splice(from, 1)[0];
        data = [...data.slice(0, to), temp, ...data.slice(to)];
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
    :global(#ghost.haunting) {
        z-index: 10;
        opacity: 1.0;
    }
</style>

<main>
    <div 
        id="ghost"
        class={grabbed ? "item haunting" : "item"}
        style={"top: " + (mouseY + offsetY - layerY) + "px"}></div>
    <div 
        class="list"
        on:mousemove={function(ev) {drag(ev)}}
        on:mouseup|stopPropagation={function(ev) {release(ev)}}>
        {#each data as datum, i (datum)}
            <div 
                class="item"
                data-index={i}
                data-grabY="0"
                on:mousedown={function(ev) {grab(ev, this)}}
                on:mouseenter|stopPropagation|self={function(ev) {dragEnter(ev)}}
                in:receive={{key: datum}}
                out:send={{key: datum}}
                animate:flip={{duration: 200}}>
                <p>{datum}</p>
            </div>
        {/each}
    </div>
</main>