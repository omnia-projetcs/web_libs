# Interactive Mindmap Application

## Description

This is a web-based interactive mindmap application that allows users to create, visualize, and manage hierarchical ideas and information. Users can build mindmaps directly in their browser, add rich content to nodes, and save their work.

## Features

*   **Node Management**:
    *   Add nodes to the mindmap structure (currently, new nodes are added to the root).
    *   Edit node text by double-clicking.
    *   Delete nodes (with confirmation, especially if they have children).
*   **Rich Content in Nodes**:
    *   **Notes**: Add detailed text notes to any node.
    *   **Tables**: Embed simple tables within nodes.
    *   **Images**: Include images by providing a URL.
    *   **Charts**: Display charts (bar, line, pie) using data entered by the user. Powered by `PureChart.js`.
*   **Interactive Navigation**:
    *   **Collapsible Branches**: Click the `[+]` or `[-]` toggle next to a node's text to expand or collapse its child branches, making it easier to navigate large mindmaps.
    *   **Curved Connection Lines**: Visual lines (curved Bézier paths) are now drawn between parent and child nodes, making the mindmap structure clearer and more aesthetically pleasing.
    *   **Improved Node Spacing**: Default spacing between nodes and branches has been enhanced to reduce clutter and minimize visual overlaps.
    *   **Draggable Nodes with Global Collision Avoidance**: Nodes can be manually repositioned by clicking and dragging. When a node is dropped, the application now attempts to find a clear spot by checking for overlaps with **all other nodes** on the mindmap and subtly adjusting the final position if needed. Custom positions are saved (as global coordinates relative to the main canvas) and restored.
    *   **Hierarchical Tree Layout Algorithm (Phase 1)**: For nodes not manually repositioned, the mindmap now utilizes a foundational tree layout algorithm to determine their initial placement. This algorithm aims to:
        *   Assign vertical positions (`y`-coordinates) based on the node's level in the hierarchy, ensuring clear separation between levels.
        *   Horizontally position children, typically centering them as a group beneath their parent node.
        *   Respect manually dragged positions: nodes moved by the user will maintain their position unless their ancestors are algorithmically repositioned.
        *   This approach provides a more organized, classic tree-like structure by default and significantly reduces initial node overlaps compared to previous layout methods. This algorithm's parameters (such as level and sibling separation) have been tuned to further improve default spacing and reduce common node overlap issues in typical map structures.
*   **Data Persistence & Portability**:
    *   **Local Storage**: Your mindmap is automatically saved to your browser's local storage as you make changes. It will be reloaded when you revisit the page.
    *   **New/Clear Map Button**: Allows users to quickly clear the entire current mindmap and start over with a fresh, single root node.
    *   **Clear Local Data**: Option to clear the mindmap data stored in your browser (this typically resets to a default sample or an empty state, distinct from "New/Clear Map" which always gives a single root).
    *   **JSON Export**: Download your current mindmap as a `.json` file. This is useful for backups or sharing.
    *   **JSON Import**: Load a mindmap from a previously exported `.json` file.
    *   **Consistent Global Node State**: The internal data for each node now reliably stores its global position (x,y) and dimensions (width,height) on the canvas after every render.
*   **Simulated Server Interaction**:
    *   Buttons for "Save to Server (Sim)" and "Load from Server (Sim)" demonstrate conceptual integration with a backend. Currently, these are simulations and do not connect to a real server.
*   **Visual Presentation**:
    *   **Improved Page Positioning**: The entire mindmap visualization has been shifted further down from the top controls bar, providing better visual balance on the page.

## Getting Started

1.  **Open the Application**:
    *   Clone or download this repository.
    *   Navigate to the `Mindmap/` directory.
    *   Open the `index.html` file in a modern web browser (e.g., Chrome, Firefox, Edge, Safari).

2.  **Basic Operations**:
    *   **Adding a Node**: Type text into the input field at the top and click "Add Node to Root".
    *   **Editing Text**: Double-click on any node's text to change it.
    *   **Node-Specific Actions**: Hover over a node to see buttons for:
        *   Adding/Editing Notes, Tables, Images, or Charts.
        *   Deleting the node (the 'X' button).
    *   **Expand/Collapse**: Click the `[+]` (expand) or `[-]` (collapse) button next to a node's name to show/hide its children.
    *   **Moving Nodes**: To change a node's position, click and hold the primary mouse button on it, then drag it to the desired location on the canvas and release.
    *   **Saving Locally**: Changes are saved to local storage automatically. The "Save Locally" button provides an explicit save action.
    *   **Import/Export**:
        *   Use the "Import from JSON File" file chooser to load a mindmap.
        *   Click "Download as JSON" to save your current mindmap to a file.

## Dependencies

*   **PureChart.js**: Used for rendering charts within mindmap nodes. It is assumed to be part of the `web_libs` and is included from a relative path (`../PureChart/PureChart.js`).

## File Structure

*   `index.html`: The main HTML file for the application.
*   `mindmap.js`: Contains all the JavaScript logic for mindmap functionality, interactions, and rendering.
*   `mindmap.css`: Provides the styles for the mindmap application.
*   `README.md`: This file - providing information about the project.
*   `tests/`: Contains files related to testing the mindmap (not detailed in this README).

## Known Limitations

- **Tree Layout Algorithm (Phase 1 Limitations)**:
    *   The current tree layout algorithm is a foundational implementation. While it improves structure and reduces many overlaps, it does not yet handle all complex scenarios perfectly.
    *   **Subtree Overlaps**: It may not prevent overlaps between distant subtrees in very dense or complex maps (e.g., the children of one main branch expanding significantly and overlapping with children of another main branch). True collision avoidance between all subtrees is an advanced feature for future development.
    *   **Balancing**: The algorithm performs basic centering of children but does not yet implement advanced tree balancing techniques if child subtrees have vastly different widths or depths.
    *   **Dynamic Reflow for Content Changes**: If a node's size changes dramatically *after* the initial layout (e.g., due to adding a very large image or table without triggering a full re-layout), the overall tree structure does not automatically reflow to accommodate this. A manual adjustment or a subsequent full layout (e.g., on next node add/delete) would be needed.
    *   The 'nudge' strategy for collision avoidance during manual node dragging remains basic and might not find an optimal position in highly congested areas.
*   **Node Dimension Calculation with Asynchronous Content**: The application calculates node sizes for layout and collision detection when nodes are first rendered. If a node contains content that loads asynchronously (e.g., images from URLs, or complex charts that take time to render), its dimensions might be calculated based on the placeholder size before the content fully loads and expands the node. This can occasionally lead to suboptimal layouts or temporary visual overlaps until the content appears. A future enhancement could involve re-calculating layout after asynchronous content has loaded.
