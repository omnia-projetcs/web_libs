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
            rowHeight: 50, // Default row height in pixels
            gap: 10,       // Gap between items in pixels
            // Add other default options here
        }, options);

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

        this._init();
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

        if (typeof itemObject.config.content === 'function') {
            contentElement.appendChild(itemObject.config.content(itemObject)); // Pass itemObject if function needs context
        } else if (typeof itemObject.config.content === 'string' || typeof itemObject.config.content === 'number') {
            contentElement.innerHTML = itemObject.config.content;
        } else if (itemObject.config.content instanceof HTMLElement) {
            contentElement.appendChild(itemObject.config.content);
        } else if (itemObject.config.content) {
            console.warn(`PanoramaGrid: Item ID ${itemObject.id} has unsupported content type.`, itemObject.config.content);
            contentElement.textContent = '[Unsupported Content]';
        } else {
            contentElement.textContent = ''; // Empty content
        }

        itemElement.appendChild(contentElement);

        // Add resize handle (example: South-East)
        const resizeHandleSE = document.createElement('div');
        resizeHandleSE.className = 'pg-resize-handle pg-resize-handle-se';
        resizeHandleSE.setAttribute('data-direction', 'se');
        // Add mousedown listener for resizing on the handle
        resizeHandleSE.addEventListener('mousedown', (event) => {
            this._handleResizeStart(event, itemObject);
        });
        itemElement.appendChild(resizeHandleSE); // Append handle to the item element

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
                // console.log(`PanoramaGrid: Item ID ${this.draggedItem.id} moved to`, this.draggedItem.layout);
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

        let newW = this.resizeItemInitialLayout.w;
        let newH = this.resizeItemInitialLayout.h;

        // For 'se' handle, we only adjust width and height based on delta from initial grab point
        if (this.resizeDirection.includes('e')) { // Simplified for 'se'
            const gridDeltaW = Math.round(dx / (cellWidth + this.options.gap));
            newW = this.resizeItemInitialLayout.w + gridDeltaW;
        }
        if (this.resizeDirection.includes('s')) { // Simplified for 'se'
            const gridDeltaH = Math.round(dy / (cellHeight + this.options.gap));
            newH = this.resizeItemInitialLayout.h + gridDeltaH;
        }

        // Boundary checks
        newW = Math.max(1, newW);
        newH = Math.max(1, newH);
        // Ensure item does not exceed grid columns from its starting X position
        newW = Math.min(newW, this.options.columns - this.resizeItemInitialLayout.x + 1);
        // Max height check can be added if grid has a fixed max row count

        // Update potentialLayout (x and y are from initial layout for 'se' handle)
        this.resizeItem.potentialLayout = {
            x: this.resizeItemInitialLayout.x,
            y: this.resizeItemInitialLayout.y,
            w: newW,
            h: newH
        };

        // Live DOM Update for visual feedback
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

            // It's crucial that targetLayout has x,y,w,h for collision check
            // For 'se' resize, x and y come from resizeItemInitialLayout, w and h from potentialLayout updates
            const finalTargetLayout = {
                x: this.resizeItemInitialLayout.x,
                y: this.resizeItemInitialLayout.y,
                w: targetLayout.w,
                h: targetLayout.h
            };


            for (const existingItem of this.items) {
                if (existingItem.id === this.resizeItem.id) {
                    continue; // Skip self
                }
                // Use the fully formed finalTargetLayout for collision check
                if (this._isCollision(finalTargetLayout, existingItem.layout)) {
                    collisionFound = true;
                    break;
                }
            }

            if (collisionFound) {
                console.warn(`PanoramaGrid: Collision detected for item ID ${this.resizeItem.id} at new size. Reverting.`);
                this.resizeItem.layout = { ...this.resizeItemInitialLayout };
            } else {
                // No collision, apply the new layout (which includes potentially new W and H)
                // X and Y are from initial for 'se' handle
                this.resizeItem.layout = { ...finalTargetLayout };
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
}

// Export the class if using modules (optional for now, can be added later)
// export default PanoramaGrid;
