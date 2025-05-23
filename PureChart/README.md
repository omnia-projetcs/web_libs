# PureChart.js - A Simple Pure JavaScript Charting Library

**Version: 0.9.4**

PureChart.js is a lightweight, dependency-free JavaScript library for creating simple and interactive charts on web pages using the HTML5 Canvas API. It aims to provide essential chart types with a good range of customization options without the overhead of larger charting libraries.

## Features

* **Pure JavaScript:** No external dependencies (like jQuery, D3, etc.).
* **Canvas-based:** Renders charts using the HTML5 Canvas API.
* **Supported Chart Types:**
    * Bar charts (vertical, grouped)
    * Line charts (with optional area fill and curve tension)
    * Percentage Distribution bars (horizontal)
* **Customization:**
    * Titles, legends, axes labels, and styling.
    * Colors (solid, arrays for series), fonts, and padding.
    * Customizable tooltips with a formatter function.
    * Specific styling options for each chart type (e.g., bar spacing, point styles, percentage bar appearance).
    * Two distinct styling modes for Percentage Distribution charts.
* **Data Loading:** Supports loading chart configurations from a JSON file via a static method.
* **Interactive Tooltips:** Displays information when hovering over chart elements.

## Getting Started

### 1. Include Files

Include the `PureChart.js` file in your HTML. You can also include a CSS file (e.g., `PureChart.css` from the demo package) for basic demo page styling.

```html
<head>
    <link rel="stylesheet" href="PureChart.css"> <script src="PureChart.js"></script>
</head>
```

### 2. Add a Canvas Element

Add an HTML `<canvas>` element to your page where you want the chart to be rendered. Give it a unique `id`.

```html
<canvas id="myCoolChart" width="600" height="350"></canvas>
```
**Note:** It's recommended to set the `width` and `height` attributes directly on the canvas element or pass them in the chart options. Avoid using CSS to set canvas dimensions, as it can lead to scaling issues and blurry charts.

## Usage

### Basic Instantiation

