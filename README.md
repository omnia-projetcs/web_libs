# web_libs
All my fast, light, and free Apache 2.0 licensed libraries for web front-ends!

## Dynamic-table
A fast, light, and customizable HTML table generator.

**Features:**
*   Data loading from JSON path or direct JSON data.
*   Sortable and filterable columns.
*   Custom cell rendering, including embedding charts (using PureChart.js).
*   Pagination, global search, results count, and rows-per-page selector.
*   Column visibility toggling.
*   And more...

**Basic Usage:**
```html
<div id="myTableContainer"></div>
<script src="path/to/PureChart.js"></script> <!-- Optional, if using charts -->
<script src="path/to/dynamic-table.js"></script>
<script>
    createDynamicTable({
        containerId: 'myTableContainer',
        jsonData: [ /* your data array */ ],
        columns: [
            { key: 'id', header: 'ID', sortable: true },
            { key: 'name', header: 'Name', sortable: true, filterable: true },
            // ... more columns
        ]
    });
</script>
```

### Configuration Options
The `createDynamicTable` function accepts a configuration object with the following parameters:

*   `containerId` (string, required): The ID of the HTML element where the table will be inserted.
*   `jsonPath` (string): Path to the JSON data file (if `jsonData` is not provided).
*   `jsonData` (object[]): JSON data array directly (if `jsonPath` is not provided).
*   `columns` (object[], required): Array describing the columns. Each column object can have:
    *   `key` (string): The key in the JSON data for this column.
    *   `header` (string, required): Text to display in the column header.
    *   `sortable` (boolean, optional, default: `false`): If the column is sortable.
    *   `filterable` (boolean, optional, default: `false`): If a filter should be created for this column.
    *   `format` (string, optional): Formatting type (e.g., 'currency:EUR', 'date:YYYY/MM/DD', 'percent:2').
    *   `render` (function, optional): Custom rendering function for the cell.
    *   `renderAs` (string, optional, default: `'text'`): Rendering type, e.g., `'chart'`.
    *   `visible` (boolean, optional, default: `true`): Initial visibility of the column.
    *   `chartConfig` (object, optional): Configuration if `renderAs` is `'chart'`.
*   `defaultSortColumn` (string, optional, default: `null`): Key of the column to sort by default.
*   `defaultSortDirection` (string, optional, default: `'asc'`): Default sort direction ('asc' or 'desc').
*   `rowsPerPage` (number, optional, default: `10` or first option in `rowsPerPageOptions`): Initial number of rows per page.
*   `rowsPerPageOptions` (array, optional, default: `[10, 25, 50, 100, 'All']`): Options for the rows per page selector.
*   `showSearchControl` (boolean, optional, default: `true`): If `true`, shows the global search input field.
*   `showResultsCount` (boolean, optional, default: `true`): If `true`, shows the results counter.
*   `showPagination` (boolean, optional, default: `true`): If `true`, shows the pagination controls.
*   `showRowsPerPageSelector` (boolean, optional, default: `true`): If `true`, shows the rows per page selector (part of pagination).
*   `showColumnVisibilitySelector` (boolean, optional, default: `true`): If `true`, shows the gear icon button to toggle column visibility. Set to `false` to hide this control.
*   `tableMaxHeight` (string, optional, default: `null`): Max CSS height for the table scroll wrapper (e.g., '400px').
*   `uniformChartHeight` (number, optional, default: `null`): If set, forces this height (in px) for all charts in the table.

## Extended-search
A fast and light advanced search input field with flags and multi-line information.
*(More documentation to come)*

## PureChart
A fast and light chart library.
*(More documentation to come)*

Thank you!