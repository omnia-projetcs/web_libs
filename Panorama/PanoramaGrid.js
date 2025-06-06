// PanoramaGrid.js - Custom Grid Layout Library

class PanoramaGrid {
    constructor(containerId, options = {}) {
        this.containerElement = document.getElementById(containerId);
        if (!this.containerElement) {
            console.error(`PanoramaGrid: Container element with ID '${containerId}' not found.`);
            return;
        }

        this.options = Object.assign({}, {
            columns: 12,
            rowHeight: 50, // Initial/fallback fixed row height
            gap: 5,
            targetRowCount: 20, // New option: number of rows to aim for in container height
            renderItemContent: null,
            minItemW: 2, // Default minimum width in grid units
            minItemH: 2  // Default minimum height in grid units
        }, options);

        if (this.options.renderItemContent && typeof this.options.renderItemContent !== 'function') {
            console.warn('PanoramaGrid: options.renderItemContent must be a function.');
            this.options.renderItemContent = null; // Invalidate if not a function
        } else if (!this.options.renderItemContent) {
            console.warn('PanoramaGrid: renderItemContent callback not provided. Item content will not be rendered by Panorama.');
        }

        this.items = [];
        this.itemIdCounter = 0;

        this.draggedItem = null;
        this.draggedItemInitialLayout = null;
        this.dragInitialMousePos = null; // {x, y} relative to viewport
        this._boundHandleDragMove = null; // To store bound event handlers
        this._boundHandleDragEnd = null;

        this.resizeItem = null;
        this.resizeItemInitialLayout = null;
        this.resizeInitialMousePos = null; // {x, y} relative to viewport
        this.resizeDirection = null; // e.g., 'se'
        this._boundHandleResizeMove = null; // For storing bound mousemove handler
        this._boundHandleResizeEnd = null;   // For storing bound mouseup handler

        this._events = {};
        this.dragPlaceholderElement = null;
        this.currentRowHeight = this.options.rowHeight; // Initialize with fallback

        this._init();
        this._calculateCurrentRowHeight(); // Initial calculation

        // Debounced resize handler
        this._debouncedResizeHandler = this._debounce(this._handleGridResize.bind(this), 250);
        window.addEventListener('resize', this._debouncedResizeHandler);
    }

    _calculateCurrentRowHeight() {
        // With a fixed container height and desire for fixed row heights,
        // directly use the rowHeight option.
        // The container will scroll if items exceed its fixed height.
        this.currentRowHeight = this.options.rowHeight;
        //
    }

    _debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    _handleGridResize() {
        this._calculateCurrentRowHeight(); // Recalculate current row height first

        // Log new cellWidth (optional, as it's not stored directly as a class property impacting row height)
        if (this.containerElement) {
            const containerStyle = getComputedStyle(this.containerElement);
            const containerPaddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
            const containerPaddingRight = parseFloat(containerStyle.paddingRight) || 0;
            const contentWidth = this.containerElement.clientWidth - containerPaddingLeft - containerPaddingRight;
            const cellWidth = (contentWidth - (this.options.columns - 1) * this.options.gap) / this.options.columns;
            //
        }

        // Re-apply styles to all items
        this.items.forEach(itemObject => {
            if (itemObject.element) { // Ensure the element exists
                this._updateItemDOMPosition(itemObject);
            }
        });
    }

    destroy() {
        if (this._debouncedResizeHandler) {
            window.removeEventListener('resize', this._debouncedResizeHandler);
        }
        // Add any other cleanup logic here (e.g., removing all items, clearing containerElement)
        this._clearGrid(); // Example: clear items and their DOM elements
        this.containerElement.innerHTML = ''; // Clear the container
    }

    on(eventName, callback) {
        if (typeof callback !== 'function') {
            console.warn('PanoramaGrid.on: callback must be a function.');
            return;
        }
        if (!this._events[eventName]) {
            this._events[eventName] = [];
        }
        this._events[eventName].push(callback);
    }

    off(eventName, callback) {
        if (!this._events[eventName]) {
            return;
        }
        this._events[eventName] = this._events[eventName].filter(
            listener => listener !== callback
        );
    }

    _emit(eventName, ...args) {
        if (!this._events[eventName]) {
            return;
        }
        this._events[eventName].forEach(listener => {
            try {
                listener(...args);
            } catch (e) {
                console.error(`Error in PanoramaGrid event listener for ${eventName}:`, e, 'Listener:', listener);
            }
        });
    }

    _init() {
        // Initial setup for the grid container
        this.containerElement.classList.add('panorama-grid-custom-container');

        // Apply grid styles based on options by setting CSS variables
        this.containerElement.style.setProperty('--pg-columns', this.options.columns);
        this.containerElement.style.setProperty('--pg-gap', `${this.options.gap}px`);
        // Note: this.options.rowHeight will be used by JavaScript for item placement logic,
        // rather than directly setting a CSS grid-auto-rows property that might conflict with dynamic content.

    }

