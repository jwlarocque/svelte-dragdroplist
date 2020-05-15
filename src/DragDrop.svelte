<!-- Welcome to Bodgetown -->

<script>
    import {onMount} from 'svelte';
    export let data = [];

    let list;
    let grabbed;
    let prev;
    let next;
    let ghost;
    let offsetX;
    let offsetY;
    let from;
    let to;
    let dodrag = true;

    onMount(async () => {setup();})

    function setup() {
        // TODO: this won't work with multiple lists on the page
        list = document.querySelector(".list");
        let listy = list.getBoundingClientRect().y;
        let children = Array.from(list.children);
        children.forEach((child) => {
            if (child.id !== "ghost") {
                let ref = document.getElementById("ref" + child.id.substring(4));
                child.style.top = ref.getBoundingClientRect().y - listy + "px";
            }
        });
    }

    function grab(mouseX, mouseY, element) {

        if (grabbed) {
            grabbed.classList.remove("grabbed");
        }

        let i = Array.prototype.indexOf.call(list.children, element);
        from = i;
        to = i;
        grabbed = list.children[i];
        prev = i > 0 ? list.children[i-1] : null;
        next = i < list.children.length - 1 ? list.children[i+1] : null;

        grabbed.classList.add("grabbed");
        let grabbedBounds = grabbed.getBoundingClientRect();
        let parentBounds = grabbed.parentNode.getBoundingClientRect();
        offsetX = parentBounds.x + (mouseX - grabbedBounds.x);
        offsetY = parentBounds.y + (mouseY - grabbedBounds.y);

        ghost = document.getElementById("ghost");
        ghost.innerHTML = grabbed.innerHTML;
        ghost.classList.remove("hidden");
        ghost.style.transform = "scale(1.1)";

        updateGhostPos(mouseX, mouseY);
    }

    function drag(mouseX, mouseY) {
        if (grabbed && dodrag) {
            updateGhostPos(mouseX, mouseY);
            reorder(mouseY);
        }
    }

    function reorder(mouseY) {
        if (prev) {
            let bounds = prev.getBoundingClientRect();
            if (mouseY < bounds.y + bounds.height / 2) {
                let grabbedtop = grabbed.style.top;
                grabbed.style.top = prev.style.top;
                prev.style.top = grabbedtop;
                let temp = prev;
                prev = prev.previousElementSibling;
                // skip the grabbed element
                if (prev && prev.classList.contains("grabbed")) {
                    prev = prev.previousElementSibling;
                }
                next = temp;
                to--;

                return reorder(mouseY);
            }
        }
        if (next) {
            let bounds = next.getBoundingClientRect();
            // extra check for next sibling because 
            // the ghost element isn't really part of the list
            if (next.nextElementSibling && mouseY > bounds.y + bounds.height / 2) {
                let grabbedtop = grabbed.style.top;
                grabbed.style.top = next.style.top;
                next.style.top = grabbedtop;
                let temp = next;
                next = next.nextElementSibling;
                prev = temp;
                to++;

                return reorder(mouseY);
            }
        }
    }

    function drop(ev) {
        if (grabbed) {
            console.log("dropping!");
            ghost.style.transition = "all 0.2s ease-in-out";
            ghost.style.top = grabbed.style.top;
            ghost.style.transform = "scale(1.0)";
            next = null;
            prev = null;
            let ended = 0;
            dodrag = false;
            ghost.ontransitionend = () => {
                ended++;
                if (ended >= 2) {
                    ghost.ontransitionend = null; // keep this from triggering all the time
                    ghost.style.transition = "";
                    ghost.style.top = "";
                    ghost.style.transform = "";
                    ghost.classList.add("hidden");
                    grabbed.classList.remove("grabbed");
                    grabbed = null;
                    dodrag = true;
                    let temp;
                    if (from > to) {
                        for (let i = from; i > to; i--) {
                            temp = data[i];
                            data[i] = data[i - 1];
                            data[i - 1] = temp;
                        }
                    } else {
                        for(let i = from; i < to; i++) {
                            temp = data[i];
                            data[i] = data[i + 1];
                            data[i + 1] = temp;
                        }
                    }
                }
            }
        }
    }

    function updateGhostPos(mouseX, mouseY) {
        ghost.style.top = mouseY - offsetY + "px";
        //ghost.style.left = mouseX - offsetX + "px";
    }
</script>

<style>
    .list, .reference {
        position: relative;
        display: flex;
        flex-direction: column;
    }

    .list .item {
        position: absolute;
    }

    .item {
        background-color: white;
        top: 0;
        left: 0;
        display: inline-flex;
        border: 1px solid rgba(0, 0, 0, 0.5);
        border-radius: 2px;
        width: 100%;
        min-height: 2em;
        user-select: none;
        margin-bottom: 0.5em;
    }

    .item:not(#ghost) {
        transition: top 0.2s ease-in-out;
    }

    .item > * {
        margin: auto;
    }

    :global(.grabbed) {
        opacity: 0.0;
    }

    #ghost {
        scale: 1.0;
        position: absolute;
        transition: transform 0.2s ease-in-out;
    }

    .hidden {
        visibility: hidden;
    }

    .reference {
        opacity: 0.0;
        z-index: -100;
    }
</style>

<main>
    <div 
        class="list"
        on:mousemove={function(ev) { drag(ev.clientX, ev.clientY); }}
        on:touchmove={function(ev) { drag(ev.touches[0].clientX, ev.touches[0].clientY); }}
        on:mouseup={function(ev) { drop(ev); }}
        on:touchend={function(ev) { drop(ev); }}>
        {#each data as datum, i (datum)}
            <div 
                class="item"
                id={"item" + i}
                on:mousedown={function(ev) { grab(ev.clientX, ev.clientY, this); }}
                on:touchstart={function(ev) { grab(ev.touches[0].clientX, ev.touches[0].clientY, this); }}>
                <p>{datum}</p>
            </div>
        {/each}
        <div 
            class="item hidden" 
            id="ghost"></div>
    </div>
    <div class="reference">
        {#each data as datum, i}
            <div class="item" id={"ref" + i}>
                <p>{datum}</p>
            </div>
        {/each}
    </div>
</main>