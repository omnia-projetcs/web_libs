# PureChart.js - A Simple Pure JavaScript Charting Library

**Version: 0.9.5** (Updated for new features)

PureChart.js is a lightweight, dependency-free JavaScript library for creating simple and interactive charts on web pages using the HTML5 Canvas API. It aims to provide essential chart types with a good range of customization options without the overhead of larger charting libraries. It now supports mixed chart types, clickable legends, calculated SMA lines, annotations, and more.

## Features

* **Pure JavaScript:** No external dependencies.
* **Canvas-based:** Renders charts using the HTML5 Canvas API.
* **Supported Chart Types:**
    * Bar charts (vertical, grouped)
    * Line charts (with optional area fill, curve tension, dashed lines)
    * Percentage Distribution bars (horizontal)
    * **Mixed Bar and Line charts** on a single canvas.
    * **Calculated Simple Moving Average (SMA) lines.**
* **Interactivity:**
    * **Clickable legend items** to toggle dataset visibility.
    * Interactive tooltips displaying information on hover.
* **Customization:**
    * Titles, legends, axes labels, and styling.
    * Colors (solid, arrays for series), fonts, and padding.
    * Customizable tooltips with a formatter function.
    * **Horizontal annotation lines** with labels.
    * Specific styling options for each chart type.
* **Data Loading:** Supports loading chart configurations from a JSON file.
*   **Theming:** Light and Dark mode support.

## Getting Started

### 1. Include Files

Include `PureChart.js` and optionally `PureChart.css` for demo page styling.

```html
<head>
    <link rel="stylesheet" href="PureChart.css">
    <script src="PureChart.js"></script>
</head>
```

### 2. Add a Canvas Element

```html
<canvas id="myCoolChart" width="600" height="350"></canvas>
```
**Note:** Set `width` and `height` directly on the canvas or in chart options, not via CSS, to avoid scaling issues.

## Usage

### Basic Instantiation

```javascript
document.addEventListener('DOMContentLoaded', () => {
    const chartConfig = {
        type: 'bar', // Default global chart type
        data: {
            // ... data ...
        },
        options: {
            // ... chart options ...
        }
    };
    const myChart = new PureChart('myCoolChart', chartConfig);
    if (!myChart.isValid) {
        console.error("Chart initialization failed.");
    }
});
```

## Configuration Object Structure

### `type` (String)

Default chart type if not specified per dataset.
* `'bar'`
* `'line'`
* `'percentageDistribution'`

### `data` (Object)

#### `data.labels` (Array of Strings)
Labels for the X-axis (for `bar` and `line` charts).

#### `data.datasets` (Array of Objects)
Each object represents a dataset to be plotted.

**Common Dataset Properties:**
* `label` (String): Name for the dataset (shows in legend/tooltip).
* `values` (Array of Numbers/Nulls): Data points. `null` values in line/SMA charts will create breaks.
* `backgroundColor` (String/Array): Fill color(s).
* `borderColor` (String/Array): Border color(s).
* `borderWidth` (Number): Border width for bars or lines.

**Dataset-Specific `type` Property:**
* `type` (String): Optional. Can be `'bar'`, `'line'`, or `'sma'`. Overrides the global chart `type` for this specific dataset, enabling mixed charts.

**Line-Specific Dataset Properties (for `type: 'line'` or `type: 'sma'`):**
* `tension` (Number): `0` for straight lines, `>0` for curves (e.g., `0.1` to `0.4`).
* `fill` (Boolean): `true` to fill area under the line.
* `pointRadius` (Number): Radius of data points. `0` to hide.
* `pointColor` (String): Color of points.
* `pointBorderColor` (String): Border color of points.
* `pointBorderWidth` (Number): Border width of points.
* `pointStyle` (String): `'circle'` or `'square'`.
* `borderDash` (Array of Numbers): For creating dashed lines (e.g., `[5, 5]` for 5px dash, 5px space).

**SMA-Specific Dataset Properties (for `type: 'sma'`):**
* `sourceDatasetIndex` (Number): Required. The index of the dataset in the `datasets` array from which to calculate the SMA. The source dataset should not be of type `sma`.
* `period` (Number): Required. The period for the SMA calculation (e.g., `3` for a 3-period SMA).
* (SMA lines are drawn as lines, so line-specific properties like `borderColor`, `lineWidth`, `borderDash`, `pointRadius: 0` apply).

*Example of a mixed-type dataset array:*
```javascript
datasets: [
    { type: 'bar', label: "Sales", values: [10,20], backgroundColor: "blue" },
    { type: 'line', label: "Trend", values: [15,15], borderColor: "green" },
    { type: 'sma', label: "SMA (Sales)", sourceDatasetIndex: 0, period: 2, borderColor: "orange", pointRadius: 0 }
]
```

#### `data.items` (Array of Objects) - For `percentageDistribution`
* `items: [{ label: "Category A", value: 60 }, ...]`