    addItem(itemConfig) {
        // Basic validation for itemConfig and layout
        if (!itemConfig || !itemConfig.layout ||
            typeof itemConfig.layout.x !== 'number' || typeof itemConfig.layout.y !== 'number' ||
            typeof itemConfig.layout.w !== 'number' || typeof itemConfig.layout.h !== 'number') {
            console.error('PanoramaGrid: Invalid itemConfig or layout provided to addItem.', itemConfig);
            return -1;
        }
        // Ensure layout dimensions are positive
        if (itemConfig.layout.w <= 0 || itemConfig.layout.h <= 0) {
            console.error('PanoramaGrid: Item layout width (w) and height (h) must be positive.', itemConfig.layout);
            return -1;
        }

        let currentLayout = { ...itemConfig.layout }; // Use a mutable copy for placement

        // Enforce minimum dimensions from options early
        currentLayout.w = Math.max(currentLayout.w, this.options.minItemW);
        currentLayout.h = Math.max(currentLayout.h, this.options.minItemH);

        // Ensure layout positions are positive (1-based for CSS Grid)
        currentLayout.x = Math.max(1, currentLayout.x);
        currentLayout.y = Math.max(1, currentLayout.y);

        // Boundary check for x + w against columns
        if (currentLayout.x + currentLayout.w > this.options.columns + 1) {
            if (currentLayout.w <= this.options.columns) {
                // Item can fit, shift it left
                currentLayout.x = this.options.columns - currentLayout.w + 1;
            } else {
                // Item is too wide, clamp width and place at start
                currentLayout.w = this.options.columns;
                currentLayout.x = 1;
                console.warn(`PanoramaGrid: Item is wider than grid. Clamped width to ${this.options.columns}.`);
            }
        }


        // --- Start of Collision Avoidance Logic ---
        let collisionDetected = false;
        const maxPlacementAttempts = 50; // Or calculate based on grid height: this.options.columns * some_factor;
        let placementAttempts = 0;

        if (this.items.length > 0) { // Only check for collisions if there are existing items
            do {
                collisionDetected = false;
                for (const existingItem of this.items) {
                    if (this._isCollision(currentLayout, existingItem.layout)) {
                        collisionDetected = true;
                        break;
                    }
                }

                if (collisionDetected) {
                    currentLayout.y++; // Move down one row
                    placementAttempts++;
                    //
                }

                if (placementAttempts >= maxPlacementAttempts) {
                    console.warn(`PanoramaGrid: Could not find a non-colliding position for new item after ${maxPlacementAttempts} attempts. Placing at last attempted y=${currentLayout.y}.`);
                    break;
                }
            } while (collisionDetected);
        }
        // --- End of Collision Avoidance Logic ---

        const newItemId = ++this.itemIdCounter;
        const newItemObject = {
            id: newItemId,
            config: itemConfig, // Contains original desired layout and content
            layout: currentLayout, // Use the adjusted layout
            element: null
        };

        this.items.push(newItemObject);
        this._renderItem(newItemObject);

        this._emit('itemAdded', { ...newItemObject, element: undefined }); // Don't emit DOM element directly
        return newItemId;
    }

    removeItem(itemId) {
        const itemIndex = this.items.findIndex(item => item.id === itemId);

        if (itemIndex === -1) {
            console.warn(`PanoramaGrid: Item with ID ${itemId} not found. Cannot remove.`);
            return false;
        }

        const itemObject = this.items[itemIndex];

        // Remove the DOM element
        if (itemObject.element && itemObject.element.parentNode === this.containerElement) {
            this.containerElement.removeChild(itemObject.element);
        } else {
            // This case might occur if the element was already removed or never properly added,
            // or if the item's state is inconsistent.
            console.warn(`PanoramaGrid: DOM element for item ID ${itemId} not found in container or already removed.`);
        }

        // Remove the item from the internal array
        this.items.splice(itemIndex, 1);
        this._emit('itemRemoved', itemId, { ...itemObject, element: undefined }); // Emit data of removed item
        return true;
    }

    _isCollision(layout1, layout2) {
        // Check if they don't overlap
        if (layout1.x + layout1.w <= layout2.x || // layout1 is to the left of layout2
            layout1.x >= layout2.x + layout2.w || // layout1 is to the right of layout2
            layout1.y + layout1.h <= layout2.y || // layout1 is above layout2
            layout1.y >= layout2.y + layout2.h    // layout1 is below layout2
        ) {
            return false; // No collision
        }
        return true; // Collision
    }

