// Mindmap Library Core
console.log('Mindmap library loaded');

class MindmapNode {
    constructor(id, text, parentId = null, children = [], position = { x: 0, y: 0 }, style = {}) {
        this.id = id;
        this.text = text;
        this.parentId = parentId;
        this.children = children; // Array of child node IDs
        this.position = position; // { x, y }
        this.style = style; // { shape: 'rectangle', backgroundColor: '#fff', ... }
    }
}

class Mindmap {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Mindmap container not found:', containerId);
            return;
        }
        this.nodes = new Map(); // Stores MindmapNode objects, keyed by nodeId
        this.nodeCounter = 0; // Simple ID generator
        console.log('Mindmap initialized for container:', containerId);
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
        const newNode = new MindmapNode(nodeId, nodeData.text, parentNodeId, [], newNodePosition, nodeData.style);
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
        const connectorElement = document.createElement('div');
        connectorElement.id = connectorId;
        connectorElement.classList.add('mindmap-connector');
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
        connectorElement.style.height = '1px';
        connectorElement.style.left = pCenterX + 'px';
        connectorElement.style.top = pCenterY + 'px';
        connectorElement.style.transformOrigin = '0 0';
        connectorElement.style.transform = 'rotate(' + angle + 'deg)';
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

        if(node.style && node.style.backgroundColor) {
            nodeElement.style.backgroundColor = node.style.backgroundColor;
        }
        if(node.style && node.style.color) {
            nodeElement.style.color = node.style.color;
        }
        this.container.appendChild(nodeElement);

        // Add event listener for double-click to edit text
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
        // Could be extended for other properties (style, position, etc.)

        const nodeElement = document.getElementById(nodeId);
        if (nodeElement) {
            nodeElement.textContent = nodeToUpdate.text; // Update display
            console.log("Node text updated in DOM:", nodeId);
        } else {
            // If the node isn't currently rendered (e.g., if rendering is partial or virtualized)
            console.log("Node data updated (not rendered):", nodeId);
        }
        return nodeToUpdate;
    }
}

// Demo script removed from here. It will be in index.html
