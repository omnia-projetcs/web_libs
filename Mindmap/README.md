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
    *   **Horizontal Child Node Layout**: Child nodes are now primarily arranged in a horizontal row relative to their parent, controlled by JavaScript. This is a foundational step towards more dynamic and organized mindmap structures.
    *   **Draggable Nodes with Global Collision Avoidance**: Nodes can be manually repositioned by clicking and dragging. When a node is dropped, the application now attempts to find a clear spot by checking for overlaps with **all other nodes** on the mindmap and subtly adjusting the final position if needed. Custom positions are saved (as global coordinates relative to the main canvas) and restored.
    *   **Algorithmic Vertical Stacking of Main Branches**: To improve initial clarity, direct child branches of the root node are now automatically stacked vertically. This layout respects previously dragged positions of these main branches and uses estimates for vertical spacing.
*   **Data Persistence & Portability**:
    *   **Local Storage**: Your mindmap is automatically saved to your browser's local storage as you make changes. It will be reloaded when you revisit the page.
    *   **Clear Local Data**: Option to clear the mindmap data stored in your browser.
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

*   **Overall Layout Sophistication**:
    *   While direct child branches of the root are now algorithmically stacked vertically, this stacking uses an *estimated* height for spacing, so branches with exceptionally large content or many levels of children might still appear too close or too far from their vertical siblings.
    *   The horizontal layout of children within each branch is basic and does not wrap; very wide branches can still cause horizontal overflow or overlap with other elements if not managed manually.
    *   Collision avoidance for manually dragged nodes (global check with a local 'nudge') and for algorithmically placed siblings (local horizontal 'nudge') are basic. They may not always find an optimal non-overlapping position in very crowded scenarios.
    *   The system does not yet perform a full, dynamic reflow of the entire map when nodes are added, deleted, or significantly repositioned (like in advanced tools such as MindMeister). Preventing all potential overlaps in complex, dense maps remains an area for ongoing improvement.
*   **Node Dimension Calculation with Asynchronous Content**: The application calculates node sizes for layout and collision detection when nodes are first rendered. If a node contains content that loads asynchronously (e.g., images from URLs, or complex charts that take time to render), its dimensions might be calculated based on the placeholder size before the content fully loads and expands the node. This can occasionally lead to suboptimal layouts or temporary visual overlaps until the content appears. A future enhancement could involve re-calculating layout after asynchronous content has loaded.