    _renderItem(itemObject) {
        const itemElement = document.createElement('div');
        itemElement.className = 'panorama-grid-custom-item';
        itemElement.setAttribute('data-item-id', itemObject.id.toString());

        // Apply CSS Grid positioning
        // Assuming layout.x and layout.y are 1-based grid line numbers
        itemElement.style.gridColumnStart = itemObject.layout.x;
        itemElement.style.gridRowStart = itemObject.layout.y;
        itemElement.style.gridColumnEnd = `span ${itemObject.layout.w}`;
        itemElement.style.gridRowEnd = `span ${itemObject.layout.h}`;

        // Determine row height for explicit pixel height setting
        const itemHeight = (itemObject.layout.h * this.currentRowHeight) + ((itemObject.layout.h - 1) * this.options.gap);
        itemElement.style.height = `${itemHeight}px`;

        const contentElement = document.createElement('div');
        contentElement.className = 'panorama-grid-custom-item-content';
        itemElement.appendChild(contentElement);

        // Add all 8 resize handles
        const directions = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'];
        directions.forEach(direction => {
            const handle = document.createElement('div');
            handle.className = `pg-resize-handle pg-resize-handle-${direction}`;
            handle.setAttribute('data-direction', direction);
            handle.addEventListener('mousedown', (event) => {
                this._handleResizeStart(event, itemObject);
            });
            itemElement.appendChild(handle);
        });

        // Add itemElement to the container (DOM) first
        this.containerElement.appendChild(itemElement);
        itemObject.element = itemElement; // Store reference to the DOM element

        // Debug logs before calling renderItemContent
        // Ensure itemElement has its expected class
        if (!itemElement.classList.contains('panorama-grid-custom-item')) {
            console.warn('PanoramaGrid Debug: itemElement is missing "panorama-grid-custom-item" class before renderItemContent call for ID:', itemObject.id);
        }
        if (!contentElement.classList.contains('panorama-grid-custom-item-content')) {
            console.warn('PanoramaGrid Debug: contentElement is missing "panorama-grid-custom-item-content" class before renderItemContent call for ID:', itemObject.id);
        }

        // Now call renderItemContent, so it operates on an element already in the DOM
        if (this.options.renderItemContent) {
            try {
                // Ensure itemObject.config has 'type' for the callback
                if (itemObject.config && typeof itemObject.config.type !== 'undefined') {
                    this.options.renderItemContent(itemObject.config.type, itemObject.config, contentElement, itemObject.id);
                } else {
                    console.error(`PanoramaGrid: Item ID ${itemObject.id} is missing 'type' in its config. Cannot render content.`);
                    contentElement.innerHTML = `<p style="color:red;">Error: Item config missing 'type'.</p>`;
                }
            } catch (e) {
                console.error(`Error executing renderItemContent for item ID ${itemObject.id}, type ${itemObject.config.type}:`, e);
                contentElement.innerHTML = `<p style="color:red;">Error rendering content. Type: ${itemObject.config.type}</p>`;
            }
        } else {
            // Fallback or default rendering if no callback provided
            contentElement.innerHTML = `Item ID: ${itemObject.id}, Type: ${itemObject.config.type || 'N/A'} (No renderer provided)`;
        }

        // Add mousedown listener for dragging
        itemElement.addEventListener('mousedown', (event) => {
            this._handleDragStart(event, itemObject);
        });

        //
    }

    _handleDragStart(event, itemObject) {
        // Prevent default for text selection, etc.
        // Allow dragging only with left mouse button
        if (event.button !== 0) {
            return;
        }
        event.preventDefault();

        this.draggedItem = itemObject;
        this.draggedItemInitialLayout = { ...itemObject.layout };
        this.dragInitialMousePos = { x: event.clientX, y: event.clientY };
        // Initialize potentialLayout on the item being dragged
        this.draggedItem.potentialLayout = { ...itemObject.layout };

        if (!this.dragPlaceholderElement) {
            this.dragPlaceholderElement = document.createElement('div');
            this.dragPlaceholderElement.className = 'pg-drag-placeholder';
        }
        this.dragPlaceholderElement.style.gridColumnStart = '';
        this.dragPlaceholderElement.style.gridRowStart = '';
        this.dragPlaceholderElement.style.gridColumnEnd = '';
        this.dragPlaceholderElement.style.gridRowEnd = '';
        this.dragPlaceholderElement.style.width = '';
        this.dragPlaceholderElement.style.height = '';


        if (itemObject.element) {
            itemObject.element.classList.add('pg-dragging');
        }

        // Bind and store event handlers to allow removal
        this._boundHandleDragMove = this._handleDragMove.bind(this);
        this._boundHandleDragEnd = this._handleDragEnd.bind(this);

        document.addEventListener('mousemove', this._boundHandleDragMove);
        document.addEventListener('mouseup', this._boundHandleDragEnd);

    }

    _handleDragMove(event) {
        event.preventDefault();
        if (!this.draggedItem || !this.dragInitialMousePos) {
            return;
        }

        const dx = event.clientX - this.dragInitialMousePos.x;
        const dy = event.clientY - this.dragInitialMousePos.y;

        // Apply visual translation for smooth feedback
        this.draggedItem.element.style.transform = `translate(${dx}px, ${dy}px)`;

        // Calculate grid cell dimensions
        // Consider padding of the container for accurate cell width calculation.
        const containerStyle = getComputedStyle(this.containerElement);
        const containerPaddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
        const containerPaddingRight = parseFloat(containerStyle.paddingRight) || 0;
        // Effective width for cells is container's content box width.
        const contentWidth = this.containerElement.clientWidth - containerPaddingLeft - containerPaddingRight;

        const cellWidth = (contentWidth - (this.options.columns - 1) * this.options.gap) / this.options.columns;
        const cellHeight = this.currentRowHeight; // Use dynamic row height

        // Convert pixel delta to grid cell delta
        // Add half a cell/gap to bias towards the cell the mouse is mostly over
        const gridDeltaX = Math.round(dx / (cellWidth + this.options.gap));
        const gridDeltaY = Math.round(dy / (cellHeight + this.options.gap));

        // Calculate new potential grid position based on initial layout + delta
        let newGridX = this.draggedItemInitialLayout.x + gridDeltaX;
        let newGridY = this.draggedItemInitialLayout.y + gridDeltaY;

        // Boundary checks for the new grid position
        // Ensure item doesn't go out of left/right bounds
        newGridX = Math.max(1, Math.min(newGridX, this.options.columns - this.draggedItemInitialLayout.w + 1));
        // Ensure item doesn't go above top bound (y=1)
        newGridY = Math.max(1, newGridY);
        // No maximum Y boundary for now, grid can expand downwards.

        // Store the calculated potential layout (grid units)
        this.draggedItem.potentialLayout = {
            x: newGridX,
            y: newGridY,
            w: this.draggedItemInitialLayout.w, // Width and height don't change during drag
            h: this.draggedItemInitialLayout.h
        };

        if (this.dragPlaceholderElement) {
            const phLayout = this.draggedItem.potentialLayout;
            this.dragPlaceholderElement.style.gridColumnStart = phLayout.x;
            this.dragPlaceholderElement.style.gridRowStart = phLayout.y;
            this.dragPlaceholderElement.style.gridColumnEnd = `span ${phLayout.w}`;
            this.dragPlaceholderElement.style.gridRowEnd = `span ${phLayout.h}`;

            const phHeight = (phLayout.h * this.currentRowHeight) + ((phLayout.h - 1) * this.options.gap); // Use currentRowHeight
            this.dragPlaceholderElement.style.height = `${phHeight}px`;

            // Check for collisions to update placeholder color
            let collisionWithOtherItems = false;
            for (const existingItem of this.items) {
                if (existingItem.id === this.draggedItem.id) continue; // Skip self
                if (this._isCollision(phLayout, existingItem.layout)) {
                    collisionWithOtherItems = true;
                    break;
                }
            }

            if (collisionWithOtherItems) {
                this.dragPlaceholderElement.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
                this.dragPlaceholderElement.style.borderColor = 'rgba(200, 0, 0, 0.7)';
                this.dragPlaceholderElement.style.borderStyle = 'solid'; // Ensure border is solid for invalid
            } else {
                // Revert to default placeholder styles from PanoramaGrid.css
                this.dragPlaceholderElement.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
                this.dragPlaceholderElement.style.borderColor = '#007bff';
                this.dragPlaceholderElement.style.borderStyle = 'dashed'; // Default is dashed
            }

            if (!this.dragPlaceholderElement.parentNode) {
                this.containerElement.appendChild(this.dragPlaceholderElement);
            }
        }

        //
    }

