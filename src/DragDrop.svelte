<script>
    import {onMount} from "svelte";
    import {flip} from "svelte/animate";
    export let data = [];

    let ghost;
    let grabbed;

    let lastTarget;

    let mouseY = 0;
    let offsetY = 0;
    let layerY = 0;

    onMount(() => {
        ghost = document.getElementById("ghost");
        // TODO: DOM changes on the rest of the page could break this
        layerY = ghost.getBoundingClientRect().y;
    });

    // from Underscore.js

    function grab(clientY, element) {
        // modify grabbed element
        grabbed = element;
        grabbed.id = "grabbed";
        grabbed.dataset.grabY = clientY;

        // modify ghost element (which is actually dragged)
        ghost.innerHTML = grabbed.innerHTML;

        // record offset from cursor to top of element
        // (used for positioning ghost)
        mouseY = clientY;
        offsetY = grabbed.getBoundingClientRect().y - clientY;
    }

    function drag(clientY) {
        if (grabbed) {
            mouseY = clientY;
        }
    }

    function touchEnter(ev) {       
        drag(ev.clientY);
        let target = document.elementFromPoint(ev.clientX, ev.clientY).closest(".item");
        if (target && target != lastTarget) {
            console.log(target);
            lastTarget = target;
            dragEnter(ev, target);
        }
    }

    function dragEnter(ev, target) {
        drag(ev.clientY);
        if (grabbed) {
            // swap items in data
            if (target != grabbed && target.classList.contains("item")) {
                moveDatum(parseInt(grabbed.dataset.index), parseInt(target.dataset.index));
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

    .item:not(#grabbed):not(#ghost) {
        z-index: 10;
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

    :global(#ghost *) {
        pointer-events: none;
    }

    /* Svelte seems to be a bit overzealous about minifying away this rule, so it's
       set to global.  Consider submitting an issue/otherwise bringing it up. 
       The above rule must also be global so precedence works normally. */
    :global(#ghost.haunting) {
        z-index: 20;
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
        on:mousemove={function(ev) {drag(ev.clientY);}}
        on:touchmove={function(ev) {drag(ev.touches[0].clientY);}}
        on:mouseup|stopPropagation={function(ev) {release(ev);}}
        on:touchend|stopPropagation={function(ev) {release(ev.touches[0]);}}>
        {#each data as datum, i (datum)}
            <div 
                class="item"
                data-index={i}
                data-grabY="0"
                on:mousedown={function(ev) {grab(ev.clientY, this);}}
                on:touchstart|preventDefault={function(ev) {grab(ev.touches[0].clientY, this);}}
                on:mouseenter|stopPropagation|self={function(ev) {dragEnter(ev, ev.target);}}
                on:touchmove|preventDefault|stopPropagation={function(ev) {touchEnter(ev.touches[0]);}}
                in:receive={{key: datum}}
                out:send={{key: datum}}
                animate:flip={{duration: 200}}>
                <p>{datum}</p>
            </div>
        {/each}
    </div>
</main>