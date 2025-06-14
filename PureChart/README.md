## PureChart
A fast and light chart library.
![Chart Example](graph.jpg)

PureChart.js is a lightweight charting library with no external dependencies, designed for speed and ease of use. It supports various chart types and customization options.

### Features
*   **Chart Types:** Bar, Line, Percentage Bar, Pill.
*   **Theming:** Supports light and dark themes, and custom theme objects.
*   **Interactivity:** Tooltips, clickable legend items to toggle dataset visibility.
*   **Data Handling:** Supports multiple datasets, different Y-axes per dataset, and data processing for Simple Moving Averages (SMA).
*   **Customization:** Extensive options for axes, titles, legends, colors, fonts, and chart-specific appearances.
*   **Responsive Sizing:** Automatically resizes to fit its parent container (see details below).
*   **Dynamic Updates:** Supports data updates and chart redraws.
*   **JSON Configuration:** Can be initialized from a JSON configuration object.

### Key Features & Recent Updates

*   **Default Hidden Axes:** For a cleaner default look, X and Y axes are now hidden by default. They can be easily enabled via `options.xAxis.display = true` and `options.yAxes[].display = true`.
*   **Enhanced Pill Chart Styling:** The Pill Chart's `zoneMin` and `zoneMax` area can now visually overflow the main pill bar using the `options.pill.zoneOverflowAmount` setting.
*   **Global Contour Mode:** A new `options.contourColor` can be set. If a color is provided, charts (bars, lines, points) will render with a fill matching the chart's background (from the active theme) and an outline in the specified contour color, offering a distinct visual style.
*   **Responsive Autosizing:** Charts now automatically resize to fit their parent container by default (`options.autosize = true`).
*   **Dark Theme & Custom Theming:** Added built-in 'dark' theme and improved support for custom theme objects.
*   **Horizontal Annotations:** Draw labeled horizontal lines on your charts using `options.annotations`.
*   **Per-Dataset Average Lines:** Bar and Line datasets can now automatically display their average value as a configurable line.
*   **Period Highlighting:** Line charts support highlighting specific date ranges on the X-axis.

## Chart Types

PureChart supports several chart types, each suited for different data visualization needs.

### Bar Chart
Displays data as vertical bars. Suitable for comparing distinct categories. Datasets can be grouped.

### Line Chart
Displays data as points connected by lines. Ideal for showing trends over time or continuous data. Supports area fill, curve tension, and dashed lines.

### Percentage Distribution Chart
Displays data as horizontal bars representing parts of a whole. Each bar shows its percentage contribution.

### Pill Chart
The Pill Chart is a horizontal chart designed to display a single value against a defined range, with an optional highlighted zone. It's useful for visualizing metrics like progress, scores, or levels within a minimum and maximum boundary.

#### Configuration Options (`options.pill`)
*   `min` (number): The minimum value of the chart. Default: `0`.
*   `max` (number): The maximum value of the chart. Default: `100`.
*   `zoneMin` (number): The minimum value for the highlighted zone. Default: `20`.
*   `zoneMax` (number): The maximum value for the highlighted zone. Default: `80`.
*   `value` (number): The current value to be indicated by the cursor. Default: `50`.
*   `borderRadius` (number): The border radius for the corners of the pill and zone. Default: `10`.
*   `pillHeight` (number): The height of the pill in pixels. Default: `30`.
*   `colors` (object): An object containing color configurations:
    *   `mainBackground` (string): Background color of the main pill area. Default: `'#e0e0e0'`.
    *   `zoneBackground` (string): Background color of the highlighted zone. Default: `'#a0a0a0'`.
    *   `cursor` (string): Color of the cursor line. Default: `'#ff0000'`.
    *   `minMaxText` (string): Color of the text labels for min and max values. Default: `'#333333'`.
    *   `valueText` (string): Color of the text label for the current value. Default: `'#111111'`.
*   `cursorThickness` (number): Thickness of the cursor line in pixels. Default: `2`.
*   `cursorLengthExtension` (number): How many pixels the cursor line extends above and below the pill. Default: `5`.
*   `showMinMaxLabels` (boolean): Whether to display the min and max value labels. Default: `true`.
*   `showValueLabel` (boolean): Whether to display the current value label. Default: `true`.
*   `valueLabelPosition` (string): Position of the value label ('above', 'below', 'inside'). Default: `'below'`.
*   `labelFont` (string): Font style for the labels. Default: `'10px Arial'`. (Used for Min/Max/Value labels if `mainLabelFont` is not specified).
*   `mainLabelFont` (string): Specific font for the main Min, Max, and Value labels of the pill chart. If not provided, `labelFont` is used. Example default: `'11px Arial'`.
*   `minMaxLabelPosition` (string): Position of the main Min and Max labels. Default: `'ends'`.
    *   `'ends'`: Labels are drawn inside, near the ends of the pill bar.
    *   `'aboveEnds'`: Labels are drawn above the pill bar, aligned with its ends.
    *   `'belowEnds'`: Labels are drawn below the pill bar, aligned with its ends.
