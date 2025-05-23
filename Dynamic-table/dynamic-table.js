/**
 * @file dynamic-table.js
 * @description Light and fast html table
 * @author Nicolas HANTEVILLE
 * @version 11
 *
 * Copyright 2025 Nicolas HANTEVILLE
 * @link https://github.com/omnia-projetcs/web_libs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
 
/**
 * @param {object} config - The configuration object.
 * @param {string} config.containerId - The ID of the HTML element where the table will be inserted.
 * @param {string} [config.jsonPath] - The path to the JSON data file (if jsonData is not provided).
 * @param {object[]} [config.jsonData] - The JSON data directly (if jsonPath is not provided).
 * @param {object[]} config.columns - Array describing the columns.
 * @param {string} [config.columns[].key] - The key in the JSON data.
 * @param {string} config.columns[].header - The text to display in the header.
 * @param {boolean} [config.columns[].sortable=false] - If the column is sortable.
 * @param {boolean} [config.columns[].filterable=false] - If a filter should be created.
 * @param {string} [config.columns[].format] - Formatting type. Ex: 'currency:EUR', 'date:YYYY/MM/DD', 'percent', 'percent:2', 'percent_neutral', 'percent_neutral:2'.
 * @param {function} [config.columns[].render] - Custom rendering function for the cell.
 * @param {string} [config.columns[].renderAs='text'] - Rendering type: 'text' or 'chart'.
 * @param {object} [config.columns[].chartConfig] - Configuration if renderAs is 'chart'.
 * @param {string} [config.columns[].chartConfig.type] - PureChart chart type.
 * @param {string} [config.columns[].chartConfig.dataKey] - Key for chart data.
 * @param {object} [config.columns[].chartConfig.options] - Options for PureChart.
 * @param {number} [config.columns[].chartConfig.width=150] - Canvas width.
 * @param {number} [config.columns[].chartConfig.height=75] - Canvas height (if uniformChartHeight is not set).
 * @param {number} [config.uniformChartHeight=null] - If set, forces this height (in px) for all charts in the table.
 * @param {number} [config.rowsPerPage=10] - Initial number of rows per page.
 * @param {string} [config.defaultSortColumn=null] - Default sort column key.
 * @param {'asc'|'desc'} [config.defaultSortDirection='asc'] - Default sort direction.
 * @param {boolean} [config.showSearchControl=true] - Show global search.
 * @param {boolean} [config.showResultsCount=true] - Show results counter.
 * @param {boolean} [config.showPagination=true] - Show pagination.
 * @param {boolean} [config.showRowsPerPageSelector=true] - Show rows per page selector.
 * @param {(number|string)[]} [config.rowsPerPageOptions=[10, 25, 50, 100, 'All']] - Options for the selector. 'All' displays all items.
 * @param {string|null} [config.tableMaxHeight=null] - Max CSS height for table scroll.
 */