    _updateItemDOMPosition(itemObject) {
        if (!itemObject || !itemObject.element || !itemObject.layout) {
            console.warn('PanoramaGrid: Cannot update DOM position for invalid item object.', itemObject);
            return;
        }

        itemObject.element.style.gridColumnStart = itemObject.layout.x;
        itemObject.element.style.gridRowStart = itemObject.layout.y;
        itemObject.element.style.gridColumnEnd = `span ${itemObject.layout.w}`;
        itemObject.element.style.gridRowEnd = `span ${itemObject.layout.h}`;

        const itemHeight = (itemObject.layout.h * this.currentRowHeight) + ((itemObject.layout.h - 1) * this.options.gap); // Use currentRowHeight
        itemObject.element.style.height = `${itemHeight}px`;

        //
    }

    _handleDragEnd(event) {
        event.preventDefault();
        if (!this.draggedItem) { // Early exit if no item was being dragged
            // Ensure listeners are cleaned up if they somehow persisted
            if (this._boundHandleDragMove) document.removeEventListener('mousemove', this._boundHandleDragMove);
            if (this._boundHandleDragEnd) document.removeEventListener('mouseup', this._boundHandleDragEnd);
            this._boundHandleDragMove = null;
            this._boundHandleDragEnd = null;
            return;
        }

        if (this.dragPlaceholderElement && this.dragPlaceholderElement.parentNode) {
            this.dragPlaceholderElement.parentNode.removeChild(this.dragPlaceholderElement);
        }

        // Clear the visual transform effect immediately
        if (this.draggedItem.element) { // Check element exists before styling
            this.draggedItem.element.style.transform = '';
        }

        if (this.draggedItem.potentialLayout) {
            let finalLayout = { ...this.draggedItem.potentialLayout }; // Start with the layout where user dropped
            let initialCollision = false;

            for (const existingItem of this.items) {
                if (existingItem.id === this.draggedItem.id) continue;
                if (this._isCollision(finalLayout, existingItem.layout)) {
                    initialCollision = true;
                    break;
                }
            }

            if (initialCollision) {
                console.warn(`PanoramaGrid: Collision detected for item ID ${this.draggedItem.id} at initial drop position. Attempting to find new spot.`);
                let foundNewSpot = false;
                const maxPlacementAttemptsOnDrop = 30; // Max attempts to find a new spot by incrementing Y
                let currentAttemptLayout = { ...finalLayout }; // Copy to modify Y

                for (let attempt = 0; attempt < maxPlacementAttemptsOnDrop; attempt++) {
                    currentAttemptLayout.y++; // Move down one row
                    
                    let attemptCollision = false;
                    for (const existingItem of this.items) {
                        if (existingItem.id === this.draggedItem.id) continue;
                        if (this._isCollision(currentAttemptLayout, existingItem.layout)) {
                            attemptCollision = true;
                            break;
                        }
                    }

                    if (!attemptCollision) {
                        finalLayout = { ...currentAttemptLayout }; // Found a non-colliding spot
                        foundNewSpot = true;
                        break;
                    }
                }

                if (!foundNewSpot) {
                    console.warn(`PanoramaGrid: Could not find non-colliding spot for item ID ${this.draggedItem.id} after ${maxPlacementAttemptsOnDrop} attempts. Reverting to initial position.`);
                    finalLayout = { ...this.draggedItemInitialLayout }; // Revert to original if no spot found
                }
                // If foundNewSpot is true, finalLayout already holds the new position.
            }
            // If no initial collision, finalLayout is already this.draggedItem.potentialLayout.

            // Set the definitive layout for the dragged item based on outcomes.
            const isActualMove = JSON.stringify(finalLayout) !== JSON.stringify(this.draggedItemInitialLayout); // Compare content
            this.draggedItem.layout = { ...finalLayout };

            if (isActualMove) {
            this._emit('itemMoved', this.draggedItem.id, { ...this.draggedItem.layout });
            } else if (initialCollision) { // Reverted or y-scan ended up at the same place as initial
                console.warn(`PanoramaGrid: Item ID ${this.draggedItem.id} reverted to or resolved to initial position after collision. Layout:`, this.draggedItem.layout);
            } else { // No collision and no change from initial layout (e.g., a click or minor drag not changing cells)
            }

        } else {
            // If no potentialLayout, it means no valid drag move happened (e.g. just a click), so revert.
            this.draggedItem.layout = { ...this.draggedItemInitialLayout };
        }

        // Update the item's actual grid positioning in the DOM
        this._updateItemDOMPosition(this.draggedItem);

        // --- Existing Cleanup ---
        if (this.draggedItem.element) { // Check if element exists before trying to modify classList
           this.draggedItem.element.classList.remove('pg-dragging');
        }
        document.removeEventListener('mousemove', this._boundHandleDragMove);
        document.removeEventListener('mouseup', this._boundHandleDragEnd);


        this.draggedItem = null;
        this.draggedItemInitialLayout = null;
        this.dragInitialMousePos = null;
        this._boundHandleDragMove = null;
        this._boundHandleDragEnd = null;
        // this.draggedItem.potentialLayout is cleared when this.draggedItem is set to null
    }

