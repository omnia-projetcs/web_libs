# Panorama Dashboard Component

## Description

Panorama is a dynamic, grid-based dashboard component that allows users to create, customize, and manage interactive dashboards. It uses a custom grid system for layout management and supports various content types.

## Features

*   **Grid-Based Layout:** Items are arranged on a draggable and resizable grid.
*   **Multiple Item Types:** Supports a variety of content:
    *   **Text:** Plain text blocks.
    *   **Title:** Headings (H1-H6).
    *   **Image:** Display images from URLs.
    *   **Chart:** Integrates with `PureChart.js` to render various chart types.
    *   **Table:** Integrates with `dynamic-table.js` to display tabular data.
*   **Edit Functionality:** In-place editing for item content and configuration via a modal interface.
*   **Save and Load:** Dashboard configurations can be saved to and loaded from JSON strings, allowing for persistence and sharing of layouts.
*   **Responsive Design:** Adapts to different screen sizes.

## Dependencies

*   **PanoramaGrid.js:** For the core grid layout and item manipulation.
*   **PureChart.js:** For rendering chart items. (Assumed to be in `../PureChart/`)
*   **dynamic-table.js:** For rendering table items. (Assumed to be in `../Dynamic-table/`)

## How to Use

1.  **Include CSS Files:**
    ```html
    <link rel="stylesheet" href="../PureChart/PureChart.css" />
    <link rel="stylesheet" href="../Dynamic-table/dynamic-table.css" />
    <link rel="stylesheet" href="panorama.css" />
    <link rel="stylesheet" href="PanoramaGrid.css" />
    ```

2.  **Include JS Files:**
    ```html
    <script src="../PureChart/PureChart.js"></script>
    <script src="../Dynamic-table/dynamic-table.js"></script>
    <script src="PanoramaGrid.js"></script>
    <script src="panorama.js"></script>
    ```

3.  **HTML Structure:**
    Create a container for the Panorama grid within your main dashboard area:
    ```html
    <div id="your-main-dashboard-container">
      <div id="panorama-grid-container"></div> <!-- This ID is used by Panorama and PanoramaGrid -->
    </div>
    ```

4.  **Instantiate Panorama:**
    In your JavaScript, initialize the Panorama component by passing the ID of the grid container:
    ```javascript
    document.addEventListener('DOMContentLoaded', () => {
      const panorama = new Panorama('panorama-grid-container');
      // Now you can use the panorama instance to add items, load data, etc.
    });
    ```

## API

The `Panorama` class provides the following public methods for interacting with the dashboard:

*   `addItem(type: string, config: object, layout: object): number`
    *   Adds a new item to the dashboard.
    *   `type`: Item type (e.g., 'text', 'title', 'image', 'chart', 'table').
    *   `config`: Configuration object specific to the item type.
    *   `layout`: Grid layout object (e.g., `{ x: 0, y: 0, w: 4, h: 2 }`).
    *   Returns the ID of the newly created item.

*   `removeItem(itemId: number)`
    *   Removes an item from the dashboard by its ID.

*   `updateItemConfig(itemId: number, newConfig: object)`
    *   Updates the configuration of an existing item.

*   `updateItemLayout(itemId: number, newLayout: object, shouldRender: boolean = true)`
    *   Updates the layout of an existing item.
    *   `shouldRender`: If `false`, only the internal data is updated without re-rendering (useful for GridStack callbacks).

*   `saveDashboard(): string`
    *   Serializes the current dashboard state (items and internal counter) into a JSON string.

*   `loadDashboard(jsonData: string): boolean`
    *   Loads a dashboard state from a JSON string.
    *   Replaces the current dashboard with the loaded configuration.
    *   Returns `true` on successful load, `false` otherwise (e.g., due to parsing errors or invalid data).

## JSON Structure

The `saveDashboard()` method outputs, and `loadDashboard()` expects, a JSON string with the following structure:

```json
{
  "items": [
    {
      "id": 1,
      "type": "title",
      "config": {
        "text": "Main Dashboard Title",
        "level": 1
      },
      "layout": {
        "x": 0,
        "y": 0,
        "w": 12,
        "h": 1
      }
    },
    {
      "id": 2,
      "type": "text",
      "config": {
        "content": "This is a sample text widget."
      },
      "layout": {
        "x": 0,
        "y": 1,
        "w": 6,
        "h": 2
      }
    },
    {
      "id": 3,
      "type": "chart",
      "config": {
        "chartType": "bar",
        "chartData": [
          { "label": "Category A", "value": 150 },
          { "label": "Category B", "value": 200 }
        ],
        "chartOptions": {
          "title": "Sample Chart",
          "responsive": true,
          "height": "100%",
          "width": "100%"
        }
      },
      "layout": {
        "x": 6,
        "y": 1,
        "w": 6,
        "h": 4
      }
    }
    // ... more items
  ],
  "itemIdCounter": 3 
}
```
**Note:** `itemIdCounter` stores the last used ID to ensure new items get unique IDs. When loading, Panorama ensures the internal counter is at least the maximum ID found in the loaded items.

## Development

To work on the Panorama component:

1.  Ensure its dependencies (`PureChart` and `dynamic-table`) are available in the parent directory (e.g., `../PureChart`, `../Dynamic-table`).
2.  Modify `panorama.js` for core logic and `panorama.css` for styling.
3.  Use `demo.html` to test changes by adding items, saving/loading configurations, and interacting with the dashboard.
4.  The `demo.html` file provides controls for adding all supported item types and for testing the save/load functionality.
```
