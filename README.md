# Svelte-DragDropList

Sortable list with Svelte.

### Why this component?

* Bidirectional binding - data order updates as soon as the user drags a list item into a new position, even before it is dropped.  This means that animations fire immediately too.
* Touch support (doesn't use the HTML5 drag and drop API)


### Usage

Import the `DragDrop` component from `DragDrop.svelte`.

The simplest way to use the component is to pass it an array of unique strings.  The array will be updated as the user rearranges its items.
```js
<script>
    import DragDrop from "./DragDrop.svelte";

    data = ["Adams", "Boston", "Chicago", "Denver"];
</script>

<DragDrop {data}/>
```

If you aren't sure that your strings will be unique, you should instead pass an array of objects, each with a unique ID:

```js
data = [{"id": 0, "text": "Boston"}, 
        {"id": 1, "text": "Boston"}, 
        {"id": 2, "text": "Chicago", 
        {"id": 3, "text": "Denver"}];
```

You can also include an "html" attribute instead of "text".  It's up to you to make sure the html is clean.  
  If you want, you can even use both in one list.
```js
data = [{"id": 0, "text": "Adams"}, 
        {"id": 1, "text": "Boston"}, 
        {"id": 2, "html": "<p style="color: blue;">Chicago</p>", 
        {"id": 3, "html": "<p style="color: red;">Denver</p>"}];
```

### In Progress:

* Occasional bug where item movement doesn't register
* Additional animations on drop