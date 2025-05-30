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
    // Initialize an empty array to store dashboard item objects.
    this.items = [];
    // Initialize an itemIdCounter to 0, which will be used to generate unique IDs for items.
    this.itemIdCounter = 0;
    this.editingItemId = null; // To store the ID of the item being edited
    this.draggedItem = null; // To store the item being dragged
    this.dropPlaceholder = null; // To store the placeholder element
    this.maxGridRows = 100;

    // Create the edit modal structure
    this._createEditModal();

    // --- Native Drag and Drop Listeners for Grid Container ---
    this.gridContainer.addEventListener('dragover', (event) => {
        event.preventDefault(); // Necessary to allow dropping
        event.dataTransfer.dropEffect = 'move';

        if (!this.draggedItem) return;

        // --- Calculate mouse position relative to grid container ---
        const rect = this.gridContainer.getBoundingClientRect();
        const dropX = event.clientX - rect.left;
        const dropY = event.clientY - rect.top;

        const gridStyle = window.getComputedStyle(this.gridContainer);
        const gridPaddingLeft = parseFloat(gridStyle.paddingLeft);
        const gridPaddingTop = parseFloat(gridStyle.paddingTop);
        const gridGap = parseFloat(gridStyle.gap) || 10;
        const numColumns = 12;
        
        const clientWidth = this.gridContainer.clientWidth;
        const cellWidth = (clientWidth - (2 * gridPaddingLeft) - ((numColumns - 1) * gridGap)) / numColumns;
        const cellHeightApproximation = 50 + (gridGap/2);

        // --- Get Dragged Item's Layout for width and height of placeholder ---
        const draggedItemLayout = this.draggedItem.layout;
        const placeholderW = draggedItemLayout.w;
        const placeholderH = draggedItemLayout.h;
        
        // --- Determine Target Placeholder Position based on mouse grid position ---
        let placeholderX = Math.floor((dropX - gridPaddingLeft + gridGap / 2) / (cellWidth + gridGap)) + 1;
        let placeholderY = Math.floor((dropY - gridPaddingTop + gridGap / 2) / (cellHeightApproximation)) + 1;
        
        // --- Apply Grid Boundary Checks ---
        placeholderX = Math.max(1, Math.min(placeholderX, numColumns - placeholderW + 1));
        placeholderY = Math.max(1, placeholderY);

        // --- Debugging Logs ---
        console.log('[DragOver] MousePos:', { dropX, dropY });
        console.log('[DragOver] GridParams:', { gridPaddingLeft, gridPaddingTop, gridGap, cellWidth, cellHeightApproximation });
        console.log('[DragOver] Placeholder Attempt:', { x: placeholderX, y: placeholderY, w: placeholderW, h: placeholderH });
        console.log('[DragOver] Dragged Item Layout:', { w: draggedItemLayout.w, h: draggedItemLayout.h }); // Added this to check draggedItem's current W/H

        // --- Create or update placeholder div ---
        if (!this.dropPlaceholder) {
          this.dropPlaceholder = document.createElement('div');
          this.dropPlaceholder.className = 'drop-placeholder';
          this.gridContainer.appendChild(this.dropPlaceholder);
        }
        this.dropPlaceholder.style.gridColumnStart = placeholderX;
        this.dropPlaceholder.style.gridRowStart = placeholderY;
        this.dropPlaceholder.style.gridColumnEnd = `span ${placeholderW}`;
        this.dropPlaceholder.style.gridRowEnd = `span ${placeholderH}`;

        // --- Collision Detection for Placeholder ---
        const potentialLayout = { x: placeholderX, y: placeholderY, w: placeholderW, h: placeholderH };
        let collisionDetected = false;
        let collidingItemId = null;
        for (const otherItem of this.items) {
          if (otherItem.id === this.draggedItem.id) continue; // Skip self
          if (this._isCollision(potentialLayout, otherItem.layout)) {
            collisionDetected = true;
            collidingItemId = otherItem.id;
            break;
          }
        }

        if (collisionDetected) {
          this.dropPlaceholder.classList.add('drop-placeholder-invalid');
          event.dataTransfer.dropEffect = 'none';
        } else {
          this.dropPlaceholder.classList.remove('drop-placeholder-invalid');
          event.dataTransfer.dropEffect = 'move';
        }
        console.log('[DragOver] Collision Status:', { collisionDetected, dropEffect: event.dataTransfer.dropEffect, collidingWithItemId: collidingItemId });      



    });

    this.gridContainer.addEventListener('dragleave', (event) => {
      // Remove placeholder if mouse leaves grid container
      if (this.dropPlaceholder && event.target === this.gridContainer) {
        this.gridContainer.removeChild(this.dropPlaceholder);
        this.dropPlaceholder = null;
      }
    });

    this.gridContainer.addEventListener('drop', (event) => {
      event.preventDefault();
      if (this.dropPlaceholder) {
        this.gridContainer.removeChild(this.dropPlaceholder);
        this.dropPlaceholder = null;
      }

      const itemId = parseInt(event.dataTransfer.getData('text/plain'));
      const itemToMove = this.items.find(i => i.id === itemId);

      if (!itemToMove) return;
    console.log('[Drop] Item:', { itemId, itemToMove });

      // --- Calculate new grid position (x, y) ---
      const rect = this.gridContainer.getBoundingClientRect();
      const dropX = event.clientX - rect.left;
      const dropY = event.clientY - rect.top;

      const gridStyle = window.getComputedStyle(this.gridContainer);
      const gridPaddingLeft = parseFloat(gridStyle.paddingLeft);
      const gridPaddingTop = parseFloat(gridStyle.paddingTop);
      const gridGap = parseFloat(gridStyle.gap) || 10;
      const numColumns = 12;
      const cellWidth = (this.gridContainer.clientWidth - (2 * gridPaddingLeft) - ((numColumns - 1) * gridGap)) / numColumns;
      const cellHeightApproximation = 50 + (gridGap/2); // Based on minmax(50px, auto) and gap

      // Adjust calculation to better snap to grid cells considering their full span including gap
      // The idea is to find which cell's "center" (or a point within it) the drop point is closest to.
      let newGridX = Math.floor((dropX - gridPaddingLeft + gridGap / 2) / (cellWidth + gridGap)) + 1;
      let newGridY = Math.floor((dropY - gridPaddingTop + gridGap / 2) / (cellHeightApproximation)) + 1;
      
      // Ensure newGridX/Y are within bounds
      // For X: cannot start beyond where it would exceed numColumns
      newGridX = Math.max(1, Math.min(newGridX, numColumns - itemToMove.layout.w + 1));
      // For Y: cannot start below 1. If grid has max rows, add upper bound.
      newGridY = Math.max(1, newGridY); 
    console.log('[Drop] Calculated:', { dropX, dropY, newGridX, newGridY, cellWidth, cellHeightApproximation });
      
      // --- Collision Detection before committing drop ---
      const finalLayout = { 
        x: newGridX, 
        y: newGridY, 
        w: itemToMove.layout.w, 
        h: itemToMove.layout.h 
      };
      let dropCollision = false;
      for (const otherItem of this.items) {
        if (otherItem.id === itemToMove.id) continue; // Skip self
        if (this._isCollision(finalLayout, otherItem.layout)) {
          dropCollision = true;
          break;
        }
      }

      if (dropCollision) {
        console.warn(`[Drop] Collision detected for item ${itemToMove.id}. Reverting.`);
        // Item remains in its original position as its layout is not updated.
        // Re-render to ensure it snaps back visually if placeholder was different.
        this.renderDashboard(); 
      } else {
        console.log(`[Drop] Applying new layout for item ${itemToMove.id}:`, {newGridX, newGridY});
        itemToMove.layout.x = newGridX;
        itemToMove.layout.y = newGridY;
        this.updateItemLayout(itemToMove.id, itemToMove.layout, true); // true to re-render
      }
    console.log('[Drop] Final Layout & Collision:', { finalLayout, dropCollision });
      
      this.draggedItem = null; // Clear dragged item reference
    });
  }

  /**
   * Renders the entire dashboard.
   */
  renderDashboard() {
    // Clear any existing items from the grid container.
    this.gridContainer.innerHTML = '';
    // Iterate over the items array and render each item.
    this.items.forEach(item => {
      const itemElement = this._renderItem(item); // _renderItem now returns the element
      this.gridContainer.appendChild(itemElement);
    });
  }

  /**
   * Adds a new item to the dashboard.
   * @param {string} type - The type of the item (e.g., 'text', 'chart').
   * @param {object} config - The configuration for the item.
   * @param {object} layout - The layout information for the item (x, y, w, h).
   */
  addItem(type, config, layout) {
    let currentLayout = { ...layout }; // Operate on a copy
    const maxRowsToTry = 50; // Max Y value to try
    let collision = false;
    let attempts = 0;
    const numColumns = 12; // Assuming 12 columns

    // Ensure initial x is at least 1
    if (currentLayout.x < 1) {
        console.log(`[AddItem] Original layout.x ${currentLayout.x} < 1, adjusting to 1.`);
        currentLayout.x = 1;
    }

    // Ensure item fits horizontally
    if (currentLayout.x + currentLayout.w - 1 > numColumns) {
        if (currentLayout.w <= numColumns) { // If width itself is fine, try to shift x
             console.log(`[AddItem] Item (type: ${type}, w: ${currentLayout.w}) overflows at x: ${currentLayout.x}. Shifting x.`);
             currentLayout.x = numColumns - currentLayout.w + 1;
        } else { // Width is too large for the grid
            console.warn(`[AddItem] New item (type: ${type}) is too wide for the grid (w: ${currentLayout.w}). Clamping width to ${numColumns}.`);
            currentLayout.w = numColumns;
            currentLayout.x = 1; // Place at start if clamped
        }
    }
     // After potential adjustments, ensure x is still at least 1 (e.g. if w was clamped making original x invalid)
    if (currentLayout.x < 1) {
        currentLayout.x = 1;
    }


    do {
        collision = false;
        for (const existingItem of this.items) {
            if (this._isCollision(currentLayout, existingItem.layout)) {
                collision = true;
                break;
            }
        }

        if (collision) {
            currentLayout.y++;
            attempts++;
            if (currentLayout.y >= maxRowsToTry) {
                console.warn(`[AddItem] Could not find a non-colliding position for new item (type: ${type}) after ${attempts} attempts. Placing at y=${currentLayout.y}.`);
                break; 
            }
        }
    } while (collision && attempts < maxRowsToTry); // Ensure attempts limit is also part of the loop condition

    const newItem = {
      id: ++this.itemIdCounter, // Generate unique ID
      type,
      config,
      layout: currentLayout, // Use the potentially adjusted layout
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

          // Basic validation for loadedState and its properties
          if (!loadedState || typeof loadedState !== 'object') {
              console.error("[LoadDashboard] Load failed: Invalid data format (not an object).");
              alert("Failed to load dashboard: Invalid data format.");
              return false;
          }
          if (!Array.isArray(loadedState.items)) {
              console.error("[LoadDashboard] Load failed: 'items' property is not an array.");
              alert("Failed to load dashboard: 'items' property is missing or not an array.");
              return false;
          }
          if (typeof loadedState.itemIdCounter !== 'number' || loadedState.itemIdCounter < 0) {
              console.error("[LoadDashboard] Load failed: 'itemIdCounter' is invalid.");
              alert("Failed to load dashboard: 'itemIdCounter' is missing or invalid.");
              return false;
          }

          const tempLoadedItems = loadedState.items;
          this.items = []; // Clear current items before loading new ones
          // this.itemIdCounter will be set later based on max ID and loadedState.itemIdCounter

          const numColumns = 12; 
          const maxRowsToTry = 50; 

          for (const item of tempLoadedItems) {
              if (!item.layout || typeof item.layout.x !== 'number' || typeof item.layout.y !== 'number' || 
                  typeof item.layout.w !== 'number' || typeof item.layout.h !== 'number') {
                  console.warn(`[LoadDashboard] Item ID ${item.id || 'unknown'} has invalid or missing layout. Skipping.`);
                  continue;
              }

              let currentLayout = { ...item.layout };

              // 1. Initial Layout Correction (1-based indexing and horizontal fit)
              if (currentLayout.x < 1) {
                  console.log(`[LoadDashboard] Item ID ${item.id}: layout.x ${currentLayout.x} < 1, adjusting to 1.`);
                  currentLayout.x = 1;
              }
              if (currentLayout.y < 1) { // Should not happen if saved correctly
                  console.log(`[LoadDashboard] Item ID ${item.id}: layout.y ${currentLayout.y} < 1, adjusting to 1.`);
                  currentLayout.y = 1;
              }

              if (currentLayout.x + currentLayout.w - 1 > numColumns) {
                  if (currentLayout.w <= numColumns) {
                      currentLayout.x = numColumns - currentLayout.w + 1;
                  } else {
                      currentLayout.w = numColumns;
                      currentLayout.x = 1;
                  }
              }
              if (currentLayout.x < 1) { // Re-check after width adjustment
                  currentLayout.x = 1;
              }

              // 2. Collision Avoidance against already processed items in this.items
              let collision = false;
              let attempts = 0;
              let originalY = currentLayout.y; // Store original Y for more controlled searching

              do {
                  collision = false;
                  for (const existingItem of this.items) { 
                      if (this._isCollision(currentLayout, existingItem.layout)) {
                          collision = true;
                          break;
                      }
                  }

                  if (collision) {
                      currentLayout.y++;
                      attempts++;
                      if (currentLayout.y >= originalY + maxRowsToTry) { // Limit search relative to original Y
                          console.warn(`[LoadDashboard] Could not find a non-colliding position for loaded item ID ${item.id} near y=${originalY} after ${attempts} attempts. Placing at y=${currentLayout.y}.`);
                          break; 
                      }
                  }
              } while (collision && attempts < maxRowsToTry); // Ensure attempts limit is part of loop

              this.items.push({
                  ...item,
                  layout: currentLayout 
              });
          }

          // Update itemIdCounter based on loaded items and/or the loaded counter value
          let maxIdInLoadedItems = 0;
          if (this.items.length > 0) {
              maxIdInLoadedItems = this.items.reduce((max, itm) => Math.max(max, itm.id), 0);
          }
          this.itemIdCounter = Math.max(loadedState.itemIdCounter, maxIdInLoadedItems);
          
          this.renderDashboard();
          console.log("[LoadDashboard] Dashboard loaded successfully with layout adjustments.");
          return true;

      } catch (error) {
          console.error("[LoadDashboard] Failed to load dashboard:", error);
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
    itemElement.className = 'panorama-item'; 
    itemElement.setAttribute('data-item-id', item.id); // Store item id
    itemElement.setAttribute('draggable', 'true'); // Make item draggable

    itemElement.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', item.id.toString());
        event.dataTransfer.effectAllowed = 'move';
        event.target.classList.add('dragging-item');
        this.draggedItem = item; // Store reference to the dragged item
    console.log('[DragStart]', { itemId: item.id, draggedItem: this.draggedItem });
    });

    itemElement.addEventListener('dragend', (event) => {
        event.target.classList.remove('dragging-item');
        if (this.dropPlaceholder && this.dropPlaceholder.parentNode === this.gridContainer) {
            this.gridContainer.removeChild(this.dropPlaceholder);
            this.dropPlaceholder = null;
        }
        this.draggedItem = null; // Clear reference
    });

    // Apply CSS Grid positioning styles. 
    // Ensure layout values are 1-based and valid.
    // x and y are grid line numbers (1-based). w and h are spans.
    itemElement.style.gridColumnStart = item.layout.x;
    itemElement.style.gridRowStart = item.layout.y;
    itemElement.style.gridColumnEnd = `span ${item.layout.w}`;
    itemElement.style.gridRowEnd = `span ${item.layout.h}`;

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

    // Create or reuse the controls container
    let controlsContainer = itemElement.querySelector('.panorama-item-controls');
    if (!controlsContainer) {
        controlsContainer = document.createElement('div');
        controlsContainer.className = 'panorama-item-controls';
        // Prepend controls to the content container for better visibility/access
        itemElement.insertBefore(controlsContainer, contentContainer);
    } else {
        controlsContainer.innerHTML = ''; // Clear old buttons
    }

    // Create the menu button
    const menuButton = document.createElement('button');
    menuButton.className = 'panorama-item-menu-btn';
    menuButton.innerHTML = '⋮'; // Vertical ellipsis
    menuButton.dataset.itemId = item.id;
    menuButton.setAttribute('aria-haspopup', 'true');
    menuButton.setAttribute('aria-expanded', 'false');
    // Event listener for menu button will be added later to toggle popup

    // Create the popup menu
    const popupMenu = document.createElement('div');
    popupMenu.className = 'panorama-item-menu-popup';
    popupMenu.style.display = 'none'; // Initially hidden
    popupMenu.dataset.itemId = item.id;

    // Create "Edit" action
    const editAction = document.createElement('a');
    editAction.href = '#';
    editAction.className = 'panorama-edit-action';
    editAction.textContent = 'Edit';
    editAction.dataset.itemId = item.id;
    editAction.addEventListener('click', (event) => {
      event.preventDefault();
      const itemIdToEdit = parseInt(event.target.dataset.itemId);
      const itemToEdit = this.items.find(i => i.id === itemIdToEdit);
      if (itemToEdit) {
        this._showEditModal(itemToEdit);
      }
      popupMenu.style.display = 'none'; // Hide menu after action
      menuButton.setAttribute('aria-expanded', 'false');
    });
    popupMenu.appendChild(editAction);

    // Create "Delete" action
    const deleteAction = document.createElement('a');
    deleteAction.href = '#';
    deleteAction.className = 'panorama-delete-action';
    deleteAction.textContent = 'Delete';
    deleteAction.dataset.itemId = item.id;
    deleteAction.addEventListener('click', (event) => {
      event.preventDefault();
      const itemIdToRemove = parseInt(event.target.dataset.itemId);
      this.removeItem(itemIdToRemove);
      // Popup will be removed with the item, so no need to explicitly hide it
    });
    popupMenu.appendChild(deleteAction);

    // Append new controls
    controlsContainer.appendChild(menuButton);
    controlsContainer.appendChild(popupMenu);

    // Add event listener to menu button to toggle popup
    menuButton.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent click from bubbling to document listener immediately
      const currentlyVisible = popupMenu.style.display === 'block';
      // Hide all other popups
      document.querySelectorAll('.panorama-item-menu-popup').forEach(p => p.style.display = 'none');
      document.querySelectorAll('.panorama-item-menu-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
      
      if (!currentlyVisible) {
        popupMenu.style.display = 'block';
        menuButton.setAttribute('aria-expanded', 'true');
      } else {
        popupMenu.style.display = 'none';
        menuButton.setAttribute('aria-expanded', 'false');
      }
    });

    // Global click listener to close popups
    // Ensure this listener is added only once or managed to avoid duplicates
    if (!this.constructor._globalClickListenerAdded) {
      document.addEventListener('click', () => {
        document.querySelectorAll('.panorama-item-menu-popup').forEach(p => p.style.display = 'none');
        document.querySelectorAll('.panorama-item-menu-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
      });
      this.constructor._globalClickListenerAdded = true;
    }

    // Add new 8-directional resize handles
    const handleDirections = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'];
    handleDirections.forEach(direction => {
      const handle = document.createElement('div');
      handle.className = `resize-handle-base resize-handle-${direction}`;
      handle.dataset.direction = direction;
      handle.addEventListener('mousedown', this._initiateResize.bind(this, item, itemElement));
      itemElement.appendChild(handle);
    });
    
    return itemElement; // Return the created element
  }

  _initiateResize(item, itemElement, event) {
    event.preventDefault();
    event.stopPropagation(); // Prevent item drag or other interactions

    const direction = event.target.dataset.direction;
    event.preventDefault();
    event.stopPropagation();

    this.isResizing = true;
    this.resizeItem = item;
    this.resizeItemElement = itemElement;
    this.resizeDirection = event.target.dataset.direction;
    this.originalMouseX = event.clientX;
    this.originalMouseY = event.clientY;
    this.originalLayout = { ...item.layout }; // Shallow copy is fine here

    this._handleResizeMoveListener = this._handleResizeMove.bind(this);
    this._handleResizeUpListener = this._handleResizeUp.bind(this);
    document.addEventListener('mousemove', this._handleResizeMoveListener);
    document.addEventListener('mouseup', this._handleResizeUpListener);

    // Add a class to the item being resized for visual feedback (optional)
    this.resizeItemElement.classList.add('resizing-active');
    console.log('[Resize Start]', { itemId: this.resizeItem.id, direction: this.resizeDirection, originalLayout: this.originalLayout });

  }

  _handleResizeMove(event) {
    if (!this.isResizing) return;
    event.preventDefault();

    const deltaX = event.clientX - this.originalMouseX;
    const deltaY = event.clientY - this.originalMouseY;

    const gridStyle = window.getComputedStyle(this.gridContainer);
    const gridGap = parseFloat(gridStyle.gap) || 10;
    const numColumns = 12; // Assuming 12 columns as per current CSS
    // Calculate cellWidth based on the clientWidth of the grid container, its padding, and the gaps between columns.
    const cellWidth = (this.gridContainer.clientWidth - parseFloat(gridStyle.paddingLeft) - parseFloat(gridStyle.paddingRight) - (numColumns - 1) * gridGap) / numColumns;
    // Use a fixed basis for cell height or derive from grid-auto-rows if possible and needed.
    // For `grid-auto-rows: minmax(50px, auto)`, 50px is the minimum.
    // A more robust solution might involve inspecting actual row heights if they are truly dynamic beyond minmax.
    const cellHeight = parseFloat(gridStyle.gridAutoRows) || 50; // Approx. from minmax(50px, auto)

    // Convert pixel deltas to grid units. Add half a cell to bias rounding to the nearest cell edge.
    const deltaGridX = Math.round(deltaX / (cellWidth + gridGap));
    const deltaGridY = Math.round(deltaY / (cellHeight + gridGap));
    
    let newLayout = { ...this.originalLayout };

    // Adjust layout based on direction
    if (this.resizeDirection.includes('e')) {
      newLayout.w = this.originalLayout.w + deltaGridX;
    }
    if (this.resizeDirection.includes('w')) {
      newLayout.x = this.originalLayout.x + deltaGridX;
      newLayout.w = this.originalLayout.w - deltaGridX;
    }
    if (this.resizeDirection.includes('s')) {
      newLayout.h = this.originalLayout.h + deltaGridY;
    }
    if (this.resizeDirection.includes('n')) {
      newLayout.y = this.originalLayout.y + deltaGridY;
      newLayout.h = this.originalLayout.h - deltaGridY;
    }

    // Clamp to maxGridRows if resizing downwards or item starts too low and gets too tall
    if (newLayout.y + newLayout.h - 1 > this.maxGridRows) {
        if (newLayout.y <= this.maxGridRows) { // Item starts within max rows
            newLayout.h = this.maxGridRows - newLayout.y + 1;
        } else { // Item starts already beyond max rows (should ideally not happen)
            newLayout.h = 1; // Or some other minimum sensible height
            newLayout.y = this.maxGridRows; // Pull it back to the last valid row
        }
    }

    console.log('[Resize Move] Deltas:', { deltaX, deltaY, deltaGridX, deltaGridY });
    console.log('[Resize Move] Initial newLayout:', JSON.parse(JSON.stringify(newLayout))); // Log deep copy

    // Boundary and Minimum Size Checks
    if (newLayout.w < 1) {
        if (this.resizeDirection.includes('w')) { // Resizing from west, width became < 1
            newLayout.x = this.originalLayout.x + this.originalLayout.w -1; // Snap x to original right edge
        }
        newLayout.w = 1;
    }

    if (newLayout.h < 1) {
        if (this.resizeDirection.includes('n')) { // Resizing from north, height became < 1
            newLayout.y = this.originalLayout.y + this.originalLayout.h - 1; // Snap y to original bottom edge
        }
        newLayout.h = 1;
    }

    if (newLayout.x < 1) {
        if (this.resizeDirection.includes('w') || this.resizeDirection.includes('e')) { // If width changed due to x
            newLayout.w = this.originalLayout.x + this.originalLayout.w -1;
        }
        newLayout.x = 1;
    }
    if (newLayout.y < 1) {
        if (this.resizeDirection.includes('n') || this.resizeDirection.includes('s')) { // If height changed due to y
             newLayout.h = this.originalLayout.y + this.originalLayout.h - 1;
        }
        newLayout.y = 1;
    }

    // Max boundary checks
    if (newLayout.x + newLayout.w > numColumns + 1) {
      if (this.resizeDirection.includes('e')) { // Resizing eastwards
        newLayout.w = numColumns - newLayout.x + 1;
      } else if (this.resizeDirection.includes('w')) { // Resizing westwards, x changed
        // This case should be handled by x < 1 and w < 1 mostly
      }
    }
     if (newLayout.w > numColumns) newLayout.w = numColumns;


    // Collision Detection
    let collision = false;
    for (const otherItem of this.items) {
      if (otherItem.id === this.resizeItem.id) continue;
      if (this._isCollision(newLayout, otherItem.layout)) {
        collision = true;
        break;
      }
    }

    if (collision) {
      // Optionally, provide visual feedback for collision, e.g.,
      this.resizeItemElement.style.outline = '2px solid red'; 
      this.pendingLayout = null; // Invalidate pending layout
      return; 
    } else {
      this.resizeItemElement.style.outline = ''; // Clear collision feedback
    }
    console.log('[Resize Move] Collision Check:', { collision, newLayoutAfterBounds: JSON.parse(JSON.stringify(newLayout)) });
    if (collision) {
        console.warn('[Resize Move] Resize attempt would collide.');
    }
    console.log('[Resize Move] Pending Layout Set:', this.pendingLayout ? JSON.parse(JSON.stringify(this.pendingLayout)) : null);


    // Live Style Update
    this.resizeItemElement.style.gridColumnStart = newLayout.x;
    this.resizeItemElement.style.gridColumnEnd = `span ${newLayout.w}`;
    this.resizeItemElement.style.gridRowStart = newLayout.y;
    this.resizeItemElement.style.gridRowEnd = `span ${newLayout.h}`;
    this.pendingLayout = newLayout;
  }

  _handleResizeUp(event) {
    if (!this.isResizing) return;
    this.isResizing = false;

    document.removeEventListener('mousemove', this._handleResizeMoveListener);
    document.removeEventListener('mouseup', this._handleResizeUpListener);
    this.resizeItemElement.classList.remove('resizing-active');
    this.resizeItemElement.style.outline = ''; // Clear any collision outline

    let finalLayoutToApply = this.originalLayout; // Default to original

    if (this.pendingLayout) {
      // Final collision check for the pending layout
      let collisionOnFinal = false;
      for (const otherItem of this.items) {
        if (otherItem.id === this.resizeItem.id) continue;
        if (this._isCollision(this.pendingLayout, otherItem.layout)) {
          collisionOnFinal = true;
          break;
        }
      }
      if (!collisionOnFinal) {
        finalLayoutToApply = this.pendingLayout;
      } else {
         console.warn(`Resize for item ${this.resizeItem.id} reverted due to collision on mouseup.`);
      }
      console.log('[Resize End]', { editingItemId: this.resizeItem?.id, pendingLayout: this.pendingLayout ? JSON.parse(JSON.stringify(this.pendingLayout)) : null, collisionOnFinal });
      if (collisionOnFinal) {
          console.warn('[Resize End] Final layout collided, reverting to original or last valid pending.');
      }
      console.log('[Resize End] Applying layout:', JSON.parse(JSON.stringify(finalLayoutToApply)));

    }
    
    this.resizeItem.layout = { ...finalLayoutToApply };
    this.updateItemLayout(this.resizeItem.id, this.resizeItem.layout, true); // Update and re-render all

    // Cleanup
    this.resizeItem = null;
    this.resizeItemElement = null;
    this.pendingLayout = null;
    this.originalMouseX = null;
    this.originalMouseY = null;
    this.originalLayout = null;
    this.resizeDirection = null;
    this._handleResizeMoveListener = null;
    this._handleResizeUpListener = null;
  }

  /**
   * Checks if two layout objects collide (overlap).
   * @param {object} layout1 - Layout object { x, y, w, h }.
   * @param {object} layout2 - Layout object { x, y, w, h }.
   * @returns {boolean} - True if they collide, false otherwise.
   * @private
   */
  _isCollision(layout1, layout2) {
    // Check for non-overlapping conditions.
    // If any of these are true, the rectangles do NOT overlap.
    if (
      layout1.x + layout1.w <= layout2.x || // layout1 is to the left of layout2
      layout1.x >= layout2.x + layout2.w || // layout1 is to the right of layout2
      layout1.y + layout1.h <= layout2.y || // layout1 is above layout2
      layout1.y >= layout2.y + layout2.h    // layout1 is below layout2
    ) {
      return false; // No collision
    }
    return true; // Collision
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
    imageElement.style.objectFit = 'contain'; // Added this line
    contentContainer.appendChild(imageElement);
  }

