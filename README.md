# web_libs
All my fast, light, and free Apache 2.0 licensed libraries for web front-ends!

## Dynamic-table
A fast, light, and customizable HTML table generator.
![Table Example](table.jpg)

**Features:**
*   Data loading from JSON path or direct JSON data.
*   Sortable and filterable columns.
*   Custom cell rendering, including embedding charts (using PureChart.js).
*   Pagination, global search, results count, and rows-per-page selector.
*   Column visibility toggling.
*   Filter multi select
*   Darkmode

## Extended-search
A fast and light advanced search input field with flags and multi-line information.
![Search Example](search.jpg)

## PureChart
A fast and light chart library.
![Chart Example](graph.jpg)

PureChart.js is a lightweight charting library with no external dependencies, designed for speed and ease of use. It supports various chart types and customization options.

### Features
*   **Chart Types:** Bar, Line, Percentage Bar.
*   **Theming:** Supports light and dark themes, and custom theme objects.
*   **Interactivity:** Tooltips, clickable legend items to toggle dataset visibility.
*   **Data Handling:** Supports multiple datasets, different Y-axes per dataset, and data processing for Simple Moving Averages (SMA).
*   **Customization:** Extensive options for axes, titles, legends, colors, fonts, and chart-specific appearances.
*   **Responsive Sizing:** Automatically resizes to fit its parent container (see details below).
*   **Dynamic Updates:** Supports data updates and chart redraws.
*   **JSON Configuration:** Can be initialized from a JSON configuration object.

### Configuration Options

PureChart offers a wide range of options to customize its appearance and behavior. These are passed in the `options` object during chart instantiation.

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

Thank you!