/**
 * @file panorama.js
 * @description Defines the Panorama class, which is responsible for managing the dashboard.
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

// 
class Panorama {
  /**
   * Creates a new Panorama instance.
   * @param {string} containerId - The ID of the HTML element where the dashboard will be rendered.
   */
  constructor(containerId) {
    // Store the container element.
    this.container = document.getElementById(containerId);
    // Get the grid container element.
    this.gridContainer = document.getElementById('panorama-grid-container');
    // Initialize an itemIdCounter to 0, which will be used to generate unique IDs for items.
    // This will now be managed by PanoramaGrid instance.
    // this.itemIdCounter = 0;
    this.editingItemId = null; // To store the ID of the item being edited
    // this.draggedItem = null; // Removed, was managed by PanoramaGrid or old D&D
    // this.dropPlaceholder = null; // Removed, was managed by PanoramaGrid or old D&D
    this.maxGridRows = 100; // This might be a Panorama-specific option or passed to PanoramaGrid
    // No more this.items = []; it's managed by this.grid

    // Create the edit modal structure
    this._createEditModal();

    // Instantiate PanoramaGrid
    this.grid = new PanoramaGrid('panorama-grid-container', {
        columns: 12, // Example: Default or from Panorama options
        rowHeight: 50, // Example: Default or from Panorama options
        gap: 10,       // Example: Default or from Panorama options
        renderItemContent: this._renderPanoramaItemContent.bind(this)
    });

    // Replace direct access to this.items and this.itemIdCounter with calls to this.grid
    // For example, this.items becomes this.grid.items (though direct access might be discouraged)
    // this.itemIdCounter becomes this.grid.itemIdCounter

    // Bind methods
    this.addItemFromUrl = this.addItemFromUrl.bind(this); // For the new method

    // Event listener for "Add from URL"
    const addItemFromUrlBtn = document.getElementById('add-item-from-url-btn');
    const itemUrlInput = document.getElementById('item-url-input');

    if (addItemFromUrlBtn && itemUrlInput) {
      addItemFromUrlBtn.addEventListener('click', () => {
        const url = itemUrlInput.value.trim();
        if (url) {
          this.addItemFromUrl(url);
          itemUrlInput.value = ''; // Clear input after attempt
        } else {
          alert('Please enter a URL.');
        }
      });
    } else {
      console.warn('Panorama: "Add from URL" button or input field not found. Ensure demo_full.html is updated.');
    }
  }

  _renderPanoramaItemContent(type, config, contentContainerElement, itemId) {
    if (contentContainerElement) {
        if (contentContainerElement.parentElement && !contentContainerElement.parentElement.classList.contains('panorama-grid-custom-item')) {
            console.warn('Panorama Debug: contentContainerElement.parentElement does NOT have "panorama-grid-custom-item" class for itemId:', itemId, 'Parent:', contentContainerElement.parentElement);
        }
    } else {
        console.warn('Panorama Debug: received contentContainerElement is null or undefined for itemId:', itemId);
    }

    // The specific _render<Type> methods in Panorama.js might expect an 'item' object.
    // We need to provide it or adapt them. For now, let's create a mock 'item' for them.
    const mockItem = { id: itemId, type: type, config: config, layout: {} /* layout not directly needed for content (though might be useful for controls) */ };
    const itemElement = contentContainerElement.parentElement; // Get the main item element

    if (!itemElement) {
        console.error("CRITICAL: Panorama - itemElement is NULL. Controls cannot be added for itemId:", itemId, "ContentContainer:", contentContainerElement);
        // alert("Debug: itemElement is null for itemId " + itemId); // Optional: for immediate test feedback
        // Potentially return or handle error appropriately if itemElement is crucial for subsequent rendering steps.
        // For now, we'll let content rendering proceed if possible, but controls won't be added.
    }

    // --- Add Item Controls ---
    // Ensure contentContainerElement itself is valid before proceeding
    if (contentContainerElement) {
        try {
            let controlsContainer = contentContainerElement.querySelector('.panorama-item-controls'); // Query from contentContainerElement
            if (!controlsContainer) {
                controlsContainer = document.createElement('div');
                controlsContainer.className = 'panorama-item-controls';
                const itemElement = contentContainerElement.parentElement; itemElement.appendChild(controlsContainer);
            } else {
                controlsContainer.innerHTML = ''; // Clear old buttons if re-rendering
            }

            const menuButton = document.createElement('button');
            menuButton.className = 'panorama-item-menu-btn';
            menuButton.textContent = '⋮'; 
            menuButton.dataset.itemId = itemId.toString();
            menuButton.setAttribute('aria-haspopup', 'true');
            menuButton.setAttribute('aria-expanded', 'false');

            const popupMenu = document.createElement('div');
            popupMenu.className = 'panorama-item-menu-popup';
            popupMenu.style.display = 'none';
            popupMenu.dataset.itemId = itemId.toString();

            const editAction = document.createElement('a');
            editAction.href = '#';
            editAction.className = 'panorama-edit-action';
            editAction.textContent = 'Edit';
            editAction.dataset.itemId = itemId.toString();
            editAction.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation(); // Prevent menu click from closing itself immediately
                const itemIdToEdit = parseInt(event.target.dataset.itemId);
                const itemFromGrid = this.grid.items.find(i => i.id === itemIdToEdit);
                if (itemFromGrid) {
                    // Ensure type is correctly passed from itemFromGrid.config.type
                    this._showEditModal({ id: itemFromGrid.id, type: itemFromGrid.config.type, config: itemFromGrid.config });
                }
                popupMenu.style.display = 'none';
                if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
            });
            popupMenu.appendChild(editAction);

            const deleteAction = document.createElement('a');
            deleteAction.href = '#';
            deleteAction.className = 'panorama-delete-action';
            deleteAction.textContent = 'Delete';
            deleteAction.dataset.itemId = itemId.toString();
            deleteAction.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation(); // Prevent menu click from closing itself immediately
                const itemIdToRemove = parseInt(event.target.dataset.itemId);
                this.removeItem(itemIdToRemove); // This now calls this.grid.removeItem
                // Popup menu will be removed with the item, so no need to hide it explicitly here
            });
            popupMenu.appendChild(deleteAction);

            controlsContainer.appendChild(menuButton);
            controlsContainer.appendChild(popupMenu);

            menuButton.addEventListener('click', (event) => {
                event.stopPropagation(); // Important to prevent click from bubbling to document listener immediately
                const currentlyVisible = popupMenu.style.display === 'block';
                // Hide all other open popups
                document.querySelectorAll('.panorama-item-menu-popup').forEach(p => {
                    if (p !== popupMenu) p.style.display = 'none';
                });
                document.querySelectorAll('.panorama-item-menu-btn').forEach(b => {
                    if (b !== menuButton) b.setAttribute('aria-expanded', 'false');
                });

                // --- BEGIN DYNAMIC POPUP POSITIONING LOGIC ---
                if (!currentlyVisible) { // Only calculate position if we are about to show it
                    // 1. Temporarily make popup visible for measurement
                    const originalVisibility = popupMenu.style.visibility;
                    const originalDisplay = popupMenu.style.display;
                    
                    popupMenu.style.visibility = 'hidden';
                    popupMenu.style.display = 'block';

                    const popupHeight = popupMenu.offsetHeight;
                    const buttonRect = menuButton.getBoundingClientRect();
                    const viewportHeight = window.innerHeight;

                    const spaceBelow = viewportHeight - buttonRect.bottom;
                    const spaceAbove = buttonRect.top;

                    // 2. Reset temporary styles before actual display
                    popupMenu.style.visibility = originalVisibility;
                    popupMenu.style.display = originalDisplay; // Will be set to 'block' or 'none' below

                    // 3. Decision logic
                    popupMenu.classList.remove('open-upwards'); // Reset first
                    if (spaceBelow < popupHeight && spaceAbove >= popupHeight) {
                        popupMenu.classList.add('open-upwards');
                    }
                }
                // --- END DYNAMIC POPUP POSITIONING LOGIC ---

                if (!currentlyVisible) {
                    popupMenu.style.display = 'block';
                    menuButton.setAttribute('aria-expanded', 'true');
                } else {
                    popupMenu.style.display = 'none';
                    menuButton.setAttribute('aria-expanded', 'false');
                    popupMenu.classList.remove('open-upwards'); // Clean up class when hiding
                }
            });
        } catch (e) {
            console.error("Error creating controls for item", itemId, e);
        }
    } else {
        console.warn('Panorama Debug: contentContainerElement is null or undefined. Cannot add controls for itemId:', itemId);
    }
    // --- End Item Controls ---

    // Render actual content (text, title, image, chart, table)
    switch (type) {
        case 'text':
            this._renderText(mockItem, contentContainerElement);
            break;
        case 'title':
            this._renderTitle(mockItem, contentContainerElement);
            break;
        case 'image':
            this._renderImage(mockItem, contentContainerElement);
            break;
        case 'chart':
            this._renderChart(mockItem, contentContainerElement);
            break;
        case 'table':
            this._renderTable(mockItem, contentContainerElement);
            break;
        default:
            console.warn(`Panorama: Unknown item type for content rendering: ${type}`);
            contentContainerElement.textContent = `Unknown item type: ${type}`;
    }
  }


  /**
   * Renders the entire dashboard.
   * This method will now delegate rendering to PanoramaGrid or be significantly changed.
   * For now, it might not do much if PanoramaGrid handles its own rendering on item add/remove.
   * If PanoramaGrid does not auto-render on load, this might trigger a batch render.
   */
  renderDashboard() {
    // With PanoramaGrid, direct manipulation of gridContainer.innerHTML here might be incorrect.
    // PanoramaGrid manages its own DOM elements.
    // If we need to re-render all items for some reason (e.g. after a batch load without individual renders),
    // we would iterate through this.grid.items and tell PanoramaGrid to update/re-render them,
    // or PanoramaGrid might have its own full re-render method.
    // For now, this method's role is reduced.
    // If PanoramaGrid's loadLayout doesn't trigger render for each item,
    // this could be a place to trigger a full render if needed, e.g., by calling a
    // hypothetical this.grid.renderAllItems() or similar.
    // However, addItem in PanoramaGrid calls _renderItem, so items are rendered as they are added.
  }

  /**
   * Adds a new item to the dashboard.
   * @param {string} type - The type of the item (e.g., 'text', 'chart').
   * @param {object} config - The configuration for the item.
   * @param {object} layout - The layout information for the item (x, y, w, h).
   */
  addItem(type, config, layout) {
    // PanoramaGrid's addItem expects a single config object that includes layout.
    // It also handles its own ID generation and collision detection.
    const itemConfig = {
        type: type, // Add type to the config object for PanoramaGrid's renderItemContent
        ...config,  // Spread the rest of the original config
        layout: layout
    };
    // addItem in PanoramaGrid will handle ID generation, collision, and rendering.
    const newItemId = this.grid.addItem(itemConfig);
    return newItemId;
  }

  /**
   * Removes an item from the dashboard.
   * @param {number} itemId - The ID of the item to remove.
   */
  removeItem(itemId) {
    this.grid.removeItem(itemId);
    // PanoramaGrid handles its own DOM updates and internal array.
    // No explicit renderDashboard() needed here if PanoramaGrid updates DOM.
  }

  /**
   * Updates the configuration of an existing item.
   * @param {number} itemId - The ID of the item to update.
   * Updates the configuration of an existing item.
   * @param {number} itemId - The ID of the item to update.
   * @param {object} newConfigFields - The new configuration fields for the item.
   * @param {string} itemType - The type of the item being updated.
   */
  updateItemConfig(itemId, newConfigFields, itemType) { // newConfigFields comes from _handleSaveModal's 'newConfig'
    if (!itemType) {
        let foundType = null;
        // Attempt to find item in grid to get its type as a fallback
        if (this.grid && this.grid.items) { // Check if grid and items exist
            const itemInGrid = this.grid.items.find(i => i.id === itemId);
            if (itemInGrid && itemInGrid.config && itemInGrid.config.type) {
                foundType = itemInGrid.config.type;
            }
        }

        if (foundType) {
            itemType = foundType;
            console.warn(`Panorama.updateItemConfig: itemType was missing, retrieved from grid item as '${itemType}'.`);
        } else {
            console.error("Panorama.updateItemConfig: Could not determine itemType. Update failed for item ID:", itemId);
            return;
        }
    }

    // Construct the full config object that PanoramaGrid's renderItemContent callback expects.
    // newConfigFields are the specific properties for that type (e.g., { content: "..." } for text, or { chartType: "..." } for chart).
    const fullNewConfig = {
        type: itemType,
        ...newConfigFields
    };

    // Call PanoramaGrid's method, which will update its internal config and re-render content.
    if (this.grid) { // Check if grid exists before calling its method
        this.grid.updateItemConfiguration(itemId, fullNewConfig);
    } else {
        console.error("Panorama.updateItemConfig: this.grid is not initialized.");
    }
  }

  /**
   * Updates the layout of an existing item.
   * This is now primarily handled by PanoramaGrid's drag/resize end handlers.
   * This method could be used for programmatic updates if needed.
   * @param {number} itemId - The ID of the item to update.
   * @param {object} newLayout - The new layout object (x, y, w, h).
   * @param {boolean} [shouldRender=true] - This param is no longer used by Panorama.js.
   */
  updateItemLayout(itemId, newLayout, shouldRender = true) {
       if (!this.grid) {
           console.error("PanoramaGrid instance not available in Panorama.js");
           return;
       }
       const success = this.grid.updateItemLayout(itemId, newLayout);
       if (!success) {
           // Handle failure if needed, e.g., by alerting the user or logging
           console.warn(`Panorama.js: updateItemLayout for item ${itemId} failed in PanoramaGrid.`);
       }
       // No explicit DOM update or re-render call needed here, PanoramaGrid handles it.
  }

  /**
   * Saves the current dashboard state to a JSON string using PanoramaGrid's getLayout.
   * @returns {string} - JSON string representing the dashboard state, pretty-printed.
   */
  saveDashboard() {
    const dashboardState = this.grid.getLayout();
    return JSON.stringify(dashboardState, null, 2);
  }

  /**
   * Loads a dashboard state from a JSON string using PanoramaGrid's loadLayout.
   * @param {string} jsonData - JSON string representing the dashboard state.
   * @returns {boolean} - True if loading and rendering were successful, false otherwise.
   */
  loadDashboard(jsonData) {
    try {
        const layoutData = JSON.parse(jsonData);
        // Basic validation of layoutData structure can be done here if needed,
        // but PanoramaGrid.loadLayout also does validation.
        if (!layoutData || typeof layoutData !== 'object') {
            console.error("Panorama.loadDashboard: Invalid JSON data.");
            alert("Failed to load dashboard: Invalid JSON data.");
            return false;
        }
        return this.grid.loadLayout(layoutData);
    } catch (error) {
        console.error("Panorama.loadDashboard: Failed to parse or load dashboard:", error);
        alert(`Failed to load dashboard: ${error.message}`);
        return false;
    }
  }

  /**
   * Renders a single dashboard item.
   * (Private helper method - To be implemented)
   * @param {object} item - The item object to render.
   */
  // Placeholder for specific rendering functions
  _renderText(item, contentContainer) {
    // contentContainer is .panorama-grid-custom-item-content
    // It has .panorama-item-controls as its first child.

    let textHost = contentContainer.querySelector('.text-host');
    if (!textHost) {
        textHost = document.createElement('div');
        textHost.className = 'text-host';
        // Ensure text-host can grow if needed, but parent (.panorama-grid-custom-item-content) has overflow:hidden
        // textHost.style.flexGrow = '1'; // If contentContainer is flex and text-host should fill remaining space
        // textHost.style.overflow = 'hidden'; // Not strictly needed if parent clips
        contentContainer.appendChild(textHost); // Appended AFTER controls.
    }
    textHost.innerHTML = ''; // Clear previous text content from the host.

    const pElement = document.createElement('p');
    pElement.textContent = item.config.content;
    pElement.style.margin = '0'; // Remove default p margin for better control.
    // pElement.style.whiteSpace = 'pre-wrap'; // Preserve whitespace and wrap -> for accurate measurement
    // pElement.style.wordBreak = 'break-word'; // Break words if necessary -> for accurate measurement
    textHost.appendChild(pElement);
  }

  _renderTitle(item, contentContainer) {
    const titleElement = document.createElement(`h${item.config.level || 1}`);
    titleElement.textContent = item.config.text;
    contentContainer.appendChild(titleElement);
  }

  _renderImage(item, contentContainer) {
    const imageElement = document.createElement('img');
    imageElement.src = item.config.url;
    imageElement.alt = item.config.alt || 'Dashboard image';
    // Basic styling for responsiveness, can be moved to CSS
    imageElement.style.maxWidth = '100%';
    imageElement.style.maxHeight = '100%';
    imageElement.style.objectFit = 'contain'; // Added this line
    contentContainer.appendChild(imageElement);
  }

