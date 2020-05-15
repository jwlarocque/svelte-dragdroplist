<script>
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

    function grab(ev, element) {
        if (grabbed) {
            grabbed.classList.remove("grabbed");
        }

        // TODO: this won't work with multiple lists on the page
        list = document.querySelector(".list");
        let i = Array.prototype.indexOf.call(list.children, element);
        from = i;
        to = i;
        grabbed = list.children[i];
        prev = i > 0 ? list.children[i-1] : null;
        next = i < list.children.length - 1 ? list.children[i+1] : null;

        grabbed.classList.add("grabbed");
        let grabbedBounds = grabbed.getBoundingClientRect();
        let parentBounds = grabbed.parentNode.getBoundingClientRect();
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
            reorder(ev.clientY);
        }
    }

    function reorder(mouseY) {
        if (prev) {
            let bounds = prev.getBoundingClientRect();
            if (prev && mouseY < bounds.y + bounds.height / 2) {
                let temp = prev;
                prev = prev.previousElementSibling;
                next = temp;
                next.before(grabbed);
                to--;

                return reorder(mouseY);
            }
        }
        if (next) {
            let bounds = next.getBoundingClientRect()
            // extra check for next sibling because 
            // the ghost element isn't really part of the list
            if (next && next.nextElementSibling && mouseY > bounds.y + bounds.height / 2) {
                let temp = next;
                next = next.nextElementSibling;
                prev = temp;
                prev.after(grabbed);
                to++;

                return reorder(mouseY);
            }
        }
    }

    function drop(ev) {
        if (grabbed) {
            grabbed.classList.remove("grabbed");
            grabbed = null;
            next = null;
            ghost.classList.add("hidden");
            let temp;
            console.log("from: " + from + " to: " + to);
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

    function updateGhostPos(mouseX, mouseY) {
        ghost.style.top = mouseY - offsetY + "px";
        ghost.style.left = mouseX - offsetX + "px";
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
    {#each data as datum (datum)}
        <div 
            class="item"
            on:mousedown={function(ev) { grab(ev, this); }}>
            <p>{datum}</p>
        </div>
    {/each}
    <div 
        class="item hidden" 
        id="ghost"></div>
</div>