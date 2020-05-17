<script>
    import {flip} from "svelte/animate";
    
    export let data = [];

    let ghost;
    let grabbed;

    let lastTarget;

    let mouseY = 0; // pointer y coordinate within client
    let offsetY = 0; // y distance from top of grabbed element to pointer
    let layerY = 0; // distance from top of list to top of client

    function grab(clientY, element) {
        // modify grabbed element
        grabbed = element;
        grabbed.id = "grabbed";
        grabbed.dataset.grabY = clientY;

        // modify ghost element (which is actually dragged)
        ghost.innerHTML = grabbed.innerHTML;

        // record offset from cursor to top of element
        // (used for positioning ghost)
        offsetY = grabbed.getBoundingClientRect().y - clientY;
        drag(clientY);
    }

    // drag handler updates cursor position
    function drag(clientY) {
        if (grabbed) {
            mouseY = clientY;
            layerY = ghost.parentNode.getBoundingClientRect().y;
        }
    }

    // touchEnter handler emulates the mouseenter event for touch input
    // (more or less)
    function touchEnter(ev) {       
        drag(ev.clientY);
        // trigger dragEnter the first time the cursor moves over a list item
        let target = document.elementFromPoint(ev.clientX, ev.clientY).closest(".item");
        if (target && target != lastTarget) {
            lastTarget = target;
            dragEnter(ev, target);
        }
    }

    function dragEnter(ev, target) {
        if (grabbed) {
            // swap items in data
            if (target != grabbed && target.classList.contains("item")) {
                moveDatum(parseInt(grabbed.dataset.index), parseInt(target.dataset.index));
            }
        }
    }

    // does the actual moving of items in data
    function moveDatum(from, to) {
        let temp = data[from];
        data = [...data.slice(0, from), ...data.slice(from + 1)];
        data = [...data.slice(0, to), temp, ...data.slice(to)];
    }

    function release(ev) {
        if (grabbed) {
            // undo modifications to grabbed element
            grabbed.id = "";
            // also re-hides ghost
            grabbed = null;
        }
    }
</script>

<style>
    main {
        position: relative;
    }

    .list {
        cursor: grab;
        z-index: 5;
        display: flex;
        flex-direction: column;
    }

    .item {
        box-sizing: border-box;
        padding-right: 32px;
        display: inline-flex;
        width: 100%;
        min-height: 3em;
        margin-bottom: 0.5em;
        background-color: white;
        border: 1px solid rgb(190, 190, 190);
        border-radius: 2px;
        user-select: none;
    }

    .item:not(#grabbed):not(#ghost) {
        z-index: 10;
    }

    .item > * {
        margin: auto;
    }

    .buttons {
        width: 32px;
        min-width: 32px;
        margin: auto 0;
        display: flex;
        flex-direction: column;
    }

    .buttons button {
        cursor: pointer;
        width: 18px;
        height: 18px;
        margin: 0 auto;
        padding: 0;
        border: 1px solid rgba(0, 0, 0, 0);
        background-color: inherit;
    }

    .buttons button:focus {
        border: 1px solid black;
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

<!-- All the documentation has to go up here, sorry.
     (otherwise it conflicts with the HTML or svelte/animate) 
     The .list has handlers for pointer movement and pointer up/release/end.
     Each .item has a handler for pointer down/click/start, which assigns that
     element as the item currently being "grabbed".  They also have a handler
     for pointer enter (the touchmove handler has extra logic to behave like the
     no longer extant 'touchenter'), which swaps the entered element with the
     grabbed element when triggered.
     You'll also find reactive styling below, which keeps it from being directly
     part of the imperative javascript handlers. -->
<main>
    <div 
        bind:this={ghost}
        id="ghost"
        class={grabbed ? "item haunting" : "item"}
        style={"top: " + (mouseY + offsetY - layerY) + "px"}></div>
    <div 
        class="list"
        on:mousemove={function(ev) {drag(ev.clientY);}}
        on:touchmove={function(ev) {drag(ev.touches[0].clientY);}}
        on:mouseup|stopPropagation={function(ev) {release(ev);}}
        on:touchend|stopPropagation={function(ev) {release(ev.touches[0]);}}>
        {#each data as datum, i (datum.id ? datum.id : datum)}
            <div 
                class="item"
                data-index={i}
                data-grabY="0"
                on:mousedown={function(ev) {grab(ev.clientY, this);}}
                on:touchstart={function(ev) {grab(ev.touches[0].clientY, this);}}
                on:mouseenter|stopPropagation|self={function(ev) {dragEnter(ev, ev.target);}}
                on:touchmove|preventDefault|stopPropagation={function(ev) {touchEnter(ev.touches[0]);}}
                animate:flip|local={{duration: 200}}>
                <div class="buttons">
                    <button 
                        class="up" 
                        style={"visibility: " + (i > 0 ? "" : "hidden") + ";"}
                        on:click={function(ev) {moveDatum(i, i - 1)}}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16px" height="16px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"/></svg>
                        </button>
                    <button 
                        class="down" 
                        style={"visibility: " + (i < data.length - 1 ? "" : "hidden") + ";"}
                        on:click={function(ev) {moveDatum(i, i + 1)}}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16px" height="16px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
                        </button>
                </div>

                {#if datum.html}
                    {@html datum.html}
                {:else if datum.text}
                    <p>{datum.text}</p>
                {:else}
                    <p>{datum}</p>
                {/if}
            </div>
        {/each}
    </div>
</main>