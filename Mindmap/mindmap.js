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
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Mindmap container not found:', containerId);
            return;
        }
        this.nodes = new Map();
        this.nodeCounter = 0;
        this.currentNodeStyle = {};

        this.options = {
            connectorColor: (options && options.connectorColor) || 'black',
            connectorWidth: (options && options.connectorWidth !== undefined) ? options.connectorWidth : 1,
            ...options
        };

        this.isDragging = false;
        this.draggedNodeId = null;
        this.dragStartPos = { x: 0, y: 0 };
        this.dragStartNodePos = { x: 0, y: 0 };

        // Bind methods
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);

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
        const connectorId = "conn-" + parentNode.id + "-" + childNode.id;
        const oldConnector = document.getElementById(connectorId);
        if (oldConnector) {
            oldConnector.remove();
        }

        const pRect = document.getElementById(parentNode.id).getBoundingClientRect();
        const cRect = document.getElementById(childNode.id).getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();

        const startX = pRect.right - containerRect.left;
        const startY = pRect.top - containerRect.top + pRect.height / 2;
        const endX = cRect.left - containerRect.left;
        const endY = cRect.top - containerRect.top + cRect.height / 2;

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.id = connectorId;
        svg.classList.add('mindmap-connector');
        svg.style.position = 'absolute';
        svg.style.left = '0';
        svg.style.top = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.zIndex = -1;
        svg.style.overflow = 'visible';

        const line = document.createElementNS(svgNS, "line");
        line.setAttribute('x1', startX);
        line.setAttribute('y1', startY);
        line.setAttribute('x2', endX);
        line.setAttribute('y2', endY);
        line.setAttribute('stroke', 'black');
        line.setAttribute('stroke-width', 2);

        svg.appendChild(line);

        this.container.appendChild(svg);
    }

    _renderNode(node) {
        const nodeElement = document.createElement('div');
        nodeElement.id = node.id;
        nodeElement.classList.add('mindmap-node');
        nodeElement.textContent = node.text;
        nodeElement.style.left = node.position.x + 'px';
        nodeElement.style.top = node.position.y + 'px';
        nodeElement.style.zIndex = 1;
        nodeElement.style.cursor = 'move'; // Add move cursor

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

        // Add connection points
        const sides = ['top', 'right', 'bottom', 'left'];
        sides.forEach(side => {
            const point = document.createElement('div');
            point.classList.add('connection-point');
            point.classList.add(`connection-point-${side}`);
            point.dataset.nodeId = node.id;
            point.dataset.side = side;
            nodeElement.appendChild(point);
        });

        nodeElement.addEventListener('mousedown', (e) => this._onMouseDown(e, node));

        nodeElement.addEventListener('dblclick', (e) => {
            e.stopPropagation(); // Prevent drag from starting on dblclick
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

    _onMouseDown(e, node) {
        e.preventDefault();
        e.stopPropagation();

        this.isDragging = true;
        this.draggedNodeId = node.id;
        this.dragStartPos = { x: e.clientX, y: e.clientY };
        this.dragStartNodePos = { x: node.position.x, y: node.position.y };

        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mouseup', this._onMouseUp);
    }

    _onMouseMove(e) {
        if (!this.isDragging) return;

        const dx = e.clientX - this.dragStartPos.x;
        const dy = e.clientY - this.dragStartPos.y;

        const newX = this.dragStartNodePos.x + dx;
        const newY = this.dragStartNodePos.y + dy;

        this.updateNodePosition(this.draggedNodeId, newX, newY);
    }

    _onMouseUp(e) {
        this.isDragging = false;
        this.draggedNodeId = null;
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);
    }

    updateNodePosition(nodeId, newX, newY) {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        node.position.x = newX;
        node.position.y = newY;

        const nodeElement = document.getElementById(nodeId);
        if (nodeElement) {
            nodeElement.style.left = newX + 'px';
            nodeElement.style.top = newY + 'px';
        }

        this._updateConnectors(nodeId);
    }

    _updateConnectors(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        // Update connector to parent
        if (node.parentId && this.nodes.has(node.parentId)) {
            const parentNode = this.nodes.get(node.parentId);
            this._renderConnector(parentNode, node);
        }

        // Update connectors to children
        if (node.children && node.children.length > 0) {
            node.children.forEach(childId => {
                const childNode = this.nodes.get(childId);
                if (childNode) {
                    this._renderConnector(node, childNode);
                }
            });
        }
    }
}
