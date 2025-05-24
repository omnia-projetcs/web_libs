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
        uniformChartHeight = null,
        showColumnVisibilitySelector = true // New configuration option
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
    let columnVisibilityStates = [];
    let activeChartInstances = []; // 1. Initialize activeChartInstances Array

    let tableWrapper, table, thead, tbody, controlsWrapper, globalSearchInput,
        filterSelects = {}, resultsCountSpan, paginationWrapper, prevButton,
        nextButton, pageInfoSpan, rowsPerPageSelectElement, columnSelectorWrapper;

    // Initialize columnVisibilityStates
    columns.forEach(col => {
        columnVisibilityStates.push({
            key: col.key, // Assuming each column has a key, crucial for matching
            header: col.header, // Store header for selector UI
            visible: col.visible !== undefined ? col.visible : true 
        });
    });

    function getVisibleColumnsCount() {
        return columnVisibilityStates.filter(col => col.visible).length;
    }

    function buildHeaderRow() {
        if (!thead) return;
        thead.innerHTML = ''; // Clear existing header
        const headerRow = thead.insertRow();
        columnVisibilityStates.forEach(colState => {
            if (colState.visible) {
                const originalCol = columns.find(c => c.key === colState.key); // Find original column for properties like 'sortable'
                const th = document.createElement('th');
                th.textContent = colState.header;
                th.setAttribute('scope', 'col');
                if (originalCol && originalCol.sortable && originalCol.key) {
                    th.classList.add('sortable');
                    th.dataset.column = originalCol.key;
                }
                headerRow.appendChild(th);
            }
        });
        // Re-apply sort indicators after rebuilding the header
        updateSortIndicatorsInternal();
    }

    function buildColumnSelector() {
        const selectorContainer = document.createElement('div');
        selectorContainer.className = 'dynamic-table-column-selector';

        const selectButton = document.createElement('button');
        selectButton.innerHTML = '&#x2699;'; // Gear icon
        selectButton.className = 'dt-column-selector-button';
        selectButton.setAttribute('aria-label', 'Select columns to display');
        selectButton.title = 'Select columns to display'; // Tooltip
        selectorContainer.appendChild(selectButton);

        const dropdown = document.createElement('div');
        dropdown.className = 'dt-column-selector-dropdown';
        dropdown.style.display = 'none'; // Initially hidden

        columnVisibilityStates.forEach(colState => {
            const checkboxId = `${containerId}-col-toggle-${colState.key}`;
            const listItem = document.createElement('div');
            listItem.className = 'dt-column-selector-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = checkboxId;
            checkbox.checked = colState.visible;
            checkbox.dataset.columnKey = colState.key;

            checkbox.addEventListener('change', function() {
                const key = this.dataset.columnKey;
                const stateToUpdate = columnVisibilityStates.find(cs => cs.key === key);
                if (stateToUpdate) {
                    stateToUpdate.visible = this.checked;
                }
                buildHeaderRow(); // Rebuild the header
                renderTableInternal(); // Re-render table body
                // updatePaginationControlsInternal(); // Already called by renderTableInternal if pagination is on
            });

            const label = document.createElement('label');
            label.htmlFor = checkboxId;
            label.textContent = colState.header;

            listItem.appendChild(checkbox);
            listItem.appendChild(label);
            dropdown.appendChild(listItem);
        });

        selectorContainer.appendChild(dropdown);

        selectButton.addEventListener('click', (event) => {
            event.stopPropagation();
            const currentlyOpen = dropdown.style.display === 'block';
            // Close other potential dropdowns if any (none in this component yet, but good practice)
            document.querySelectorAll('.dt-column-selector-dropdown').forEach(d => {
                if (d !== dropdown) d.style.display = 'none';
            });
            dropdown.style.display = currentlyOpen ? 'none' : 'block';
        });
        
        // Global click to close dropdown
        document.addEventListener('click', (event) => {
            if (!selectorContainer.contains(event.target) && dropdown.style.display === 'block') {
                dropdown.style.display = 'none';
            }
        });


        return selectorContainer;
    }

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
            searchLabel.textContent = 'Global Search:';
            globalSearchInput = document.createElement('input');
            globalSearchInput.type = 'search';
            globalSearchInput.id = `${containerId}-global-search`;
            globalSearchInput.placeholder = 'Search...';
            searchDiv.appendChild(searchLabel);
            searchDiv.appendChild(globalSearchInput);
            controlsWrapper.appendChild(searchDiv);
            hasVisibleTopControls = true;
        }
        
        // Add Column Selector to controls
        columnSelectorWrapper = buildColumnSelector(); // buildColumnSelector is now defined
        // controlsWrapper.appendChild(columnSelectorWrapper); // Will be added to rightControlsGroup
        // hasVisibleTopControls = true; // Will be set if rightControlsGroup is added or other controls

        columns.forEach(col => {
            if (col.filterable && col.key) {
                const filterDiv = document.createElement('div');
                filterDiv.className = 'dynamic-table-filter-control';
                const filterLabel = document.createElement('label');
                // ID will be set on the main select or custom select wrapper
                filterLabel.htmlFor = `${containerId}-filter-${col.key}`; 
                filterLabel.textContent = `Filter by ${col.header}:`;
                filterDiv.appendChild(filterLabel);

                if (col.format === 'flag') {
                    filterDiv.classList.add('custom-flag-filter');

                    const customSelect = document.createElement('div');
                    customSelect.id = `${containerId}-filter-${col.key}`; // ID for the label
                    customSelect.className = 'dt-custom-select';
                    customSelect.dataset.filterKey = col.key;

                    const trigger = document.createElement('div');
                    trigger.className = 'dt-custom-select-trigger';

                    const triggerValue = document.createElement('span');
                    triggerValue.className = 'dt-custom-select-value';
                    triggerValue.textContent = 'All'; // Changed: Default text for trigger
                    trigger.appendChild(triggerValue);

                    const arrow = document.createElement('span');
                    arrow.className = 'dt-custom-arrow';
                    arrow.innerHTML = '&#9660;'; // Down arrow, could be '▼'
                    trigger.appendChild(arrow);
                    
                    customSelect.appendChild(trigger);

                    const optionsContainer = document.createElement('div');
                    optionsContainer.className = 'dt-custom-options';
                    optionsContainer.style.display = 'none'; // Initially hidden
                    customSelect.appendChild(optionsContainer);

                    filterDiv.appendChild(customSelect);
                    filterSelects[col.key] = {
                        custom: true,
                        mainElement: customSelect,
                        triggerValueElement: triggerValue,
                        optionsContainer: optionsContainer,
                        value: '' // Initialize value for the custom select
                    };

                } else {
                    const select = document.createElement('select');
                    select.id = `${containerId}-filter-${col.key}`; // ID for the label
                    select.dataset.filterKey = col.key;
                    select.classList.add('dt-common-select');
                    
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = `All ${col.header}`;
                    select.appendChild(defaultOption);
                    
                    filterDiv.appendChild(select);
                    filterSelects[col.key] = { custom: false, element: select };
                }
                
                controlsWrapper.appendChild(filterDiv);
                hasVisibleTopControls = true;
            }
        });
        
        // Create a group for right-aligned controls
        const rightControlsGroup = document.createElement('div');
        rightControlsGroup.className = 'dynamic-table-right-controls-group';
        let hasRightControls = false;

        if (showResultsCount) {
             const resultsDiv = document.createElement('div');
             resultsDiv.className = 'dynamic-table-results-info';
             resultsCountSpan = document.createElement('strong');
             resultsCountSpan.textContent = '0';
             resultsDiv.appendChild(resultsCountSpan);
             resultsDiv.appendChild(document.createTextNode(' result(s)'));
             rightControlsGroup.appendChild(resultsDiv); // Append to group
             hasRightControls = true;
        }

        // Always add column selector to the right group
        // rightControlsGroup.appendChild(columnSelectorWrapper); // Made conditional below
        // hasRightControls = true; // Will be set if column selector is added

        if (showColumnVisibilitySelector) {
            columnSelectorWrapper = buildColumnSelector(); // Ensure it's created if shown
            rightControlsGroup.appendChild(columnSelectorWrapper);
            hasRightControls = true;
        }
        
        if (hasRightControls) { // Only append the group if it has children
            controlsWrapper.appendChild(rightControlsGroup);
            hasVisibleTopControls = true; // If right group has controls, then top controls are visible
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

        // buildColumnSelector needs to be defined before this, or this part needs to be a separate function
        // For now, let's assume buildHeaderRow will be called after buildColumnSelector is setup if needed
        // Or, call a dedicated function to build/rebuild the header
        buildHeaderRow(); 

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

    function getCanonicalCountryCode(value) {
        if (typeof value !== 'string' || !value.trim()) {
            return ""; 
        }
        let code = value.trim().toLowerCase();
        if (code.startsWith('fi-')) {
            code = code.substring(3);
        }
        return code;
    }

    function countryCodeToUnicodeFlag(countryCode) {
        if (!countryCode || countryCode.length !== 2) {
            return ''; // Or return countryCode itself as fallback
        }
        const codePoints = countryCode.toUpperCase().split('').map(char => 
            0x1F1E6 + (char.charCodeAt(0) - 'A'.charCodeAt(0))
        );
        return String.fromCodePoint(...codePoints);
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
            if (formatType === 'flag') {
                if (typeof value === 'string' && value.trim() !== '') {
                    let countryCode = value.trim().toLowerCase();
                    if (countryCode.startsWith('fi-')) {
                        countryCode = countryCode.substring(3); // Remove 'fi-'
                    }
                    // Basic validation: ensure it's likely a 2-letter code, though not strictly enforced here
                    if (countryCode.length >= 2) { 
                        return `<span class="fi fi-${countryCode}"></span>`;
                    }
                }
                return ''; // Return empty if not a valid string, empty, or becomes too short
            }
        }
        return value;
    }

    function showLoadingMessage() {
        const visibleCols = getVisibleColumnsCount();
        if (tbody) tbody.innerHTML = `<tr><td colspan="${visibleCols > 0 ? visibleCols : 1}" class="message-row loading">Loading...</td></tr>`; 
    }
    function showNoResultsMessage() {
        const visibleCols = getVisibleColumnsCount();
        if (tbody) tbody.innerHTML = `<tr><td colspan="${visibleCols > 0 ? visibleCols : 1}" class="message-row no-results">No results found.</td></tr>`; 
    }
    
    function _initTableWithData(data) {
        originalData = data;
        if (!Array.isArray(originalData)) {
            console.error(`[DynamicTable ${containerId}] Error: Provided data is not an array.`);
            const visibleCols = getVisibleColumnsCount();
            if (tbody) tbody.innerHTML = `<tr><td colspan="${visibleCols > 0 ? visibleCols : 1}" class="message-row error">Error: Invalid data.</td></tr>`; 
            return;
        }
        populateFilterOptions();
        processDataInternal();
    }
    
    async function _fetchAndInitData() {
        if (!jsonPath) { 
            console.error(`[DynamicTable ${containerId}] Error: jsonPath not defined.`);
            const visibleCols = getVisibleColumnsCount();
            if (tbody) tbody.innerHTML = `<tr><td colspan="${visibleCols > 0 ? visibleCols : 1}" class="message-row error">Error: JSON path not defined.</td></tr>`; 
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
            const visibleCols = getVisibleColumnsCount();
            if (tbody) tbody.innerHTML = `<tr><td colspan="${visibleCols > 0 ? visibleCols : 1}" class="message-row error">Error loading data.</td></tr>`; 
            if (globalSearchInput) globalSearchInput.disabled = true;
            Object.values(filterSelects).forEach(sel => sel.disabled = true);
            if (prevButton) prevButton.disabled = true;
            if (nextButton) nextButton.disabled = true;
            if (rowsPerPageSelectElement) rowsPerPageSelectElement.disabled = true;
        }
    }

    function populateCustomFlagOptions(filterKey, optionsContainer, triggerValueElement, canonicalValues, headerText) {
        optionsContainer.innerHTML = ''; // Clear existing options

        // "All" Option
        const allOptionDiv = document.createElement('div');
        allOptionDiv.className = 'dt-custom-option';
        allOptionDiv.textContent = 'All'; // Changed: Text for "All" option in dropdown
        allOptionDiv.dataset.value = "";
        allOptionDiv.addEventListener('click', () => {
            triggerValueElement.textContent = 'All'; // Changed: Text for trigger when "All" is selected
            filterSelects[filterKey].value = "";
            optionsContainer.style.display = 'none';
            optionsContainer.closest('.dt-custom-select').classList.remove('open');
            processDataInternal();
        });
        optionsContainer.appendChild(allOptionDiv);

        // Flag Options
        canonicalValues.forEach(canonicalCode => {
            const flagOptionDiv = document.createElement('div');
            flagOptionDiv.className = 'dt-custom-option';
            flagOptionDiv.dataset.value = canonicalCode;
            // Unicode flags are now used for display in cells/options, but for the trigger, we might want the flag icon via CSS
            // For consistency with cell rendering (which uses span.fi), we can use it here too if CSS is set up.
            // Or, use Unicode flag directly if preferred for trigger as well.
            // The subtask description for buildTableShell implies triggerValueElement is a span to hold text or HTML.
            // Let's assume the trigger should display the flag icon using the span.fi method for visual consistency with table cells.
            flagOptionDiv.innerHTML = `<span class="fi fi-${canonicalCode}"></span>`;


            flagOptionDiv.addEventListener('click', () => {
                triggerValueElement.innerHTML = `<span class="fi fi-${canonicalCode}"></span>`; // Display flag icon
                filterSelects[filterKey].value = canonicalCode;
                optionsContainer.style.display = 'none';
                optionsContainer.closest('.dt-custom-select').classList.remove('open');
                processDataInternal();
            });
            optionsContainer.appendChild(flagOptionDiv);
        });
    }

    function populateFilterOptions() {
        Object.entries(filterSelects).forEach(([key, filterConfig]) => {
            const columnDef = columns.find(c => c.key === key);
            const header = columnDef ? columnDef.header : '';

            if (filterConfig.custom) {
                const canonicalValues = [...new Set(originalData.map(item => getCanonicalCountryCode(item[key])))].filter(Boolean).sort();
                populateCustomFlagOptions(key, filterConfig.optionsContainer, filterConfig.triggerValueElement, canonicalValues, header);
            } else {
                // Standard select element
                const selectElement = filterConfig.element;
                if (selectElement) {
                    // Keep the first option ("All X")
                    while (selectElement.options.length > 1) selectElement.remove(1);
                    
                    const uniqueValues = [...new Set(originalData.map(item => item[key]))].sort();
                    uniqueValues.forEach(val => {
                        if (val !== null && typeof val !== 'undefined') {
                            const option = document.createElement('option');
                            option.value = val;
                            option.textContent = val;
                            selectElement.appendChild(option);
                        }
                    });
                }
            }
        });
    }

    function processDataInternal() {
        const globalSearchTerm = (globalSearchInput && showSearchControl) ? globalSearchInput.value.trim().toLowerCase() : "";
        const activeFilters = {};
        Object.entries(filterSelects).forEach(([key, filterConfig]) => {
            if (filterConfig.custom) {
                if (filterConfig.value) { // Check if a value is selected
                    activeFilters[key] = filterConfig.value;
                }
            } else {
                // Standard select
                if (filterConfig.element && filterConfig.element.value) {
                    activeFilters[key] = filterConfig.element.value;
                }
            }
        });

        let filteredData = originalData.filter(item => {
            // Check specific column filters
            const specificFiltersMatch = Object.entries(activeFilters).every(([key, value]) => {
                const columnConfig = columns.find(col => col.key === key); 
                if (columnConfig && columnConfig.format === 'flag') {
                    const itemCanonicalValue = getCanonicalCountryCode(item[key]);
                    return String(itemCanonicalValue) === value; 
                }
                return String(item[key]) === value; 
            });
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

        // --- BEGIN NEW CLEANUP LOGIC ---
        if (activeChartInstances && activeChartInstances.length > 0) {
            activeChartInstances.forEach(chart => {
                if (chart && typeof chart._onMouseOut === 'function') {
                    chart._onMouseOut(); // Hide tooltip and reset cursor
                }
                if (chart && chart.tooltipElement && chart.tooltipElement.parentNode) {
                    chart.tooltipElement.parentNode.removeChild(chart.tooltipElement);
                }
            });
        }
        activeChartInstances = []; // Reset for the current render pass
        // --- END NEW CLEANUP LOGIC ---

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
            const row = tbody.insertRow(); // Create the row

            // `columns` is the original full configuration array
            // `columnVisibilityStates` is the array like [{ key, header, visible }, ...]
            
            columnVisibilityStates.forEach((visState, colIndexOriginal) => { // colIndexOriginal to keep canvasId unique as before
                if (visState.visible) {
                    const colConfig = columns.find(c => c.key === visState.key);
                    
                    if (!colConfig) {
                        // This should not happen if keys are consistent
                        console.warn(`[DynamicTable] Column config not found for key: ${visState.key}`);
                        return; // Skip this cell
                    }

                    // Diagnostic logs removed from here

                    const cell = row.insertCell();
                    cell.innerHTML = ''; // Clear previous content
                    
                    const value = item[colConfig.key];

                    if (typeof colConfig.render === 'function') {
                        colConfig.render(value, item, cell);
                    } else if (colConfig.renderAs === 'chart' && colConfig.chartConfig) {
                        cell.classList.add('dt-chart-cell');
                        
                        // Create inner wrapper for canvas
                        const canvasWrapper = document.createElement('div');
                        canvasWrapper.className = 'dt-chart-canvas-wrapper';
                        cell.appendChild(canvasWrapper);

                        const canvasId = `${containerId}-chart-${startIndex + itemIndex}-${colIndexOriginal}`; // Use original index for unique ID
                        const canvas = document.createElement('canvas');
                        canvas.id = canvasId;
                        canvas.width = colConfig.chartConfig.width || 150;
                        canvas.height = uniformChartHeight || colConfig.chartConfig.height || 75; 
                        canvasWrapper.appendChild(canvas); // Append canvas to wrapper
                        
                        const chartData = item[colConfig.chartConfig.dataKey];
                        if (chartData && typeof PureChart !== 'undefined') {
                            try {
                                const chartInstance = new PureChart(canvasId, { type: colConfig.chartConfig.type, data: chartData, options: colConfig.chartConfig.options || {} });
                                if (chartInstance) { 
                                   activeChartInstances.push(chartInstance);
                                }
                            } catch (e) { console.error(`[DynamicTable] Error creating chart ${canvasId}:`, e); cell.textContent = 'Chart Err.'; }
                        } else if (typeof PureChart === 'undefined') {
                            console.warn(`[DynamicTable] PureChart is not defined for column ${colConfig.header}. Ensure PureChart.js is loaded.`);
                            cell.textContent = 'PureChart?';
                        } else {
                            console.warn(`[DynamicTable] Data for chart not found via dataKey '${colConfig.chartConfig.dataKey}' for column ${colConfig.header}.`);
                            cell.textContent = 'Data?';
                        }
                    } else {
                        const formattedValue = formatValue(value, colConfig.format);
                        if (typeof colConfig.format === 'string' && colConfig.format.startsWith('percent_neutral') && typeof value === 'number' && value === 0) {
                            cell.innerHTML = '';
                        } else if (colConfig.format === 'flag') {
                            cell.innerHTML = formattedValue;
                        } else {
                            cell.textContent = formattedValue;
                        }

                        if (typeof colConfig.format === 'string' && colConfig.format.startsWith('percent') && !colConfig.format.includes('_neutral') && typeof value === 'number') {
                            cell.classList.remove('dt-value-positive', 'dt-value-negative');
                            if (value > 0) {
                                cell.classList.add('dt-value-positive');
                            } else if (value <= 0) {
                                cell.classList.add('dt-value-negative');
                            }
                        }
                    }
                } else {
                    // Diagnostic logs removed from here
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

        Object.entries(filterSelects).forEach(([key, filterConfig]) => {
            if (filterConfig.custom) {
                const mainElement = filterConfig.mainElement;
                const trigger = mainElement.querySelector('.dt-custom-select-trigger');
                const optionsContainer = filterConfig.optionsContainer;

                if (trigger) {
                    trigger.addEventListener('click', (event) => {
                        event.stopPropagation(); // Prevent click from immediately closing due to document listener
                        const isOpen = mainElement.classList.contains('open');
                        // Close all other custom dropdowns
                        Object.values(filterSelects).forEach(fc => {
                            if (fc.custom && fc.mainElement !== mainElement) {
                                fc.mainElement.classList.remove('open');
                                fc.optionsContainer.style.display = 'none';
                            }
                        });
                        // Toggle current dropdown
                        mainElement.classList.toggle('open', !isOpen);
                        optionsContainer.style.display = isOpen ? 'none' : 'block';
                    });
                }
            } else {
                // Standard select
                if (filterConfig.element) {
                    filterConfig.element.addEventListener('change', processDataInternal);
                }
            }
        });

        // Global click listener to close custom dropdowns
        document.addEventListener('click', (event) => {
            Object.values(filterSelects).forEach(filterConfig => {
                if (filterConfig.custom && filterConfig.mainElement.classList.contains('open')) {
                    if (!filterConfig.mainElement.contains(event.target)) {
                        filterConfig.mainElement.classList.remove('open');
                        filterConfig.optionsContainer.style.display = 'none';
                    }
                }
            });
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
    buildTableShell(); // This will also call buildHeaderRow and buildColumnSelector internally
    attachEventListeners(); 
    
    // Load data
    if (jsonData) {
        _initTableWithData(jsonData);
    } else if (jsonPath) {
        _fetchAndInitData();
    }
}