To create a chart, instantiate the `PureChart` class with the ID of your canvas element and a configuration object:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    const chartConfig = {
        type: 'bar', // or 'line', 'percentageDistribution'
        data: {
            // ... data specific to the chart type ...
        },
        options: {
            // ... chart options ...
        }
    };

    const myChart = new PureChart('myCoolChart', chartConfig);
    if (!myChart.isValid) {
        console.error("Chart initialization failed. Check console for PureChart errors.");
    }
});
```

### Configuration Object Structure

The configuration object has three main properties: `type`, `data`, and `options`.

#### `type` (String)

Specifies the type of chart to render. Supported values:
* `'bar'`
* `'line'`
* `'percentageDistribution'`

#### `data` (Object)

Contains the data for the chart. Its structure varies by chart type:

* **For `bar` and `line` charts:**
    ```javascript
    data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May"], // Labels for the X-axis
        datasets: [
            {
                label: "Dataset 1", // Label for this dataset (shows in legend/tooltip)
                values: [10, 20, 30, 25, 35], // Data points
                backgroundColor: "rgba(54, 162, 235, 0.6)", // Fill color
                borderColor: "rgba(54, 162, 235, 1)",     // Border color
                borderWidth: 1,                         // Border width for bars
                // Line-specific dataset options:
                // tension: 0.1, // 0 for straight lines, >0 for curves (e.g., 0.4)
                // fill: false, // Whether to fill the area under the line
                // pointRadius: 3,
                // pointColor: "rgba(54, 162, 235, 1)",
                // pointBorderColor: "#fff",
                // pointBorderWidth: 1,
                // pointStyle: 'circle' // or 'square'
            },
            // ... more datasets ...
        ]
    }
    ```

* **For `percentageDistribution` charts:**
    ```javascript
    data: {
        items: [ // Array of data items
            { label: "Category A", value: 60 }, // 'value' is the raw value
            { label: "Category B", value: 40 }
        ]
    }
    ```

#### `options` (Object)

Contains options to customize the appearance and behavior of the chart.

**Global Options (apply to all chart types):**
* `width` (Number): Width of the canvas in pixels. Defaults to canvas attribute or 300.
* `height` (Number): Height of the canvas in pixels. Defaults to canvas attribute or 150.
* `padding` (Object): Padding around the chart drawing area.
    * Example: `{ top: 20, right: 20, bottom: 40, left: 20 }`
* `title` (Object): Chart title configuration.
    * `display` (Boolean): `true` to show title (default `true`).
    * `text` (String): The title text.
    * `font` (String): CSS font string (e.g., `'18px Arial bold'`).
    * `color` (String): CSS color string (e.g., `'#333'`).
    * `padding` (Number): Padding below the title (default `15`).
* `legend` (Object): Legend configuration.
    * `display` (Boolean): `true` to show legend (default `true`).
    * `position` (String): `'top'` (default) or `'bottom'`.
    * `font` (String): CSS font string (e.g., `'12px Arial'`).
    * `color` (String): CSS color string (e.g., `'#333'`).
    * `padding` (Number): Padding around the legend (default `10`).
    * `markerSize` (Number): Size of the color markers (default `12`).
    * `markerStyle` (String): `'square'` (default) or `'circle'`.
* `font` (String): Global default font for text elements if not specified elsewhere (e.g., `'12px Arial'`).
* `gridColor` (String): Color for grid lines (e.g., `'#e0e0e0'`).
* `tooltip` (Object): Tooltip configuration.
    * `enabled` (Boolean): `true` to enable tooltips (default `true`).
    * `backgroundColor` (String): e.g., `'rgba(0,0,0,0.85)'`.
    * `color` (String): Text color, e.g., `'white'`.
    * `font` (String): CSS font string (e.g., `'12px Arial'`).
    * `padding` (String): CSS padding string, e.g., `'10px'`.
    * `borderRadius` (String): CSS border-radius string, e.g., `'5px'`.
    * `offset` (Number): Pixel offset from the anchor point (default `10`).
    * `formatter` (Function): A function to customize tooltip content.
        * Receives a `params` object with details about the hovered element.
        * Should return an HTML string.
        * Default formatter provides a good starting point.

**Axis Options (`options.xAxis` and `options.yAxis`):**
* `display` (Boolean): `true` to show the axis (default `true`).
* `title` (String): Text for the axis title.
* `displayTitle` (Boolean): `true` to show the axis title (default `true`).
* `gridLines` (Boolean): `true` to show grid lines for this axis (Y-axis default `true`, X-axis default `false`).
* `labelFont` (String): Font for axis labels (tick values) (default `'10px Arial'`).
* `titleFont` (String): Font for the axis title (default `'12px Arial bold'`).
* `color` (String): Color for the axis line and text (default `'#666'`).
* `yAxis.beginAtZero` (Boolean): If `true`, Y-axis scale starts at 0 (default `true`).
* `yAxis.maxTicks` (Number): Suggested maximum number of ticks on the Y-axis (default `5`).
* `yAxis.sampleLabelForWidthEstimation` (String): An example of a potentially wide Y-axis label string (e.g., `"-9,999,999.9"`) to help in automatic left padding calculation. Defaults to `"-9,999.9"`.

**Type-Specific Options:**

* **`options.bar`:** (For `type: 'bar'`)
    * `itemSpacingFactor` (Number): Factor for spacing between bars within the same group (e.g., `0.1` for 10% of bar width, default `0.1`).
    * `groupSpacingFactor` (Number): Factor for spacing between groups of bars (e.g., `0.2` for 20% of group width, default `0.2`).
    * `defaultBorderWidth` (Number): Default border width for bars if not specified in dataset (default `1`).
    * `borderDarkenPercent` (Number): Percentage to darken `backgroundColor` for automatic border color if `borderColor` is not specified (default `20`).

* **`options.line`:** (For `type: 'line'`)
    * `pointRadius` (Number): Radius of data points (default `3`). Set to `0` to hide.
    * `lineWidth` (Number): Width of the line (default `2`).
    * `tension` (Number): Line tension for curves. `0` for straight lines, `0.1` to `0.5` for typical curves (default `0`). Max usually `1`.
    * `pointStyle` (String): `'circle'` (default) or `'square'`.

* **`options.percentageDistribution`:** (For `type: 'percentageDistribution'`)
    * `barHeight` (Number): Height of each bar (default `20`).
    * `barSpacing` (Number): Spacing between bars (default `3`).
    * `barBorderRadius` (Number or Object): Border radius for bars. E.g., `4` or `{ tl: 5, tr: 0, br: 0, bl: 5 }` (default `4`).
    * `labelFont` (String): Font for item labels (default `'12px Arial'`).
    * `labelColor` (String): Color for item labels (default `'#333'`).
    * `valueFont` (String): Font for percentage value text (default `'12px Arial bold'`).
    * `valueColor` (String or Function): Color for percentage value text (default `'#333'`). Can be a function `(params) => colorString` for dynamic coloring.
    * `showValueText` (Boolean): `true` to display percentage text (default `true`).
    * `labelPosition` (String): `'left'` (default) or `'insideStart'`.
    * `valuePosition` (String): `'right'` (default) or `'insideEnd'`.
    * `colors` (Array of Strings): Array of CSS color strings for bars. Cycles if more items than colors. If `null` (default), colors are auto-generated (HSL-based). **For best results with `fillLightenPercent` or `borderDarkenPercent`, use HEX or RGB(A) colors here.**
    * `maxLabelWidth` (Number): Max width for labels if `labelPosition: 'left'` (default `100`). Affects left margin calculation.
    * `valueTextMargin` (Number): Margin for value text if `valuePosition: 'right'` (default `8`).
    * `sort` (String): `'none'` (default), `'ascending'`, or `'descending'` by value.
    * **Styling Mode 1 (Default): Base color is fill, optional darker border.**
        * `borderWidth` (Number): Border width for the filled bar part (default `1`).
        * `borderColor` (String): Specific border color. If `undefined` (default) and `borderWidth > 0`, border is auto-darkened fill color.
        * `borderDarkenPercent` (Number): Percentage to darken fill for border (default `20`).
    * **Styling Mode 2 (Inverse/Gauge-like): Base color is border, fill is lightened. Bar shows only actual percentage.**
        * `fillLightenPercent` (Number): If set to a positive value (e.g., `50`), this mode is activated. The `colors` array provides the base color for the **border** of the filled portion. The **fill** of this portion will be a lightened version of this base color. The bar (fill and border) only extends to its actual percentage length. If `undefined` (default) or `0`, this mode is off.

### Loading Configuration from JSON

You can load a chart configuration from an external JSON file using the static method `PureChart.fromJSON()`:

```javascript
async function loadMyChart() {
    const chartUrl = 'path/to/your/chart-config.json';
    const chartInstance = await PureChart.fromJSON('myCoolChart', chartUrl);
    
    // Optional: Provide override options that will be merged with the JSON config
    // const chartInstance = await PureChart.fromJSON('myCoolChart', chartUrl, {
    //     options: { title: { text: "New Title Overridden from JS" } } 
    // });

    if (chartInstance && chartInstance.isValid) {
        console.log("Chart loaded successfully from JSON!");
    } else {
        console.error("Failed to load chart from JSON or chart is invalid.");
    }
}

