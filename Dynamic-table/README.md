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

---
# dynamic-table.js - Documentation

## 1. Overview

`dynamic-table.js` is a JavaScript library for creating and managing dynamic HTML tables from JSON data. It supports features like sorting, per-column filtering, global search, pagination, data formatting, and embedding charts directly into table cells using `PureChart.js`.

## 2. Installation / Inclusion

Include the `dynamic-table.js` file in your HTML page. If you plan to use the integrated chart feature, ensure `PureChart.js` is included **before** `dynamic-table.js`. Also, include a CSS file for table styling.

```html
<script src="PureChart.js"></script>
<script src="dynamic-table.js"></script>
<link rel="stylesheet" href="dynamic-table.css">
```

## 3. Basic Usage

To create a table, call the `createDynamicTable(config)` function, typically after the DOM has loaded.

```html
<div id="myTableContainer"></div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    createDynamicTable({
        containerId: 'myTableContainer',
        jsonPath: 'path/to/your/data.json', // Or use jsonData directly
        columns: [
            { key: 'name', header: 'Name', sortable: true, filterable: true },
            { key: 'price', header: 'Price', format: 'currency:USD' }
            // ... more column definitions
        ]
        // ... other configuration options
    });
});
</script>
```

## 4. Configuration Object (`config`)

The `createDynamicTable` function accepts a configuration object with the following properties:

* **`containerId`** (String, required): The ID of the HTML `div` element where the table will be injected.
* **`jsonPath`** (String, optional): The path to your JSON data file. Use this *or* `jsonData`.
* **`jsonData`** (Array, optional): An array of JavaScript objects to use as data directly. Use this *or* `jsonPath`.
* **`language`** (String, optional, default: `'en-US'`): Sets the display language for all table UI elements, including labels, buttons, and messages.
    * Supported language codes:
        * `'en-US'` (English, Default)
        * `'fr-FR'` (French)
        * `'es-ES'` (Spanish)
        * `'it-IT'` (Italian)
        * `'de-DE'` (German)
    * If an unsupported code is provided, it will default to `'en-US'`.
* **`columns`** (Array of Objects, required): An array describing each column. Each column object can have:
    * `key` (String): The corresponding key in your JSON data objects. Used for text display, sorting, filtering, and as the first argument to a custom `render` function. Not strictly required if only using a custom `render` function that doesn't depend on a specific value from the row, or for a chart column that only uses `dataKey` on a sub-object.
    * `header` (String, required): The text to display in the column header (`<th>`).
    * `sortable` (Boolean, optional, default: `false`): If `true`, the column will be sortable (requires `key`).
    * `filterable` (Boolean, optional, default: `false`): If `true`, a filter dropdown will be generated for this column (requires `key`).
    * `format` (String, optional): Specifies how to format the data if no custom `render` function is used.
        * `'currency:EUR'`: Formats a number as Euro currency (e.g., `1.234,56 €`).
        * `'currency:USD'`: Formats a number as US Dollar currency (e.g., `$1,234.56`).
        * `'currency:CODE:locale'`: E.g., `'currency:JPY:ja-JP'` for other currencies/locales.
        * `'date'`: Formats a date string/timestamp as `DD/MM/YYYY` (uses `fr-FR` locale by default).
        * `'date:YYYY/MM/DD'`: Formats a date string/timestamp as `YYYY/MM/DD`.
        * `'percent'`: Formats a number as a percentage with 0 decimal places and conditional coloring (e.g., `0.25` -> `25%`).
        * `'percent:N'`: Formats with `N` decimal places and conditional coloring (e.g., `0.1234` with `format: 'percent:2'` -> `12.34%`).
        * `'percent_neutral'`: Formats a number as a percentage with 0 decimal places, no color, and displays empty for `0`.
        * `'percent_neutral:N'`: Formats with `N` decimal places, no color, and displays empty for `0`.
    * `render` (Function, optional): A custom rendering function for the cell. Takes `(value, rowData, cellElement)` as arguments. `value` is `rowData[col.key]`. The function is responsible for populating `cellElement`.
    * `renderAs` (String, optional, default: `'text'`): Ignored if `render` is provided.
        * `'text'`: Displays text data (after formatting).
        * `'chart'`: Displays a `PureChart.js` chart. Requires `chartConfig`.
    * `chartConfig` (Object, optional): Required if `renderAs: 'chart'`.
        * `type` (String): `PureChart.js` chart type (e.g., `'bar'`, `'line'`, `'percentageDistribution'`).
        * `dataKey` (String): Key in the row's JSON data object that holds the data for this chart (in the format expected by `PureChart.js`).
        * `width` (Number, optional, default: `150`): Width of the chart canvas.
        * `height` (Number, optional, default: `75`): Height of the chart canvas (unless `uniformChartHeight` is set globally).
        * `options` (Object, optional): Options object passed directly to the `PureChart.js` instance for this specific chart.
