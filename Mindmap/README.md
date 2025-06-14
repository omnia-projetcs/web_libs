# Mindmap JS Library

A JavaScript library for creating and managing interactive mind maps.

## Current Features (v0.2.0 - Styling Update)

*   **Node Management:**
    *   Create a central topic: `mindmap.addCentralTopic({ text: 'My Topic', style: {...} })`
    *   Create child nodes: `mindmap.createNode(parentNodeId, { text: 'Child Idea', style: {...} })\`
    *   Get node data: `mindmap.getNodeById(nodeId)`
    *   Update node text and style: `mindmap.updateNode(nodeId, { text: 'New Text', style: {...} })` (text also via double-click)
    *   Remove nodes (and their children recursively): `mindmap.removeNode(nodeId)`
*   **Node Styling (via `style` object on nodes):**
    *   `backgroundColor`: Background color (e.g., `'#RRGGBB'`, `'white'`). Default: `'#f8f9fa'`.
    *   `textColor`: Text color. Default: `'#212529'`.
    *   `borderColor`: Border color. Default: `'#ced4da'`.
    *   `borderWidth`: Border width (e.g., `'2px'`, `2`). Default: `'2px'`.
    *   `borderStyle`: Border style (e.g., `'solid'`, `'dashed'`). Default: `'solid'`.
    *   `fontSize`: Font size (e.g., `'1.2em'`, `'16px'`). Default: `'1em'`.
    *   `fontWeight`: Font weight (e.g., `'bold'`, `'normal'`). Default: `'normal'`.
    *   `fontFamily`: Font family (e.g., `'Arial, sans-serif'`). Default: `'sans-serif'`.
    *   `borderRadius`: Border radius for rounded corners (e.g., `'10px'`, `10`). Default: `'6px'`.
    *   `padding`: Padding inside the node (e.g., `'10px 15px'`). Default: `'12px 18px'`.
*   **Connector Styling (via `options` in `Mindmap` constructor):**
    *   `connectorColor`: Color of the connector lines. Default: `'black'`.
    *   `connectorWidth`: Width/thickness of connector lines in pixels. Default: `1`.
*   **Basic Rendering:**
    *   Nodes are rendered as styled divs.
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
        // Example: Initialize with custom connector styles
        const mindmap = new Mindmap('myMindmapContainer', {
            connectorColor: 'gray',
            connectorWidth: 2
        });

        // Add a central topic with custom style
        const central = mindmap.addCentralTopic({
            text: 'Main Idea (Styled)',
            style: {
                backgroundColor: '#007bff',
                textColor: 'white',
                borderColor: '#0056b3',
                borderWidth: '3px', // or just 3
                borderRadius: '10px', // or just 10
                fontSize: '1.2em',
                padding: '15px 20px',
                fontWeight: 'bold'
            }
        });

        // Add child nodes with different styles
        if (central) {
            const child1Style = {
                backgroundColor: '#28a745',
                textColor: 'white',
                borderRadius: '50px',
                borderColor: 'darkgreen',
                fontFamily: 'Courier New, monospace'
            };
            const child1 = mindmap.createNode(central.id, { text: 'Concept 1 (Green & Rounded)', style: child1Style });

            const child2Style = {
                backgroundColor: '#ffc107',
                textColor: '#333',
                borderColor: '#e0a800',
                borderStyle: 'dashed',
                borderWidth: '2px'
            };
            const child2 = mindmap.createNode(central.id, { text: 'Concept 2 (Yellow & Dashed)', style: child2Style });

            if (child1) {
                mindmap.createNode(child1.id, { text: 'Sub-Concept 1.1 (Default Style)' });
            }
        }

        // Example of updating a node's style programmatically:
        // setTimeout(() => {
        //   if (child1) {
        //     mindmap.updateNode(child1.id, {
        //       style: { backgroundColor: '#dc3545', textColor: 'white', borderColor: 'darkred' }
        //     });
        //   }
        // }, 5000);

        // Example of removing a node:
        // setTimeout(() => {
        //   if (child2) mindmap.removeNode(child2.id);
        // }, 7000);
    });
    ```

## How to Use `index.html` Demo

*   Open `Mindmap/index.html` in your browser.
*   The demo page starts with an empty mind map.
*   Use the controls provided to:
    *   Set node text and various style properties (background color, text color, border color, border radius) before adding a new node.
    *   Add a central topic or child nodes.
    *   Select a node to see its current style properties reflected in the input fields.
    *   Update the style of the selected node.
    *   Set connector color and width, then click "Re-initialize Map with New Connector Styles" to clear the map and apply these styles to new connectors (for existing connectors to change, the map would need a full redraw or re-add nodes).
*   **Double-click** on any node to edit its text directly.

## Future Development

This is a basic version. Future enhancements will include:
*   More advanced connector styling (e.g., dashed, dotted lines directly via options).
*   More shapes for nodes.
*   Drag-and-drop node manipulation.
*   Zoom and pan functionality.
*   Import/Export features (e.g., JSON).
*   And much more from the initial specification!