*   `zoneOverflowAmount` (number): The amount in pixels by which the highlighted zone (`zoneMin` to `zoneMax`) will extend vertically (both top and bottom) beyond the main `pillHeight`. This creates a visual effect where the zone appears taller than the pill bar. Default: `5`.

    *Example of `zoneOverflowAmount` in action:*
    If `pillHeight` is 30 and `zoneOverflowAmount` is 5, the colored zone rectangle will be drawn with a total height of 40px (30 + 2*5), vertically centered with the pill bar but overflowing by 5px on top and 5px at the bottom. The sides of the zone remain aligned with the pill's rounded edges.
*   `showZoneMinMaxLabels` (boolean): Controls whether to display labels for `zoneMin` and `zoneMax` values. Default: `false`.
*   `zoneLabelFont` (string): Font for the zone Min/Max labels. Default: `'10px Arial'`.
*   `zoneLabelColor` (string): Text color for the zone Min/Max labels. Default: `'#333333'`.
*   `zoneLabelOffset` (number): Pixel offset for the zone labels from their default calculated position. For 'above'/'below', this is the distance from the (potentially overflowed) zone bar. For 'on', this is the nudge inward from the zone boundary line. Default: `5`.
*   `zoneLabelBackgroundPadding` (number): Padding around the zone label text if `zoneLabelBackgroundColor` is used. Default: `2`.
*   `zoneLabelBackgroundColor` (string): Background color for the zone labels. Useful for readability if labels are 'on' the zone or close to other elements. Default: `'rgba(255, 255, 255, 0.7)'`.
*   `zoneLabelPosition` (string): Position of the zone Min/Max labels relative to the zone boundaries. Valid values: `'above'`, `'below'`, or `'on'`. Default: `'above'`.

    *Example: Displaying Zone Labels*
    ```javascript
    options: {
        pill: {
            // ... other pill options ...
            showZoneMinMaxLabels: true,
            zoneLabelPosition: 'below',
            zoneLabelColor: 'blue',
            zoneLabelOffset: 8
        }
    }
    ```

    *Example: Customizing Main Min/Max/Value Label Font and Min/Max Position*
    ```javascript
    options: {
      pill: {
        // ... other options
        showMinMaxLabels: true, // Ensure Min/Max labels are shown
        mainLabelFont: '12px "Courier New", monospace',
        minMaxLabelPosition: 'aboveEnds', // Position Min/Max labels above the pill ends

        showValueLabel: true, // Ensure Value label is shown
        valueLabelPosition: 'below', // Value label will also use mainLabelFont
        // ... other pill options
      }
    }
    ```

#### JSON Configuration Example for Pill Chart
```json
{
  "type": "pill",
  "data": {}, // Pill chart typically gets its data from options.pill
  "options": {
    "title": {
      "text": "Project Progress"
    },
    "pill": {
      "min": 0,
      "max": 200,
      "zoneMin": 70,
      "zoneMax": 150,
      "value": 120,
      "borderRadius": 15,
      "pillHeight": 40,
      "colors": {
        "mainBackground": "#d3d3d3",
        "zoneBackground": "#77dd77",
        "cursor": "#0000ff",
        "minMaxText": "#000000",
        "valueText": "#000000"
      },
      "cursorThickness": 3,
      "cursorLengthExtension": 6,
      "showMinMaxLabels": true,
      "showValueLabel": true,
      "valueLabelPosition": "above"
    }
  }
}
```

### Configuration Options

PureChart offers a wide range of options to customize its appearance and behavior. These are passed in the `options` object during chart instantiation.

#### Axes Configuration (X and Y)

By default, both X and Y axes are now hidden to provide a cleaner initial chart appearance. To display them, you need to explicitly enable them in your chart configuration:

**Example: Displaying Axes**
```javascript
new PureChart('myChartCanvas', {
    type: 'bar',
    data: { /* ... */ },
    options: {
        xAxis: {
            display: true, // Shows the X-axis
            title: 'Categories'
            // ... other xAxis options
        },
        yAxes: [{
            display: true, // Shows this Y-axis
            title: 'Values'
            // ... other yAxis options for the first (or only) Y-axis
        }]
        // ... other options
    }
});
```

#### X-Axis Label Display

PureChart includes options to manage the display of X-axis labels, especially when dealing with many data points:

*   **`options.xAxis.maxLabelsToShow`**: (Optional) `Number`. Specifies the maximum number of X-axis labels to attempt to display. If not provided, the chart will dynamically estimate this based on the available width and average label size.
*   **`options.xAxis.forceShowFirstAndLastLabel`**: (Optional) `Boolean`. Defaults to `true`. If true, the chart will make a stronger effort to display the first and last labels on the X-axis, even if it means adjusting their position slightly to fit. They are still subject to overlap checks with other labels and extreme boundary conditions.
*   **`options.xAxis.minSpacingBetweenLabels`**: (Optional) `Number`. Defaults to `5` (pixels). The minimum horizontal space between the end of one label and the start of the next.
*   **`options.xAxis.labelYOffset`**: (Optional) `Number`. Defaults to `8` (pixels). The vertical offset of the X-axis labels from the axis line.

#### Customizing Tooltip Content (`options.tooltip.formatter`)

You can provide a custom function to `options.tooltip.formatter` to completely control the HTML content of the tooltip.

**Function Signature:** `formatter(params)`

**`params` Object Properties:**

*   **`type`**: (`String`) The type of element hovered. For bar/line charts with shared tooltips, this is often `'shared'`. For `percentageDistribution`, it's `'percentageDistribution'`.
*   **`xLabel`**: (`String`) The label for the X-axis point being hovered.
*   **`datasets`**: (`Array`) For `type: 'shared'`, this array contains objects for each dataset active at the hovered point. Each object typically includes:
    ```javascript
    {
        dataset: { // Original dataset properties relevant for tooltip
            label: 'Series Name',
            color: '#resolvedColor', // Resolved color for this series
            originalIndex: 0 // Original index of dataset
        },
        value: 123 // Value at the hovered point (can be null/undefined)
    }
    ```
    Your formatter should iterate over `params.datasets` to display info for all relevant series.
*   **`item`**: (`Object`) Relevant for `type: 'percentageDistribution'`. Contains data for the hovered segment.
*   **`themePalette`**: (`Object`) The active theme palette.
*   **`anchorX`, `anchorY`**: (`Number`) Viewport-relative X/Y coordinates of the tooltip's anchor.