* **`uniformChartHeight`** (Number, optional, default: `null`): If set (e.g., `50`), forces all charts in the table to this height in pixels, overriding individual `chartConfig.height`.
* **`rowsPerPage`** (Number, optional, default: `10` or first value in `rowsPerPageOptions`): Initial number of rows to display per page.
* **`defaultSortColumn`** (String, optional, default: `null`): The `key` of the column to sort by initially.
* **`defaultSortDirection`** (String, optional, default: `'asc'`): Initial sort direction (`'asc'` or `'desc'`).
* **`showSearchControl`** (Boolean, optional, default: `true`): If `false`, the global search bar will not be displayed.
* **`showResultsCount`** (Boolean, optional, default: `true`): If `false`, the results count display will not be shown.
* **`showPagination`** (Boolean, optional, default: `true`): If `false`, pagination controls will not be displayed, and all (filtered) data will be shown.
* **`showRowsPerPageSelector`** (Boolean, optional, default: `true`): If `true` and `showPagination` is also `true`, displays a dropdown to select the number of rows per page.
* **`rowsPerPageOptions`** (Array of Numbers/String, optional, default: `[10, 25, 50, 100, 'All']`): Options for the rows per page selector. The string `'All'` (case-insensitive) will display all items.
* **`tableMaxHeight`** (String, optional, default: `null`): CSS max-height for the table scroll wrapper (e.g., `'400px'`, `'60vh'`). Enables vertical scrolling and sticky header if set.

## 6. Expected JSON Data Structure

Your JSON data (from `jsonPath` or `jsonData`) should be an array of objects. Each object represents a row in the table.

```json
[
  {
    "id": 1,
    "productName": "Laptop Pro",
    "category": "Electronics",
    "price": 1200.99,
    "lastUpdate": "2024-05-20T10:00:00Z",
    "performanceData": { // Used by chartConfig.dataKey for a chart column
      "labels": ["Q1", "Q2", "Q3", "Q4"],
      "datasets": [{ "label": "Sales", "values": [10, 15, 12, 18] /* , ... PureChart dataset options ... */ }]
    },
    "changeRate": 0.0525 // 5.25% (for 'percent' format)
  }
  // ... more objects ...
]
```

## 7. Full Example Call

```javascript
createDynamicTable({
    containerId: 'myAdvancedTable',
    jsonData: [ /* ... your array of data objects ... */ ],
    columns: [
        { key: 'id', header: 'ID', sortable: true },
        { key: 'productName', header: 'Product', sortable: true, filterable: true },
        { key: 'price', header: 'Price', format: 'currency:USD', sortable: true },
        { key: 'lastUpdate', header: 'Updated', format: 'date:YYYY/MM/DD', sortable: true },
        { 
            key: 'changeRate', 
            header: 'Change', 
            sortable: true, 
            format: 'percent:2' // Formats as percentage with 2 decimals and color
        },
        {
            header: 'Trend', // No 'key' needed if renderAs: 'chart' primarily uses dataKey
            renderAs: 'chart',
            chartConfig: {
                type: 'line',
                dataKey: 'performanceData', // Points to an object within each row's data
                width: 150,
                // height: 60, // Will be overridden by uniformChartHeight if set
                options: { // Options passed to PureChart.js
                    line: { tension: 0.4, pointRadius: 0, lineWidth: 1.5 },
                    yAxis: { display: false },
                    xAxis: { display: false },
                    legend: { display: false },
                    padding: { top: 5, right: 5, bottom: 5, left: 5 }
                }
            }
        }
    ],
    uniformChartHeight: 60, // All charts will be 60px high
    rowsPerPage: 5,
    rowsPerPageOptions: [5, 10, 20, 'All'], // 'Tout' changed to 'All'
    defaultSortColumn: 'productName',
    tableMaxHeight: '400px' // Enable scrolling with sticky header
});
```

## 8. Dependencies

* `PureChart.js`: Required if you use `renderAs: 'chart'`. Ensure it's loaded before `dynamic-table.js`.
* A CSS file (e.g., `dynamic-table.css`): Necessary for styling the table, controls, and pagination.

### Header Filtering

In addition to the global search and filter controls, Dynamic Table supports a header filtering mode where filter inputs are placed directly below each column's title.

**Enabling Header Filtering:**

To use header filtering, set the global configuration option:
*   `filterMode`:
    *   `'global'` (default): Uses the standard global search and filter dropdowns at the top of the table.
    *   `'header'`: Activates filter inputs within each column header.

**Configuring Column Header Filters:**

When `filterMode` is set to `'header'`, you can specify the type of filter for each column using the `headerFilterType` property in its column definition. The column must also have `filterable: true`.

*   `headerFilterType: 'text'`: Displays a simple text input. Filters by case-insensitive text matching. Supports `*` as a multi-character wildcard and `?` as a single-character wildcard.
*   `headerFilterType: 'regex'`: Displays a text input that uses a simplified, case-insensitive wildcard syntax for filtering: `*` matches any sequence of characters (including an empty one), and `?` matches any single character. This input is converted internally to a regular expression.
*   `headerFilterType: 'select'`: Displays a dropdown select list. The options are dynamically populated with the unique values from that column's data.
*   `headerFilterType: 'multiselect'`: Displays a dropdown list with checkboxes, allowing users to select multiple values from the column's unique data to filter by. The table will show rows where the column's value matches *any* of the selected options.

Example column definition:
```javascript
{ key: 'product_name', header: 'Product', filterable: true, headerFilterType: 'text' }
```

### Global Multi-select Filters

For columns using global filters (i.e., when `filterMode` is `'global'`), you can enable a multi-select interface for specific filterable columns:

*   **`globalFilterType`** (in column definition):
    *   `'select'` (default): The global filter for this column will be a standard single-choice dropdown.
    *   `'multiselect'`: The global filter for this column will be a multi-select dropdown with checkboxes, allowing multiple values to be chosen. Rows match if the column's value is one of the selected options.

Example column definition for a global multi-select filter:
```javascript
{ 
    key: 'status', 
    header: 'Status', 
    filterable: true, 
    globalFilterType: 'multiselect' 
}
```

---
