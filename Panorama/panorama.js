// Defines the Panorama class, which is responsible for managing the dashboard.
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
    // Initialize GridStack.js on the grid container.
    const options = {
      // TODO: Add any specific GridStack options here if needed
      // float: true, // example option
    };
    this.grid = GridStack.init(options, this.gridContainer);
    // Initialize an empty array to store dashboard item objects.
    this.items = [];
    // Initialize an itemIdCounter to 0, which will be used to generate unique IDs for items.
    this.itemIdCounter = 0;
    this.editingItemId = null; // To store the ID of the item being edited

    // Create the edit modal structure
    this._createEditModal();

    // Add event listener for changes in the grid (drag/resize)
    this.grid.on('change', (event, gsItems) => {
      gsItems.forEach(gsItem => {
        if (!gsItem.el) return; // Element might not be present if item was just removed
        const itemId = parseInt(gsItem.el.dataset.itemId);
        const newLayout = {
          x: gsItem.x,
          y: gsItem.y,
          w: gsItem.w, // GridStack uses 'w' and 'h' for width and height
          h: gsItem.h
        };
        this.updateItemLayout(itemId, newLayout, false); // Pass false to avoid re-render
      });
      // console.log('Dashboard layout synchronized:', this.items);
    });
  }

  /**
   * Renders the entire dashboard.
   */
  renderDashboard() {
    // Clear any existing items from the grid.
    this.grid.removeAll();
    // Iterate over the items array and render each item.
    this.items.forEach(item => this._renderItem(item));
  }

  /**
   * Adds a new item to the dashboard.
   * @param {string} type - The type of the item (e.g., 'text', 'chart').
   * @param {object} config - The configuration for the item.
   * @param {object} layout - The layout information for the item (x, y, w, h).
   */
  addItem(type, config, layout) {
    const newItem = {
      id: ++this.itemIdCounter, // Generate unique ID
      type,
      config,
      layout, // Should include x, y, w, h
    };
    this.items.push(newItem); // Add to items array
    this.renderDashboard(); // Re-render the entire dashboard
    return newItem.id;
  }

  /**
   * Removes an item from the dashboard.
   * @param {number} itemId - The ID of the item to remove.
   */
  removeItem(itemId) {
    this.items = this.items.filter(item => item.id !== itemId);
    // No need to call this.grid.removeWidget() explicitly if we re-render
    this.renderDashboard(); // Re-render the entire dashboard
  }

  /**
   * Updates the configuration of an existing item.
   * @param {number} itemId - The ID of the item to update.
   * @param {object} newConfig - The new configuration object.
   */
  updateItemConfig(itemId, newConfig) {
    const item = this.items.find(i => i.id === itemId);
    if (item) {
      item.config = { ...item.config, ...newConfig };
      this.renderDashboard(); // Re-render to reflect changes
    } else {
      console.warn(`Item with ID ${itemId} not found for config update.`);
    }
  }

  /**
   * Updates the layout of an existing item in the internal items array.
   * @param {number} itemId - The ID of the item to update.
   * @param {object} newLayout - The new layout object (x, y, w, h).
   * @param {boolean} [shouldRender=true] - Whether to re-render the dashboard.
   */
  updateItemLayout(itemId, newLayout, shouldRender = true) {
    const item = this.items.find(i => i.id === itemId);
    if (item) {
      // Ensure all layout properties are updated
      item.layout = { 
        x: newLayout.x, 
        y: newLayout.y, 
        w: newLayout.w, 
        h: newLayout.h 
      };
      if (shouldRender) {
        this.renderDashboard(); // Re-render if needed
      }
      // console.log(`Internal layout for item ${itemId} updated:`, item.layout);
    } else {
      console.warn(`Item with ID ${itemId} not found for layout update.`);
    }
  }

  /**
   * Saves the current dashboard state to a JSON string.
   * Saves the current dashboard state (items and itemIdCounter) to a JSON string.
   * @returns {string} - JSON string representing the dashboard state, pretty-printed.
   */
  saveDashboard() {
    const dashboardState = {
      items: this.items,
      itemIdCounter: this.itemIdCounter
    };
    return JSON.stringify(dashboardState, null, 2);
  }

  /**
   * Loads a dashboard state from a JSON string.
   * @param {string} jsonData - JSON string representing the dashboard state.
   * @returns {boolean} - True if loading and rendering were successful, false otherwise.
   */
  loadDashboard(jsonData) {
    try {
      const loadedState = JSON.parse(jsonData);

      // Basic validation
      if (!loadedState || typeof loadedState !== 'object') {
        console.error("Load failed: Invalid data format (not an object).");
        alert("Failed to load dashboard: Invalid data format.");
        return false;
      }
      if (!Array.isArray(loadedState.items)) {
        console.error("Load failed: 'items' property is not an array.");
        alert("Failed to load dashboard: 'items' property is missing or not an array.");
        return false;
      }
      if (typeof loadedState.itemIdCounter !== 'number' || loadedState.itemIdCounter < 0) {
        console.error("Load failed: 'itemIdCounter' is invalid.");
        alert("Failed to load dashboard: 'itemIdCounter' is missing or invalid.");
        return false;
      }

      // Validate each item (basic)
      for (const item of loadedState.items) {
        if (typeof item.id !== 'number' ||
            typeof item.type !== 'string' ||
            typeof item.config !== 'object' ||
            typeof item.layout !== 'object' ||
            typeof item.layout.x !== 'number' ||
            typeof item.layout.y !== 'number' ||
            typeof item.layout.w !== 'number' ||
            typeof item.layout.h !== 'number') {
          console.error("Load failed: Invalid item structure.", item);
          alert(`Failed to load dashboard: An item has an invalid structure (e.g., item ID ${item.id || 'unknown'}).`);
          return false;
        }
      }

      this.items = loadedState.items;
      this.itemIdCounter = loadedState.itemIdCounter;

      // It's also good practice to re-calculate itemIdCounter based on loaded items
      // to prevent potential future ID clashes if the saved counter was incorrect.
      if (this.items.length > 0) {
        const maxId = this.items.reduce((max, item) => Math.max(max, item.id), 0);
        this.itemIdCounter = Math.max(this.itemIdCounter, maxId); // Ensure counter is at least maxId
      } else {
        // If no items, itemIdCounter could be reset, but using the loaded value is fine
        // or reset to 0 if strict reset is preferred when dashboard is empty.
        // this.itemIdCounter = 0; // Optional: reset if no items
      }
      
      this.renderDashboard();
      console.log("Dashboard loaded successfully.");
      return true;
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      alert(`Failed to load dashboard: ${error.message}`);
      return false;
    }
  }

  /**
   * Renders a single dashboard item.
   * (Private helper method - To be implemented)
   * @param {object} item - The item object to render.
   */
  _renderItem(item) {
    // Create the main item element.
    const itemElement = document.createElement('div');
    itemElement.className = 'grid-stack-item';
    // Set GridStack attributes.
    itemElement.setAttribute('gs-x', item.layout.x);
    itemElement.setAttribute('gs-y', item.layout.y);
    itemElement.setAttribute('gs-w', item.layout.w);
    itemElement.setAttribute('gs-h', item.layout.h);
    itemElement.setAttribute('data-item-id', item.id); // Store item id

    // Create the content container.
    const contentContainer = document.createElement('div');
    contentContainer.className = 'grid-stack-item-content';
    itemElement.appendChild(contentContainer);

    // Render specific content based on item type.
    switch (item.type) {
      case 'text':
        this._renderText(item, contentContainer);
        break;
      case 'title':
        this._renderTitle(item, contentContainer);
        break;
      case 'image':
        this._renderImage(item, contentContainer);
        break;
      case 'chart':
        this._renderChart(item, contentContainer);
        break;
      case 'table':
        this._renderTable(item, contentContainer);
        break;
      default:
        console.warn(`Unknown item type: ${item.type}`);
        contentContainer.textContent = `Unknown item type: ${item.type}`;
    }

    // Add Edit and Delete buttons.
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'panorama-item-controls';

    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.className = 'panorama-edit-button';
    editButton.dataset.itemId = item.id;
    // TODO: Add event listener for edit functionality:
    editButton.addEventListener('click', (event) => {
      const itemIdToEdit = parseInt(event.target.dataset.itemId);
      const itemToEdit = this.items.find(i => i.id === itemIdToEdit);
      if (itemToEdit) {
        this._showEditModal(itemToEdit);
      }
    });
    controlsContainer.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'panorama-delete-button';
    deleteButton.dataset.itemId = item.id;
    deleteButton.addEventListener('click', (event) => {
      const itemIdToRemove = parseInt(event.target.dataset.itemId);
      this.removeItem(itemIdToRemove);
    });
    controlsContainer.appendChild(deleteButton);
    
    // Prepend controls to the content container for better visibility/access
    contentContainer.insertBefore(controlsContainer, contentContainer.firstChild);

    // Add the item to the grid.
    this.grid.makeWidget(itemElement);
  }

  // Placeholder for specific rendering functions
  _renderText(item, contentContainer) {
    const textElement = document.createElement('p');
    textElement.textContent = item.config.content;
    contentContainer.appendChild(textElement);
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
    contentContainer.appendChild(imageElement);
  }

  _renderChart(item, contentContainer) {
    // Ensure contentContainer has a unique ID for chart rendering if needed
    if (!contentContainer.id) {
      contentContainer.id = `chart-container-${item.id}`;
    }
    // Placeholder for PureChart.js integration
    // Example: new PureChart(contentContainer.id, item.config.chartType, item.config.chartData, item.config.chartOptions);
    contentContainer.textContent = `Chart: ${item.config.chartType}`; // Placeholder content
    console.log(`Rendering chart in ${contentContainer.id} with config:`, item.config);
  }

  _renderTable(item, contentContainer) {
    // Ensure contentContainer has a unique ID for table rendering if needed
    if (!contentContainer.id) {
      contentContainer.id = `table-container-${item.id}`;
    }
    // Placeholder for dynamic-table.js integration
    // Example: new DynamicTable(contentContainer, item.config.tableData, item.config.tableOptions);
    contentContainer.textContent = 'Table Placeholder'; // Placeholder content
    console.log(`Rendering table in ${contentContainer.id} with config:`, item.config);
  }

  _createEditModal() {
    if (document.getElementById('panorama-edit-modal')) {
      // Modal already exists, ensure listeners are correctly attached or re-attached if necessary
      this.modalElement = document.getElementById('panorama-edit-modal');
      this.modalTitleElement = this.modalElement.querySelector('.panorama-modal-header h2');
      this.modalFormArea = this.modalElement.querySelector('.panorama-modal-form-area');
      this.saveModalButton = this.modalElement.querySelector('.panorama-modal-save');
      this.cancelModalButton = this.modalElement.querySelector('.panorama-modal-cancel');
    } else {
      // Create modal from scratch
      this.modalElement = document.createElement('div');
      this.modalElement.id = 'panorama-edit-modal';
      this.modalElement.className = 'panorama-modal'; // Initially hidden by CSS

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

    // Ensure cancel button always has its listener
    // Remove existing listener before adding a new one to prevent duplicates
    const newCancelButton = this.cancelModalButton.cloneNode(true);
    this.cancelModalButton.parentNode.replaceChild(newCancelButton, this.cancelModalButton);
    this.cancelModalButton = newCancelButton;
    this.cancelModalButton.addEventListener('click', () => this._hideEditModal());

    // Save button listener is attached in _showEditModal because its behavior depends on the item type.
  }

  _showEditModal(item) {
    this.editingItemId = item.id;
    this.modalTitleElement.textContent = `Edit ${item.type.charAt(0).toUpperCase() + item.type.slice(1)} Item (ID: ${item.id})`;
    this.modalFormArea.innerHTML = ''; // Clear previous form content

    // Populate form based on item type
    switch (item.type) {
      case 'text':
        this.modalFormArea.innerHTML = `
          <label for="editTextContent">Content:</label>
          <textarea id="editTextContent" class="panorama-modal-textarea">${item.config.content}</textarea>
        `;
        break;
      case 'title':
        this.modalFormArea.innerHTML = `
          <label for="editTitleText">Text:</label>
          <input type="text" id="editTitleText" class="panorama-modal-input" value="${item.config.text}">
          <label for="editTitleLevel">Level (1-6):</label>
          <input type="number" id="editTitleLevel" class="panorama-modal-input" value="${item.config.level || 1}" min="1" max="6">
        `;
        break;
      case 'image':
        this.modalFormArea.innerHTML = `
          <label for="editImageUrl">Image URL:</label>
          <input type="text" id="editImageUrl" class="panorama-modal-input" value="${item.config.url}">
          <label for="editImageAlt">Alt Text:</label>
          <input type="text" id="editImageAlt" class="panorama-modal-input" value="${item.config.alt || ''}">
        `;
        break;
      case 'chart':
      case 'table':
        this.modalFormArea.innerHTML = `
          <label for="editJsonConfig">JSON Configuration:</label>
          <textarea id="editJsonConfig" class="panorama-modal-textarea" rows="10">${JSON.stringify(item.config, null, 2)}</textarea>
          <p><small>Edit the JSON configuration directly. Be careful with syntax.</small></p>
        `;
        break;
      default:
        this.modalFormArea.textContent = 'This item type cannot be edited in this way.';
    }

    // Setup Save button listener
    // Clone and replace to remove old listeners, then add new one
    const oldSaveButton = this.saveModalButton;
    this.saveModalButton = oldSaveButton.cloneNode(true); // Save a true copy
    oldSaveButton.parentNode.replaceChild(this.saveModalButton, oldSaveButton);
    
    this.saveModalButton.addEventListener('click', () => this._handleSaveModal(item.type));

    this.modalElement.style.display = 'block';
  }

  _hideEditModal() {
    this.modalElement.style.display = 'none';
    this.editingItemId = null;
    this.modalFormArea.innerHTML = ''; // Clear form for next time
  }

  _handleSaveModal(itemType) {
    if (!this.editingItemId) return;

    let newConfig = {};
    try {
      switch (itemType) {
        case 'text':
          newConfig.content = document.getElementById('editTextContent').value;
          break;
        case 'title':
          newConfig.text = document.getElementById('editTitleText').value;
          newConfig.level = parseInt(document.getElementById('editTitleLevel').value) || 1;
          if (newConfig.level < 1 || newConfig.level > 6) newConfig.level = 1; // Basic validation
          break;
        case 'image':
          newConfig.url = document.getElementById('editImageUrl').value;
          newConfig.alt = document.getElementById('editImageAlt').value;
          break;
        case 'chart':
        case 'table':
          const jsonString = document.getElementById('editJsonConfig').value;
          newConfig = JSON.parse(jsonString); // This can throw an error
          break;
        default:
          console.warn("Attempted to save unhandled item type:", itemType);
          this._hideEditModal();
          return;
      }
    } catch (error) {
      alert(`Error parsing configuration: ${error.message}\nPlease check the JSON syntax if editing chart/table.`);
      console.error("Error processing configuration for save:", error);
      return; // Don't close modal or save if there's an error
    }

    this.updateItemConfig(this.editingItemId, newConfig);
    this._hideEditModal();
  }
}