    _handleResizeStart(event, itemObject) {
        event.preventDefault();
        event.stopPropagation(); // Prevent item drag start

        if (event.button !== 0) { // Only left mouse button
            return;
        }

        this.resizeItem = itemObject;
        this.resizeItemInitialLayout = { ...itemObject.layout };
        this.resizeInitialMousePos = { x: event.clientX, y: event.clientY };
        this.resizeDirection = event.target.dataset.direction;
        // Initialize potentialLayout on the item being resized
        this.resizeItem.potentialLayout = { ...itemObject.layout };

        if (itemObject.element) {
            itemObject.element.classList.add('pg-resizing');
        }

        this._boundHandleResizeMove = this._handleResizeMove.bind(this);
        this._boundHandleResizeEnd = this._handleResizeEnd.bind(this);

        document.addEventListener('mousemove', this._boundHandleResizeMove);
        document.addEventListener('mouseup', this._boundHandleResizeEnd);

    }

    _handleResizeMove(event) {
        event.preventDefault();
        if (!this.resizeItem || !this.resizeInitialMousePos) {
            return;
        }

        const dx = event.clientX - this.resizeInitialMousePos.x;
        const dy = event.clientY - this.resizeInitialMousePos.y;

        const containerStyle = getComputedStyle(this.containerElement);
        const containerPaddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
        const containerPaddingRight = parseFloat(containerStyle.paddingRight) || 0;
        const contentWidth = this.containerElement.clientWidth - containerPaddingLeft - containerPaddingRight;

        const cellWidth = (contentWidth - (this.options.columns - 1) * this.options.gap) / this.options.columns;
        const cellHeight = this.currentRowHeight; // Use dynamic row height

        let { x: newX, y: newY, w: newW, h: newH } = this.resizeItemInitialLayout;

        const gridDeltaX = Math.round(dx / (cellWidth + this.options.gap));
        const gridDeltaY = Math.round(dy / (cellHeight + this.options.gap));
        const dir = this.resizeDirection;

        if (dir.includes('n')) {
            let proposedY = this.resizeItemInitialLayout.y + gridDeltaY;
            let proposedH = this.resizeItemInitialLayout.h - gridDeltaY;
            if (proposedY < 1) {
                proposedH += (1 - proposedY);
                proposedY = 1;
            }
            if (proposedH < 1) { // Ensure height does not make Y adjust again to break top boundary
                // If proposedH became < 1, it means gridDeltaY was too large for initial H.
                // Adjust Y upwards from its proposed position to maintain H=1
                // This effectively means the bottom edge moves up more than the top edge tried to.
                // No, this logic is tricky. If H becomes < 1, it means deltaY was > initial H.
                // We should clamp H to 1, and Y should be initialY + initialH - 1.
                 proposedY = this.resizeItemInitialLayout.y + this.resizeItemInitialLayout.h -1;
                 if (proposedY < 1) proposedY = 1; // Should not happen if initial H >=1
                 proposedH = 1;
            }
            newY = proposedY;
            newH = proposedH;
        }
        if (dir.includes('s')) {
            newH = this.resizeItemInitialLayout.h + gridDeltaY;
        }
        if (dir.includes('w')) {
            let proposedX = this.resizeItemInitialLayout.x + gridDeltaX;
            let proposedW = this.resizeItemInitialLayout.w - gridDeltaX;
            if (proposedX < 1) {
                proposedW += (1 - proposedX);
                proposedX = 1;
            }
            if (proposedW < 1) { // Similar to 'n' handle for H
                 proposedX = this.resizeItemInitialLayout.x + this.resizeItemInitialLayout.w - 1;
                 if (proposedX < 1) proposedX = 1;
                 proposedW = 1;
            }
            newX = proposedX;
            newW = proposedW;
        }
        if (dir.includes('e')) {
            newW = this.resizeItemInitialLayout.w + gridDeltaX;
        }

        // Boundary Checks
        if (newH < 1) newH = 1;
        if (newW < 1) newW = 1;

        // Ensure X and Y are at least 1 (can be affected by previous logic if initial size was 1)
        if (newX < 1) newX = 1;
        if (newY < 1) newY = 1;


        if (newX + newW > this.options.columns + 1) {
            if (dir.includes('w')) {
                // If dragging from west, X can change, W was primary driver from delta.
                // We need to adjust X to keep W if possible, or reduce W if X hits 1.
                newX = this.options.columns - newW + 1;
                if (newX < 1) {
                    newW = this.options.columns;
                    newX = 1;
                }
            } else { // East or no horizontal drag component that affects X directly.
                newW = this.options.columns - newX + 1;
            }
        }
        // Max height check can be added if this.options.maxRows is defined.

        // Final clamping for safety / consistency
        if (newW < 1) newW = 1;
        if (newX < 1) newX = 1;
        if (newX + newW > this.options.columns + 1) { // Re-check width if X was clamped to 1
             newW = this.options.columns - newX + 1;
        }

        // Enforce minimum dimensions
        newW = Math.max(newW, this.options.minItemW);
        newH = Math.max(newH, this.options.minItemH);

        // Re-check boundaries if min dimensions changed things, especially position if size grew
        // Example: If minItemW made it wider, ensure it doesn't overflow columns
        if (newX + newW > this.options.columns + 1) {
            if (dir.includes('w')) { // If dragging from west, X might need to shift right if possible
                newX = this.options.columns - newW + 1;
                if (newX < 1) { // If shifting X makes it invalid, clamp W and set X to 1
                    newX = 1;
                    newW = this.options.columns;
                }
            } else { // If dragging from east or not horizontally affecting X, just clamp W
                newW = this.options.columns - newX + 1;
            }
        }
        // A similar check for newY + newH against max rows could be added if applicable.
        // Ensure X and Y are still valid after potential adjustments
        if (newX < 1) newX = 1;
        if (newY < 1) newY = 1;


        this.resizeItem.potentialLayout = {
            x: newX,
            y: newY,
            w: newW,
            h: newH
        };

        // Live DOM Update for visual feedback
        this.resizeItem.element.style.gridColumnStart = newX;
        this.resizeItem.element.style.gridRowStart = newY;
        this.resizeItem.element.style.gridColumnEnd = `span ${newW}`;
        this.resizeItem.element.style.gridRowEnd = `span ${newH}`;
        const itemHeight = (newH * this.currentRowHeight) + ((newH - 1) * this.options.gap); // Use dynamic row height
        this.resizeItem.element.style.height = `${itemHeight}px`;

        //
    }

