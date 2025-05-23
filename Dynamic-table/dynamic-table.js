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
 * @param {object} config - L'objet de configuration.
 * @param {string} config.containerId - L'ID de l'élément HTML où insérer le tableau.
 * @param {string} [config.jsonPath] - Le chemin vers le fichier de données JSON (si jsonData n'est pas fourni).
 * @param {object[]} [config.jsonData] - Les données JSON directement (si jsonPath n'est pas fourni).
 * @param {object[]} config.columns - Tableau décrivant les colonnes.
 * @param {string} [config.columns[].key] - La clé dans les données JSON.
 * @param {string} config.columns[].header - Le texte à afficher dans l'en-tête.
 * @param {boolean} [config.columns[].sortable=false] - Si la colonne est triable.
 * @param {boolean} [config.columns[].filterable=false] - Si un filtre doit être créé.
 * @param {string} [config.columns[].format] - Type de formatage. Ex: 'currency:EUR', 'date:YYYY/MM/DD', 'percent', 'percent:2', 'percent_neutral', 'percent_neutral:2'.
 * @param {function} [config.columns[].render] - Fonction de rendu personnalisée pour la cellule.
 * @param {string} [config.columns[].renderAs='text'] - Type de rendu: 'text' ou 'chart'.
 * @param {object} [config.columns[].chartConfig] - Configuration si renderAs est 'chart'.
 * @param {string} [config.columns[].chartConfig.type] - Type de graphique PureChart.
 * @param {string} [config.columns[].chartConfig.dataKey] - Clé des données du graphique.
 * @param {object} [config.columns[].chartConfig.options] - Options pour PureChart.
 * @param {number} [config.columns[].chartConfig.width=150] - Largeur du canvas.
 * @param {number} [config.columns[].chartConfig.height=75] - Hauteur du canvas (si uniformChartHeight n'est pas défini).
 * @param {number} [config.uniformChartHeight=null] - Si défini, force cette hauteur (en px) pour tous les graphiques du tableau.
 * @param {number} [config.rowsPerPage=10] - Nombre de lignes par page initial.
 * @param {string} [config.defaultSortColumn=null] - Clé de la colonne de tri par défaut.
 * @param {'asc'|'desc'} [config.defaultSortDirection='asc'] - Direction de tri par défaut.
 * @param {boolean} [config.showSearchControl=true] - Afficher la recherche globale.
 * @param {boolean} [config.showResultsCount=true] - Afficher le compteur de résultats.
 * @param {boolean} [config.showPagination=true] - Afficher la pagination.
 * @param {boolean} [config.showRowsPerPageSelector=true] - Afficher le sélecteur de lignes/page.
 * @param {(number|string)[]} [config.rowsPerPageOptions=[10, 25, 50, 100, 'Tout']] - Options pour le sélecteur.
 * @param {string|null} [config.tableMaxHeight=null] - Hauteur CSS max pour le scroll du tableau.
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
        rowsPerPageOptions = [10, 25, 50, 100, 'Tout'],
        tableMaxHeight = null,
        uniformChartHeight = null
    } = config;

    let initialRowsPerPageSetting = config.rowsPerPage !== undefined ? config.rowsPerPage : (rowsPerPageOptions[0] || 10);
    let currentRowsPerPage;

    if (String(initialRowsPerPageSetting).toLowerCase() === 'tout' || String(initialRowsPerPageSetting).toLowerCase() === 'infinity') {
        currentRowsPerPage = Infinity;
    } else {
        currentRowsPerPage = Number(initialRowsPerPageSetting);
        if (isNaN(currentRowsPerPage) || currentRowsPerPage <= 0) {
            const firstValidOption = rowsPerPageOptions.find(opt => Number(opt) > 0 || String(opt).toLowerCase() === 'tout' || String(opt).toLowerCase() === 'infinity');
            if (firstValidOption) {
                 currentRowsPerPage = (String(firstValidOption).toLowerCase() === 'tout' || String(firstValidOption).toLowerCase() === 'infinity') ? Infinity : Number(firstValidOption);
            } else {
                currentRowsPerPage = 10;
            }
        }
    }

    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`[DynamicTable] Erreur: Conteneur avec ID "${containerId}" introuvable.`);
        return;
    }
    if (!jsonPath && !jsonData) {
        console.error(`[DynamicTable] Erreur: jsonPath ou jsonData doit être fourni.`);
        container.innerHTML = `<p style="color:red;">Erreur de configuration: Données non fournies.</p>`;
        return;
    }
     if (jsonData && !Array.isArray(jsonData)) {
        console.error(`[DynamicTable] Erreur: jsonData doit être un tableau.`);
        container.innerHTML = `<p style="color:red;">Erreur de configuration: jsonData invalide.</p>`;
        return;
    }
    if (!Array.isArray(columns) || columns.length === 0) {
        console.error(`[DynamicTable] Erreur: Définition des colonnes (columns) invalide.`);
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
            searchLabel.textContent = 'Recherche globale :';
            globalSearchInput = document.createElement('input');
            globalSearchInput.type = 'search';
            globalSearchInput.id = `${containerId}-global-search`;
            globalSearchInput.placeholder = 'Rechercher...';
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
                filterLabel.textContent = `Filtrer par ${col.header} :`;
                const select = document.createElement('select');
                select.id = `${containerId}-filter-${col.key}`;
                select.dataset.filterKey = col.key;
                select.classList.add('dt-common-select');
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = `Tous les ${col.header}`;
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
             resultsDiv.appendChild(document.createTextNode(' résultat(s)'));
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
                rowsLabel.textContent = 'Lignes/page:';
                rowsPerPageSelectElement = document.createElement('select');
                rowsPerPageSelectElement.id = `${containerId}-rows-per-page`;
                rowsPerPageSelectElement.classList.add('dt-common-select');

                rowsPerPageOptions.forEach(optionValue => {
                    const option = document.createElement('option');
                    const isAllOption = String(optionValue).toLowerCase() === 'tout';
                    option.value = isAllOption ? Infinity : optionValue;
                    option.textContent = String(optionValue);
                    if ((isAllOption && currentRowsPerPage === Infinity) || 
                        (!isAllOption && Number(optionValue) === Number(currentRowsPerPage))) {
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
            prevButton.textContent = 'Précédent';
            prevButton.disabled = true;
            mainPaginationControlsDiv.appendChild(prevButton);

            pageInfoSpan = document.createElement('span');
            pageInfoSpan.textContent = 'Page 1 / 1';
            mainPaginationControlsDiv.appendChild(pageInfoSpan);

            nextButton = document.createElement('button');
            nextButton.textContent = 'Suivant';
            nextButton.disabled = true;
            mainPaginationControlsDiv.appendChild(nextButton);
            
            paginationWrapper.appendChild(mainPaginationControlsDiv);
            container.appendChild(paginationWrapper);
        }
        // Ne pas appeler showLoadingMessage ici si les données sont passées directement et traitées de suite
    }

    function formatValue(value, formatType) {
        if (value === null || typeof value === 'undefined') return '';
        
        const isNumericValue = typeof value === 'number';

        if (!isNumericValue && (String(formatType).startsWith('currency:') || String(formatType).startsWith('percent'))) {
            return value; 
        }

        if (typeof formatType === 'string') {
            if (formatType.startsWith('currency:')) {
                const parts = formatType.split(':');
                const currencyCode = parts[1] ? parts[1].toUpperCase() : 'EUR';
                let locale = (currencyCode === 'USD') ? 'en-US' : 'fr-FR';
                if (parts[2]) locale = parts[2];
                return value.toLocaleString(locale, { style: 'currency', currency: currencyCode });
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
                return value;
            }
            if (formatType === 'date') {
                const date = new Date(value);
                return !isNaN(date.getTime()) ? date.toLocaleDateString('fr-FR') : value;
            }
        }
        return value;
    }

    function showLoadingMessage() {
        if (tbody) tbody.innerHTML = `<tr><td colspan="${columns.length}" class="message-row loading">Chargement...</td></tr>`;
    }
    function showNoResultsMessage() {
        if (tbody) tbody.innerHTML = `<tr><td colspan="${columns.length}" class="message-row no-results">Aucun résultat trouvé.</td></tr>`;
    }
    
    function _initTableWithData(data) {
        originalData = data;
        if (!Array.isArray(originalData)) {
            console.error(`[DynamicTable ${containerId}] Erreur: Les données fournies ne sont pas un tableau.`);
            if (tbody) tbody.innerHTML = `<tr><td colspan="${columns.length}" class="message-row error">Erreur: Données invalides.</td></tr>`;
            return;
        }
        populateFilterOptions();
        processDataInternal();
    }
    
    async function _fetchAndInitData() {
        if (!jsonPath) { 
            console.error(`[DynamicTable ${containerId}] Erreur: jsonPath non défini.`);
            if (tbody) tbody.innerHTML = `<tr><td colspan="${columns.length}" class="message-row error">Erreur: Chemin JSON non défini.</td></tr>`;
            return;
        }
        showLoadingMessage();
        try {
            const response = await fetch(jsonPath);
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            const data = await response.json();
            _initTableWithData(data);
        } catch (error) {
            console.error(`[DynamicTable ${containerId}] Erreur fetch:`, error);
            if (tbody) tbody.innerHTML = `<tr><td colspan="${columns.length}" class="message-row error">Erreur de chargement des données.</td></tr>`;
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
                while (selectElement.options.length > 1) selectElement.remove(1);
                const uniqueValues = [...new Set(originalData.map(item => item[key]))].sort();
                uniqueValues.forEach(val => {
                    if (val !== null && typeof val !== 'undefined') {
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
            const specificFiltersMatch = Object.entries(activeFilters).every(([key, value]) =>
                String(item[key]) === value );
             if (!specificFiltersMatch) return false;
            return !globalSearchTerm || Object.values(item).some(val =>
                String(val).toLowerCase().includes(globalSearchTerm) );
        });

        if (sortColumn) {
             filteredData.sort((a, b) => {
                let valA = a[sortColumn]; let valB = b[sortColumn];
                const numA = parseFloat(valA); const numB = parseFloat(valB);
                if (!isNaN(numA) && !isNaN(numB) && typeof valA !== 'boolean' && typeof valB !== 'boolean') {
                    valA = numA; valB = numB; 
                } else { 
                    valA = String(valA).toLowerCase(); valB = String(valB).toLowerCase(); 
                }
                if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
        displayData = filteredData;
        currentPage = 1;
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
        if (!showPagination) {
            actualRowsToDisplayOnPage = displayData.length;
        } else {
            actualRowsToDisplayOnPage = (currentRowsPerPage === Infinity) ? displayData.length : Number(currentRowsPerPage);
        }

        const totalPages = (actualRowsToDisplayOnPage === 0 && displayData.length > 0) ? 1 : Math.ceil(displayData.length / actualRowsToDisplayOnPage);
        currentPage = Math.max(1, Math.min(currentPage, totalPages));
        
        const startIndex = (currentPage - 1) * actualRowsToDisplayOnPage;
        const endIndex = Math.min(startIndex + actualRowsToDisplayOnPage, displayData.length);

        const pageData = displayData.slice(startIndex, endIndex);

        pageData.forEach((item, itemIndex) => {
            const row = tbody.insertRow();
            columns.forEach((col, colIndex) => {
                const cell = row.insertCell();
                cell.innerHTML = ''; 

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
                        } catch (e) { console.error(`[DynamicTable] Erreur création graphique ${canvasId}:`, e); cell.textContent = 'Erreur Graph.'; }
                    } else if (typeof PureChart === 'undefined') {
                        console.warn(`[DynamicTable] PureChart n'est pas défini pour la colonne ${col.header}. Assurez-vous que PureChart.js est chargé.`);
                        cell.textContent = 'PureChart?';
                    } else {
                        console.warn(`[DynamicTable] Données pour graphique non trouvées via dataKey '${col.chartConfig.dataKey}' pour la colonne ${col.header}.`);
                        cell.textContent = 'Données?';
                    }
                } else {
                    if (typeof col.format === 'string' && col.format.startsWith('percent_neutral') && typeof value === 'number' && value === 0) {
                        cell.textContent = '';
                    } else {
                        cell.textContent = formatValue(value, col.format);
                    }

                    if (typeof col.format === 'string' && col.format.startsWith('percent') && !col.format.includes('_neutral') && typeof value === 'number') {
                        cell.classList.remove('dt-value-positive', 'dt-value-negative');
                        if (value > 0) {
                            cell.classList.add('dt-value-positive');
                        } else if (value <= 0) {
                            cell.classList.add('dt-value-negative');
                        }
                    }
                }
            });
        });

        if (showPagination) updatePaginationControlsInternal();
        if(resultsCountSpan) resultsCountSpan.textContent = displayData.length.toLocaleString('fr-FR');
    }

    function updatePaginationControlsInternal() {
         if (!showPagination || !pageInfoSpan || !prevButton || !nextButton) return;
         
         const itemsPerPageForCalc = (currentRowsPerPage === Infinity) ? displayData.length : Number(currentRowsPerPage);
         const totalItems = displayData.length;
         let totalPages;

         if (totalItems === 0) {
             totalPages = 1;
         } else if (itemsPerPageForCalc === 0) {
             totalPages = 1;
         } else if (itemsPerPageForCalc >= totalItems) {
             totalPages = 1;
         } else {
             totalPages = Math.ceil(totalItems / itemsPerPageForCalc);
         }
        
         currentPage = Math.max(1, Math.min(currentPage, totalPages));

         pageInfoSpan.textContent = `Page ${currentPage} / ${totalPages}`;
         prevButton.disabled = currentPage === 1;
         nextButton.disabled = currentPage === totalPages || totalItems === 0;

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
            const arrow = th.querySelector('.sort-arrow');
            if (arrow) arrow.remove();
            if (th.dataset.column === sortColumn) {
                const arrowSpan = document.createElement('span');
                arrowSpan.className = 'sort-arrow ' + sortDirection;
                th.appendChild(arrowSpan);
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
                        const firstOptionVal = rowsPerPageOptions[0];
                        currentRowsPerPage = (String(firstOptionVal).toLowerCase() === 'tout' || String(firstOptionVal).toLowerCase() === 'infinity') ? Infinity : (Number(firstOptionVal) || 10);
                        if(currentRowsPerPage === Infinity && displayData && displayData.length > 0) currentRowsPerPage = displayData.length; 
                        else if (currentRowsPerPage === Infinity) currentRowsPerPage = 10;
                    }
                }
                currentPage = 1;
                renderTableInternal();
            });
        }

        if (thead) {
            thead.querySelectorAll('th.sortable').forEach(header => {
                 header.addEventListener('click', () => {
                    const columnKey = header.dataset.column;
                    if (!columnKey) return;
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
                if (displayData.length > 0 && itemsPerPageForCalc > 0) {
                     totalPages = Math.ceil(displayData.length / itemsPerPageForCalc);
                } else if (displayData.length === 0) {
                    totalPages = 1;
                }
                if (currentPage < totalPages) { currentPage++; renderTableInternal(); }
            });
        }
    }
    
    buildTableShell(); 
    attachEventListeners(); 
    
    if (jsonData) {
        _initTableWithData(jsonData);
    } else if (jsonPath) {
        _fetchAndInitData();
    }
}