### `options` (Object)

Customizes chart appearance and behavior.

**Global Options (apply to all chart types):**
* `width`, `height`, `padding` (see existing docs)
* `title` (Object): (see existing docs)
* `legend` (Object):
    * `display` (Boolean): `true` to show legend (default `true`). **Legend items are now clickable to toggle dataset visibility.**
    * `position`, `font`, `color`, `padding`, `markerSize`, `markerStyle`: (see existing docs)
* `font`, `gridColor`, `tooltip`: (see existing docs)

**Axis Options (`options.xAxis`, `options.yAxis`):**
* (Refer to existing documentation for common axis options like `display`, `title`, `gridLines`, `labelFont`, `color`, etc.)

**Type-Specific Options (`options.bar`, `options.line`, `options.percentageDistribution`):**
* (Refer to existing documentation for these.)

#### `percentageDistribution` Specific Options

Under `options.percentageDistribution`:

*   **`valuesArePercentages`** (boolean, default: `false`):
    *   If set to `true`, the chart will interpret the `value` property of each object in `data.items` as a direct percentage (expected to be in the 0-100 range). The chart will not sum values to calculate percentages. Values outside the 0-100 range will be clamped for display purposes, and a console warning will be issued during chart initialization.
    *   If `false` (the default), the chart calculates percentages by summing all `item.value`s and determining each item's share of that total.

    Example:
    ```javascript
    new PureChart('myChart', {
        type: 'percentageDistribution',
        data: {
            items: [
                { label: 'Category A', value: 60 }, // Interpreted as 60%
                { label: 'Category B', value: 40 }  // Interpreted as 40%
            ]
        },
        options: {
            percentageDistribution: {
                valuesArePercentages: true
                // ... other options like barHeight, colors, labelPosition, etc.
            }
        }
    });
    ```

**NEW: `options.theme` (String):**
*   Specifies the color theme for the chart.
*   Possible values:
    *   `'light'` (Default): Standard theme with light backgrounds and dark text/elements.
    *   `'dark'`: Theme optimized for dark backgrounds with lighter text and adjusted default colors.
*   The theme affects default colors for axes, grid lines, titles, legends, tooltips, and default dataset series colors.
*   Dataset-specific colors (e.g., `backgroundColor`, `borderColor`) will override theme defaults for that dataset.
*   See the "Theming" section below for more details.

**NEW: `options.annotations` (Array of AnnotationObjects):**
Used to draw horizontal lines and labels on the chart, typically for highlighting thresholds, targets, etc.
```javascript
options: {
    annotations: [
        {
            type: 'line',       // Required. Currently only 'line' is supported.
            mode: 'horizontal', // Required. Currently only 'horizontal' is supported.
            value: 75,          // Y-axis value where the line is drawn.
            // OR
            // percentage: 50,  // Y-axis position as a percentage (0-100) of the
                                // current Y-axis range (minValue to maxValue).
                                // 'value' takes precedence over 'percentage'.
            borderColor: '#FF0000', // Color of the annotation line (default: '#CCC').
            borderWidth: 2,         // Width of the line (default: 1).
            borderDash: [5, 5],     // Dash pattern for the line (e.g., [5, 5]). (default: solid)
            label: {
                text: 'Target Value', // Text to display.
                font: '12px Arial',   // Font for the label (default: chart's global font or '10px Arial').
                color: '#FF0000',    // Color of the label text (default: annotation borderColor or '#333').
                position: 'top-right',// e.g., 'right', 'left', 'center', 
                                      // 'top-left', 'top-center', 'top-right',
                                      // 'bottom-left', 'bottom-center', 'bottom-right'.
                                      // (default: 'right', which means text is above line, to the right)
                backgroundColor: 'rgba(255, 255, 255, 0.7)', // Optional background for the label.
                padding: 5            // Padding for the background. Can be a number or {x, y}. (default: 2)
            }
        },
        // ... more annotation objects ...
    ]
}
```

**NEW: Average Line Per Dataset:**
This feature allows you to draw a horizontal line representing the calculated average of a specific dataset's values. A label displaying the average value can also be shown. This is useful for quickly visualizing how dataset values compare to their mean.

The `averageLine` configuration object can be added directly to any dataset object within the `data.datasets` array, for datasets of `type: 'bar'` or `type: 'line'`. It is not applicable to `percentageDistribution` or `sma` type datasets.

**Configuration Options for `averageLine` (within a dataset object):**

*   `display` (Boolean): Set to `true` to show the average line for this dataset.
    *   Default: `false`.
*   `color` (String): Color of the average line.
    *   Default: `'#888'`.
*   `lineWidth` (Number): Width of the average line.
    *   Default: `1`.
*   `dashPattern` (Array of Numbers): Dash pattern for the line (e.g., `[3, 3]` for dotted, `[]` or `null` for solid).
    *   Default: `[3, 3]`.
