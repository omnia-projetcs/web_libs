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

## Loading Configuration from JSON (`PureChart.fromJSON()`)

You can load chart configurations from an external JSON file. The JSON structure should mirror the JavaScript configuration object.
**All new features and options described above (dataset `type`, `borderDash`, `sourceDatasetIndex`, `period`, and `options.annotations`) can be included in the JSON configuration.**

```javascript
PureChart.fromJSON('myCanvasID', 'path/to/data.json')
    .then(chart => {
        if (chart && chart.isValid) console.log("Chart loaded from JSON!");
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

Please see the `demo.html` (basic examples) and `demo_full.html` (comprehensive showcase) files included in the PureChart package. The `sample-data.json` file also serves as a good reference for JSON configurations.

## Contributing

Contributions, issues, and feature requests are welcome. Please feel free to fork the repository, make changes, and submit pull requests.

## License

This project is open source and available under the MIT License.
