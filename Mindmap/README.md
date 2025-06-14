# Mindmap JS Library

A JavaScript library for creating and managing interactive mind maps.

## Current Features (v0.1.0 - Initial Release)

*   **Node Management:**
    *   Create a central topic: `mindmap.addCentralTopic({ text: 'My Topic' })`
    *   Create child nodes: `mindmap.createNode(parentNodeId, { text: 'Child Idea' })`
    *   Get node data: `mindmap.getNodeById(nodeId)`
    *   Update node text: `mindmap.updateNode(nodeId, { text: 'New Text' })` (also via double-click on a node)
    *   Remove nodes (and their children recursively): `mindmap.removeNode(nodeId)`
*   **Basic Rendering:**
    *   Nodes are rendered as simple divs.
    *   Connectors (straight lines) are drawn between parent and child nodes.

## Setup

1.  Include `mindmap.css` in the `<head>` of your HTML file:
    ```html
    <link rel="stylesheet" href="mindmap.css">
    ```
2.  Include `mindmap.js` at the end of your `<body>`:
    ```html
    <script src="mindmap.js"></script>
    ```
3.  Create a container element in your HTML where the mind map will be rendered:
    ```html
    <div id="myMindmapContainer" style="width: 800px; height: 600px; border: 1px solid #ccc; position: relative;"></div>
    ```
4.  Initialize the library in a script:
    ```javascript
    document.addEventListener('DOMContentLoaded', () => {
        const mindmap = new Mindmap('myMindmapContainer'); // Use the ID of your container

        // Add a central topic
        const central = mindmap.addCentralTopic({ text: 'Main Idea' });

        // Add child nodes
        if (central) {
            const child1 = mindmap.createNode(central.id, { text: 'Concept 1' });
            const child2 = mindmap.createNode(central.id, { text: 'Concept 2 (Dbl-Click Me!)' });

            if (child1) {
                mindmap.createNode(child1.id, { text: 'Sub-Concept 1.1' });
            }
            if (child2) {
                const child2_1 = mindmap.createNode(child2.id, { text: 'Sub-Concept 2.1' });
                if (child2_1) {
                     mindmap.createNode(child2_1.id, { text: 'Sub-Sub-Concept 2.1.1 (Dbl-Click Me!)' });
                }
            }
            mindmap.createNode(central.id, { text: 'Concept 3' });
        }

        // Example of using other functions:
        // To remove a node (e.g., child2 and its children):
        // setTimeout(() => {
        // if (child2) mindmap.removeNode(child2.id);
        // }, 5000);

        // To update a node programmatically:
        // setTimeout(() => {
        // if (child1) mindmap.updateNode(child1.id, { text: 'Updated Concept 1' });
        // }, 3000);
    });
    ```

## How to Use `index.html` Demo

*   Open `Mindmap/index.html` in your browser.
*   A sample mind map will be created.
*   **Double-click** on any node to edit its text.
*   The demo script in `mindmap.js` currently removes some nodes automatically after a few seconds to demonstrate the `removeNode` functionality. You can comment this out in `mindmap.js` if you want to interact with the map longer.

## Future Development

This is a very basic version. Future enhancements will include:
*   Advanced styling for nodes and connectors.
*   Drag-and-drop node manipulation.
*   Zoom and pan.
*   Import/Export features.
*   And much more from the initial specification!