*   `label` (Object): Configuration for the label displayed near the average line.
    *   `display` (Boolean): Set to `true` to show the average value label.
        *   Default: `true`.
    *   `font` (String): Font for the label.
        *   Default: `'10px Arial'`.
    *   `color` (String): Color of the label text.
        *   Default: `'#555'`.
    *   `position` (String): Position of the label relative to the line.
        *   Supported values: `'above-right'`, `'above-left'`, `'below-right'`, `'below-left'`.
        *   Default: `'above-right'`.
    *   `padding` (Number): Padding around the label text, especially if `backgroundColor` is used.
        *   Default: `2`.
    *   `backgroundColor` (String): Background color for the label, making it more readable over chart elements.
        *   Default: `'rgba(255, 255, 255, 0.7)'`.
    *   `formatter` (Function): A function that takes the calculated average value as an argument and returns the string to be displayed.
        *   Default: `(value) => \`Avg: \${value !== null && value !== undefined ? value.toFixed(2) : 'N/A'}\``.

**Example:**

```javascript
data: {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [{
        label: 'Sales Data',
        values: [100, 150, 125],
        type: 'line', // or 'bar'
        averageLine: {
            display: true,
            color: 'blue',
            lineWidth: 2,
            dashPattern: [5, 5], // Dashed line
            label: {
                display: true,
                color: 'darkblue',
                font: 'bold 12px Arial',
                position: 'above-left', // Display label on the left side, above the line
                backgroundColor: 'rgba(200, 200, 255, 0.8)',
                formatter: (avg) => `Average Sale: ${avg.toFixed(1)}`
            }
        }
    }, {
        label: 'Expenses Data',
        values: [70, 80, 75],
        type: 'bar',
        averageLine: { // Another average line, using more defaults
            display: true,
            color: 'red' // Only customize color, other options use defaults
        }
    }]
}
```

## Loading Configuration from JSON (`PureChart.fromJSON()`)

You can load chart configurations from an external JSON file. The JSON structure should mirror the JavaScript configuration object.
**All new features and options described above (dataset `type`, `borderDash`, `sourceDatasetIndex`, `period`, `options.annotations`, `options.theme`, and dataset `averageLine`) can be included in the JSON configuration.**

The `fromJSON` method signature is:

`PureChart.fromJSON(elementId, jsonUrl, overrideOptions = {})`
*   `elementId` (String): The ID of the canvas element.
*   `jsonUrl` (String): The URL to fetch the JSON configuration from.
*   `overrideOptions` (Object, optional): An object that will be deeply merged with the fetched JSON configuration. Defaults to an empty object.
```javascript
// Example call in README
PureChart.fromJSON('myCanvasID', 'path/to/data.json')
    .then(chart => {
        if (chart && chart.isValid) console.log("Chart loaded from JSON!");
    })
    .catch(error => {
        console.error("Failed to load chart:", error);
    });
```
Refer to `sample-data.json` in the demo package for a comprehensive example of a JSON configuration file using these new features.

## Examples & Demos

This README provides basic setup and configuration details. For detailed examples of all features, including:
*   Mixed bar and line charts
*   Clickable legends
*   Dashed lines
*   Simple Moving Average (SMA) lines
*   Annotations
*   Loading from JSON
*   Light and Dark Theming

Please see the `demo.html` (basic examples) and `demo_full.html` (comprehensive showcase) files included in the PureChart package. The `sample-data.json` file also serves as a good reference for JSON configurations.

## Contributing

Contributions, issues, and feature requests are welcome. Please feel free to fork the repository, make changes, and submit pull requests.

## License

This project is open source and available under the MIT License.

---

## Theming

PureChart now supports a basic theming system to control the overall look and feel of your charts. You can choose between a 'light' (default) and a 'dark' theme.

### Setting the Theme

To set a theme, pass the `theme` option within the `options` object when creating a new chart instance:

```javascript
const myChart = new PureChart('myCanvasId', {
    type: 'bar',
    data: {
        labels: ['A', 'B', 'C'],
        datasets: [{
            label: 'Sample Data',
            values: [10, 20, 30]
            // You can still specify backgroundColor or borderColor here
            // to override theme defaults for this specific dataset.
        }]
    },
    options: {
        theme: 'dark', // Activates the dark theme
        title: {
            display: true,
            text: 'Dark Mode Chart'
        }
        // ... other chart options
    }
});
```

### Theme Details

-   **`'light'` (Default):** The standard theme with light backgrounds and dark text/elements.
-   **`'dark'`:** A theme optimized for dark backgrounds, using lighter text, grids, and adjusted default dataset colors for better visibility.

The selected theme will affect the default colors for:
-   Axis lines and labels
-   Title text
-   Legend text
-   Grid lines
-   Tooltip background and text
-   Default series colors for bars/lines (if not specified in the dataset itself)

If you provide specific colors within a dataset's configuration (e.g., `borderColor`, `backgroundColor`), those will take precedence over the theme's defaults for that particular dataset.
