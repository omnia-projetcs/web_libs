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
*   **Data Persistence & Portability**:
    *   **Local Storage**: Your mindmap is automatically saved to your browser's local storage as you make changes. It will be reloaded when you revisit the page.
    *   **Clear Local Data**: Option to clear the mindmap data stored in your browser.
    *   **JSON Export**: Download your current mindmap as a `.json` file. This is useful for backups or sharing.
    *   **JSON Import**: Load a mindmap from a previously exported `.json` file.
*   **Simulated Server Interaction**:
    *   Buttons for "Save to Server (Sim)" and "Load from Server (Sim)" demonstrate conceptual integration with a backend. Currently, these are simulations and do not connect to a real server.

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