// Call the function to load the chart
loadMyChart();
```

The JSON file should contain a single chart configuration object, similar to the `chartConfig` object shown in "Basic Instantiation":
```json
// Example: path/to/your/chart-config.json
{
    "type": "line",
    "data": {
        "labels": ["A", "B", "C"],
        "datasets": [{
            "label": "My Data from JSON",
            "values": [10, 15, 12],
            "borderColor": "blue"
        }]
    },
    "options": {
        "title": { "text": "Chart Loaded from JSON File" }
    }
}
```
The `fromJSON` method also supports a simple JSON structure containing only the `data` part, if `type` and `options` are provided via `overrideOptions`. If the JSON contains `type`, `data`, or `options` keys, it's treated as a full config.

## Examples

### 1. Bar Chart

```html
<canvas id="barChartExample" width="500" height="300"></canvas>
<script>
    new PureChart('barChartExample', {
        type: 'bar',
        data: {
            labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple'],
            datasets: [{
                label: 'Votes',
                values: [12, 19, 3, 5, 2],
                backgroundColor: [ // Array of colors for each bar
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)'
                ],
                // borderColor will be auto-darkened from backgroundColor
            }]
        },
        options: {
            title: { text: 'Simple Bar Chart' },
            yAxis: { beginAtZero: true }
        }
    });
</script>
```

### 2. Line Chart

```html
<canvas id="lineChartExample" width="500" height="300"></canvas>
<script>
    new PureChart('lineChartExample', {
        type: 'line',
        data: {
            labels: ['January', 'February', 'March', 'April', 'May'],
            datasets: [{
                label: 'Website Traffic',
                values: [65, 59, 80, 81, 56],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1, // Slight curve
                fill: true,   // Fill area under line
                pointRadius: 4,
                pointColor: 'rgb(75, 192, 192)',
                pointBorderColor: '#fff'
            }]
        },
        options: {
            title: { text: 'Monthly Website Traffic' }
        }
    });
</script>
```

### 3. Percentage Distribution Chart (New "Gauge" Style)

This style uses the `fillLightenPercent` option. The base color (from `colors` array) is used for the border of the filled portion, and the fill is a lightened version.

```html
<canvas id="percentageGauge" width="600" height="150"></canvas>
<script>
    new PureChart('percentageGauge', {
        type: 'percentageDistribution',
        data: {
            items: [
                { label: 'Project Alpha Completion', value: 75 },
                { label: 'Resource Utilization', value: 90 }
            ]
        },
        options: {
            title: { text: 'Project Status (Gauge Style)' },
            percentageDistribution: {
                colors: ['#007bff', '#28a745'], // Base colors for border
                borderWidth: 2,
                fillLightenPercent: 60, // Fill will be 60% lighter than border
                barHeight: 25,
                barBorderRadius: 5,
                labelPosition: 'left',
                maxLabelWidth: 200,
                valuePosition: 'insideEnd',
                valueFont: '11px Arial bold'
            }
        }
    });
</script>
```

### 4. Percentage Distribution Chart (Classic Style)

This style uses the base color for the fill, and the border is either explicitly set or a darkened version of the fill.

```html
<canvas id="percentageClassic" width="600" height="150"></canvas>
<script>
    new PureChart('percentageClassic', {
        type: 'percentageDistribution',
        data: {
            items: [
                { label: 'Market Share X', value: 40 },
                { label: 'Market Share Y', value: 60 }
            ]
        },
        options: {
            title: { text: 'Market Share (Classic Style)' },
            percentageDistribution: {
                colors: ['#ffc107', '#6f42c1'], // Base colors for fill
                borderWidth: 1,
                // borderColor: '#333', // Or specify a border color
                borderDarkenPercent: 25, // Used if borderColor is not set
                // fillLightenPercent: 0 or undefined (to ensure classic mode)
                barHeight: 25,
                barBorderRadius: 3
            }
        }
    });
</script>
```

## Contributing

Contributions, issues, and feature requests are welcome. Please feel free to fork the repository, make changes, and submit pull requests.

## License

This project is open source and available under the MIT License.
