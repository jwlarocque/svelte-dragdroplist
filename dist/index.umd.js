(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Dragdroplist = {}));
})(this, (function (exports) { 'use strict';

    function noop() { }
    const identity = x => x;
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function append_styles(target, style_sheet_id, styles) {
        const append_styles_to = get_root_for_style(target);
        if (!append_styles_to.getElementById(style_sheet_id)) {
            const style = element('style');
            style.id = style_sheet_id;
            style.textContent = styles;
            append_stylesheet(append_styles_to, style);
        }
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
        return style.sheet;
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }
    class HtmlTag {
        constructor(is_svg = false) {
            this.is_svg = false;
            this.is_svg = is_svg;
            this.e = this.n = null;
        }
        c(html) {
            this.h(html);
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                if (this.is_svg)
                    this.e = svg_element(target.nodeName);
                else
                    this.e = element(target.nodeName);
                this.t = target;
                this.c(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { ownerNode } = info.stylesheet;
                // there is no ownerNode if it runs on jsdom.
                if (ownerNode)
                    detach(ownerNode);
            });
            managed_styles.clear();
        });
    }

    function create_animation(node, from, fn, params) {
        if (!from)
            return noop;
        const to = node.getBoundingClientRect();
        if (from.left === to.left && from.right === to.right && from.top === to.top && from.bottom === to.bottom)
            return noop;
        const { delay = 0, duration = 300, easing = identity, 
        // @ts-ignore todo: should this be separated from destructuring? Or start/end added to public api and documentation?
        start: start_time = now() + delay, 
        // @ts-ignore todo:
        end = start_time + duration, tick = noop, css } = fn(node, { from, to }, params);
        let running = true;
        let started = false;
        let name;
        function start() {
            if (css) {
                name = create_rule(node, 0, 1, duration, delay, easing, css);
            }
            if (!delay) {
                started = true;
            }
        }
        function stop() {
            if (css)
                delete_rule(node, name);
            running = false;
        }
        loop(now => {
            if (!started && now >= start_time) {
                started = true;
            }
            if (started && now >= end) {
                tick(1, 0);
                stop();
            }
            if (!running) {
                return false;
            }
            if (started) {
                const p = now - start_time;
                const t = 0 + 1 * easing(p / duration);
                tick(t, 1 - t);
            }
            return true;
        });
        start();
        tick(0, 1);
        return stop;
    }
    function fix_position(node) {
        const style = getComputedStyle(node);
        if (style.position !== 'absolute' && style.position !== 'fixed') {
            const { width, height } = style;
            const a = node.getBoundingClientRect();
            node.style.position = 'absolute';
            node.style.width = width;
            node.style.height = height;
            add_transform(node, a);
        }
    }
    function add_transform(node, a) {
        const b = node.getBoundingClientRect();
        if (a.left !== b.left || a.top !== b.top) {
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            node.style.transform = `${transform} translate(${a.left - b.left}px, ${a.top - b.top}px)`;
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function fix_and_destroy_block(block, lookup) {
        block.f();
        destroy_block(block, lookup);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function flip(node, { from, to }, params = {}) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;
        const [ox, oy] = style.transformOrigin.split(' ').map(parseFloat);
        const dx = (from.left + from.width * ox / to.width) - (to.left + ox);
        const dy = (from.top + from.height * oy / to.height) - (to.top + oy);
        const { delay = 0, duration = (d) => Math.sqrt(d) * 120, easing = cubicOut } = params;
        return {
            delay,
            duration: is_function(duration) ? duration(Math.sqrt(dx * dx + dy * dy)) : duration,
            easing,
            css: (t, u) => {
                const x = u * dx;
                const y = u * dy;
                const sx = t + u * from.width / to.width;
                const sy = t + u * from.height / to.height;
                return `transform: ${transform} translate(${x}px, ${y}px) scale(${sx}, ${sy});`;
            }
        };
    }

    /* src/DragDropList.svelte generated by Svelte v3.53.1 */

    function add_css(target) {
    	append_styles(target, "svelte-2znflc", "main.svelte-2znflc.svelte-2znflc{position:relative}.list.svelte-2znflc.svelte-2znflc{cursor:grab;z-index:5;display:flex;flex-direction:column}.item.svelte-2znflc.svelte-2znflc{box-sizing:border-box;display:inline-flex;width:100%;min-height:3em;margin-bottom:0.5em;background-color:white;border:1px solid rgb(190, 190, 190);border-radius:2px;user-select:none}.item.item-active.svelte-2znflc.svelte-2znflc{background-color:#787878;color:#ffffff}.item.item-active.svelte-2znflc svg.svelte-2znflc{fill:#ffffff}.item.svelte-2znflc.svelte-2znflc:last-child{margin-bottom:0}.item.svelte-2znflc.svelte-2znflc:not(#grabbed):not(#ghost){z-index:10}.item.svelte-2znflc>.svelte-2znflc{margin:auto}.buttons.svelte-2znflc.svelte-2znflc{width:32px;min-width:32px;margin:auto 0;display:flex;flex-direction:column}.buttons.svelte-2znflc button.svelte-2znflc{cursor:pointer;width:18px;height:18px;margin:0 auto;padding:0;border:1px solid rgba(0, 0, 0, 0);background-color:inherit}.buttons.svelte-2znflc button.svelte-2znflc:focus{border:1px solid black}.delete.svelte-2znflc.svelte-2znflc{width:32px}#grabbed.svelte-2znflc.svelte-2znflc{opacity:0}#ghost.svelte-2znflc.svelte-2znflc{pointer-events:none;z-index:-5;position:absolute;top:0;left:0;opacity:0}#ghost.svelte-2znflc .svelte-2znflc{pointer-events:none}#ghost.haunting.svelte-2znflc.svelte-2znflc{z-index:20;opacity:1}");
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	child_ctx[32] = i;
    	return child_ctx;
    }

    // (175:10) {:else}
    function create_else_block(ctx) {
    	let p;
    	let t_value = /*datum*/ ctx[30] + "";
    	let t;

    	return {
    		c() {
    			p = element("p");
    			t = text(t_value);
    		},
    		m(target, anchor) {
    			insert(target, p, anchor);
    			append(p, t);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*data*/ 1 && t_value !== (t_value = /*datum*/ ctx[30] + "")) set_data(t, t_value);
    		},
    		d(detaching) {
    			if (detaching) detach(p);
    		}
    	};
    }

    // (173:31) 
    function create_if_block_2(ctx) {
    	let p;
    	let t_value = /*datum*/ ctx[30].text + "";
    	let t;

    	return {
    		c() {
    			p = element("p");
    			t = text(t_value);
    		},
    		m(target, anchor) {
    			insert(target, p, anchor);
    			append(p, t);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*data*/ 1 && t_value !== (t_value = /*datum*/ ctx[30].text + "")) set_data(t, t_value);
    		},
    		d(detaching) {
    			if (detaching) detach(p);
    		}
    	};
    }

    // (171:10) {#if datum.html}
    function create_if_block_1(ctx) {
    	let html_tag;
    	let raw_value = /*datum*/ ctx[30].html + "";
    	let html_anchor;

    	return {
    		c() {
    			html_tag = new HtmlTag(false);
    			html_anchor = empty();
    			html_tag.a = html_anchor;
    		},
    		m(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert(target, html_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*data*/ 1 && raw_value !== (raw_value = /*datum*/ ctx[30].html + "")) html_tag.p(raw_value);
    		},
    		d(detaching) {
    			if (detaching) detach(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};
    }

    // (181:10) {#if removesItems}
    function create_if_block(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[19](/*i*/ ctx[32], ...args);
    	}

    	return {
    		c() {
    			button = element("button");
    			button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16" class="svelte-2znflc"><path d="M0 0h24v24H0z" fill="none"></path><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>`;
    			attr(button, "class", "svelte-2znflc");
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);

    			if (!mounted) {
    				dispose = listen(button, "click", click_handler_2);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d(detaching) {
    			if (detaching) detach(button);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (101:4) {#each data as datum, i (datum.id ? datum.id : JSON.stringify(datum))}
    function create_each_block(key_1, ctx) {
    	let div3;
    	let div0;
    	let button0;
    	let svg0;
    	let path0;
    	let path1;
    	let button0_style_value;
    	let t0;
    	let button1;
    	let svg1;
    	let path2;
    	let path3;
    	let button1_style_value;
    	let t1;
    	let div1;
    	let t2;
    	let div2;
    	let t3;
    	let div3_id_value;
    	let div3_class_value;
    	let div3_data_index_value;
    	let div3_data_id_value;
    	let rect;
    	let stop_animation = noop;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[17](/*i*/ ctx[32], ...args);
    	}

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[18](/*i*/ ctx[32], ...args);
    	}

    	function select_block_type(ctx, dirty) {
    		if (/*datum*/ ctx[30].html) return create_if_block_1;
    		if (/*datum*/ ctx[30].text) return create_if_block_2;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*removesItems*/ ctx[1] && create_if_block(ctx);

    	function dblclick_handler(...args) {
    		return /*dblclick_handler*/ ctx[24](/*datum*/ ctx[30], ...args);
    	}

    	return {
    		key: key_1,
    		first: null,
    		c() {
    			div3 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			t0 = space();
    			button1 = element("button");
    			svg1 = svg_element("svg");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			t1 = space();
    			div1 = element("div");
    			if_block0.c();
    			t2 = space();
    			div2 = element("div");
    			if (if_block1) if_block1.c();
    			t3 = space();
    			attr(path0, "d", "M0 0h24v24H0V0z");
    			attr(path0, "fill", "none");
    			attr(path1, "d", "M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z");
    			attr(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg0, "viewBox", "0 0 24 24");
    			attr(svg0, "width", "16px");
    			attr(svg0, "height", "16px");
    			attr(svg0, "class", "svelte-2znflc");
    			attr(button0, "class", "up svelte-2znflc");
    			attr(button0, "style", button0_style_value = "visibility: " + (/*i*/ ctx[32] > 0 ? "" : "hidden") + ";");
    			attr(path2, "d", "M0 0h24v24H0V0z");
    			attr(path2, "fill", "none");
    			attr(path3, "d", "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z");
    			attr(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg1, "viewBox", "0 0 24 24");
    			attr(svg1, "width", "16px");
    			attr(svg1, "height", "16px");
    			attr(svg1, "class", "svelte-2znflc");
    			attr(button1, "class", "down svelte-2znflc");

    			attr(button1, "style", button1_style_value = "visibility: " + (/*i*/ ctx[32] < /*data*/ ctx[0].length - 1
    			? ""
    			: "hidden") + ";");

    			attr(div0, "class", "buttons svelte-2znflc");
    			attr(div1, "class", "content svelte-2znflc");
    			attr(div2, "class", "buttons delete svelte-2znflc");

    			attr(div3, "id", div3_id_value = /*grabbed*/ ctx[5] && (/*datum*/ ctx[30].id
    			? /*datum*/ ctx[30].id
    			: JSON.stringify(/*datum*/ ctx[30])) == /*grabbed*/ ctx[5].dataset.id
    			? "grabbed"
    			: "");

    			attr(div3, "class", div3_class_value = "item " + (/*activeItemIndex*/ ctx[3] === /*i*/ ctx[32]
    			? 'item-active'
    			: '') + " svelte-2znflc");

    			attr(div3, "data-index", div3_data_index_value = /*i*/ ctx[32]);

    			attr(div3, "data-id", div3_data_id_value = /*datum*/ ctx[30].id
    			? /*datum*/ ctx[30].id
    			: JSON.stringify(/*datum*/ ctx[30]));

    			attr(div3, "data-graby", "0");
    			this.first = div3;
    		},
    		m(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, div0);
    			append(div0, button0);
    			append(button0, svg0);
    			append(svg0, path0);
    			append(svg0, path1);
    			append(div0, t0);
    			append(div0, button1);
    			append(button1, svg1);
    			append(svg1, path2);
    			append(svg1, path3);
    			append(div3, t1);
    			append(div3, div1);
    			if_block0.m(div1, null);
    			append(div3, t2);
    			append(div3, div2);
    			if (if_block1) if_block1.m(div2, null);
    			append(div3, t3);

    			if (!mounted) {
    				dispose = [
    					listen(button0, "click", click_handler),
    					listen(button1, "click", click_handler_1),
    					listen(div3, "mousedown", /*mousedown_handler*/ ctx[20]),
    					listen(div3, "touchstart", /*touchstart_handler*/ ctx[21]),
    					listen(div3, "mouseenter", /*mouseenter_handler*/ ctx[22]),
    					listen(div3, "touchmove", /*touchmove_handler*/ ctx[23]),
    					listen(div3, "dblclick", dblclick_handler)
    				];

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*data*/ 1 && button0_style_value !== (button0_style_value = "visibility: " + (/*i*/ ctx[32] > 0 ? "" : "hidden") + ";")) {
    				attr(button0, "style", button0_style_value);
    			}

    			if (dirty[0] & /*data*/ 1 && button1_style_value !== (button1_style_value = "visibility: " + (/*i*/ ctx[32] < /*data*/ ctx[0].length - 1
    			? ""
    			: "hidden") + ";")) {
    				attr(button1, "style", button1_style_value);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div1, null);
    				}
    			}

    			if (/*removesItems*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(div2, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty[0] & /*grabbed, data*/ 33 && div3_id_value !== (div3_id_value = /*grabbed*/ ctx[5] && (/*datum*/ ctx[30].id
    			? /*datum*/ ctx[30].id
    			: JSON.stringify(/*datum*/ ctx[30])) == /*grabbed*/ ctx[5].dataset.id
    			? "grabbed"
    			: "")) {
    				attr(div3, "id", div3_id_value);
    			}

    			if (dirty[0] & /*activeItemIndex, data*/ 9 && div3_class_value !== (div3_class_value = "item " + (/*activeItemIndex*/ ctx[3] === /*i*/ ctx[32]
    			? 'item-active'
    			: '') + " svelte-2znflc")) {
    				attr(div3, "class", div3_class_value);
    			}

    			if (dirty[0] & /*data*/ 1 && div3_data_index_value !== (div3_data_index_value = /*i*/ ctx[32])) {
    				attr(div3, "data-index", div3_data_index_value);
    			}

    			if (dirty[0] & /*data*/ 1 && div3_data_id_value !== (div3_data_id_value = /*datum*/ ctx[30].id
    			? /*datum*/ ctx[30].id
    			: JSON.stringify(/*datum*/ ctx[30]))) {
    				attr(div3, "data-id", div3_data_id_value);
    			}
    		},
    		r() {
    			rect = div3.getBoundingClientRect();
    		},
    		f() {
    			fix_position(div3);
    			stop_animation();
    		},
    		a() {
    			stop_animation();
    			stop_animation = create_animation(div3, rect, flip, { duration: 200, delay: 0, easing: func });
    		},
    		d(detaching) {
    			if (detaching) detach(div3);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function create_fragment(ctx) {
    	let main;
    	let div0;
    	let p;
    	let div0_class_value;
    	let div0_style_value;
    	let t;
    	let div1;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let mounted;
    	let dispose;
    	let each_value = /*data*/ ctx[0];

    	const get_key = ctx => /*datum*/ ctx[30].id
    	? /*datum*/ ctx[30].id
    	: JSON.stringify(/*datum*/ ctx[30]);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	return {
    		c() {
    			main = element("main");
    			div0 = element("div");
    			p = element("p");
    			t = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(p, "class", "svelte-2znflc");
    			attr(div0, "id", "ghost");
    			attr(div0, "class", div0_class_value = "" + (null_to_empty(/*grabbed*/ ctx[5] ? "item haunting" : "item") + " svelte-2znflc"));
    			attr(div0, "style", div0_style_value = "top: " + (/*mouseY*/ ctx[6] + /*offsetY*/ ctx[7] - /*layerY*/ ctx[8]) + "px");
    			attr(div1, "class", "list svelte-2znflc");
    			attr(main, "class", "dragdroplist svelte-2znflc");
    		},
    		m(target, anchor) {
    			insert(target, main, anchor);
    			append(main, div0);
    			append(div0, p);
    			/*div0_binding*/ ctx[16](div0);
    			append(main, t);
    			append(main, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen(div1, "mousemove", /*mousemove_handler*/ ctx[25]),
    					listen(div1, "touchmove", /*touchmove_handler_1*/ ctx[26]),
    					listen(div1, "mouseup", /*mouseup_handler*/ ctx[27]),
    					listen(div1, "touchend", /*touchend_handler*/ ctx[28])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*grabbed*/ 32 && div0_class_value !== (div0_class_value = "" + (null_to_empty(/*grabbed*/ ctx[5] ? "item haunting" : "item") + " svelte-2znflc"))) {
    				attr(div0, "class", div0_class_value);
    			}

    			if (dirty[0] & /*mouseY, offsetY, layerY*/ 448 && div0_style_value !== (div0_style_value = "top: " + (/*mouseY*/ ctx[6] + /*offsetY*/ ctx[7] - /*layerY*/ ctx[8]) + "px")) {
    				attr(div0, "style", div0_style_value);
    			}

    			if (dirty[0] & /*grabbed, data, activeItemIndex, grab, dragEnter, touchEnter, itemDblClick, removeDatum, removesItems, moveDatum*/ 47663) {
    				each_value = /*data*/ ctx[0];
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div1, fix_and_destroy_block, create_each_block, null, get_each_context);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(main);
    			/*div0_binding*/ ctx[16](null);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    const func = () => 0;

    function instance($$self, $$props, $$invalidate) {
    	let { data = [] } = $$props;
    	let { removesItems = false } = $$props;
    	let { itemDblClick } = $$props;
    	let { activeItemIndex = null } = $$props;
    	let ghost;
    	let grabbed;
    	let lastTarget;
    	let mouseY = 0; // pointer y coordinate within client
    	let offsetY = 0; // y distance from top of grabbed element to pointer
    	let layerY = 0; // distance from top of list to top of client

    	function grab(clientY, element) {
    		// modify grabbed element
    		$$invalidate(5, grabbed = element);

    		$$invalidate(5, grabbed.dataset.grabY = clientY, grabbed);

    		// modify ghost element (which is actually dragged)
    		$$invalidate(4, ghost.innerHTML = grabbed.innerHTML, ghost);

    		// record offset from cursor to top of element
    		// (used for positioning ghost)
    		$$invalidate(7, offsetY = grabbed.getBoundingClientRect().y - clientY);

    		drag(clientY);
    	}

    	// drag handler updates cursor position
    	function drag(clientY) {
    		if (grabbed) {
    			$$invalidate(6, mouseY = clientY);
    			$$invalidate(8, layerY = ghost.parentNode.getBoundingClientRect().y);
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
    		// swap items in data
    		if (grabbed && target != grabbed && target.classList.contains("item")) {
    			moveDatum(parseInt(grabbed.dataset.index), parseInt(target.dataset.index));
    		}
    	}

    	// does the actual moving of items in data
    	function moveDatum(from, to) {
    		let temp = data[from];
    		$$invalidate(0, data = [...data.slice(0, from), ...data.slice(from + 1)]);
    		$$invalidate(0, data = [...data.slice(0, to), temp, ...data.slice(to)]);
    	}

    	function release(ev) {
    		$$invalidate(5, grabbed = null);
    	}

    	function removeDatum(index) {
    		$$invalidate(0, data = [...data.slice(0, index), ...data.slice(index + 1)]);
    	}

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			ghost = $$value;
    			$$invalidate(4, ghost);
    		});
    	}

    	const click_handler = function (i, ev) {
    		moveDatum(i, i - 1);
    	};

    	const click_handler_1 = function (i, ev) {
    		moveDatum(i, i + 1);
    	};

    	const click_handler_2 = function (i, ev) {
    		removeDatum(i);
    	};

    	const mousedown_handler = function (ev) {
    		grab(ev.clientY, this);
    	};

    	const touchstart_handler = function (ev) {
    		grab(ev.touches[0].clientY, this);
    	};

    	const mouseenter_handler = function (ev) {
    		ev.stopPropagation();
    		dragEnter(ev, ev.target);
    	};

    	const touchmove_handler = function (ev) {
    		ev.stopPropagation();
    		ev.preventDefault();
    		touchEnter(ev.touches[0]);
    	};

    	const dblclick_handler = function (datum, ev) {
    		ev.stopPropagation();
    		ev.preventDefault();
    		itemDblClick(datum);
    	};

    	const mousemove_handler = function (ev) {
    		ev.stopPropagation();
    		drag(ev.clientY);
    	};

    	const touchmove_handler_1 = function (ev) {
    		ev.stopPropagation();
    		drag(ev.touches[0].clientY);
    	};

    	const mouseup_handler = function (ev) {
    		ev.stopPropagation();
    		release();
    	};

    	const touchend_handler = function (ev) {
    		ev.stopPropagation();
    		release(ev.touches[0]);
    	};

    	$$self.$$set = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('removesItems' in $$props) $$invalidate(1, removesItems = $$props.removesItems);
    		if ('itemDblClick' in $$props) $$invalidate(2, itemDblClick = $$props.itemDblClick);
    		if ('activeItemIndex' in $$props) $$invalidate(3, activeItemIndex = $$props.activeItemIndex);
    	};

    	return [
    		data,
    		removesItems,
    		itemDblClick,
    		activeItemIndex,
    		ghost,
    		grabbed,
    		mouseY,
    		offsetY,
    		layerY,
    		grab,
    		drag,
    		touchEnter,
    		dragEnter,
    		moveDatum,
    		release,
    		removeDatum,
    		div0_binding,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		mousedown_handler,
    		touchstart_handler,
    		mouseenter_handler,
    		touchmove_handler,
    		dblclick_handler,
    		mousemove_handler,
    		touchmove_handler_1,
    		mouseup_handler,
    		touchend_handler
    	];
    }

    class DragDropList extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(
    			this,
    			options,
    			instance,
    			create_fragment,
    			safe_not_equal,
    			{
    				data: 0,
    				removesItems: 1,
    				itemDblClick: 2,
    				activeItemIndex: 3
    			},
    			add_css,
    			[-1, -1]
    		);
    	}
    }

    exports.DragDropList = DragDropList;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.umd.js.map
