// Mindmap Library Core
console.log('Mindmap library loaded');

class MindmapNode {
    constructor(id, text, parentId = null, children = [], position = { x: 0, y: 0 }, style = {}) {
        this.id = id;
        this.text = text;
        this.parentId = parentId;
        this.children = children; // Array of child node IDs
        this.position = position; // { x, y }
        // style can include: backgroundColor, borderColor, borderWidth, borderStyle, textColor,
        // fontSize, fontWeight, fontFamily, borderRadius, padding, shape (for future use), etc.
        this.style = style;
    }
}

class Mindmap {
    constructor(containerId, options = {}) { // Added options parameter
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Mindmap container not found:', containerId);
            return;
        }
        this.nodes = new Map(); // Stores MindmapNode objects, keyed by nodeId
        this.nodeCounter = 0; // Simple ID generator
        this.currentNodeStyle = {}; // Style for the currently selected node

        // Default connector style options
        this.options = {
            connectorColor: (options && options.connectorColor) || 'black',
            connectorWidth: (options && options.connectorWidth !== undefined) ? options.connectorWidth : 1, // in pixels
            // Future options: connectorStyle: (options && options.connectorStyle) || 'solid',
            ...options // Allow overriding other options if needed
        };

        console.log('Mindmap initialized for container:', containerId, 'with options:', this.options);
    }

    _generateId() {
        return 'node-' + (this.nodeCounter++);
    }

    addCentralTopic(topicData = { text: 'Central Topic' }) {
        const nodeId = this._generateId();
        const initialPosition = {
            x: this.container.offsetWidth / 2 - 50,
            y: 50
        };
        const newNode = new MindmapNode(nodeId, topicData.text, null, [], initialPosition, topicData.style);
        this.nodes.set(nodeId, newNode);
        console.log('Central topic added:', newNode);
        this._renderNode(newNode);
        return newNode;
    }

    createNode(parentNodeId, nodeData = { text: 'New Node' }) {
        if (!this.nodes.has(parentNodeId)) {
            console.error('Parent node not found:', parentNodeId);
            return null;
        }
        const parentNode = this.nodes.get(parentNodeId);
        const nodeId = this._generateId();
        const parentPosition = parentNode.position;
        const childrenCount = parentNode.children.length;
        const newNodePosition = {
            x: parentPosition.x,
            y: parentPosition.y + 70 + (childrenCount * 60)
        };

        let styleForNewNode = nodeData.style;
        if (!styleForNewNode || Object.keys(styleForNewNode).length === 0) {
            styleForNewNode = { ...this.currentNodeStyle };
        }

        const newNode = new MindmapNode(nodeId, nodeData.text, parentNodeId, [], newNodePosition, styleForNewNode);
        this.nodes.set(nodeId, newNode);
        parentNode.children.push(nodeId);
        console.log('Node created:', newNode, 'as child of', parentNodeId);
        this._renderNode(newNode);
        return newNode;
    }

    getNodeById(nodeId) {
        return this.nodes.get(nodeId);
    }

    _renderConnector(parentNode, childNode) {
        console.log("[Mindmap._renderConnector] Rendering connector between:", parentNode.id, "and", childNode.id);
        console.log("[Mindmap._renderConnector] Connector Options:", this.options);

        const connectorId = "conn-" + parentNode.id + "-" + childNode.id;
        const oldConnector = document.getElementById(connectorId);
        if (oldConnector) {
            oldConnector.remove();
        }
        const connectorElement = document.createElement('div');
        connectorElement.id = connectorId;
        connectorElement.classList.add('mindmap-connector');

        connectorElement.style.backgroundColor = this.options.connectorColor;
        connectorElement.style.height = this.options.connectorWidth + 'px';

        const pRect = document.getElementById(parentNode.id).getBoundingClientRect();
        const cRect = document.getElementById(childNode.id).getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();

        const pCenterX = pRect.left - containerRect.left + pRect.width / 2;
        const pCenterY = pRect.top - containerRect.top + pRect.height;
        const cCenterX = cRect.left - containerRect.left + cRect.width / 2;
        const cCenterY = cRect.top - containerRect.top;

        const angle = Math.atan2(cCenterY - pCenterY, cCenterX - pCenterX) * 180 / Math.PI;
        const length = Math.sqrt(Math.pow(cCenterX - pCenterX, 2) + Math.pow(cCenterY - pCenterY, 2));

        connectorElement.style.width = length + 'px';
        connectorElement.style.left = pCenterX + 'px';
        connectorElement.style.top = pCenterY + 'px';
        connectorElement.style.transformOrigin = '0 0';
        connectorElement.style.transform = 'rotate(' + angle + 'deg)';

        console.log(`[Mindmap._renderConnector] Calculated values: length: ${length}, angle: ${angle}`);
        console.log(`[Mindmap._renderConnector] Parent attach point (pCenterX, pCenterY relative to container): ${pCenterX}, ${pCenterY}`);
        console.log(`[Mindmap._renderConnector] Child attach point (cCenterX, cCenterY relative to container): ${cCenterX}, ${cCenterY}`);
        console.log("[Mindmap._renderConnector] Connector Element ID:", connectorElement.id);
        console.log("[Mindmap._renderConnector] Applied Styles - backgroundColor:", connectorElement.style.backgroundColor);
        console.log("[Mindmap._renderConnector] Applied Styles - height (thickness):", connectorElement.style.height);
        console.log("[Mindmap._renderConnector] Applied Styles - width (length):", connectorElement.style.width);
        console.log("[Mindmap._renderConnector] Applied Styles - left:", connectorElement.style.left);
        console.log("[Mindmap._renderConnector] Applied Styles - top:", connectorElement.style.top);
        console.log("[Mindmap._renderConnector] Applied Styles - transformOrigin:", connectorElement.style.transformOrigin);
        console.log("[Mindmap._renderConnector] Applied Styles - transform:", connectorElement.style.transform);
        // Note: getComputedStyle might be more accurate for zIndex if it's set in CSS, but for direct styles, this is fine.
        // We expect z-index to be set by the .mindmap-connector CSS rule.
        // console.log("[Mindmap._renderConnector] Applied Styles - zIndex (from CSS or inline if set):", getComputedStyle(connectorElement).zIndex);


        this.container.appendChild(connectorElement);
    }

    _renderNode(node) {
        const nodeElement = document.createElement('div');
        nodeElement.id = node.id;
        nodeElement.classList.add('mindmap-node');
        nodeElement.textContent = node.text;
        nodeElement.style.left = node.position.x + 'px';
        nodeElement.style.top = node.position.y + 'px';
        nodeElement.style.zIndex = 1;

        const style = node.style || {};
        nodeElement.style.backgroundColor = style.backgroundColor || '#f8f9fa';
        nodeElement.style.color = style.textColor || '#212529';
        nodeElement.style.borderColor = style.borderColor || '#ced4da';
        nodeElement.style.borderWidth = style.borderWidth ? (typeof style.borderWidth === 'number' ? style.borderWidth + 'px' : style.borderWidth) : '2px';
        nodeElement.style.borderStyle = style.borderStyle || 'solid';
        nodeElement.style.fontSize = style.fontSize || '1em';
        nodeElement.style.fontWeight = style.fontWeight || 'normal';
        nodeElement.style.fontFamily = style.fontFamily || 'sans-serif';
        nodeElement.style.borderRadius = style.borderRadius ? (typeof style.borderRadius === 'number' ? style.borderRadius + 'px' : style.borderRadius) : '6px';
        nodeElement.style.padding = style.padding || '12px 18px';

        this.container.appendChild(nodeElement);

        nodeElement.addEventListener('dblclick', () => {
            const newText = prompt('Enter new text for node:', node.text);
            if (newText !== null && newText.trim() !== '') {
                this.updateNode(node.id, { text: newText });
            }
        });

        if (node.parentId && this.nodes.has(node.parentId)) {
            const parentNode = this.nodes.get(node.parentId);
            if (document.getElementById(parentNode.id) && document.getElementById(node.id)) {
                 this._renderConnector(parentNode, node);
            } else {
                console.warn("Parent or child node DOM element not found for connector rendering:", parentNode.id, node.id);
            }
        }
    }

    removeNode(nodeId) {
        const nodeToRemove = this.nodes.get(nodeId);
        if (!nodeToRemove) {
            console.warn("Node not found for removal:", nodeId);
            return;
        }
        const childrenIds = [...nodeToRemove.children];
        childrenIds.forEach(childId => {
            this.removeNode(childId);
        });
        const nodeElement = document.getElementById(nodeId);
        if (nodeElement) {
            nodeElement.remove();
        }
        if (nodeToRemove.parentId && this.nodes.has(nodeToRemove.parentId)) {
            const parentNode = this.nodes.get(nodeToRemove.parentId);
            const connectorToRemoveId = "conn-" + parentNode.id + "-" + nodeToRemove.id;
            const connectorElementToRemove = document.getElementById(connectorToRemoveId);
            if (connectorElementToRemove) {
                connectorElementToRemove.remove();
            }
        }
        if (nodeToRemove.parentId && this.nodes.has(nodeToRemove.parentId)) {
            const parentNode = this.nodes.get(nodeToRemove.parentId);
            const indexInParent = parentNode.children.indexOf(nodeId);
            if (indexInParent > -1) {
                parentNode.children.splice(indexInParent, 1);
            }
        }
        this.nodes.delete(nodeId);
        console.log("Node removed from data structure:", nodeId);
    }

    updateNode(nodeId, updatedData) {
        const nodeToUpdate = this.nodes.get(nodeId);
        if (!nodeToUpdate) {
            console.warn("Node not found for update:", nodeId);
            return null;
        }

        if (updatedData.text !== undefined) {
            nodeToUpdate.text = updatedData.text;
        }
        if (updatedData.style) {
            nodeToUpdate.style = { ...nodeToUpdate.style, ...updatedData.style };
            this.currentNodeStyle = { ...nodeToUpdate.style }; // Update currentNodeStyle
            console.log("Node style data updated:", nodeId, nodeToUpdate.style);
        }

        const nodeElement = document.getElementById(nodeId);
        if (nodeElement) {
            if (updatedData.text !== undefined) {
                 nodeElement.textContent = nodeToUpdate.text;
                 console.log("Node text updated in DOM:", nodeId);
            }
            if (updatedData.style || nodeToUpdate.style) {
                const styleToApply = nodeToUpdate.style || {};
                nodeElement.style.backgroundColor = styleToApply.backgroundColor || '';
                nodeElement.style.color = styleToApply.textColor || '';
                nodeElement.style.borderColor = styleToApply.borderColor || '';
                nodeElement.style.borderWidth = styleToApply.borderWidth ? (typeof styleToApply.borderWidth === 'number' ? styleToApply.borderWidth + 'px' : styleToApply.borderWidth) : '';
                nodeElement.style.borderStyle = styleToApply.borderStyle || '';
                nodeElement.style.fontSize = styleToApply.fontSize || '';
                nodeElement.style.fontWeight = styleToApply.fontWeight || '';
                nodeElement.style.fontFamily = styleToApply.fontFamily || '';
                nodeElement.style.borderRadius = styleToApply.borderRadius ? (typeof styleToApply.borderRadius === 'number' ? styleToApply.borderRadius + 'px' : styleToApply.borderRadius) : '';
                nodeElement.style.padding = styleToApply.padding || '';
                console.log("Node style updated in DOM:", nodeId);
            }
        } else {
            console.log("Node data updated (not rendered):", nodeId);
        }
        return nodeToUpdate;
    }
}

// Demo script removed from here. It will be in index.html
