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
            rowHeight: 50,
            gap: 10,
            renderItemContent: null // Default to null
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

        this._init();
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

        console.log('PanoramaGrid initialized for:', this.containerElement.id, 'with options:', this.options);
        console.log('CSS variables --pg-columns and --pg-gap set on container.');
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
                    // console.log(`PanoramaGrid: Collision, trying y=${currentLayout.y}`);
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
        console.log(`PanoramaGrid: Added item ID ${newItemId} with layout:`, newItemObject.layout, `(Attempts: ${placementAttempts})`);
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
        console.log(`PanoramaGrid: Removed item ID ${itemId}.`);
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

        // Determine row height for explicit pixel height setting (optional, CSS grid-auto-rows might handle some cases)
        // This makes row spans behave more predictably if rowHeight is fixed.
        const itemHeight = (itemObject.layout.h * this.options.rowHeight) + ((itemObject.layout.h - 1) * this.options.gap);
        itemElement.style.height = `${itemHeight}px`;


        const contentElement = document.createElement('div');
        contentElement.className = 'panorama-grid-custom-item-content';

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

        this.containerElement.appendChild(itemElement);
        itemObject.element = itemElement; // Store reference to the DOM element

        // Add mousedown listener for dragging
        itemElement.addEventListener('mousedown', (event) => {
            this._handleDragStart(event, itemObject);
        });

        // console.log(`PanoramaGrid: Rendered item ID ${itemObject.id}`, itemElement.style.cssText);
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


        if (itemObject.element) {
            itemObject.element.classList.add('pg-dragging');
        }

        // Bind and store event handlers to allow removal
        this._boundHandleDragMove = this._handleDragMove.bind(this);
        this._boundHandleDragEnd = this._handleDragEnd.bind(this);

        document.addEventListener('mousemove', this._boundHandleDragMove);
        document.addEventListener('mouseup', this._boundHandleDragEnd);

        console.log(`PanoramaGrid: Drag start on item ID ${itemObject.id}`, this.dragInitialMousePos);
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
        const cellHeight = this.options.rowHeight; // Using the configured rowHeight

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

        // console.log(`PanoramaGrid: Drag Move - dx:${dx}, dy:${dy}, gridDeltaX:${gridDeltaX}, gridDeltaY:${gridDeltaY}, Potential:`, this.draggedItem.potentialLayout);
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

        const itemHeight = (itemObject.layout.h * this.options.rowHeight) + ((itemObject.layout.h - 1) * this.options.gap);
        itemObject.element.style.height = `${itemHeight}px`;

        // console.log(`PanoramaGrid: Updated DOM position for item ID ${itemObject.id} to`, itemObject.layout);
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

        // Clear the visual transform effect immediately
        if (this.draggedItem.element) { // Check element exists before styling
            this.draggedItem.element.style.transform = '';
        }

        if (this.draggedItem.potentialLayout) {
            const targetLayout = this.draggedItem.potentialLayout;
            let collisionFound = false;

            for (const existingItem of this.items) {
                if (existingItem.id === this.draggedItem.id) {
                    continue; // Skip self
                }
                if (this._isCollision(targetLayout, existingItem.layout)) {
                    collisionFound = true;
                    break;
                }
            }

            if (collisionFound) {
                console.warn(`PanoramaGrid: Collision detected for item ID ${this.draggedItem.id} at new position. Reverting.`);
                this.draggedItem.layout = { ...this.draggedItemInitialLayout };
            } else {
                // No collision, apply the new layout
                this.draggedItem.layout = { ...targetLayout };
            this._emit('itemMoved', this.draggedItem.id, { ...this.draggedItem.layout });
            console.log(`PanoramaGrid: Item ID ${this.draggedItem.id} moved to`, this.draggedItem.layout);
            }
        } else {
            // If no potentialLayout, it means no valid drag move happened (e.g. just a click), so revert.
            // console.warn(`PanoramaGrid: No potential layout calculated for item ID ${this.draggedItem.id}. Reverting.`);
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

        console.log(`PanoramaGrid: Drag End for item ID ${this.draggedItem.id}. Final layout:`, this.draggedItem.layout);

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

        console.log(`PanoramaGrid: Resize start on item ID ${itemObject.id}, Dir: ${this.resizeDirection}`);
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
        const cellHeight = this.options.rowHeight;

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
        const itemHeight = (newH * this.options.rowHeight) + ((newH - 1) * this.options.gap);
        this.resizeItem.element.style.height = `${itemHeight}px`;

        // console.log(`PanoramaGrid: Resize Move - newW:${newW}, newH:${newH}`);
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
            const targetLayout = this.resizeItem.potentialLayout;
            let collisionFound = false;

            // Use the full potential layout calculated during _handleResizeMove
            const finalTargetLayout = this.resizeItem.potentialLayout;
            let collisionFound = false;

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
            this._emit('itemResized', this.resizeItem.id, { ...this.resizeItem.layout });
                console.log(`PanoramaGrid: Item ID ${this.resizeItem.id} resized to`, this.resizeItem.layout);
            }
        } else {
            // If no potentialLayout (e.g. click without move), revert to ensure consistency
            this.resizeItem.layout = { ...this.resizeItemInitialLayout };
            // console.log(`PanoramaGrid: No resize changes for item ID ${this.resizeItem.id}. Reverted to initial.`);
        }

        // Update the item's actual grid positioning in the DOM to reflect final layout
        this._updateItemDOMPosition(this.resizeItem);

        // --- Existing Cleanup ---
        if (this.resizeItem.element) {
            this.resizeItem.element.classList.remove('pg-resizing');
        }
        document.removeEventListener('mousemove', this._boundHandleResizeMove);
        document.removeEventListener('mouseup', this._boundHandleResizeEnd);

        // console.log(`PanoramaGrid: Resize End for item ID ${this.resizeItem.id}. Final layout:`, this.resizeItem.layout);

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
        console.log(`PanoramaGrid: Layout updated for item ID ${itemId}.`, itemObject.layout);
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
        console.log('PanoramaGrid: Grid cleared.');
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
            console.log('PanoramaGrid: Grid options restored.', this.options);
        }

        layoutData.items.forEach(itemData => {
            if (!itemData.layout || !itemData.config) {
                console.warn('PanoramaGrid: Skipping item in loadLayout due to missing layout or config.', itemData);
                return; // continue to next item
            }
            // addItem expects a single config object where 'layout' is a property.
            // The structure from getLayout is { id, config, layout }.
            // We need to pass an object to addItem that it expects, usually { ...actualConfig, layout: actualLayout }
            // addItem will generate its own ID, so we don't pass itemData.id to it.
            // We will rely on itemIdCounter being set correctly afterwards.
            this.addItem({ ...itemData.config, layout: itemData.layout });
        });

        // Restore itemIdCounter, ensuring it's at least the max ID from loaded items
        let maxIdInLoadedItems = 0;
        if (this.items.length > 0) { // Check this.items as addItem populates it
            maxIdInLoadedItems = this.items.reduce((max, itm) => Math.max(max, itm.id), 0);
        }
        // Prefer layoutData.itemIdCounter if provided and valid, otherwise ensure it's at least maxId
        this.itemIdCounter = Math.max(layoutData.itemIdCounter || 0, maxIdInLoadedItems);


        this._emit('layoutLoaded');
        console.log('PanoramaGrid: Layout loaded successfully.');
        return true;
    }

    getLayout() {
        const serializableItems = this.items.map(itemObject => {
            // Ensure we are creating deep enough copies if config or layout are complex
            // For now, shallow copies via spread operator are used for layout.
            // Deep copy for config to handle nested objects/arrays, assuming JSON serializable content.
            // Functions or live DOM elements in config.content won't serialize with JSON.stringify.
            let serializableConfig = {};
            try {
                // Attempt deep copy for config, but handle potential non-serializable content gracefully.
                // This basic deep copy won't handle functions or DOM elements in config.
                serializableConfig = JSON.parse(JSON.stringify(itemObject.config));
            } catch (e) {
                console.warn(`PanoramaGrid: Could not fully serialize config for item ID ${itemObject.id} due to non-JSON content. Proceeding with a shallow copy.`, e);
                serializableConfig = { ...itemObject.config }; // Fallback to shallow copy
            }

            return {
                id: itemObject.id,
                config: serializableConfig,
                layout: { ...itemObject.layout }
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
            console.log(`PanoramaGrid: Content updated for item ID ${itemId}.`);
            return true;
        } else {
            console.warn(`PanoramaGrid: Content container element not found for item ID ${itemId}. Config updated, but DOM not.`);
            return false; // Visual update failed
        }
    }
}

// Export the class if using modules (optional for now, can be added later)
// export default PanoramaGrid;