_renderChart(item, contentContainer) {
    // PureChart requires a CANVAS element. We create one inside the contentContainer.
    contentContainer.innerHTML = ''; // Clear any placeholder text like "Chart: line"
    const canvas = document.createElement('canvas');
    canvas.id = `chart-canvas-${item.id}`; // Unique ID for the canvas itself

    // Optional: Basic styling for canvas to be responsive.
    // PureChart might handle this, or you might need CSS for .panorama-item-content canvas
    canvas.style.width = '100%';
    canvas.style.height = '100%'; 
    
    contentContainer.appendChild(canvas);

    // Original debug check (keep this)
    const checkCanvas = document.getElementById(canvas.id);
    if (!checkCanvas) {
        console.error(`PANORAMA DEBUG (pre-rAF): Canvas ${canvas.id} was NOT found in DOM immediately after appendChild! Item ID: ${item.id}`);
    } else {
        console.log(`PANORAMA DEBUG (pre-rAF): Canvas ${canvas.id} was found in DOM. Item ID: ${item.id}`);
    }

    const chartConfig = { // Define chartConfig outside rAF if it doesn't depend on things inside it
        type: item.config.chartType,
        data: item.config.chartData || { labels: [], datasets: [] },
        options: item.config.chartOptions || {}
    };

    // Check for valid chartType and data *before* rAF, to avoid rAF if config is bad
    if (!chartConfig.type || !chartConfig.data.datasets || chartConfig.data.datasets.length === 0) {
        console.error(`Chart item ${item.id} is missing 'chartType' or 'chartData.datasets'. Cannot render.`);
        contentContainer.innerHTML = "<p style='color:red;'>Error: Chart type or data is missing.</p>";
        return;
    }

    requestAnimationFrame(() => {
        try {
            // New check inside rAF
            const canvasInRAF = document.getElementById(canvas.id);
            if (!canvasInRAF) {
                console.error(`PANORAMA DEBUG (in-rAF): Canvas ${canvas.id} NOT found for item ${item.id} even in rAF.`);
                // Attempt to provide a more helpful error message in the UI
                if (contentContainer) { // Ensure contentContainer is still valid
                     contentContainer.innerHTML = `<p style='color:red;'>Error: Chart canvas (ID: ${canvas.id}) not found in DOM for item ${item.id} during rAF. Chart cannot be rendered.</p>`;
                }
                return; // Don't proceed if canvas is still not found
            }

            if (typeof PureChart === 'function') {
                new PureChart(canvas.id, chartConfig);
                console.log(`Rendering chart on canvas ${canvas.id} for item ${item.id} (via rAF).`);
            } else {
                console.error("Error: PureChart is not defined (rAF). Ensure PureChart.js is loaded.");
                if (contentContainer) {
                    contentContainer.innerHTML = "<p style='color:red;'>Error: Chart library (PureChart) not found (rAF).</p>";
                }
            }
        } catch (e) {
            console.error(`Error rendering chart for item ${item.id} (via rAF):`, e);
            if (contentContainer) {
                // Display error in the item content area
                contentContainer.innerHTML = `<p style='color:red;'>Error rendering chart (ID: ${item.id}) via rAF: ${e.message}. Check console.</p>`;
            }
        }
    });
  }
  _renderTable(item, contentContainer) {
    if (!contentContainer.id) {
      contentContainer.id = `table-container-${item.id}`;
    }
    const containerId = contentContainer.id; // Store for use in rAF

    // Define tableConfig outside rAF if its parts don't depend on things inside rAF
    const tableConfig = {
        containerId: containerId, // Use the stored ID
        jsonData: item.config.tableData,
        columns: item.config.tableColumns,
        ...(item.config.tableOptions || {})
    };

    // Preliminary checks before rAF
    if (!tableConfig.columns || tableConfig.columns.length === 0) {
      console.error(`Table item ${item.id} is missing 'tableColumns' in its configuration. Cannot render.`);
      contentContainer.textContent = "Error: Table column configuration is missing.";
      return;
    }
    if (!tableConfig.jsonData) { // Or other essential checks for tableData
        console.error(`Table item ${item.id} is missing 'tableData'. Cannot render.`);
        contentContainer.textContent = "Error: Table data is missing.";
        return;
    }
    
    // Ensure contentContainer is empty before rAF might populate it
    contentContainer.innerHTML = ''; 

    requestAnimationFrame(() => {
        try {
            const tableContainerInRAF = document.getElementById(containerId);
            if (!tableContainerInRAF) {
                console.error(`PANORAMA DEBUG (in-rAF): Table container ${containerId} NOT found for item ${item.id} even in rAF.`);
                // contentContainer might be the one that's supposed to be found.
                // If contentContainer itself is the target, and it's passed to _renderTable,
                // it should exist. The issue is whether getElementById can find it by its NEW ID.
                // Let's assume contentContainer is the element that should have containerId.
                if (contentContainer) { // Check if the original contentContainer reference is still valid
                     contentContainer.innerHTML = `<p style='color:red;'>Error: Table container (ID: ${containerId}) not found in DOM for item ${item.id} during rAF. Table cannot be rendered.</p>`;
                }
                return; 
            }

            if (typeof createDynamicTable === 'function') {
                // Pass the config, ensuring containerId within it is correct
                createDynamicTable(tableConfig); 
                console.log(`Rendering table in container ${containerId} for item ${item.id} (via rAF) with config:`, item.config);
            } else {
                console.error("Error: createDynamicTable function is not defined globally (rAF). Check Dynamic-table.js.");
                if (contentContainer) {
                    contentContainer.textContent = "Error: Table library function not found (rAF).";
                }
            }
        } catch (e) {
            console.error(`Error rendering table for item ${item.id} (via rAF):`, e);
            if (contentContainer) {
                 contentContainer.textContent = `Error rendering table (ID: ${item.id}) via rAF: ${e.message}. Check console.`;
            }
        }
    });
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