**Example: Custom Formatter for Shared Tooltips**
```javascript
new PureChart('myChartCanvas', {
    options: {
        tooltip: {
            formatter: function(params) {
                if (!params) return ''; // Should not happen with current setup, but good guard

                if (params.type === 'percentageDistribution' && params.item) {
                     return `<strong>${params.item.label}</strong>: ${params.item.value.toLocaleString('en-US').replace(/,/g, ' ')} (${params.item.percentage.toFixed(1)}%)`;
                }

                if (!params.datasets || params.datasets.length === 0) {
                    return ''; // No dataset info to show for this point
                }

                let html = `<div style="font-weight:bold; margin-bottom:8px; padding-bottom:5px; border-bottom:1px solid #eee; text-align:left;">${params.xLabel}</div>`;
                params.datasets.forEach(function(series) {
                    const seriesLabel = series.dataset.label || `Dataset ${series.dataset.originalIndex !== undefined ? series.dataset.originalIndex + 1 : ''}`;
                    const seriesColor = series.dataset.color || '#ccc'; // Color pre-resolved by _onMouseMove
                    const seriesValue = (series.value !== null && series.value !== undefined)
                                        ? series.value.toLocaleString('en-US').replace(/,/g, ' ')
                                        : 'N/A';
                    html += `<div style="margin-bottom: 5px; text-align:left;">` +
                            `<span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${seriesColor}; margin-right:8px;"></span>` +
                            `<strong>${seriesLabel}:</strong> ${seriesValue}` +
                            `</div>`;
                });
                return html;
            }
        }
    }
    // ... other config ...
});
```

### Responsive Sizing (Autosize)

PureChart now supports automatic responsive resizing to fit its parent container.

**`options.autosize`**

*   **Type:** `Boolean`
*   **Default:** `true`

When `autosize` is enabled (which it is by default), the chart will automatically adjust its width and height to match the dimensions of its direct parent HTML element. This is achieved using a `ResizeObserver`.

**Behavior:**

*   The chart listens for size changes of the canvas's parent element.
*   On resize, the chart redraws to fit the new dimensions. A debounce mechanism (250ms) is used to optimize performance during rapid resizing.
*   **Maximum Size Constraint:** If the `<canvas>` element has `width` and/or `height` attributes set directly in the HTML (e.g., `<canvas id="myChart" width="600" height="400"></canvas>`), these dimensions will be treated as the **maximum** width and height for the chart when `autosize` is true. The chart will still shrink if the parent container is smaller than these dimensions but will not grow larger.
*   If the canvas has no parent element, or if the parent is not an HTMLElement, autosize will be disabled for that chart instance, and an error will be logged to the console.

**Disabling Autosize:**

If you need to use fixed dimensions for your chart, you can disable `autosize` and provide explicit `width` and `height` in the chart options:

```javascript
const myChart = new PureChart('myChartCanvas', {
    options: {
        autosize: false,
        width: 600, // Chart will be fixed at 600px wide
        height: 400 // Chart will be fixed at 400px high
    },
    data: { /* ... */ }
});
```

### Cleaning Up (Destroying the Chart)

When a chart instance is no longer needed (e.g., when a component is unmounted in a single-page application, or the chart is dynamically removed from the page), it's important to clean up its resources to prevent memory leaks.

PureChart provides a `destroy()` method for this purpose.

**`chart.destroy()`**

Call this method on your chart instance to:

*   Disconnect the `ResizeObserver` (if `autosize` was enabled).
*   Remove all event listeners attached to the canvas (e.g., for tooltips, legend interaction).
*   Remove the tooltip DOM element if it was created.
*   Nullify internal references to help with garbage collection.

**Example:**

```javascript
// Create a chart
const myChart = new PureChart('myChartCanvas', { /* ... your config ... */ });

