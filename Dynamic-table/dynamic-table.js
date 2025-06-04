/**
 * @file dynamic-table.js
 * @description Light and fast html table
 * @author Nicolas HANTEVILLE
 * @version 0.15
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

const DT_LANG_PACKS = {
  'en-US': {
    errorDataNotProvided: 'Configuration Error: Data not provided.',
    errorInvalidJsonData: 'Configuration Error: Invalid jsonData.',
    errorInvalidData: 'Error: Invalid data.',
    errorJsonPathNotDefined: 'Error: JSON path not defined.',
    errorLoadingData: 'Error loading data.',
    errorChart: 'Chart Error',
    errorPureChartMissing: 'Chart Library Missing',
    errorChartDataMissing: 'Chart Data Missing',
    columnSelectorAriaLabel: 'Select columns to display',
    columnSelectorTitle: 'Select columns to display',
    globalSearchLabel: 'Global Search:',
    globalSearchPlaceholder: 'Search...',
    filterByLabel: 'Filter by {columnName}:',
    headerFilterPlaceholder: 'Filter {columnName}...',
    allOption: 'All',
    allOptionWithColumn: 'All {columnName}',
    itemsSelected: '{count} selected',
    resultsInfo: '{count} result(s)',
    rowsPerPageLabel: 'Rows/page:',
    allRowsOptionLabel: 'All',
    previousButtonLabel: 'Previous',
    nextButtonLabel: 'Next',
    pageInfo: 'Page {currentPage} / {totalPages}',
    loadingMsg: 'Loading...',
    noResultsMsg: 'No results found.'
  },
  'fr-FR': {
    errorDataNotProvided: 'Erreur de configuration : Données non fournies.',
    errorInvalidJsonData: 'Erreur de configuration : Données jsonData invalides.',
    errorInvalidData: 'Erreur : Données invalides.',
    errorJsonPathNotDefined: 'Erreur : Chemin JSON non défini.',
    errorLoadingData: 'Erreur lors du chargement des données.',
    errorChart: 'Erreur de graphique',
    errorPureChartMissing: 'Bibliothèque de graphiques manquante',
    errorChartDataMissing: 'Données de graphique manquantes',
    columnSelectorAriaLabel: 'Sélectionner les colonnes à afficher',
    columnSelectorTitle: 'Afficher/Masquer les colonnes',
    globalSearchLabel: 'Recherche globale :',
    globalSearchPlaceholder: 'Rechercher...',
    filterByLabel: 'Filtrer par {columnName} :',
    headerFilterPlaceholder: 'Filtrer {columnName}...',
    allOption: 'Tous',
    allOptionWithColumn: 'Tous {columnName}',
    itemsSelected: '{count} sélectionné(s)',
    resultsInfo: '{count} résultat(s)',
    rowsPerPageLabel: 'Lignes/page :',
    allRowsOptionLabel: 'Toutes',
    previousButtonLabel: 'Précédent',
    nextButtonLabel: 'Suivant',
    pageInfo: 'Page {currentPage} / {totalPages}',
    loadingMsg: 'Chargement...',
    noResultsMsg: 'Aucun résultat trouvé.'
  },
'es-ES': {
    errorDataNotProvided: 'Error de configuración: Datos no proporcionados.',
    errorInvalidJsonData: 'Error de configuración: jsonData no válido.',
    errorInvalidData: 'Error: Datos no válidos.',
    errorJsonPathNotDefined: 'Error: Ruta JSON no definida.',
    errorLoadingData: 'Error al cargar los datos.',
    errorChart: 'Error del gráfico',
    errorPureChartMissing: 'Falta la librería de gráficos',
    errorChartDataMissing: 'Faltan datos del gráfico',
    columnSelectorAriaLabel: 'Seleccionar columnas para mostrar',
    columnSelectorTitle: 'Seleccionar columnas para mostrar',
    globalSearchLabel: 'Búsqueda global:',
    globalSearchPlaceholder: 'Buscar...',
    filterByLabel: 'Filtrar por {columnName}:',
    headerFilterPlaceholder: 'Filtrar {columnName}...',
    allOption: 'Todo',
    allOptionWithColumn: 'Todas las {columnName}',
    itemsSelected: '{count} seleccionado(s)',
    resultsInfo: '{count} resultado(s)',
    rowsPerPageLabel: 'Filas por página:',
    allRowsOptionLabel: 'Todas',
    previousButtonLabel: 'Anterior',
    nextButtonLabel: 'Siguiente',
    pageInfo: 'Página {currentPage} / {totalPages}',
    loadingMsg: 'Cargando...',
    noResultsMsg: 'No se encontraron resultados.'
  },
  'it-IT': {
    errorDataNotProvided: 'Errore di configurazione: Dati non forniti.',
    errorInvalidJsonData: 'Errore di configurazione: jsonData non valido.',
    errorInvalidData: 'Errore: Dati non validi.',
    errorJsonPathNotDefined: 'Errore: Percorso JSON non definito.',
    errorLoadingData: 'Errore durante il caricamento dei dati.',
    errorChart: 'Errore grafico',
    errorPureChartMissing: 'Libreria grafica mancante',
    errorChartDataMissing: 'Dati del grafico mancanti',
    columnSelectorAriaLabel: 'Seleziona colonne da visualizzare',
    columnSelectorTitle: 'Seleziona colonne da visualizzare',
    globalSearchLabel: 'Ricerca globale:',
    globalSearchPlaceholder: 'Cerca...',
    filterByLabel: 'Filtra per {columnName}:',
    headerFilterPlaceholder: 'Filtra {columnName}...',
    allOption: 'Tutti',
    allOptionWithColumn: 'Tutti i {columnName}',
    itemsSelected: '{count} selezionato(i)',
    resultsInfo: '{count} risultato(i)',
    rowsPerPageLabel: 'Righe per pagina:',
    allRowsOptionLabel: 'Tutte',
    previousButtonLabel: 'Precedente',
    nextButtonLabel: 'Successivo',
    pageInfo: 'Pagina {currentPage} / {totalPages}',
    loadingMsg: 'Caricamento...',
    noResultsMsg: 'Nessun risultato trovato.'
  },
  'de-DE': {
    errorDataNotProvided: 'Konfigurationsfehler: Daten nicht bereitgestellt.',
    errorInvalidJsonData: 'Konfigurationsfehler: Ungültige jsonData.',
    errorInvalidData: 'Fehler: Ungültige Daten.',
    errorJsonPathNotDefined: 'Fehler: JSON-Pfad nicht definiert.',
    errorLoadingData: 'Fehler beim Laden der Daten.',
    errorChart: 'Diagrammfehler',
    errorPureChartMissing: 'Diagrammbibliothek fehlt',
    errorChartDataMissing: 'Diagrammdaten fehlen',
    columnSelectorAriaLabel: 'Spalten zur Anzeige auswählen',
    columnSelectorTitle: 'Spalten zur Anzeige auswählen',
    globalSearchLabel: 'Globale Suche:',
    globalSearchPlaceholder: 'Suchen...',
    filterByLabel: 'Filtern nach {columnName}:',
    headerFilterPlaceholder: '{columnName} filtern...',
    allOption: 'Alle',
    allOptionWithColumn: 'Alle {columnName}',
    itemsSelected: '{count} ausgewählt',
    resultsInfo: '{count} Ergebnis(se)',
    rowsPerPageLabel: 'Zeilen pro Seite:',
    allRowsOptionLabel: 'Alle',
    previousButtonLabel: 'Zurück',
    nextButtonLabel: 'Weiter',
    pageInfo: 'Seite {currentPage} / {totalPages}',
    loadingMsg: 'Wird geladen...',
    noResultsMsg: 'Keine Ergebnisse gefunden.'
  }
};
 
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
 * @param {'text'|'regex'|'select'|'multiselect'|null} [config.columns[].headerFilterType=null] - Defines the type of filter to display in the header for this column. If null or undefined, no header filter is shown for this column.
 *     - `'text'`: Displays a text input. Filters by case-insensitive text matching, supporting `*` (multi-character) and `?` (single-character) wildcards.
 *     - `'regex'`: Displays a text input. Filters using a simplified, case-insensitive wildcard syntax: `*` for multi-character, `?` for single-character. This is converted internally to a regular expression.
 *     - `'select'`: Displays a dropdown select list with unique values from the column.
 *     - `'multiselect'`: Displays a dropdown list with checkboxes, allowing selection of multiple values. Rows match if the column's value is one of the selected options.
 * @param {'select'|'multiselect'} [config.columns[].globalFilterType='select'] - For a filterable column, specifies if the global filter control should be a standard single-select dropdown or a multi-select dropdown with checkboxes. Defaults to 'select'.
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
 * @param {'global'|'header'} [config.filterMode='global'] - Specifies the filter mode. 'global' uses top controls, 'header' uses in-header inputs. This is set at initialization.
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
        showColumnVisibilitySelector = true, // New configuration option
        language = 'en-US' // New language option
        // filterMode is now directly from config or defaults to 'global'
    } = config;

    const currentLangPack = DT_LANG_PACKS[language] || DT_LANG_PACKS['en-US'];

    const filterMode = config.filterMode || 'global';
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
        container.innerHTML = `<p style="color:red;">${currentLangPack.errorDataNotProvided}</p>`;
        return;
    }
     if (jsonData && !Array.isArray(jsonData)) {
        console.error(`[DynamicTable] Error: jsonData must be an array.`);
        container.innerHTML = `<p style="color:red;">${currentLangPack.errorInvalidJsonData}</p>`;
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

    function convertWildcardToRegex(pattern) {
        let regexString = "";
        for (const char of pattern) {
            if (char === '*') {
                regexString += '.*';
            } else if (char === '?') {
                regexString += '.';
            } else if (/[.+(){}\[\]\\^$|]/.test(char)) { // Check if char is a regex special char
                regexString += '\\' + char; // Escape it
            } else {
                regexString += char; // Add literal char
            }
        }
        return regexString;
    }

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
                const originalCol = columns.find(c => c.key === colState.key);
                const th = document.createElement('th');
                th.setAttribute('scope', 'col');

                const titleLineDiv = document.createElement('div');
                titleLineDiv.className = 'dt-title-line';

                const headerTextSpan = document.createElement('span');
                headerTextSpan.className = 'dt-header-text';
                headerTextSpan.textContent = colState.header;
                
                titleLineDiv.appendChild(headerTextSpan);
                th.appendChild(titleLineDiv);

                if (originalCol && originalCol.sortable && originalCol.key) {
                    th.classList.add('sortable');
                    th.dataset.column = originalCol.key;
                }

                if (filterMode === 'header' && originalCol && originalCol.filterable) {
                    const filterPlaceholder = document.createElement('div');
                    filterPlaceholder.className = 'dt-header-filter-placeholder';
                    
                    const filterType = originalCol.headerFilterType || null;

                    if (filterType) {
                        filterPlaceholder.innerHTML = ''; 

                        switch (filterType) {
                            case 'text':
                            case 'regex':
                                const input = document.createElement('input');
                                input.type = 'text';
                                input.placeholder = currentLangPack.headerFilterPlaceholder.replace('{columnName}', colState.header);
                                input.className = 'dt-header-filter-input';
                                input.dataset.columnKey = colState.key;
                                input.addEventListener('click', (e) => e.stopPropagation());
                                input.addEventListener('input', () => { 
                                    processDataInternal();
                                });
                                filterPlaceholder.appendChild(input);
                                break;
                            case 'select':
                                const select = document.createElement('select');
                                select.className = 'dt-header-filter-select';
                                select.dataset.columnKey = colState.key;
                                const defaultOption = document.createElement('option');
                                defaultOption.value = '';
                                defaultOption.textContent = currentLangPack.allOption;
                                select.appendChild(defaultOption);
                                // select.addEventListener('click', (e) => e.stopPropagation());
                                select.addEventListener('change', () => { 
                                    processDataInternal();
                                });
                                filterPlaceholder.appendChild(select);
                                break;
                            case 'multiselect':
                                const multiSelectDiv = document.createElement('div');
                                multiSelectDiv.className = 'dt-header-multiselect';
                                multiSelectDiv.dataset.columnKey = colState.key;

                                const triggerDiv = document.createElement('div');
                                triggerDiv.className = 'dt-multiselect-trigger';

                                const valueSpan = document.createElement('span');
                                valueSpan.className = 'dt-multiselect-value';
                                valueSpan.textContent = currentLangPack.allOption; // Default display text

                                const arrowSpan = document.createElement('span');
                                arrowSpan.className = 'dt-multiselect-arrow';
                                arrowSpan.innerHTML = '&#9660;';

                                triggerDiv.appendChild(valueSpan);
                                triggerDiv.appendChild(arrowSpan);

                                const dropdownDiv = document.createElement('div');
                                dropdownDiv.className = 'dt-multiselect-dropdown';
                                dropdownDiv.style.display = 'none';
                                // Items will be populated later

                                multiSelectDiv.appendChild(triggerDiv);
                                multiSelectDiv.appendChild(dropdownDiv);

                                // Prevent click on the component from sorting the column
                                multiSelectDiv.addEventListener('click', (e) => e.stopPropagation());
                                
                                triggerDiv.addEventListener('click', (event) => {
                                    // event.stopPropagation(); // Already stopped by multiSelectDiv's listener for the outer box
                                    const currentlyOpen = dropdownDiv.style.display === 'block';
                                    // Close other open multiselects first
                                    if (thead) { // Ensure thead is available
                                        thead.querySelectorAll('.dt-header-multiselect .dt-multiselect-dropdown').forEach(d => {
                                            if (d !== dropdownDiv) d.style.display = 'none';
                                        });
                                    }
                                    dropdownDiv.style.display = currentlyOpen ? 'none' : 'block';
                                });
                                
                                filterPlaceholder.appendChild(multiSelectDiv);
                                break;
                        }
                    }
                    th.appendChild(filterPlaceholder); // Appended after titleLineDiv
                }
                headerRow.appendChild(th);
            }
        });
        updateSortIndicatorsInternal();
    }

    function buildColumnSelector() {
        const selectorContainer = document.createElement('div');
        selectorContainer.className = 'dynamic-table-column-selector';

        const selectButton = document.createElement('button');
        selectButton.innerHTML = '&#x2699;'; // Gear icon
        selectButton.className = 'dt-column-selector-button';
        selectButton.setAttribute('aria-label', currentLangPack.columnSelectorAriaLabel);
        selectButton.title = currentLangPack.columnSelectorTitle; 
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
                populateFilterOptions(); // Repopulate filter options
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

        // Global Search Control (created first, then potentially hidden)
        let searchDiv; // Declare searchDiv to access its parentElement later
        if (showSearchControl) {
            searchDiv = document.createElement('div'); // Assign to searchDiv
            searchDiv.className = 'dynamic-table-search-control';
            const searchLabel = document.createElement('label');
            searchLabel.htmlFor = `${containerId}-global-search`;
            searchLabel.textContent = currentLangPack.globalSearchLabel;
            globalSearchInput = document.createElement('input');
            globalSearchInput.type = 'search';
            globalSearchInput.id = `${containerId}-global-search`;
            globalSearchInput.placeholder = currentLangPack.globalSearchPlaceholder;
            searchDiv.appendChild(searchLabel);
            searchDiv.appendChild(globalSearchInput);
            controlsWrapper.appendChild(searchDiv);
            hasVisibleTopControls = true;
        }
        
        // Global Filter Dropdowns (created first, then potentially hidden)
        const globalFilterControls = []; // To store references to filterDivs
        columns.forEach(col => {
            if (col.filterable && col.key) {
                const filterDiv = document.createElement('div');
                filterDiv.className = 'dynamic-table-filter-control';
                // Labels for global filters are fine even if hidden initially
                const filterLabel = document.createElement('label');
                filterLabel.htmlFor = `${containerId}-filter-${col.key}`; 
                filterLabel.textContent = currentLangPack.filterByLabel.replace('{columnName}', col.header);
                filterDiv.appendChild(filterLabel);

                const gFilterType = col.globalFilterType || 'select';

                if (gFilterType === 'multiselect') {
                    const globalMultiSelectDiv = document.createElement('div');
                    globalMultiSelectDiv.className = 'dt-global-multiselect dt-custom-select'; 
                    globalMultiSelectDiv.dataset.filterKey = col.key;

                    const triggerDiv = document.createElement('div');
                    triggerDiv.className = 'dt-custom-select-trigger';

                    const valueSpan = document.createElement('span');
                    valueSpan.className = 'dt-custom-select-value'; 
                    valueSpan.textContent = currentLangPack.allOptionWithColumn.replace('{columnName}', col.header); 

                    const arrowSpan = document.createElement('span');
                    arrowSpan.className = 'dt-custom-arrow'; 
                    arrowSpan.innerHTML = '&#9660;';

                    triggerDiv.appendChild(valueSpan);
                    triggerDiv.appendChild(arrowSpan);

                    const dropdownDiv = document.createElement('div');
                    dropdownDiv.className = 'dt-custom-options'; 
                    dropdownDiv.style.display = 'none';

                    globalMultiSelectDiv.appendChild(triggerDiv);
                    globalMultiSelectDiv.appendChild(dropdownDiv);
                    filterDiv.appendChild(globalMultiSelectDiv);

                    filterSelects[col.key] = {
                        custom: true, 
                        isGlobalMultiSelect: true, 
                        mainElement: globalMultiSelectDiv,
                        triggerValueElement: valueSpan,
                        optionsContainer: dropdownDiv,
                        value: [] 
                    };

                } else { // Handles 'select' and default cases (including flags)
                    if (col.format === 'flag') {
                        filterDiv.classList.add('custom-flag-filter');
                        const customSelect = document.createElement('div');
                        customSelect.id = `${containerId}-filter-${col.key}`;
                        customSelect.className = 'dt-custom-select';
                        customSelect.dataset.filterKey = col.key;
                        const trigger = document.createElement('div');
                        trigger.className = 'dt-custom-select-trigger';
                        const triggerValue = document.createElement('span');
                        triggerValue.className = 'dt-custom-select-value';
                        triggerValue.textContent = currentLangPack.allOption;
                        trigger.appendChild(triggerValue);
                        const arrow = document.createElement('span');
                        arrow.className = 'dt-custom-arrow';
                        arrow.innerHTML = '&#9660;';
                        trigger.appendChild(arrow);
                        customSelect.appendChild(trigger);
                        const optionsContainer = document.createElement('div');
                        optionsContainer.className = 'dt-custom-options';
                        optionsContainer.style.display = 'none';
                        customSelect.appendChild(optionsContainer);
                        filterDiv.appendChild(customSelect);
                        filterSelects[col.key] = {
                            custom: true,
                            isGlobalMultiSelect: false, // Explicitly false
                            mainElement: customSelect,
                            triggerValueElement: triggerValue,
                            optionsContainer: optionsContainer,
                            value: ''
                        };
                    } else {
                        const select = document.createElement('select');
                        select.id = `${containerId}-filter-${col.key}`;
                        select.dataset.filterKey = col.key;
                        select.classList.add('dt-common-select');
                        const defaultOption = document.createElement('option');
                        defaultOption.value = '';
                        defaultOption.textContent = currentLangPack.allOptionWithColumn.replace('{columnName}', col.header);
                        select.appendChild(defaultOption);
                        filterDiv.appendChild(select);
                        filterSelects[col.key] = { custom: false, isGlobalMultiSelect: false, element: select }; // Explicitly false
                    }
                }
                
                controlsWrapper.appendChild(filterDiv);
                globalFilterControls.push(filterDiv); // Store reference
                hasVisibleTopControls = true;
            }
        });

        // Hide global controls if filterMode is 'header'
        if (filterMode === 'header') {
            if (searchDiv) { // searchDiv is the parent of globalSearchInput
                searchDiv.style.display = 'none';
            }
            globalFilterControls.forEach(control => {
                control.style.display = 'none';
            });
        }
        
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
             // The result(s) text will be handled by updatePaginationControlsInternal or renderTableInternal
             // For now, let's ensure the number is followed by a space for the text to be appended.
             // resultsDiv.appendChild(document.createTextNode(currentLangPack.resultsInfo.replace('{count}', ''))); // This might be tricky if {count} is at the start
             // A better approach is to construct this fully where the count is known.
             // For now, let's leave a placeholder text that will be overwritten, or handle it in renderTableInternal.
             const resultsTextNode = document.createTextNode(''); // Placeholder, will be updated
             resultsDiv.appendChild(resultsTextNode);
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
                rowsLabel.textContent = currentLangPack.rowsPerPageLabel; 
                rowsPerPageSelectElement = document.createElement('select');
                rowsPerPageSelectElement.id = `${containerId}-rows-per-page`;
                rowsPerPageSelectElement.classList.add('dt-common-select');

                rowsPerPageOptions.forEach(optionValue => {
                    const option = document.createElement('option');
                    const isCurrentAllOption = isAllString(optionValue);
                    option.value = isCurrentAllOption ? Infinity : optionValue;
                    // option.textContent = String(optionValue); // Display original value (e.g., "All")
                    option.textContent = isCurrentAllOption ? currentLangPack.allRowsOptionLabel : String(optionValue);
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
            prevButton.textContent = currentLangPack.previousButtonLabel;
            prevButton.disabled = true;
            mainPaginationControlsDiv.appendChild(prevButton);

            pageInfoSpan = document.createElement('span');
            // Page info will be updated in updatePaginationControlsInternal
            pageInfoSpan.textContent = currentLangPack.pageInfo.replace('{currentPage}', '1').replace('{totalPages}', '1');
            mainPaginationControlsDiv.appendChild(pageInfoSpan);

            nextButton = document.createElement('button');
            nextButton.textContent = currentLangPack.nextButtonLabel;
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
                let locale = (currencyCode === 'USD') ? 'en-US' : 'en-GB'; // This line is no longer strictly needed for 'en-US' but kept for potential future locale strategies.
                if (parts[2]) locale = parts[2]; // User-specified locale could override 'en-US' if logic was different.
                try {
                    // Use 'en-US' for consistent decimal and initial thousands separator, then replace comma with space.
                    let formattedCurrency = value.toLocaleString('en-US', { style: 'currency', currency: currencyCode, useGrouping: true });
                    return formattedCurrency.replace(/,/g, ' ');
                } catch (e) {
                    console.warn(`[DynamicTable] Currency formatting error for ${currencyCode} with locale 'en-US':`, e);
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
                    let percentStr = (value * 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                    return percentStr.replace(/,/g, ' ') + '%';
                }
                let percentStr = (value * 100).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
                return percentStr.replace(/,/g, ' ') + '%';
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
        if (tbody) tbody.innerHTML = `<tr><td colspan="${visibleCols > 0 ? visibleCols : 1}" class="message-row loading">${currentLangPack.loadingMsg}</td></tr>`; 
    }
    function showNoResultsMessage() {
        const visibleCols = getVisibleColumnsCount();
        if (tbody) tbody.innerHTML = `<tr><td colspan="${visibleCols > 0 ? visibleCols : 1}" class="message-row no-results">${currentLangPack.noResultsMsg}</td></tr>`; 
    }
    
    function _initTableWithData(data) {
        originalData = data;
        if (!Array.isArray(originalData)) {
            console.error(`[DynamicTable ${containerId}] Error: Provided data is not an array.`);
            const visibleCols = getVisibleColumnsCount();
            if (tbody) tbody.innerHTML = `<tr><td colspan="${visibleCols > 0 ? visibleCols : 1}" class="message-row error">${currentLangPack.errorInvalidData}</td></tr>`; 
            return;
        }
        populateFilterOptions();
        processDataInternal();
    }
    
    async function _fetchAndInitData() {
        if (!jsonPath) { 
            console.error(`[DynamicTable ${containerId}] Error: jsonPath not defined.`);
            const visibleCols = getVisibleColumnsCount();
            if (tbody) tbody.innerHTML = `<tr><td colspan="${visibleCols > 0 ? visibleCols : 1}" class="message-row error">${currentLangPack.errorJsonPathNotDefined}</td></tr>`; 
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
            if (tbody) tbody.innerHTML = `<tr><td colspan="${visibleCols > 0 ? visibleCols : 1}" class="message-row error">${currentLangPack.errorLoadingData}</td></tr>`; 
            if (globalSearchInput) globalSearchInput.disabled = true;
            Object.values(filterSelects).forEach(sel => sel.disabled = true);
            if (prevButton) prevButton.disabled = true;
            if (nextButton) nextButton.disabled = true;
            if (rowsPerPageSelectElement) rowsPerPageSelectElement.disabled = true;
        }
    }

    function updateMultiSelectValueDisplay(multiSelectContainerElement, headerForDefaultAllText = null) {
        const checkedCheckboxes = multiSelectContainerElement.querySelectorAll('.dt-multiselect-item input[type="checkbox"]:checked');
        // Query for value span, accommodating both header and global multi-select structures
        const valueSpan = multiSelectContainerElement.querySelector('.dt-multiselect-value') || 
                          multiSelectContainerElement.querySelector('.dt-custom-select-value');
        if (!valueSpan) return;

        if (checkedCheckboxes.length === 0) {
            valueSpan.textContent = headerForDefaultAllText 
                ? currentLangPack.allOptionWithColumn.replace('{columnName}', headerForDefaultAllText) 
                : currentLangPack.allOption;
        } else if (checkedCheckboxes.length <= 2) { 
            let selectedTexts = [];
            checkedCheckboxes.forEach(cb => selectedTexts.push(cb.value));
            valueSpan.textContent = selectedTexts.join(', ');
        } else {
            valueSpan.textContent = currentLangPack.itemsSelected.replace('{count}', checkedCheckboxes.length);
        }
    }

    function populateFilterOptions() {
        Object.entries(filterSelects).forEach(([key, filterConfig]) => {
            const columnDef = columns.find(c => c.key === key);
            const header = columnDef ? columnDef.header : ''; // Used for 'All X' text

            if (filterConfig.custom && filterConfig.isGlobalMultiSelect) {
                const optionsContainer = filterConfig.optionsContainer; // The div to populate
                if (optionsContainer && originalData.length > 0) {
                    optionsContainer.innerHTML = ''; // Clear existing items

                    const uniqueValues = [...new Set(originalData.map(item => item[key]))]
                        .filter(val => val !== null && typeof val !== 'undefined' && String(val).trim() !== '')
                        .sort((a, b) => {
                            if (typeof a === 'number' && typeof b === 'number') return a - b;
                            return String(a).localeCompare(String(b));
                        });

                    uniqueValues.forEach(value => {
                        const checkboxId = `dt-gms-${containerId}-${key}-${String(value).replace(/\s+/g, '-')}`; // gms for global multi-select
                        
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'dt-multiselect-item';

                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.id = checkboxId;
                        checkbox.value = value;
                        checkbox.dataset.filterKey = key;

                        const label = document.createElement('label');
                        label.htmlFor = checkboxId;
                        label.textContent = value; 

                        itemDiv.appendChild(checkbox);
                        itemDiv.appendChild(label);
                        optionsContainer.appendChild(itemDiv);

                        checkbox.addEventListener('change', () => {
                            const checkedCBs = optionsContainer.querySelectorAll('input[type="checkbox"]:checked');
                            let selectedValues = [];
                            checkedCBs.forEach(cb => selectedValues.push(cb.value));
                            filterSelects[key].value = selectedValues; // Update array of selected values
                            
                            updateMultiSelectValueDisplay(filterConfig.mainElement, header); 
                            processDataInternal();
                        });
                    });
                    // After populating, update display in case of pre-selected values (none for now)
                    updateMultiSelectValueDisplay(filterConfig.mainElement, header);
                }

            } else if (filterConfig.custom) { // Handles other custom types (e.g., flags)
                const canonicalValues = [...new Set(originalData.map(item => getCanonicalCountryCode(item[key])))].filter(Boolean).sort();
                populateCustomFlagOptions(key, filterConfig.optionsContainer, filterConfig.triggerValueElement, canonicalValues, header);
            
            } else { // Standard select element (non-custom)
                const selectElement = filterConfig.element;
                if (selectElement) {
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

        // Populate header select and multi-select filters
        if (thead && originalData.length > 0) {
            columns.forEach(colConfig => {
                if (colConfig.filterable && colConfig.key) {
                    if (colConfig.headerFilterType === 'select') {
                        const headerSelectElement = thead.querySelector(`.dt-header-filter-select[data-column-key="${colConfig.key}"]`);
                        if (headerSelectElement) {
                            while (headerSelectElement.options.length > 1) {
                                headerSelectElement.remove(1);
                            }
                            const uniqueValues = [...new Set(originalData.map(item => item[colConfig.key]))]
                                .filter(val => val !== null && typeof val !== 'undefined' && String(val).trim() !== '')
                                .sort((a, b) => {
                                    if (typeof a === 'number' && typeof b === 'number') return a - b;
                                    return String(a).localeCompare(String(b));
                                });
                            uniqueValues.forEach(val => {
                                const option = document.createElement('option');
                                option.value = val;
                                option.textContent = val; 
                                headerSelectElement.appendChild(option);
                            });
                        }
                    } else if (colConfig.headerFilterType === 'multiselect') {
                        const multiSelectContainer = thead.querySelector(`.dt-header-multiselect[data-column-key="${colConfig.key}"]`);
                        if (multiSelectContainer) {
                            const dropdownDiv = multiSelectContainer.querySelector('.dt-multiselect-dropdown');
                            if (dropdownDiv) {
                                dropdownDiv.innerHTML = ''; // Clear existing items
                                const uniqueValues = [...new Set(originalData.map(item => item[colConfig.key]))]
                                    .filter(val => val !== null && typeof val !== 'undefined' && String(val).trim() !== '')
                                    .sort((a, b) => {
                                        if (typeof a === 'number' && typeof b === 'number') return a - b;
                                        return String(a).localeCompare(String(b));
                                    });

                                uniqueValues.forEach(value => {
                                    const checkboxId = `dt-ms-${containerId}-${colConfig.key}-${String(value).replace(/\s+/g, '-')}`;
                                    
                                    const itemDiv = document.createElement('div');
                                    itemDiv.className = 'dt-multiselect-item';

                                    const checkbox = document.createElement('input');
                                    checkbox.type = 'checkbox';
                                    checkbox.id = checkboxId;
                                    checkbox.value = value;
                                    checkbox.dataset.columnKey = colConfig.key;

                                    const label = document.createElement('label');
                                    label.htmlFor = checkboxId;
                                    label.textContent = value; 

                                    itemDiv.appendChild(checkbox);
                                    itemDiv.appendChild(label);
                                    dropdownDiv.appendChild(itemDiv);

                                    checkbox.addEventListener('change', () => {
                                        updateMultiSelectValueDisplay(multiSelectContainer); // Header version call
                                        processDataInternal();
                                    });
                                });
                                // After populating, update display in case of pre-selected values (future enhancement)
                                updateMultiSelectValueDisplay(multiSelectContainer);
                            }
                        }
                    }
                }
            });
        }
    }

    function populateCustomFlagOptions(filterKey, optionsContainer, triggerValueElement, canonicalValues, headerText) {
        optionsContainer.innerHTML = ''; // Clear existing options

        // "All" Option
        const allOptionDiv = document.createElement('div');
        allOptionDiv.className = 'dt-custom-option';
        allOptionDiv.textContent = currentLangPack.allOption; 
        allOptionDiv.dataset.value = "";
        allOptionDiv.addEventListener('click', () => {
            triggerValueElement.textContent = currentLangPack.allOption; 
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

    function processDataInternal() {
        let filteredData;

        if (filterMode === 'header') {
            const activeHeaderFilters = {};
            if (thead) { // Ensure thead exists
                columns.forEach(colConfig => {
                    if (colConfig.filterable && colConfig.headerFilterType && colConfig.key) {
                        const columnKey = colConfig.key;

                        switch (colConfig.headerFilterType) {
                            case 'text':
                            case 'regex':
                                const inputElement = thead.querySelector(`.dt-header-filter-input[data-column-key="${columnKey}"]`);
                                if (inputElement && inputElement.value.trim()) {
                                    activeHeaderFilters[columnKey] = {
                                        value: inputElement.value.trim(),
                                        type: colConfig.headerFilterType
                                    };
                                }
                                break;
                            case 'select':
                                const selectElement = thead.querySelector(`.dt-header-filter-select[data-column-key="${columnKey}"]`);
                                if (selectElement && selectElement.value) {
                                    activeHeaderFilters[columnKey] = {
                                        value: selectElement.value,
                                        type: 'select'
                                    };
                                }
                                break;
                            case 'multiselect':
                                const multiSelectContainer = thead.querySelector(`.dt-header-multiselect[data-column-key="${columnKey}"]`);
                                if (multiSelectContainer) {
                                    const checkedCheckboxes = multiSelectContainer.querySelectorAll('.dt-multiselect-item input[type="checkbox"]:checked');
                                    if (checkedCheckboxes.length > 0) {
                                        let selectedValues = [];
                                        checkedCheckboxes.forEach(cb => selectedValues.push(cb.value));
                                        activeHeaderFilters[columnKey] = {
                                            values: selectedValues, // Array of selected string values
                                            type: 'multiselect'
                                        };
                                    }
                                }
                                break;
                        }
                    }
                });
            }

            filteredData = originalData.filter(item => {
                for (const key in activeHeaderFilters) {
                    const columnConfig = columns.find(col => col.key === key); // Redundant if already have originalColumn above, but good for safety
                    const itemValue = item[key];
                    const filterDetails = activeHeaderFilters[key];
                    const filterValue = filterDetails.value;
                    const safeItemValue = String(itemValue !== null && itemValue !== undefined ? itemValue : '');

                    if (filterDetails.type === 'text' || filterDetails.type === 'regex') {
                        const actualRegexPattern = convertWildcardToRegex(filterValue);
                        try {
                            const regex = new RegExp(actualRegexPattern, 'i');
                            if (!regex.test(safeItemValue)) return false;
                        } catch (e) {
                            console.warn(`[DynamicTable] Invalid pattern/regex for column ${key}: ${filterValue} (converted to ${actualRegexPattern})`, e);
                            return false; 
                        }
                    } else if (filterDetails.type === 'select') {
                        if (safeItemValue !== filterValue) return false;
                    } else if (filterDetails.type === 'multiselect') {
                        // itemValue is already stringified as safeItemValue
                        if (filterDetails.values && filterDetails.values.length > 0) {
                            // Ensure item's value for this column is one of the selected values.
                            // Values in filterDetails.values are already strings from checkbox.value
                            if (!filterDetails.values.includes(safeItemValue)) {
                                return false; 
                            }
                        }
                        // If filterDetails.values is empty or undefined, this filter doesn't apply, so don't return false.
                    }
                }
                return true; 
            });

        } else { // 'global' filterMode
            const globalSearchTerm = (globalSearchInput && showSearchControl) ? globalSearchInput.value.trim().toLowerCase() : "";
            const activeGlobalFilters = {}; // Renamed to avoid confusion with activeHeaderFilters
            Object.entries(filterSelects).forEach(([key, filterConfig]) => {
                if (filterConfig.custom) {
                    if (filterConfig.value) {
                        activeGlobalFilters[key] = filterConfig.value;
                    }
                } else {
                    if (filterConfig.element && filterConfig.element.value) {
                        activeGlobalFilters[key] = filterConfig.element.value;
                    }
                }
            });

            filteredData = originalData.filter(item => {
                const specificFiltersMatch = Object.entries(activeGlobalFilters).every(([key, filterValue]) => {
                    const columnConfig = columns.find(col => col.key === key);
                    const itemValueString = String(item[key] !== null && item[key] !== undefined ? item[key] : '');

                    if (columnConfig && columnConfig.globalFilterType === 'multiselect') {
                        if (Array.isArray(filterValue) && filterValue.length > 0) {
                            return filterValue.includes(itemValueString);
                        }
                        return true; // If filterValue is an empty array (no selections), it effectively means "all" for this filter.
                    } else if (columnConfig && columnConfig.format === 'flag') { // For single-select custom flag filter
                        const itemCanonicalValue = getCanonicalCountryCode(item[key]);
                        return String(itemCanonicalValue) === filterValue;
                    }
                    // Default for single select (standard select elements)
                    return itemValueString === filterValue;
                });
                if (!specificFiltersMatch) return false;

                // Global search term logic (only if global search is enabled and term is present)
                if (showSearchControl && globalSearchTerm) {
                    return Object.values(item).some(val =>
                        String(val !== null && val !== undefined ? val : '').toLowerCase().includes(globalSearchTerm)
                    );
                }
                return true; // Passed specific filters, and global search is either not active or also passed
            });
        }

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
                            } catch (e) { console.error(`[DynamicTable] Error creating chart ${canvasId}:`, e); cell.textContent = currentLangPack.errorChart; }
                        } else if (typeof PureChart === 'undefined') {
                            console.warn(`[DynamicTable] PureChart is not defined for column ${colConfig.header}. Ensure PureChart.js is loaded.`);
                            cell.textContent = currentLangPack.errorPureChartMissing;
                        } else {
                            console.warn(`[DynamicTable] Data for chart not found via dataKey '${colConfig.chartConfig.dataKey}' for column ${colConfig.header}.`);
                            cell.textContent = currentLangPack.errorChartDataMissing;
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
        if(resultsCountSpan && resultsCountSpan.parentNode) { // Check if resultsCountSpan and its parent (resultsDiv) exist
            let countStr = displayData.length.toLocaleString('en-US'); 
            countStr = countStr.replace(/,/g, ' '); 
            resultsCountSpan.textContent = countStr;
            // Update the accompanying text node, which is the next sibling of resultsCountSpan
            const textNode = resultsCountSpan.nextSibling;
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                textNode.textContent = ` ${currentLangPack.resultsInfo.replace('{count}', '')}`;
            }
        }
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

         pageInfoSpan.textContent = currentLangPack.pageInfo.replace('{currentPage}', currentPage).replace('{totalPages}', totalPages);
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
            
            if (th.dataset.column === sortColumn) {
                const arrowSpan = document.createElement('span');
                arrowSpan.className = 'sort-arrow ' + sortDirection;
                
                const titleLineDiv = th.querySelector('.dt-title-line');
                if (titleLineDiv) {
                    titleLineDiv.appendChild(arrowSpan);
                } else {
                    // Fallback: this case should ideally not be reached if buildHeaderRow is correct
                    th.appendChild(arrowSpan); 
                }
            }
        });
    }

    function attachEventListeners() {
        // Removed filterModeToggle event listener block

        if (globalSearchInput) globalSearchInput.addEventListener('input', processDataInternal);
        
        // Global click listener to close custom dropdowns (flags, column visibility, AND multiselect)
        document.addEventListener('click', (event) => {
            // For custom flag filter dropdowns AND global multi-selects
            Object.values(filterSelects).forEach(fConfig => {
                if (fConfig.custom && fConfig.mainElement.classList.contains('open')) { // .open class is key
                    if (!fConfig.mainElement.contains(event.target)) {
                        fConfig.mainElement.classList.remove('open');
                        if (fConfig.optionsContainer) { // Check as not all custom might have it
                           fConfig.optionsContainer.style.display = 'none';
                        }
                    }
                }
            });

            // For column visibility dropdown
            if (columnSelectorWrapper) {
                const dropdown = columnSelectorWrapper.querySelector('.dt-column-selector-dropdown');
                if (dropdown && dropdown.style.display === 'block') {
                    if (!columnSelectorWrapper.contains(event.target)) {
                        dropdown.style.display = 'none';
                    }
                }
            }
            
            // For header multi-select dropdowns
            if (thead) { // Check if thead exists, relevant if table is not yet fully built or is destroyed
                thead.querySelectorAll('.dt-header-multiselect').forEach(msContainer => {
                    const dropdown = msContainer.querySelector('.dt-multiselect-dropdown');
                    if (dropdown && dropdown.style.display === 'block') {
                        if (!msContainer.contains(event.target)) {
                            dropdown.style.display = 'none';
                        }
                    }
                });
            }
        });


        Object.entries(filterSelects).forEach(([key, fConfig]) => {
            if (fConfig.custom) { // Handles both custom flag filters and global multi-selects
                const mainElement = fConfig.mainElement;
                const trigger = mainElement.querySelector('.dt-custom-select-trigger'); 
                const optionsContainer = fConfig.optionsContainer;

                if (trigger && optionsContainer) {
                    trigger.addEventListener('click', (event) => {
                        event.stopPropagation();
                        const isOpen = mainElement.classList.contains('open');

                        // Close ALL other custom global dropdowns (flags and other multi-selects)
                        Object.values(filterSelects).forEach(otherFConfig => {
                            if (otherFConfig.custom && otherFConfig.mainElement !== mainElement) {
                                otherFConfig.mainElement.classList.remove('open');
                                if (otherFConfig.optionsContainer) {
                                    otherFConfig.optionsContainer.style.display = 'none';
                                }
                            }
                        });

                        mainElement.classList.toggle('open', !isOpen);
                        optionsContainer.style.display = isOpen ? 'none' : 'block';
                    });
                }
            } else { // Standard single-select global filters
                if (fConfig.element) {
                    fConfig.element.addEventListener('change', processDataInternal);
                }
            }
        });

        // The global document click listener for closing dropdowns is already updated above.

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
            thead.addEventListener('click', (event) => {
                const target = event.target;
                const sortableHeader = target.closest('th.sortable');

                if (!sortableHeader) {
                    return; // Click was not on a sortable header cell or its child
                }

                // Check if the click originated from within a filter placeholder
                if (target.closest('.dt-header-filter-placeholder')) {
                    return; // Don't sort if click is on or in a filter input
                }

                const columnKey = sortableHeader.dataset.column;
                if (!columnKey) {
                    return; // Should not happen if 'sortable' class is on a valid column
                }

                if (sortColumn === columnKey) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    sortColumn = columnKey;
                    sortDirection = 'asc';
                }
                updateSortIndicatorsInternal();
                processDataInternal();
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
