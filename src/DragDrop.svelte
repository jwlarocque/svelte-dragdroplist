<script>
    export let data = [];

    let list;
    let grabbed;
    let prev;
    let next;
    let ghost;
    let offsetX;
    let offsetY;

    function updateGhostPos(mouseX, mouseY) {
        ghost.style.top = mouseY - offsetY + "px";
        ghost.style.left = mouseX - offsetX + "px";
    }

    function grab(ev, i) {
        console.log("grab event:");
        console.log(ev);
        if (grabbed) {
            grabbed.classList.remove("grabbed");
        }

        // TODO: this won't work with multiple lists on the page
        list = document.querySelector(".list");
        grabbed = list.children[i];
        prev = i > 1 ? list.children[i-1] : null;
        next = i < list.children.length - 1 ? list.children[i+1] : null;

        grabbed.classList.add("grabbed");
        let grabbedBounds = grabbed.getBoundingClientRect();
        let parentBounds = grabbed.parentNode.getBoundingClientRect();
        console.log(parentBounds);
        offsetX = parentBounds.x + (ev.clientX - grabbedBounds.x);
        offsetY = parentBounds.y + (ev.clientY - grabbedBounds.y);

        ghost = document.getElementById("ghost");
        ghost.innerHTML = grabbed.innerHTML;
        ghost.classList.remove("hidden");

        updateGhostPos(ev.clientX, ev.clientY);
    }

    function drag(ev) {
        if (grabbed) {
            updateGhostPos(ev.clientX, ev.clientY);
            for (let i = 0; i < list.children.length; i++) {
                let item = list.children[i];
                let bounds = item.getBoundingClientRect();
            }
            
        }
    }

    function drop(ev) {
        if (grabbed) {
            grabbed.classList.remove("grabbed");
            grabbed = null;
            ghost.classList.add("hidden");
        }
    }
</script>

<style>
    .list {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .item {
        display: inline-flex;
        border: 1px solid rgba(0, 0, 0, 0.5);
        border-radius: 2px;
        width: 100%;
        height: 2em;
        user-select: none;
    }

    .item > * {
        margin: auto;
    }

    :global(.grabbed) {
        opacity: 0.0;
    }

    #ghost {
        opacity: 0.6;
        position: absolute;
        top: -50px;
    }

    .hidden {
        visibility: hidden;
    }
</style>

<div 
    class="list"
    on:mousemove={function(ev) { drag(ev); }}
    on:mouseup={function(ev) { drop(ev); }}>
    {#each data as datum, i}
        <div 
            class="item"
            on:mousedown={function(ev) { grab(ev, i); }}>
            <p>{datum}</p>
        </div>
    {/each}
    <div 
        class="item hidden" 
        id="ghost"></div>
</div>