// ... later, when the chart is no longer needed ...
myChart.destroy();
// myChart = null; // Optional: help garbage collector
```

### Handling Negative Values

PureChart supports the display of negative values in both bar and line charts, allowing for a comprehensive representation of your data. The primary way to control how negative values affect the Y-axis scale is through the `beginAtZero` option for each Y-axis configuration.

*   **`options.yAxes[].beginAtZero`**:
    *   **`true` (Default):** When set to true, the Y-axis will always include 0.
        *   If all data points for an axis are negative (e.g., values from -10 to -2), the axis will automatically scale from the most negative data point up to 0 (e.g., Y-axis range of -10 to 0).
        *   If data points are mixed (e.g., -10 to 20) or all positive, the axis will scale to include 0 and accommodate the full range of data.
    *   **`false`:** When set to false, the Y-axis will scale to the actual minimum and maximum values of your data for that axis. This is useful if you want the axis to tightly fit the data range, even if all values are negative (e.g., an axis from -20 to -5).

**Example:**

```javascript
new PureChart('myChartCanvas', {
    data: {
        labels: ['P1', 'P2', 'P3'],
        datasets: [{
            label: 'Profit/Loss',
            values: [-50, 150, -20],
            yAxisID: 'financialAxis' // Ensure this dataset is mapped to the configured Y-axis
        }]
    },
    options: {
        yAxes: [{
            id: 'financialAxis',
            position: 'left',
            title: 'Amount ($)',
            // beginAtZero: true, // Default behavior, will scale from -50 to 150
            // beginAtZero: false, // Would also scale from -50 to 150 in this mixed case
        }]
        // To see specific negative scaling, e.g. if all values were [-50, -10, -20]:
        // beginAtZero: true  => Y-axis from -50 to 0
        // beginAtZero: false => Y-axis from -50 to -10 (approx, with buffering)
    }
});
```

**Note:** The `percentageDistribution` chart type does not support negative values, as its data items are expected to be non-negative contributions to a total.

---
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
    * Pill charts (horizontal gauge-like display for a single value in a range)
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
* `'pill'`

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
*   `contourColor` (String | null): Default: `null`.
    If set to a valid color string (e.g., `'#FF0000'`, `'rgba(0,0,0,0.7)'`), this global option activates a "contour mode" for chart elements:
    *   **Bars and Percentage Bars:** Will be filled with the chart's background color (defined by the active theme, typically white or a dark shade) and stroked with the specified `contourColor`. The existing `borderWidth` options are respected.
    *   **Line Chart Fills:** Filled areas under lines will use the chart's background color as their fill, with the `contourColor` used for their border.
    *   **Line Chart Lines & Points:** The main lines and the borders of points will be drawn using the `contourColor`. Points will be filled with the chart's background color.
    This creates a distinct "outlined" or "hollow" appearance. If `null` or an invalid color string, standard color options apply.

    **Example: Using Contour Color**
    ```javascript
    new PureChart('myChartCanvas', {
        type: 'bar',
        data: { /* ... */ },
        options: {
            contourColor: 'blue', // All bars will have a blue outline and white/theme background fill
            title: {
                text: 'Chart with Blue Contour'
            }
            // ... other options
        }
    });
    ```

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

### Period Highlighting (for Line Charts)

Line charts can display highlighted periods on the X-axis, useful for indicating events, crises, or other significant time ranges. This is configured via the `options.periodHighlights` object.
This feature is primarily designed for charts with a continuous X-axis where labels represent dates (e.g., 'YYYY-MM-DD').

**`options.periodHighlights` Object Properties:**

*   **`display`**: `boolean` (Default: `false`)
    *   Set to `true` to enable period highlighting and show the corresponding legend item (if `legendLabel` is also provided).
*   **`legendLabel`**: `string` (Default: `"Periods"`)
    *   The text label for the legend item that globally toggles the visibility of all period highlights.
*   **`periods`**: `Array<Object>` (Default: `[]`)
    *   An array of period definition objects. Each object defines a single highlighted region.
*   **`defaultStyle`**: `Object`
    *   Defines the default appearance for all period highlights and their labels.
    *   **`fillColor`**: `string` (e.g., `'rgba(255, 0, 0, 0.1)'`) - Fill color of the rectangle.
    *   **`borderColor`**: `string` (e.g., `'rgba(255, 0, 0, 0.3)'`) - Border color of the rectangle.
    *   **`borderWidth`**: `number` (e.g., `1`) - Border width of the rectangle.
    *   **`label`**: `Object` - Default styling for the period name labels.
        *   **`font`**: `string` (e.g., `'10px Arial'`)
        *   **`color`**: `string` (e.g., `'#000000'`)
        *   **`angle`**: `number` (e.g., `-30`) - Rotation angle in degrees.
        *   **`position`**: `string` (e.g., `'above'`, `'center'`, `'below'`) - Label's position relative to the rectangle.
        *   **`offset`**: `number` (e.g., `5`) - Pixel offset from the rectangle's edge or center.
        *   **`textAlign`**: `string` (e.g., `'center'`)

**Period Object Properties (within the `periods` array):**

*   **`name`**: `string` (Required)
    *   The name of the period, displayed as a label.
*   **`startDate`**: `string` (Required, format: 'YYYY-MM-DD')
    *   The start date of the period. The highlight will snap to the nearest date found in `data.labels`.
*   **`endDate`**: `string` (Required, format: 'YYYY-MM-DD')
    *   The end date of the period. The highlight will snap to the nearest date found in `data.labels`.
*   **`style`**: `Object` (Optional)
    *   Allows overriding any of the `defaultStyle` properties (including nested `defaultStyle.label` properties) for this specific period.

**Example Configuration:**

```javascript
options: {
    // ... other chart options for a line chart with date labels ...
    periodHighlights: {
        display: true,
        legendLabel: "Key Economic Events",
        periods: [
            {
                name: "Tech Boom",
                startDate: "2023-03-01", // Example: assumes "2023-03-01" is in your data.labels
                endDate: "2023-04-15"   // Example: assumes "2023-04-15" is in your data.labels
                // Uses defaultStyle defined globally in PureChart.js or overridden in this chart's periodHighlights.defaultStyle
            },
            {
                name: "Market Correction",
                startDate: "2023-05-01",
                endDate: "2023-06-15",
                style: {
                    fillColor: 'rgba(255, 165, 0, 0.15)', // Light orange
                    borderColor: 'rgba(255, 165, 0, 0.4)',
                    label: {
                        color: '#B22222', // Firebrick
                        angle: 0,         // Horizontal label
                        position: 'center',
                        font: 'bold 10px sans-serif'
                    }
                }
            }
        ],
        defaultStyle: { // Example of overriding global defaults for this specific chart instance
            fillColor: 'rgba(128, 0, 128, 0.08)', // Light purple default
            borderColor: 'rgba(128, 0, 128, 0.25)',
            label: {
                color: '#555555',
                angle: -20,
                position: 'above'
            }
        }
    }
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