_renderChart(item, contentContainer) {
    let chartHostDiv = contentContainer.querySelector('.chart-host');
    if (!chartHostDiv) {
        chartHostDiv = document.createElement('div');
        chartHostDiv.className = 'chart-host';
        chartHostDiv.style.width = '100%'; 
        chartHostDiv.style.height = '100%';
        contentContainer.appendChild(chartHostDiv);
    } else {
        chartHostDiv.innerHTML = ''; // Clear only the host for re-renders
    }

    const canvas = document.createElement('canvas');
    canvas.id = `chart-canvas-${item.id}`; // Unique ID for the canvas itself

    // Optional: Basic styling for canvas to be responsive.
    // PureChart might handle this, or you might need CSS for .panorama-item-content canvas
    canvas.style.width = '100%';
    canvas.style.height = '100%'; 
    
    chartHostDiv.appendChild(canvas); // Append canvas to the new chartHostDiv

    // Original debug check (keep this)
    const checkCanvas = document.getElementById(canvas.id);
    if (!checkCanvas) {
        console.error(`PANORAMA DEBUG (pre-rAF): Canvas ${canvas.id} was NOT found in DOM immediately after appendChild! Item ID: ${item.id}`);
    } else {
    }

    const chartConfig = { // Define chartConfig outside rAF if it doesn't depend on things inside it
        type: item.config.chartType,
        data: item.config.chartData || { labels: [], datasets: [] },
        options: item.config.chartOptions || {}
    };

    // Check for valid chartType and data *before* rAF, to avoid rAF if config is bad
    if (!chartConfig.type || !chartConfig.data.datasets || chartConfig.data.datasets.length === 0) {
        console.error(`Chart item ${item.id} is missing 'chartType' or 'chartData.datasets'. Cannot render.`);
        chartHostDiv.innerHTML = "<p style='color:red;'>Error: Chart type or data is missing.</p>"; // Target chartHostDiv
        return;
    }

    requestAnimationFrame(() => {
        try {
            // New check inside rAF
            const canvasInRAF = document.getElementById(canvas.id);
            if (!canvasInRAF) {
                console.error(`PANORAMA DEBUG (in-rAF): Canvas ${canvas.id} NOT found for item ${item.id} even in rAF.`);
                // Attempt to provide a more helpful error message in the UI
                if (chartHostDiv) { // Ensure chartHostDiv is still valid
                     chartHostDiv.innerHTML = `<p style='color:red;'>Error: Chart canvas (ID: ${canvas.id}) not found in DOM for item ${item.id} during rAF. Chart cannot be rendered.</p>`;
                }
                return; // Don't proceed if canvas is still not found
            }

            if (typeof PureChart === 'function') {
                new PureChart(canvas.id, chartConfig);
            } else {
                console.error("Error: PureChart is not defined (rAF). Ensure PureChart.js is loaded.");
                if (chartHostDiv) { // Target chartHostDiv
                    chartHostDiv.innerHTML = "<p style='color:red;'>Error: Chart library (PureChart) not found (rAF).</p>";
                }
            }
        } catch (e) {
            console.error(`Error rendering chart for item ${item.id} (via rAF):`, e);
            if (chartHostDiv) { // Target chartHostDiv
                // Display error in the item content area
                chartHostDiv.innerHTML = `<p style='color:red;'>Error rendering chart (ID: ${item.id}) via rAF: ${e.message}. Check console.</p>`;
            }
        }
    });
  }
  _renderTable(item, contentContainer) {
    let tableHostDiv = contentContainer.querySelector('.table-host');
    if (!tableHostDiv) {
        tableHostDiv = document.createElement('div');
        tableHostDiv.className = 'table-host';
        tableHostDiv.style.width = '100%'; 
        tableHostDiv.style.height = '100%'; 
        contentContainer.appendChild(tableHostDiv);
    } else {
        tableHostDiv.innerHTML = ''; // Clear only the host for re-renders
    }

    if (!tableHostDiv.id) {
      tableHostDiv.id = `table-specific-container-${item.id}`; // Ensure the host has an ID
    }
    const actualTableContainerId = tableHostDiv.id;

    // Define tableConfig outside rAF if its parts don't depend on things inside rAF
    const tableConfig = {
        containerId: actualTableContainerId, // Use new host's ID
        jsonData: item.config.tableData,
        columns: item.config.tableColumns,
        ...(item.config.tableOptions || {})
    };

    // Preliminary checks before rAF
    if (!tableConfig.columns || tableConfig.columns.length === 0) {
      console.error(`Table item ${item.id} is missing 'tableColumns' in its configuration. Cannot render.`);
      tableHostDiv.textContent = "Error: Table column configuration is missing."; // Target tableHostDiv
      return;
    }
    if (!tableConfig.jsonData) { // Or other essential checks for tableData
        console.error(`Table item ${item.id} is missing 'tableData'. Cannot render.`);
        tableHostDiv.textContent = "Error: Table data is missing."; // Target tableHostDiv
        return;
    }
    
    // tableHostDiv.innerHTML = ''; // Already done above or not needed if createDynamicTable handles clearing

    requestAnimationFrame(() => {
        try {
            const tableContainerInRAF = document.getElementById(actualTableContainerId); // Use actualTableContainerId
            if (!tableContainerInRAF) {
                console.error(`PANORAMA DEBUG (in-rAF): Table container ${actualTableContainerId} NOT found for item ${item.id} even in rAF.`);
                if (tableHostDiv) { // Check if the tableHostDiv reference is still valid
                     tableHostDiv.innerHTML = `<p style='color:red;'>Error: Table container (ID: ${actualTableContainerId}) not found in DOM for item ${item.id} during rAF. Table cannot be rendered.</p>`;
                }
                return; 
            }

            if (typeof createDynamicTable === 'function') {
                // Pass the config, ensuring containerId within it is correct
                createDynamicTable(tableConfig); 
            } else {
                console.error("Error: createDynamicTable function is not defined globally (rAF). Check Dynamic-table.js.");
                if (tableHostDiv) { // Target tableHostDiv
                    tableHostDiv.textContent = "Error: Table library function not found (rAF).";
                }
            }
        } catch (e) {
            console.error(`Error rendering table for item ${item.id} (via rAF):`, e);
            if (tableHostDiv) { // Target tableHostDiv
                 tableHostDiv.textContent = `Error rendering table (ID: ${item.id}) via rAF: ${e.message}. Check console.`;
            }
        }
    });
  }


  _createEditModal() {
    // Check if modal already exists (e.g. from a previous instantiation or manual HTML)
    let modal = document.getElementById('panorama-item-modal');
    if (modal) {
        this.modalElement = modal;
        this.modalTitleElement = modal.querySelector('.panorama-modal-header h2');
        this.modalFormArea = modal.querySelector('.panorama-modal-form-area');
        this.saveModalButton = modal.querySelector('.panorama-modal-save');
        this.cancelModalButton = modal.querySelector('.panorama-modal-cancel');
    } else {
        this.modalElement = document.createElement('div');
        this.modalElement.id = 'panorama-item-modal'; // More generic ID
        this.modalElement.className = 'panorama-modal';

        const modalContent = document.createElement('div');
        modalContent.className = 'panorama-modal-content';

        const modalHeader = document.createElement('div');
        modalHeader.className = 'panorama-modal-header';
        this.modalTitleElement = document.createElement('h2');
        modalHeader.appendChild(this.modalTitleElement);

        this.modalFormArea = document.createElement('div');
        this.modalFormArea.className = 'panorama-modal-form-area';

        const modalFooter = document.createElement('div');
        modalFooter.className = 'panorama-modal-footer';
        
        this.saveModalButton = document.createElement('button');
        this.saveModalButton.textContent = 'Save';
        this.saveModalButton.className = 'panorama-modal-save';

        this.cancelModalButton = document.createElement('button');
        this.cancelModalButton.textContent = 'Cancel';
        this.cancelModalButton.className = 'panorama-modal-cancel';

        modalFooter.appendChild(this.saveModalButton);
        modalFooter.appendChild(this.cancelModalButton);

        modalContent.appendChild(modalHeader);
        modalContent.appendChild(this.modalFormArea);
        modalContent.appendChild(modalFooter);
        this.modalElement.appendChild(modalContent);

        document.body.appendChild(this.modalElement);
    }

    // Standard event listener for cancel, remove if exists to avoid duplication
    const newCancelButton = this.cancelModalButton.cloneNode(true);
    this.cancelModalButton.parentNode.replaceChild(newCancelButton, this.cancelModalButton);
    this.cancelModalButton = newCancelButton;
    this.cancelModalButton.addEventListener('click', () => this._hideModal());

    // Save button listener is attached in _showAddItemModal or _showEditModal 
    // as its behavior (add vs edit) depends on the context.
  }

  // Helper to populate form fields based on type and mode
  _populateModalFormForType(itemType, mode, currentConfig = {}, targetElementForAddMode = null) {
    const formIdPrefix = mode === 'add' ? 'addItem' : 'editItem';
    let formHTML = '';

    switch (itemType) {
      case 'text':
        formHTML = `
          <label for="${formIdPrefix}Content">Content:</label>
          <textarea id="${formIdPrefix}Content" class="panorama-modal-textarea">${currentConfig.content || ''}</textarea>
        `;
        break;
      case 'title':
        formHTML = `
          <label for="${formIdPrefix}Text">Text:</label>
          <input type="text" id="${formIdPrefix}Text" class="panorama-modal-input" value="${currentConfig.text || ''}">
          <label for="${formIdPrefix}Level">Level (1-6):</label>
          <input type="number" id="${formIdPrefix}Level" class="panorama-modal-input" value="${currentConfig.level || 2}" min="1" max="6">
        `;
        break;
      case 'image':
        formHTML = `
          <label for="${formIdPrefix}Url">Image URL:</label>
          <input type="text" id="${formIdPrefix}Url" class="panorama-modal-input" value="${currentConfig.url || ''}">
          <label for="${formIdPrefix}Alt">Alt Text:</label>
          <input type="text" id="${formIdPrefix}Alt" class="panorama-modal-input" value="${currentConfig.alt || ''}">
        `;
        break;
      case 'chart':
      case 'table':
        let jsonTemplate = {};
        if (itemType === 'chart') {
            jsonTemplate = { 
                chartType: 'bar', 
                chartData: { labels: ['A', 'B'], datasets: [{ label: 'Series 1', values: [10, 20] }] }, 
                chartOptions: { title: 'New Chart' } 
            };
        } else { // table
            jsonTemplate = { 
                tableData: [{col1: 'Val1', col2: 'Val2'}], 
                tableColumns: [{key: 'col1', header: 'Column 1'}, {key: 'col2', header: 'Column 2'}], 
                tableOptions: {caption: 'New Table'} 
            };
        }
        const jsonString = mode === 'add' ? JSON.stringify(jsonTemplate, null, 2) : JSON.stringify(currentConfig, null, 2);
        formHTML = `
          <label for="${formIdPrefix}JsonConfig">JSON Configuration:</label>
          <textarea id="${formIdPrefix}JsonConfig" class="panorama-modal-textarea" rows="10">${jsonString}</textarea>
          <p><small>Edit the JSON configuration directly. Be careful with syntax.</small></p>
        `;
        break;
      default:
        formHTML = '<p>Unknown item type selected.</p>';
    }

    if (mode === 'add' && targetElementForAddMode) {
        targetElementForAddMode.innerHTML = formHTML;
    } else if (mode === 'edit') { // Edit mode always targets the main modalFormArea
        this.modalFormArea.innerHTML = formHTML;
    } else if (mode === 'add' && !targetElementForAddMode) {
        // Fallback for add mode if targetElementForAddMode is not provided (should not happen with new design)
        console.warn("_populateModalFormForType called in 'add' mode without targetElementForAddMode. Using modalFormArea.");
        this.modalFormArea.innerHTML = formHTML;
    }
  }

  _showAddItemModal() {
    this.editingItemId = null; // Ensure not in edit mode
    this.modalTitleElement.textContent = 'Add New Item';
    
    this.modalFormArea.innerHTML = `
      <div class="control-group" style="margin-bottom: 15px;">
        <label for="new-item-type" style="display: block; margin-bottom: 5px; font-weight: bold;">Item Type:</label>
        <select id="new-item-type" class="panorama-modal-select" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; width: 100%;">
          <option value="">-- Select Type --</option>
          <option value="text">Text</option>
          <option value="title">Title</option>
          <option value="image">Image</option>
          <option value="chart">Chart</option>
          <option value="table">Table</option>
        </select>
      </div>
      <div id="item-specific-form-fields">
        <p style="text-align:center; color:#777; margin-top:10px;">Select an item type to configure.</p>
      </div>
    `;

    const itemTypeSelect = this.modalFormArea.querySelector('#new-item-type');
    const itemSpecificFieldsContainer = this.modalFormArea.querySelector('#item-specific-form-fields');

    itemTypeSelect.addEventListener('change', (event) => {
      const selectedType = event.target.value;
      if (selectedType) {
        this._populateModalFormForType(selectedType, 'add', {}, itemSpecificFieldsContainer);
      } else {
        itemSpecificFieldsContainer.innerHTML = '<p style="text-align:center; color:#777; margin-top:10px;">Select an item type to configure.</p>';
      }
    });
    
    // Setup Save button listener for "add" mode
    const oldSaveButton = this.saveModalButton;
    this.saveModalButton = oldSaveButton.cloneNode(true);
    oldSaveButton.parentNode.replaceChild(this.saveModalButton, oldSaveButton);
    this.saveModalButton.addEventListener('click', () => this._handleSaveModal('add'));

    this.modalElement.style.display = 'block';
  }

  _showEditModal(item) {
    this.editingItemId = item.id;
    this.modalTitleElement.textContent = `Edit ${item.type.charAt(0).toUpperCase() + item.type.slice(1)} Item (ID: ${item.id})`;
    
    this._populateModalFormForType(item.type, 'edit', item.config);

    // Setup Save button listener for "edit" mode
    const oldSaveButton = this.saveModalButton;
    this.saveModalButton = oldSaveButton.cloneNode(true); 
    oldSaveButton.parentNode.replaceChild(this.saveModalButton, oldSaveButton);
    
    // Pass item.type to _handleSaveModal for context when editing
    this.saveModalButton.addEventListener('click', () => this._handleSaveModal('edit', item.type)); 

    this.modalElement.style.display = 'block';
  }

  _hideModal() { // Renamed from _hideEditModal for generic use
    this.modalElement.style.display = 'none';
    this.editingItemId = null;
    this.modalFormArea.innerHTML = ''; // Clear form for next time
  }

  _handleSaveModal(mode, itemTypeForEdit = null) { // itemTypeForEdit only used in 'edit' mode
    let newConfig = {};
    let itemType = ''; // For 'add' mode, this will be from the dropdown

    try {
      if (mode === 'add') {
        itemType = document.getElementById('new-item-type').value;
        if (!itemType) {
          alert('Please select an item type.');
          return;
        }
        const formIdPrefix = 'addItem';
        switch (itemType) {
          case 'text':
            newConfig.content = document.getElementById(`${formIdPrefix}Content`).value;
            break;
          case 'title':
            newConfig.text = document.getElementById(`${formIdPrefix}Text`).value;
            newConfig.level = parseInt(document.getElementById(`${formIdPrefix}Level`).value) || 1;
            if (newConfig.level < 1 || newConfig.level > 6) newConfig.level = 1;
            break;
          case 'image':
            newConfig.url = document.getElementById(`${formIdPrefix}Url`).value;
            newConfig.alt = document.getElementById(`${formIdPrefix}Alt`).value;
            break;
          case 'chart':
          case 'table':
            const jsonStringAdd = document.getElementById(`${formIdPrefix}JsonConfig`).value;
            newConfig = JSON.parse(jsonStringAdd);
            break;
          default:
            console.warn("Attempted to save unhandled new item type:", itemType);
            this._hideModal();
            return;
        }
      } else if (mode === 'edit') {
        if (!this.editingItemId || !itemTypeForEdit) {
          console.error("Save error: Editing item ID or type is missing.");
          this._hideModal();
          return;
        }
        itemType = itemTypeForEdit; // Use the passed itemType for edit
        const formIdPrefix = 'editItem';
        switch (itemType) {
          case 'text':
            newConfig.content = document.getElementById(`${formIdPrefix}Content`).value;
            break;
          case 'title':
            newConfig.text = document.getElementById(`${formIdPrefix}Text`).value;
            newConfig.level = parseInt(document.getElementById(`${formIdPrefix}Level`).value) || 1;
            if (newConfig.level < 1 || newConfig.level > 6) newConfig.level = 1;
            break;
          case 'image':
            newConfig.url = document.getElementById(`${formIdPrefix}Url`).value;
            newConfig.alt = document.getElementById(`${formIdPrefix}Alt`).value;
            break;
          case 'chart':
          case 'table':
            const jsonStringEdit = document.getElementById(`${formIdPrefix}JsonConfig`).value;
            newConfig = JSON.parse(jsonStringEdit);
            break;
          default:
            console.warn("Attempted to save unhandled existing item type:", itemType);
            this._hideModal();
            return;
        }
      } else {
        console.error("Unknown mode for _handleSaveModal:", mode);
        this._hideModal();
        return;
      }
    } catch (error) {
      alert(`Error parsing configuration: ${error.message}\nPlease check the JSON syntax if editing chart/table or providing new JSON.`);
      console.error("Error processing configuration for save:", error);
      return; // Don't close modal or save if there's an error
    }

    if (mode === 'add') {
      // Define default layout - can be more sophisticated later
      let defaultLayout = { x: 0, y: 0, w: 4, h: 2 }; // Generic default
      switch (itemType) {
          case 'title': defaultLayout.h = 1; defaultLayout.w = 6; break;
          case 'text': defaultLayout.h = 2; defaultLayout.w = 4; break;
          case 'image': defaultLayout.h = 3; defaultLayout.w = 5; break;
          case 'chart': defaultLayout.h = 4; defaultLayout.w = 6; break;
          case 'table': defaultLayout.h = 3; defaultLayout.w = 6; break;
      }
      this.addItem(itemType, newConfig, defaultLayout);
    } else if (mode === 'edit') {
      this.updateItemConfig(this.editingItemId, newConfig, itemType);
    }
    this._hideModal();
  }

  async addItemFromUrl(url) {
    if (!url) {
      alert('URL cannot be empty.');
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const data = await response.json();

      // Validate JSON structure
      if (!data || typeof data !== 'object') {
        alert('Invalid JSON format: Data is not an object.');
        console.error('Invalid JSON format from URL:', data);
        return;
      }

      const { type, config, layout } = data;

      if (!type || typeof type !== 'string') {
        alert('Invalid item data: "type" is missing or not a string.');
        console.error('Missing or invalid "type" in JSON from URL:', data);
        return;
      }
      if (!config || typeof config !== 'object') {
        alert('Invalid item data: "config" is missing or not an object.');
        console.error('Missing or invalid "config" in JSON from URL:', data);
        return;
      }
      if (!layout || typeof layout !== 'object') {
        // Try to get default layout if not provided, or require it
        // For now, let's require it to match the spec closely.
        alert('Invalid item data: "layout" is missing or not an object.');
        console.error('Missing or invalid "layout" in JSON from URL:', data);
        return;
      }
      
      // Optional: More specific validation for layout properties (x, y, w, h)
      if (typeof layout.x !== 'number' || typeof layout.y !== 'number' || 
          typeof layout.w !== 'number' || typeof layout.h !== 'number') {
        alert('Invalid item data: "layout" properties (x, y, w, h) must be numbers.');
        console.error('Invalid "layout" properties in JSON from URL:', data);
        return;
      }

      this.addItem(type, config, layout);
      //

    } catch (error) {
      alert(`Failed to add item from URL: ${error.message}`);
      console.error('Error in addItemFromUrl:', error);
    }
  }
}