    _handleResizeEnd(event) {
        event.preventDefault();
        if (!this.resizeItem) { // Early exit if no item was being resized
            // Ensure listeners are cleaned up if they somehow persisted
            if (this._boundHandleResizeMove) document.removeEventListener('mousemove', this._boundHandleResizeMove);
            if (this._boundHandleResizeEnd) document.removeEventListener('mouseup', this._boundHandleResizeEnd);
            this._boundHandleResizeMove = null;
            this._boundHandleResizeEnd = null;
            return;
        }

        if (this.resizeItem.potentialLayout) {
            const finalTargetLayout = this.resizeItem.potentialLayout;
            let collisionFound = false; // Declared once

            for (const existingItem of this.items) {
                if (existingItem.id === this.resizeItem.id) {
                    continue; // Skip self
                }
                if (this._isCollision(finalTargetLayout, existingItem.layout)) {
                    collisionFound = true;
                    break;
                }
            }

            if (collisionFound) {
                console.warn(`PanoramaGrid: Collision detected for item ID ${this.resizeItem.id} with new layout. Reverting.`);
                this.resizeItem.layout = { ...this.resizeItemInitialLayout };
            } else {
                // No collision, apply the new layout from potentialLayout
                this.resizeItem.layout = { ...finalTargetLayout };
            }
        } else {
            // If no potentialLayout (e.g. click without move), revert to ensure consistency
            this.resizeItem.layout = { ...this.resizeItemInitialLayout };
            //
        }

        // Enforce minimums on the final layout before updating DOM and emitting event
        this.resizeItem.layout.w = Math.max(this.resizeItem.layout.w, this.options.minItemW);
        this.resizeItem.layout.h = Math.max(this.resizeItem.layout.h, this.options.minItemH);
        
        // Boundary checks after enforcing minimums (especially if item was at edge and min size made it larger)
        if (this.resizeItem.layout.x + this.resizeItem.layout.w > this.options.columns + 1) {
            // If width made it overflow, try to shift X left. If X is already 1, then clamp width.
            let newX = this.options.columns - this.resizeItem.layout.w + 1;
            if (newX < 1) {
                this.resizeItem.layout.x = 1;
                this.resizeItem.layout.w = this.options.columns;
            } else {
                this.resizeItem.layout.x = newX;
            }
        }
        // Similar check for Y and H if max rows are a constraint.
        // Ensure x and y are at least 1
        if (this.resizeItem.layout.x < 1) this.resizeItem.layout.x = 1;
        if (this.resizeItem.layout.y < 1) this.resizeItem.layout.y = 1;


        // Update the item's actual grid positioning in the DOM to reflect final layout
        this._updateItemDOMPosition(this.resizeItem);
        
        // Emit event only if there was a change from initial or potential layout was applied
        // For simplicity, we'll emit if layout potentially changed, could be refined.
        // Check if the (potentially min-size-adjusted) layout is different from the initial.
        const initialLayoutStr = JSON.stringify(this.resizeItemInitialLayout);
        const finalLayoutStr = JSON.stringify(this.resizeItem.layout);
        if (initialLayoutStr !== finalLayoutStr) {
            this._emit('itemResized', this.resizeItem.id, { ...this.resizeItem.layout });
        }


        // --- Existing Cleanup ---
        if (this.resizeItem.element) {
            this.resizeItem.element.classList.remove('pg-resizing');
        }
        document.removeEventListener('mousemove', this._boundHandleResizeMove);
        document.removeEventListener('mouseup', this._boundHandleResizeEnd);

        //

        this.resizeItem = null;
        this.resizeItemInitialLayout = null;
        this.resizeInitialMousePos = null;
        this.resizeDirection = null;
        this._boundHandleResizeMove = null;
        this._boundHandleResizeEnd = null;
        // this.resizeItem.potentialLayout is cleared when this.resizeItem is set to null
    }