function createDynamicTable(config) {
    const {
        containerId,
        jsonPath, 
        jsonData, 
        columns = [],
        defaultSortColumn = null,
        defaultSortDirection = 'asc',
        showSearchControl = true,
        showResultsCount = true,
        showPagination = true,
        showRowsPerPageSelector = true,
        rowsPerPageOptions = [10, 25, 50, 100, 'All'], // Default 'Tout' changed to 'All'
        tableMaxHeight = null,
        uniformChartHeight = null
    } = config;

    let initialRowsPerPageSetting = config.rowsPerPage !== undefined ? config.rowsPerPage : (rowsPerPageOptions[0] || 10);
    let currentRowsPerPage;

    // Handle 'All'/'Infinity' for rowsPerPage from config or options
    const isAllString = (val) => String(val).toLowerCase() === 'all' || String(val).toLowerCase() === 'tout'; // Keep 'tout' for backward compatibility if passed in config

    if (isAllString(initialRowsPerPageSetting) || String(initialRowsPerPageSetting).toLowerCase() === 'infinity') {
        currentRowsPerPage = Infinity;
    } else {
        currentRowsPerPage = Number(initialRowsPerPageSetting);
        if (isNaN(currentRowsPerPage) || currentRowsPerPage <= 0) {
            const firstValidOption = rowsPerPageOptions.find(opt => Number(opt) > 0 || isAllString(opt) || String(opt).toLowerCase() === 'infinity');
            if (firstValidOption) {
                 currentRowsPerPage = (isAllString(firstValidOption) || String(firstValidOption).toLowerCase() === 'infinity') ? Infinity : Number(firstValidOption);
            } else {
                currentRowsPerPage = 10; // Fallback if no valid option
            }
        }
    }

    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`[DynamicTable] Error: Container with ID "${containerId}" not found.`);
        return;
    }
    if (!jsonPath && !jsonData) {
        console.error(`[DynamicTable] Error: jsonPath or jsonData must be provided.`);
        container.innerHTML = `<p style="color:red;">Configuration Error: Data not provided.</p>`;
        return;
    }
     if (jsonData && !Array.isArray(jsonData)) {
        console.error(`[DynamicTable] Error: jsonData must be an array.`);
        container.innerHTML = `<p style="color:red;">Configuration Error: Invalid jsonData.</p>`;
        return;
    }
    if (!Array.isArray(columns) || columns.length === 0) {
        console.error(`[DynamicTable] Error: Columns definition (columns) is invalid.`);
        return;
    }

    let originalData = [];
    let displayData = [];
    let currentPage = 1;
    let sortColumn = defaultSortColumn;
    let sortDirection = defaultSortDirection;

    let tableWrapper, table, thead, tbody, controlsWrapper, globalSearchInput,
        filterSelects = {}, resultsCountSpan, paginationWrapper, prevButton,
        nextButton, pageInfoSpan, rowsPerPageSelectElement;

    function buildTableShell() {
        container.innerHTML = ''; 
        container.classList.add('dynamic-table-wrapper');

        controlsWrapper = document.createElement('div');
        controlsWrapper.className = 'dynamic-table-controls';
        let hasVisibleTopControls = false;

        if (showSearchControl) {
            const searchDiv = document.createElement('div');
            searchDiv.className = 'dynamic-table-search-control';
            const searchLabel = document.createElement('label');
            searchLabel.htmlFor = `${containerId}-global-search`;
            searchLabel.textContent = 'Global Search:'; // Translated
            globalSearchInput = document.createElement('input');
            globalSearchInput.type = 'search';
            globalSearchInput.id = `${containerId}-global-search`;
            globalSearchInput.placeholder = 'Search...'; // Translated
            searchDiv.appendChild(searchLabel);
            searchDiv.appendChild(globalSearchInput);
            controlsWrapper.appendChild(searchDiv);
            hasVisibleTopControls = true;
        }

        columns.forEach(col => {
            if (col.filterable && col.key) {
                const filterDiv = document.createElement('div');
                filterDiv.className = 'dynamic-table-filter-control';
                const filterLabel = document.createElement('label');
                filterLabel.htmlFor = `${containerId}-filter-${col.key}`;
                filterLabel.textContent = `Filter by ${col.header}:`; // Translated
                const select = document.createElement('select');
                select.id = `${containerId}-filter-${col.key}`;
                select.dataset.filterKey = col.key;
                select.classList.add('dt-common-select');
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = `All ${col.header}`; // Translated
                select.appendChild(defaultOption);
                filterDiv.appendChild(filterLabel);
                filterDiv.appendChild(select);
                controlsWrapper.appendChild(filterDiv);
                filterSelects[col.key] = select;
                hasVisibleTopControls = true;
            }
        });
        
        if (showResultsCount) {
             const resultsDiv = document.createElement('div');
             resultsDiv.className = 'dynamic-table-results-info';
             resultsCountSpan = document.createElement('strong');
             resultsCountSpan.textContent = '0';
             resultsDiv.appendChild(resultsCountSpan);
             resultsDiv.appendChild(document.createTextNode(' result(s)')); // Translated
             controlsWrapper.appendChild(resultsDiv);
             hasVisibleTopControls = true;
        }
        
        if (hasVisibleTopControls) {
            container.appendChild(controlsWrapper);
        }

        tableWrapper = document.createElement('div');
        tableWrapper.className = 'dynamic-table-scroll-wrapper';
        if (tableMaxHeight) {
            tableWrapper.style.maxHeight = tableMaxHeight;
            tableWrapper.style.overflowY = 'auto';
        }

        table = document.createElement('table');
        table.className = 'dynamic-table';
        thead = table.createTHead();
        tbody = table.createTBody();

        const headerRow = thead.insertRow();
        columns.forEach((col, index) => {
            const th = document.createElement('th');
            th.textContent = col.header;
            th.setAttribute('scope', 'col');
            if (col.sortable && col.key) {
                th.classList.add('sortable');
                th.dataset.column = col.key;
            }
            headerRow.appendChild(th);
        });
        tableWrapper.appendChild(table);
        container.appendChild(tableWrapper);

        if (showPagination) {
            paginationWrapper = document.createElement('div');
            paginationWrapper.className = 'dynamic-table-pagination';
            
            const rowsPerPageContainer = document.createElement('div');
            rowsPerPageContainer.className = 'dynamic-table-pagination-left';
            if (showRowsPerPageSelector) {
                const rowsPerPageDiv = document.createElement('div');
                rowsPerPageDiv.className = 'dynamic-table-rows-per-page-control';
                const rowsLabel = document.createElement('label');
                rowsLabel.htmlFor = `${containerId}-rows-per-page`;
                rowsLabel.textContent = 'Rows/page:'; // Translated
                rowsPerPageSelectElement = document.createElement('select');
                rowsPerPageSelectElement.id = `${containerId}-rows-per-page`;
                rowsPerPageSelectElement.classList.add('dt-common-select');

                rowsPerPageOptions.forEach(optionValue => {
                    const option = document.createElement('option');
                    const isCurrentAllOption = isAllString(optionValue);
                    option.value = isCurrentAllOption ? Infinity : optionValue;
                    option.textContent = String(optionValue); // Display original value (e.g., "All")
                    if ((isCurrentAllOption && currentRowsPerPage === Infinity) || 
                        (!isCurrentAllOption && Number(optionValue) === Number(currentRowsPerPage))) {
                        option.selected = true;
                    }
                    rowsPerPageSelectElement.appendChild(option);
                });
                rowsPerPageDiv.appendChild(rowsLabel);
                rowsPerPageDiv.appendChild(rowsPerPageSelectElement);
                rowsPerPageContainer.appendChild(rowsPerPageDiv);
            }
            paginationWrapper.appendChild(rowsPerPageContainer);

            const mainPaginationControlsDiv = document.createElement('div');
            mainPaginationControlsDiv.className = 'dynamic-table-main-pagination-controls';

            prevButton = document.createElement('button');
            prevButton.textContent = 'Previous'; // Translated
            prevButton.disabled = true;
            mainPaginationControlsDiv.appendChild(prevButton);

            pageInfoSpan = document.createElement('span');
            pageInfoSpan.textContent = 'Page 1 / 1'; // Translated
            mainPaginationControlsDiv.appendChild(pageInfoSpan);

            nextButton = document.createElement('button');
            nextButton.textContent = 'Next'; // Translated
            nextButton.disabled = true;
            mainPaginationControlsDiv.appendChild(nextButton);
            
            paginationWrapper.appendChild(mainPaginationControlsDiv);
            container.appendChild(paginationWrapper);
        }
        // Do not call showLoadingMessage here if data is passed directly and processed immediately
    }

    function formatValue(value, formatType) {
        if (value === null || typeof value === 'undefined') return '';
        
        const isNumericValue = typeof value === 'number';

        if (!isNumericValue && (String(formatType).startsWith('currency:') || String(formatType).startsWith('percent'))) {
            return value; // Non-numeric values cannot be formatted as currency/percent
        }

        if (typeof formatType === 'string') {
            if (formatType.startsWith('currency:')) {
                const parts = formatType.split(':');
                const currencyCode = parts[1] ? parts[1].toUpperCase() : 'EUR'; // Default to EUR if not specified
                let locale = (currencyCode === 'USD') ? 'en-US' : 'en-GB'; // Changed default non-USD locale to en-GB for wider understanding
                if (parts[2]) locale = parts[2]; // Allow specific locale override
                try {
                    return value.toLocaleString(locale, { style: 'currency', currency: currencyCode });
                } catch (e) {
                    console.warn(`[DynamicTable] Currency formatting error for ${currencyCode} with locale ${locale}:`, e);
                    return value; // Fallback to raw value
                }
            }
            if (formatType.startsWith('percent')) { 
                const isNeutral = formatType.includes('_neutral');
                if (isNeutral && value === 0) {
                    return '';
                }

                const parts = formatType.replace('_neutral', '').split(':');
                const decimals = parts[1] ? parseInt(parts[1], 10) : 0;

                if (isNaN(decimals) || decimals < 0) {
                    return (value * 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + '%';
                }
                return (value * 100).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + '%';
            }
            if (formatType === 'date:YYYY/MM/DD') {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    const month = ('0' + (date.getMonth() + 1)).slice(-2);
                    const day = ('0' + date.getDate()).slice(-2);
                    return `${year}/${month}/${day}`;
                }
                return value; // Return original if not a valid date
            }
            if (formatType === 'date') { // Default date format
                const date = new Date(value);
                return !isNaN(date.getTime()) ? date.toLocaleDateString('en-US') : value; // Changed to en-US locale
            }
        }
        return value;
    }

    function showLoadingMessage() {
        if (tbody) tbody.innerHTML = `<tr><td colspan="${columns.length}" class="message-row loading">Loading...</td></tr>`; // Translated
    }
    function showNoResultsMessage() {
        if (tbody) tbody.innerHTML = `<tr><td colspan="${columns.length}" class="message-row no-results">No results found.</td></tr>`; // Translated
    }
    
    function _initTableWithData(data) {
        originalData = data;
        if (!Array.isArray(originalData)) {
            console.error(`[DynamicTable ${containerId}] Error: Provided data is not an array.`);
            if (tbody) tbody.innerHTML = `<tr><td colspan="${columns.length}" class="message-row error">Error: Invalid data.</td></tr>`; // Translated
            return;
        }
        populateFilterOptions();
        processDataInternal();
    }
    
    async function _fetchAndInitData() {
        if (!jsonPath) { 
            console.error(`[DynamicTable ${containerId}] Error: jsonPath not defined.`);
            if (tbody) tbody.innerHTML = `<tr><td colspan="${columns.length}" class="message-row error">Error: JSON path not defined.</td></tr>`; // Translated
            return;
        }
        showLoadingMessage();
        try {
            const response = await fetch(jsonPath);
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            const data = await response.json();
            _initTableWithData(data);
        } catch (error) {
            console.error(`[DynamicTable ${containerId}] Fetch error:`, error);
            if (tbody) tbody.innerHTML = `<tr><td colspan="${columns.length}" class="message-row error">Error loading data.</td></tr>`; // Translated
            if (globalSearchInput) globalSearchInput.disabled = true;
            Object.values(filterSelects).forEach(sel => sel.disabled = true);
            if (prevButton) prevButton.disabled = true;
            if (nextButton) nextButton.disabled = true;
            if (rowsPerPageSelectElement) rowsPerPageSelectElement.disabled = true;
        }
    }

    function populateFilterOptions() {
        Object.entries(filterSelects).forEach(([key, selectElement]) => {
            if(selectElement) {
                // Keep the first option (e.g., "All X")
                while (selectElement.options.length > 1) selectElement.remove(1);
                const uniqueValues = [...new Set(originalData.map(item => item[key]))].sort();
                uniqueValues.forEach(val => {
                    if (val !== null && typeof val !== 'undefined') { // Ensure value is not null or undefined
                        const option = document.createElement('option');
                        option.value = val; option.textContent = val;
                        selectElement.appendChild(option);
                    }
                });
            }
        });
    }

    function processDataInternal() {
        const globalSearchTerm = (globalSearchInput && showSearchControl) ? globalSearchInput.value.trim().toLowerCase() : "";
        const activeFilters = {};
        Object.entries(filterSelects).forEach(([key, select]) => {
            if (select && select.value) activeFilters[key] = select.value;
        });

        let filteredData = originalData.filter(item => {
            // Check specific column filters
            const specificFiltersMatch = Object.entries(activeFilters).every(([key, value]) =>
                String(item[key]) === value // Ensure comparison as strings if needed
            );
             if (!specificFiltersMatch) return false;

            // Check global search term if active
            return !globalSearchTerm || Object.values(item).some(val =>
                String(val).toLowerCase().includes(globalSearchTerm)
            );
        });

        if (sortColumn) {
             filteredData.sort((a, b) => {
                let valA = a[sortColumn]; let valB = b[sortColumn];
                // Attempt numeric conversion for sorting if possible
                const numA = parseFloat(valA); const numB = parseFloat(valB);
                if (!isNaN(numA) && !isNaN(numB) && typeof valA !== 'boolean' && typeof valB !== 'boolean') { // Avoid converting booleans to numbers
                    valA = numA; valB = numB; 
                } else { // Otherwise, string comparison
                    valA = String(valA).toLowerCase(); valB = String(valB).toLowerCase(); 
                }
                if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
        displayData = filteredData;
        currentPage = 1; // Reset to first page after filtering/sorting
        renderTableInternal();
    }

    function renderTableInternal() {
        if (!tbody) return;
        tbody.innerHTML = '';

        if (displayData.length === 0) {
            showNoResultsMessage();
            if (showPagination) updatePaginationControlsInternal();
            if(resultsCountSpan) resultsCountSpan.textContent = '0';
            return;
        }
        
        let actualRowsToDisplayOnPage;
        if (!showPagination) { // If pagination is off, show all data
            actualRowsToDisplayOnPage = displayData.length;
        } else {
            actualRowsToDisplayOnPage = (currentRowsPerPage === Infinity) ? displayData.length : Number(currentRowsPerPage);
        }

        const totalPages = (actualRowsToDisplayOnPage === 0 && displayData.length > 0) ? 1 : Math.ceil(displayData.length / actualRowsToDisplayOnPage);
        currentPage = Math.max(1, Math.min(currentPage, totalPages)); // Ensure current page is valid
        
        const startIndex = (currentPage - 1) * actualRowsToDisplayOnPage;
        const endIndex = Math.min(startIndex + actualRowsToDisplayOnPage, displayData.length);

        const pageData = displayData.slice(startIndex, endIndex);

        pageData.forEach((item, itemIndex) => {
            const row = tbody.insertRow();
            columns.forEach((col, colIndex) => {
                const cell = row.insertCell();
                cell.innerHTML = ''; // Clear previous content

                const value = item[col.key];

                if (typeof col.render === 'function') {
                    col.render(value, item, cell);
                } else if (col.renderAs === 'chart' && col.chartConfig) {
                    cell.classList.add('dt-chart-cell');
                    const canvasId = `${containerId}-chart-${startIndex + itemIndex}-${colIndex}`;
                    const canvas = document.createElement('canvas');
                    canvas.id = canvasId;
                    canvas.width = col.chartConfig.width || 150;
                    canvas.height = uniformChartHeight || col.chartConfig.height || 75; 
                    cell.appendChild(canvas);
                    const chartData = item[col.chartConfig.dataKey];
                    if (chartData && typeof PureChart !== 'undefined') {
                        try {
                            new PureChart(canvasId, { type: col.chartConfig.type, data: chartData, options: col.chartConfig.options || {} });
                        } catch (e) { console.error(`[DynamicTable] Error creating chart ${canvasId}:`, e); cell.textContent = 'Chart Err.'; } // Translated
                    } else if (typeof PureChart === 'undefined') {
                        console.warn(`[DynamicTable] PureChart is not defined for column ${col.header}. Ensure PureChart.js is loaded.`);
                        cell.textContent = 'PureChart?'; // Translated
                    } else {
                        console.warn(`[DynamicTable] Data for chart not found via dataKey '${col.chartConfig.dataKey}' for column ${col.header}.`);
                        cell.textContent = 'Data?'; // Translated
                    }
                } else {
                    // Handle specific case for percent_neutral and 0 value
                    if (typeof col.format === 'string' && col.format.startsWith('percent_neutral') && typeof value === 'number' && value === 0) {
                        cell.textContent = '';
                    } else {
                        cell.textContent = formatValue(value, col.format);
                    }

                    // Apply positive/negative classes for non-neutral percentages
                    if (typeof col.format === 'string' && col.format.startsWith('percent') && !col.format.includes('_neutral') && typeof value === 'number') {
                        cell.classList.remove('dt-value-positive', 'dt-value-negative'); // Reset classes
                        if (value > 0) {
                            cell.classList.add('dt-value-positive');
                        } else if (value <= 0) { // Handles 0 and negative
                            cell.classList.add('dt-value-negative');
                        }
                    }
                }
            });
        });

        if (showPagination) updatePaginationControlsInternal();
        if(resultsCountSpan) resultsCountSpan.textContent = displayData.length.toLocaleString('en-US'); // Locale for results count
    }

    function updatePaginationControlsInternal() {
         if (!showPagination || !pageInfoSpan || !prevButton || !nextButton) return;
         
         const itemsPerPageForCalc = (currentRowsPerPage === Infinity) ? displayData.length : Number(currentRowsPerPage);
         const totalItems = displayData.length;
         let totalPages;

         if (totalItems === 0) {
             totalPages = 1; // Display "Page 1 / 1" even if no items
         } else if (itemsPerPageForCalc === 0) { // Avoid division by zero if rowsPerPage is somehow 0
             totalPages = 1;
         } else if (itemsPerPageForCalc >= totalItems && totalItems > 0) { // If items per page covers all items
             totalPages = 1;
         } else {
             totalPages = Math.ceil(totalItems / itemsPerPageForCalc);
         }
        
         currentPage = Math.max(1, Math.min(currentPage, totalPages)); // Ensure current page is valid

         pageInfoSpan.textContent = `Page ${currentPage} / ${totalPages}`; // Translated
         prevButton.disabled = currentPage === 1;
         nextButton.disabled = currentPage === totalPages || totalItems === 0;

         // Update selected option in rowsPerPageSelectElement
         if (rowsPerPageSelectElement) {
            const targetValue = currentRowsPerPage === Infinity ? "Infinity" : String(currentRowsPerPage);
            for (let i = 0; i < rowsPerPageSelectElement.options.length; i++) {
                if (rowsPerPageSelectElement.options[i].value.toLowerCase() === targetValue.toLowerCase()) {
                    rowsPerPageSelectElement.selectedIndex = i;
                    break;
                }
            }
        }
    }

     function updateSortIndicatorsInternal() {
         if (!thead) return;
         thead.querySelectorAll('th.sortable').forEach(th => {
            // Remove existing arrow first
            const arrow = th.querySelector('.sort-arrow');
            if (arrow) arrow.remove();
            // Add arrow if this is the sorted column
            if (th.dataset.column === sortColumn) {
                const arrowSpan = document.createElement('span');
                arrowSpan.className = 'sort-arrow ' + sortDirection;
                // arrowSpan.innerHTML = sortDirection === 'asc' ? '&#9650;' : '&#9660;'; // Unicode arrows
                th.appendChild(arrowSpan); // Append after text content
            }
        });
    }

    function attachEventListeners() {
        if (globalSearchInput) globalSearchInput.addEventListener('input', processDataInternal);

        Object.values(filterSelects).forEach(select => {
             if(select) select.addEventListener('change', processDataInternal);
        });

        if (rowsPerPageSelectElement) {
            rowsPerPageSelectElement.addEventListener('change', function() {
                const selectedVal = this.value;
                if (selectedVal.toLowerCase() === 'infinity') {
                    currentRowsPerPage = Infinity;
                } else {
                    currentRowsPerPage = parseInt(selectedVal, 10);
                    if (isNaN(currentRowsPerPage) || currentRowsPerPage <= 0) {
                        // Fallback to first valid option if parsing fails or value is invalid
                        const firstOptionVal = rowsPerPageOptions[0];
                        currentRowsPerPage = (isAllString(firstOptionVal) || String(firstOptionVal).toLowerCase() === 'infinity') ? Infinity : (Number(firstOptionVal) || 10);
                        // If first option is 'All' and there's data, show all, else default to 10
                        if(currentRowsPerPage === Infinity && displayData && displayData.length > 0) { /* Keep Infinity */ } 
                        else if (currentRowsPerPage === Infinity) { currentRowsPerPage = 10; }
                    }
                }
                currentPage = 1; // Reset to first page
                renderTableInternal();
            });
        }

        if (thead) {
            thead.querySelectorAll('th.sortable').forEach(header => {
                 header.addEventListener('click', () => {
                    const columnKey = header.dataset.column;
                    if (!columnKey) return; // Should not happen if 'sortable' class is only on valid columns
                    if (sortColumn === columnKey) {
                        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                    } else {
                        sortColumn = columnKey; sortDirection = 'asc';
                    }
                    updateSortIndicatorsInternal(); processDataInternal();
                });
            });
        }
        
        if (prevButton) {
            prevButton.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTableInternal(); } });
        }
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                const itemsPerPageForCalc = (currentRowsPerPage === Infinity) ? displayData.length : Number(currentRowsPerPage);
                let totalPages = 1;
                if (displayData.length > 0 && itemsPerPageForCalc > 0) { // Avoid division by zero
                     totalPages = Math.ceil(displayData.length / itemsPerPageForCalc);
                } else if (displayData.length === 0) { // If no data, only 1 page
                    totalPages = 1;
                } // If itemsPerPageForCalc is 0, totalPages remains 1 (already handled)
                
                if (currentPage < totalPages) { currentPage++; renderTableInternal(); }
            });
        }
    }
    
    // Initial setup
    buildTableShell(); 
    attachEventListeners(); 
    
    // Load data
    if (jsonData) {
        _initTableWithData(jsonData);
    } else if (jsonPath) {
        _fetchAndInitData();
    }
}
