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
        if (!this.draggedItem) return;

        // For now, just log. Actual position update will be in the next step.
        console.log('PanoramaGrid: Drag move', event.clientX, event.clientY);
        // Later: calculate new position, check collisions, update element style
    }

    _handleDragEnd(event) {
        event.preventDefault();
        if (!this.draggedItem) return; // Should not happen if listeners are correctly managed

        console.log(`PanoramaGrid: Drag end for item ID ${this.draggedItem.id}`);

        document.removeEventListener('mousemove', this._boundHandleDragMove);
        document.removeEventListener('mouseup', this._boundHandleDragEnd);

        if (this.draggedItem.element) {
            this.draggedItem.element.classList.remove('pg-dragging');
        }

        // Reset state
        this.draggedItem = null;
        this.draggedItemInitialLayout = null;
        this.dragInitialMousePos = null;
        this._boundHandleDragMove = null;
        this._boundHandleDragEnd = null;
        // Later: Finalize position, save layout, etc.
    }
}

// Export the class if using modules (optional for now, can be added later)
// export default PanoramaGrid;