    updateItemLayout(itemId, newLayout) {
        const itemObject = this.items.find(item => item.id === itemId);
        if (!itemObject) {
            console.warn(`PanoramaGrid: Item with ID ${itemId} not found. Cannot update layout.`);
            return false;
        }

        // Validate newLayout structure and basic values
        if (!newLayout || typeof newLayout.x !== 'number' || typeof newLayout.y !== 'number' ||
            typeof newLayout.w !== 'number' || typeof newLayout.h !== 'number' ||
            newLayout.w <= 0 || newLayout.h <= 0 || newLayout.x < 1 || newLayout.y < 1) {
            console.error('PanoramaGrid: Invalid newLayout provided (structure, type, or positive dimensions/coordinates).', newLayout);
            return false;
        }
        // Validate against grid boundaries
        if (newLayout.x + newLayout.w > this.options.columns + 1) {
            console.error('PanoramaGrid: newLayout exceeds grid column boundaries.', newLayout);
            return false;
        }
        // Add maxRows check if applicable: if (newLayout.y + newLayout.h > this.options.maxRows + 1) ...

        let collisionFound = false;
        for (const existingItem of this.items) {
            if (existingItem.id === itemId) continue; // Skip self
            if (this._isCollision(newLayout, existingItem.layout)) {
                collisionFound = true;
                break;
            }
        }

        if (collisionFound) {
            console.warn(`PanoramaGrid: Programmatic layout update for item ID ${itemId} would cause collision. Layout update rejected.`);
            // Optionally, emit an event indicating failure due to collision
            this._emit('itemLayoutUpdateFailed', itemId, newLayout, 'collision');
            return false;
        }

        // No collision, apply the new layout
        itemObject.layout = { ...newLayout };
        this._updateItemDOMPosition(itemObject);
        this._emit('itemLayoutUpdated', itemId, { ...itemObject.layout });
        return true;
    }

    updateItemConfiguration(itemId, newFullConfig) {
        const itemObject = this.items.find(item => item.id === itemId);
        if (!itemObject) {
            console.warn(`PanoramaGrid: Item with ID ${itemId} not found. Cannot update configuration.`);
            return false;
        }

        if (!itemObject.element) {
            console.warn(`PanoramaGrid: DOM element for item ID ${itemId} not found. Configuration updated, but cannot re-render content visually.`);
            // Still update config, but visual update won't happen if element is missing.
        }
        
        if (!this.options.renderItemContent || typeof this.options.renderItemContent !== 'function') {
            console.warn(`PanoramaGrid: renderItemContent callback is not valid. Cannot re-render content for item ID ${itemId}. Configuration will be updated.`);
            itemObject.config = { ...itemObject.config, ...newFullConfig };
            this._emit('itemConfigUpdated', itemId, { ...itemObject.config }); 
            return true; 
        }

        itemObject.config = { ...itemObject.config, ...newFullConfig };

        if (itemObject.element) {
            const contentElement = itemObject.element.querySelector('.panorama-grid-custom-item-content');
            if (!contentElement) {
                console.warn(`PanoramaGrid: Content element (.panorama-grid-custom-item-content) not found for item ID ${itemId}. Cannot re-render content.`);
                this._emit('itemConfigUpdated', itemId, { ...itemObject.config });
                return false; 
            }

            contentElement.innerHTML = '';

            try {
                if (itemObject.config && typeof itemObject.config.type !== 'undefined') {
                    this.options.renderItemContent(itemObject.config.type, itemObject.config, contentElement, itemId);
                } else {
                     console.error(`PanoramaGrid: Item ID ${itemId} is missing 'type' in its updated config. Cannot re-render content.`);
                     contentElement.innerHTML = `<p style="color:red;">Error: Item config missing 'type' after update.</p>`;
                }
            } catch (e) {
                console.error(`Error executing renderItemContent for item ID ${itemId} after config update:`, e);
                contentElement.innerHTML = `<p style="color:red;">Error re-rendering content. Type: ${itemObject.config.type}</p>`;
            }
        } else {
        }
        
        this._emit('itemConfigUpdated', itemId, { ...itemObject.config });
        return true;
    }

    _clearGrid() {
        // Remove DOM elements
        this.items.forEach(item => {
            if (item.element && item.element.parentNode) {
                item.element.remove();
            }
        });
        // Clear internal state
        this.items = [];
        this.itemIdCounter = 0;
    }

    loadLayout(layoutData) {
        if (!layoutData || typeof layoutData !== 'object' || !Array.isArray(layoutData.items)) {
            console.error('PanoramaGrid: Invalid layoutData provided to loadLayout. Must include an "items" array.', layoutData);
            return false;
        }

        this._clearGrid();

        // Optional: Restore grid options if they were saved and are part of layoutData.options
        if (layoutData.options) {
            // Simple merge, could be more sophisticated if options affect DOM structure that needs rebuilding
            Object.assign(this.options, layoutData.options);
            // Re-apply dynamic CSS variables from options
            if (this.containerElement) { // Ensure container exists
                this.containerElement.style.setProperty('--pg-columns', this.options.columns);
                this.containerElement.style.setProperty('--pg-gap', `${this.options.gap}px`);
            }
        }

        layoutData.items.forEach(itemData => {
            if (!itemData.layout || !itemData.config || typeof itemData.type === 'undefined') { // Added check for itemData.type
                console.warn('PanoramaGrid: Skipping item in loadLayout due to missing layout, config, or type.', itemData);
                return; // continue to next item
            }
            // Pass itemData.type into the config object for addItem
            this.addItem({ type: itemData.type, ...itemData.config, layout: itemData.layout });
        });

        // Restore itemIdCounter, ensuring it's at least the max ID from loaded items
        let maxIdInLoadedItems = 0;
        if (this.items.length > 0) { // Check this.items as addItem populates it
            maxIdInLoadedItems = this.items.reduce((max, itm) => Math.max(max, itm.id), 0);
        }
        // Prefer layoutData.itemIdCounter if provided and valid, otherwise ensure it's at least maxId
        this.itemIdCounter = Math.max(layoutData.itemIdCounter || 0, maxIdInLoadedItems);


        this._emit('layoutLoaded');
        return true;
    }

    getLayout() {
        const serializableItems = this.items.map(itemObject => {
            // Ensure we are creating deep enough copies if config or layout are complex
            // For now, shallow copies via spread operator are used for layout.
            // Deep copy for config to handle nested objects/arrays, assuming JSON serializable content.
            // Functions or live DOM elements in config.content won't serialize with JSON.stringify.
            let specificConfig = {};
            try {
                // Attempt deep copy for config, but handle potential non-serializable content gracefully.
                specificConfig = JSON.parse(JSON.stringify(itemObject.config));
            } catch (e) {
                console.warn(`PanoramaGrid: Could not fully serialize config for item ID ${itemObject.id} due to non-JSON content. Proceeding with a shallow copy.`, e);
                specificConfig = { ...itemObject.config }; // Fallback to shallow copy
            }

            // Extract type from the original config (less prone to issues if type was complex)
            const itemType = itemObject.config.type; 
            
            // The authoritative layout is itemObject.layout
            const authoritativeLayout = { ...itemObject.layout };

            // Remove 'type' and 'layout' from the specificConfig object
            // as they are now top-level properties in the serialized item.
            delete specificConfig.type;
            delete specificConfig.layout; // Deletes layout if it was part of the itemObject.config structure

            return {
                id: itemObject.id,
                type: itemType,
                config: specificConfig, // This is now the type-specific config
                layout: authoritativeLayout
            };
        });

        return {
            items: serializableItems,
            itemIdCounter: this.itemIdCounter,
            options: { ...this.options } // Include a copy of the grid's constructor options
        };
    }

    updateItemContent(itemId, newContent) {
        const itemObject = this.items.find(item => item.id === itemId);

        if (!itemObject) {
            console.warn(`PanoramaGrid: Item with ID ${itemId} not found. Cannot update content.`);
            return false;
        }

        if (!itemObject.element) {
            console.warn(`PanoramaGrid: DOM element for item ID ${itemId} not found. Cannot update content visually.`);
            // Still update config, but visual update won't happen.
            itemObject.config.content = newContent; // Update the stored configuration
            return false;
        }

        itemObject.config.content = newContent; // Update the stored configuration

        const contentElement = itemObject.element.querySelector('.panorama-grid-custom-item-content');

        if (contentElement) {
            contentElement.innerHTML = ''; // Clear existing content

            // Apply new content (logic borrowed from _renderItem)
            if (typeof newContent === 'function') {
                contentElement.appendChild(newContent(itemObject)); // Pass itemObject if function needs context
            } else if (typeof newContent === 'string' || typeof newContent === 'number') {
                contentElement.innerHTML = newContent;
            } else if (newContent instanceof HTMLElement) {
                contentElement.appendChild(newContent);
            } else if (newContent) { // Check if newContent is not null/undefined
                console.warn(`PanoramaGrid: Item ID ${itemObject.id} received unsupported newContent type.`, newContent);
                contentElement.textContent = '[Unsupported Content Type]';
            } else {
                // Content is null or undefined, leave it empty
            }
            this._emit('itemContentUpdated', itemObject.id, itemObject.config.content);
            return true;
        } else {
            console.warn(`PanoramaGrid: Content container element not found for item ID ${itemId}. Config updated, but DOM not.`);
            return false; // Visual update failed
        }
    }
}

// Export the class if using modules (optional for now, can be added later)
// export default PanoramaGrid;
