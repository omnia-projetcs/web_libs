/**
 * MindMeld.js - A Vanilla JavaScript Mind Mapping Library
 * This script encapsulates all the logic for creating, rendering,
 * and interacting with a mind map.
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // Auto-initialize the library on the default container.
    // For more advanced usage, you could export the MindMeld class
    // and let the user instantiate it manually: new MindMeld('#my-container');
    new MindMeld();

});

class MindMeld {
    constructor() {
        this.initDOM();
        if (!this.mindmapContainer) {
            console.error("MindMeld Error: Container element #mindmap-container not found.");
            return;
        }
        this.initProperties();
        this.init();
    }

    /**
     * Selects all necessary DOM elements for the application.
     */
    initDOM() {
        this.mindmapContainer = document.getElementById('mindmap-container');
        
        // Create the SVG canvas dynamically
        this.mindmapContainer.innerHTML = `
            <svg id="mindmap-canvas">
                <defs>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="2" dy="3" stdDeviation="3" flood-color="var(--node-shadow)" />
                    </filter>
                </defs>
                <g id="mindmap-group"></g>
            </svg>
        `;
        
        this.svg = document.getElementById('mindmap-canvas');
        this.mindmapGroup = document.getElementById('mindmap-group');

        this.toolbar = {
            importBtn: document.getElementById('import-btn'),
            importFile: document.getElementById('import-file'),
            exportBtn: document.getElementById('export-btn'),
            zoomInBtn: document.getElementById('zoom-in-btn'),
            zoomOutBtn: document.getElementById('zoom-out-btn'),
            resetViewBtn: document.getElementById('reset-view-btn'),
            newMapBtn: document.getElementById('new-map-btn'),
        };
        this.contextMenu = {
            el: document.getElementById('context-menu'),
            addChild: document.getElementById('ctx-add-child'),
            addSibling: document.getElementById('ctx-add-sibling'),
            editNode: document.getElementById('ctx-edit-node'),
            deleteNode: document.getElementById('ctx-delete-node'),
        };
        this.editModal = {
            el: document.getElementById('edit-modal'),
            textInput: document.getElementById('node-text-input'),
            colorInput: document.getElementById('node-color-input'),
            saveBtn: document.getElementById('modal-save'),
            cancelBtn: document.getElementById('modal-cancel'),
        };
        this.confirmModal = {
            el: document.getElementById('confirm-modal'),
            title: document.getElementById('confirm-title'),
            text: document.getElementById('confirm-text'),
            okBtn: document.getElementById('confirm-ok'),
            cancelBtn: document.getElementById('confirm-cancel'),
        };
    }

    /**
     * Initializes the state and properties of the application.
     */
    initProperties() {
        this.NODE_WIDTH = 180;
        this.NODE_HEIGHT = 60;
        this.HORIZONTAL_SPACING = 80;
        this.VERTICAL_SPACING = 40;
        this.GRID_SIZE = 20;
        
        this.state = {
            tree: null,
            view: { scale: 1, pan: { x: 0, y: 0 } },
            selectedNodeId: null,
            contextNodeId: null,
            editingNodeId: null,
        };
        
        this.confirmCallback = null;
        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };
        this.dragInfo = null;
    }

    /**
     * Main initialization function.
     */
    init() {
        this.loadState();
        if (!this.state.tree) {
            this.createNewMap(true);
            this.calculateLayout(this.state.tree);
        }
        this.addEventListeners();
        this.centerView();
    }

    // --- STATE MANAGEMENT ---
    createNewMap(isInitial = false) {
        this.state.tree = {
            id: this.generateId(),
            text: "Nœud Central",
            children: [],
            data: { color: '#ffffff' },
            isCollapsed: false,
        };
        this.state.selectedNodeId = this.state.tree.id;
        
        if (isInitial) return;
        
        this.calculateLayout(this.state.tree);
        this.saveAndRender();
        this.centerView();
    }

    saveState() {
        try {
            const stateToSave = { tree: this.state.tree, view: this.state.view };
            localStorage.setItem('mindMeldState', JSON.stringify(stateToSave));
        } catch (e) {
            console.error("Erreur lors de la sauvegarde de l'état:", e);
        }
    }

    loadState() {
        try {
            const savedState = localStorage.getItem('mindMeldState');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                this.state.tree = parsedState.tree;
                this.state.view = parsedState.view || { scale: 1, pan: { x: 0, y: 0 } };
            }
        } catch (e) {
            console.error("Erreur lors du chargement de l'état:", e);
            this.state.tree = null;
        }
    }

    generateId() {
        return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // --- NODE & TREE UTILITIES ---
    findNodeById(nodeId, node = this.state.tree, parent = null, index = -1) {
        if (!node) return null;
        if (node.id === nodeId) {
            return { node, parent, index };
        }
        for (let i = 0; i < node.children.length; i++) {
            const found = this.findNodeById(nodeId, node.children[i], node, i);
            if (found) return found;
        }
        return null;
    }
    
    getAllNodes(node, nodes = []) {
        if (!node) return [];
        nodes.push(node);
        if (node.children && !node.isCollapsed) {
            node.children.forEach(child => this.getAllNodes(child, nodes));
        }
        return nodes;
    }
    
    getAllDescendants(nodeId) {
        const result = [];
        const startNode = this.findNodeById(nodeId)?.node;
        if (!startNode) return [];

        function recurse(currentNode) {
            result.push(currentNode);
            currentNode.children.forEach(recurse);
        }
        
        startNode.children.forEach(recurse);
        return result;
    }

    // --- RENDERING ---
    render() {
        if (!this.state.tree) return;
        
        this.mindmapGroup.innerHTML = '';
        this.mindmapGroup.setAttribute('transform', `translate(${this.state.view.pan.x}, ${this.state.view.pan.y}) scale(${this.state.view.scale})`);
        this.renderRecursive(this.state.tree);
        this.updateSelectionVisuals();
    }
    
    renderRecursive(node, parent = null) {
        if (parent) {
            this.drawConnector(parent, node);
        }
        this.drawNode(node);
        if (!node.isCollapsed) {
            node.children.forEach(child => this.renderRecursive(child, node));
        }
    }

    drawNode(node) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'node');
        group.setAttribute('id', node.id);
        group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
        
        if (node.id === this.state.selectedNodeId) {
            group.classList.add('selected');
        }

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('class', 'node-rect');
        rect.setAttribute('x', -this.NODE_WIDTH / 2);
        rect.setAttribute('y', -this.NODE_HEIGHT / 2);
        rect.setAttribute('width', this.NODE_WIDTH);
        rect.setAttribute('height', this.NODE_HEIGHT);
        rect.setAttribute('rx', 10);
        rect.setAttribute('ry', 10);
        rect.setAttribute('fill', node.data?.color || 'var(--node-bg)');
        rect.setAttribute('stroke', 'var(--node-stroke)');
        group.appendChild(rect);

        const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        foreignObject.setAttribute('x', -this.NODE_WIDTH / 2);
        foreignObject.setAttribute('y', -this.NODE_HEIGHT / 2);
        foreignObject.setAttribute('width', this.NODE_WIDTH);
        foreignObject.setAttribute('height', this.NODE_HEIGHT);

        const wrapper = document.createElement('div');
        wrapper.setAttribute('class', 'node-text-wrapper');
        wrapper.innerHTML = this.parseMarkdownLinks(node.text);
        
        foreignObject.appendChild(wrapper);
        group.appendChild(foreignObject);

        if (node.children.length > 0) {
            const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            handle.setAttribute('class', 'collapse-handle');
            handle.setAttribute('cx', this.NODE_WIDTH / 2);
            handle.setAttribute('cy', 0);
            handle.setAttribute('r', 8);
            handle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleCollapse(node.id);
            });
            group.appendChild(handle);

            const handleSymbol = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            handleSymbol.setAttribute('d', node.isCollapsed ? 'M -3,0 L 3,0 M 0,-3 L 0,3' : 'M -3,0 L 3,0');
            handleSymbol.setAttribute('stroke', 'white');
            handleSymbol.setAttribute('stroke-width', '2');
            handleSymbol.setAttribute('transform', `translate(${this.NODE_WIDTH / 2}, 0)`);
            handleSymbol.style.pointerEvents = 'none';
            group.appendChild(handleSymbol);
        }

        this.mindmapGroup.appendChild(group);
    }
    
    parseMarkdownLinks(text) {
        if (!text) return '';
        const escapeHtml = (unsafe) => 
            unsafe
                 .replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
                 .replace(/'/g, "&#039;");

        const regex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
        return escapeHtml(text).replace(regex, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    }

    drawConnector(parentNode, childNode) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'connector');
        
        let startX, startY, endX, endY;
        const dx = childNode.x - parentNode.x;
        const dy = childNode.y - parentNode.y;

        if (Math.abs(dx) > Math.abs(dy)) { 
            startX = parentNode.x + (dx > 0 ? this.NODE_WIDTH / 2 : -this.NODE_WIDTH / 2);
            startY = parentNode.y;
            endX = childNode.x - (dx > 0 ? this.NODE_WIDTH / 2 : -this.NODE_WIDTH / 2);
            endY = childNode.y;
        } else { 
            startX = parentNode.x;
            startY = parentNode.y + (dy > 0 ? this.NODE_HEIGHT / 2 : -this.NODE_HEIGHT / 2);
            endX = childNode.x;
            endY = childNode.y - (dy > 0 ? this.NODE_HEIGHT / 2 : -this.NODE_HEIGHT / 2);
        }
        
        const c1x = startX + dx / 2.5;
        const c1y = startY + dy / 2.5;
        const c2x = endX - dx / 2.5;
        const c2y = endY - dy / 2.5;

        path.setAttribute('d', `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`);
        this.mindmapGroup.insertBefore(path, this.mindmapGroup.firstChild);
    }
    
    updateSelectionVisuals() {
        document.querySelectorAll('.node.selected').forEach(el => el.classList.remove('selected'));
        if (this.state.selectedNodeId) {
            const selectedEl = document.getElementById(this.state.selectedNodeId);
            if (selectedEl) {
                selectedEl.classList.add('selected');
            }
        }
    }

    // --- LAYOUT & COLLISION ---
    calculateLayout(root) {
        this.calculateSubtreeHeight(root);
        this.layoutRecursive(root, 0, 0, 0);
    }

    calculateSubtreeHeight(node) {
        if (node.children.length === 0 || node.isCollapsed) {
            node.subtreeHeight = this.NODE_HEIGHT;
            return this.NODE_HEIGHT;
        }
        let totalHeight = 0;
        node.children.forEach(child => {
            totalHeight += this.calculateSubtreeHeight(child);
        });
        node.subtreeHeight = totalHeight + (node.children.length - 1) * this.VERTICAL_SPACING;
        return node.subtreeHeight;
    }

    layoutRecursive(node, x, y, level) {
        node.x = x + level * (this.NODE_WIDTH + this.HORIZONTAL_SPACING);
        node.y = y;

        if (node.children.length > 0 && !node.isCollapsed) {
            let currentY = y - node.subtreeHeight / 2;
            node.children.forEach(child => {
                const childYOffset = child.subtreeHeight / 2;
                this.layoutRecursive(child, x, currentY + childYOffset, level + 1);
                currentY += child.subtreeHeight + this.VERTICAL_SPACING;
            });
        }
    }
    
    snapToGrid(value) {
        return Math.round(value / this.GRID_SIZE) * this.GRID_SIZE;
    }

    resolveCollisions(movedNodeId) {
        const allNodes = this.getAllNodes(this.state.tree);
        const movedNodeInfo = this.findNodeById(movedNodeId);
        if (!movedNodeInfo) return;
        const movedNode = movedNodeInfo.node;

        allNodes.forEach(staticNode => {
            if (movedNode.id === staticNode.id) return;

            const rect1 = { x: movedNode.x - this.NODE_WIDTH / 2, y: movedNode.y - this.NODE_HEIGHT / 2, width: this.NODE_WIDTH, height: this.NODE_HEIGHT };
            const rect2 = { x: staticNode.x - this.NODE_WIDTH / 2, y: staticNode.y - this.NODE_HEIGHT / 2, width: this.NODE_WIDTH, height: this.NODE_HEIGHT };

            const overlapX = Math.max(0, Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - Math.max(rect1.x, rect2.x));
            const overlapY = Math.max(0, Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - Math.max(rect1.y, rect2.y));

            if (overlapX > 0 && overlapY > 0) {
                const pushX = overlapX + this.GRID_SIZE;
                const pushY = overlapY + this.GRID_SIZE;

                if (pushX < pushY) {
                    if (movedNode.x < staticNode.x) movedNode.x -= pushX;
                    else movedNode.x += pushX;
                } else {
                    if (movedNode.y < staticNode.y) movedNode.y -= pushY;
                    else movedNode.y += pushY;
                }
            }
        });
    }
    
    // --- USER ACTIONS ---
    addNode(type, targetNodeId) {
        const { node: targetNode, parent: targetParent } = this.findNodeById(targetNodeId);
        if (!targetNode) return;

        const newNode = {
            id: this.generateId(),
            text: "Nouveau Nœud",
            children: [],
            data: { color: '#ffffff' },
            isCollapsed: false,
        };
        
        if (type === 'child') {
            newNode.x = targetNode.x + this.NODE_WIDTH + this.HORIZONTAL_SPACING;
            newNode.y = targetNode.y;
            targetNode.children.push(newNode);
        } else if (type === 'sibling' && targetParent) {
            newNode.x = targetNode.x;
            newNode.y = targetNode.y + this.NODE_HEIGHT + this.VERTICAL_SPACING;
            const index = targetParent.children.findIndex(n => n.id === targetNodeId);
            targetParent.children.splice(index + 1, 0, newNode);
        } else {
            return;
        }

        this.state.selectedNodeId = newNode.id;
        this.resolveCollisions(newNode.id);
        this.saveAndRender();
    }

    deleteNode(nodeId) {
        const { parent } = this.findNodeById(nodeId);
        if (parent) {
            const index = parent.children.findIndex(n => n.id === nodeId);
            parent.children.splice(index, 1);
            this.state.selectedNodeId = parent.id;
            this.saveAndRender();
        }
    }

    toggleCollapse(nodeId) {
        const { node } = this.findNodeById(nodeId);
        if (node) {
            node.isCollapsed = !node.isCollapsed;
            this.saveAndRender();
        }
    }
    
    centerView() {
        const canvasBounds = this.svg.getBoundingClientRect();
        const allNodes = this.getAllNodes(this.state.tree);

        if (allNodes.length === 0) {
            this.state.view.pan = { x: canvasBounds.width / 2, y: canvasBounds.height / 2 };
            this.state.view.scale = 1;
            this.saveAndRender();
            return;
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        allNodes.forEach(node => {
            minX = Math.min(minX, node.x - this.NODE_WIDTH / 2);
            minY = Math.min(minY, node.y - this.NODE_HEIGHT / 2);
            maxX = Math.max(maxX, node.x + this.NODE_WIDTH / 2);
            maxY = Math.max(maxY, node.y + this.NODE_HEIGHT / 2);
        });
        
        const mapWidth = maxX - minX;
        const mapHeight = maxY - minY;

        if (mapWidth === 0 || mapHeight === 0) {
            this.state.view.scale = 1;
            this.state.view.pan.x = canvasBounds.width / 2 - this.state.tree.x * this.state.view.scale;
            this.state.view.pan.y = canvasBounds.height / 2 - this.state.tree.y * this.state.view.scale;
        } else {
            const scaleX = (canvasBounds.width - 100) / mapWidth;
            const scaleY = (canvasBounds.height - 100) / mapHeight;
            this.state.view.scale = Math.min(scaleX, scaleY, 1);
            
            const mapCenterX = minX + mapWidth / 2;
            const mapCenterY = minY + mapHeight / 2;

            this.state.view.pan.x = canvasBounds.width / 2 - mapCenterX * this.state.view.scale;
            this.state.view.pan.y = canvasBounds.height / 2 - mapCenterY * this.state.view.scale;
        }
        this.saveAndRender();
    }
    
    saveAndRender() {
        this.saveState();
        this.render();
    }

    // --- EVENT HANDLING ---
    addEventListeners() {
        // Toolbar
        this.toolbar.importBtn?.addEventListener('click', () => this.toolbar.importFile.click());
        this.toolbar.importFile?.addEventListener('change', (e) => this.handleImport(e));
        this.toolbar.exportBtn?.addEventListener('click', () => this.handleExport());
        this.toolbar.resetViewBtn?.addEventListener('click', () => this.centerView());
        this.toolbar.zoomInBtn?.addEventListener('click', () => this.handleZoomButton('in'));
        this.toolbar.zoomOutBtn?.addEventListener('click', () => this.handleZoomButton('out'));
        this.toolbar.newMapBtn?.addEventListener('click', () => {
            this.showConfirmModal(
                "Nouvelle carte mentale",
                "Êtes-vous sûr de vouloir créer une nouvelle carte ? Le travail non sauvegardé sera perdu.",
                () => this.createNewMap()
            );
        });

        // SVG Canvas
        this.svg.addEventListener('wheel', (e) => this.handleZoom(e));
        this.svg.addEventListener('mousedown', (e) => this.handlePanStart(e));
        this.svg.addEventListener('mousemove', (e) => this.handlePanMove(e));
        this.svg.addEventListener('mouseup', () => this.handlePanEnd());
        this.svg.addEventListener('mouseleave', () => this.handlePanEnd());
        this.svg.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.svg.addEventListener('contextmenu', (e) => this.handleCanvasContextMenu(e));

        // Node events (delegated)
        this.svg.addEventListener('dblclick', (e) => this.handleNodeDblClick(e));
        this.svg.addEventListener('mousedown', (e) => this.handleNodeDragStart(e));

        // Context menu
        document.addEventListener('click', () => { if(this.contextMenu.el) this.contextMenu.el.style.display = 'none' });
        this.contextMenu.el?.addEventListener('click', e => e.stopPropagation());
        this.contextMenu.addChild?.addEventListener('click', () => {
            if (this.state.contextNodeId) this.addNode('child', this.state.contextNodeId);
            this.contextMenu.el.style.display = 'none';
        });
        this.contextMenu.addSibling?.addEventListener('click', () => {
            if (this.state.contextNodeId) this.addNode('sibling', this.state.contextNodeId);
            this.contextMenu.el.style.display = 'none';
        });
        this.contextMenu.deleteNode?.addEventListener('click', () => {
            if (this.state.contextNodeId) {
                this.showConfirmModal(
                    "Supprimer le nœud",
                    "Voulez-vous vraiment supprimer ce nœud et toute sa branche ?",
                    () => this.deleteNode(this.state.contextNodeId)
                );
            }
            this.contextMenu.el.style.display = 'none';
        });
        this.contextMenu.editNode?.addEventListener('click', () => {
            if (this.state.contextNodeId) this.openEditModal(this.state.contextNodeId);
            this.contextMenu.el.style.display = 'none';
        });
        
        // Modals
        this.editModal.saveBtn?.addEventListener('click', () => this.handleModalSave());
        this.editModal.cancelBtn?.addEventListener('click', () => this.closeEditModal());
        this.editModal.el?.addEventListener('click', (e) => {
            if (e.target === this.editModal.el) this.closeEditModal();
        });
        this.confirmModal.okBtn?.addEventListener('click', () => {
            if (this.confirmCallback) this.confirmCallback();
            this.closeConfirmModal();
        });
        this.confirmModal.cancelBtn?.addEventListener('click', () => this.closeConfirmModal());
        this.confirmModal.el?.addEventListener('click', (e) => {
            if (e.target === this.confirmModal.el) this.closeConfirmModal();
        });
    }
    
    // --- EVENT HANDLERS ---
    handleZoom(e) {
        e.preventDefault();
        const scaleAmount = -e.deltaY * 0.001;
        const oldScale = this.state.view.scale;
        this.state.view.scale = Math.max(0.1, Math.min(3, this.state.view.scale + scaleAmount));
        
        const mouseScreenPoint = {x: e.clientX, y: e.clientY};
        this.state.view.pan.x = mouseScreenPoint.x - (mouseScreenPoint.x - this.state.view.pan.x) * (this.state.view.scale / oldScale);
        this.state.view.pan.y = mouseScreenPoint.y - (mouseScreenPoint.y - this.state.view.pan.y) * (this.state.view.scale / oldScale);

        this.saveAndRender();
    }
    
    handleZoomButton(direction) {
        const scaleFactor = 1.2;
        const scaleAmount = direction === 'in' ? scaleFactor : 1 / scaleFactor;
        const oldScale = this.state.view.scale;
        this.state.view.scale = Math.max(0.1, Math.min(3, this.state.view.scale * scaleAmount));
        
        const canvasRect = this.svg.getBoundingClientRect();
        const centerPoint = { x: canvasRect.width / 2, y: canvasRect.height / 2 };

        this.state.view.pan.x = centerPoint.x - (centerPoint.x - this.state.view.pan.x) * (this.state.view.scale / oldScale);
        this.state.view.pan.y = centerPoint.y - (centerPoint.y - this.state.view.pan.y) * (this.state.view.scale / oldScale);

        this.saveAndRender();
    }

    handlePanStart(e) {
        const targetNode = e.target.closest('.node');
        if (!targetNode && e.button === 0) {
            this.isPanning = true;
            this.panStart = { x: e.clientX - this.state.view.pan.x, y: e.clientY - this.state.view.pan.y };
            this.svg.style.cursor = 'grabbing';
        }
    }

    handlePanMove(e) {
        if (this.isPanning) {
            e.preventDefault();
            this.state.view.pan.x = e.clientX - this.panStart.x;
            this.state.view.pan.y = e.clientY - this.panStart.y;
            this.render();
        }
    }

    handlePanEnd() {
        if (this.isPanning) {
            this.isPanning = false;
            this.svg.style.cursor = 'grab';
            this.saveState();
        }
    }

    handleCanvasClick(e) {
        if (e.target.tagName.toLowerCase() === 'svg') {
            this.state.selectedNodeId = null;
            this.updateSelectionVisuals();
        }
    }
    
    handleCanvasContextMenu(e) {
        e.preventDefault();
        const targetNode = e.target.closest('.node');
        if (targetNode) {
            this.state.contextNodeId = targetNode.id;
            this.contextMenu.el.style.display = 'block';
            this.contextMenu.el.style.left = `${e.clientX}px`;
            this.contextMenu.el.style.top = `${e.clientY}px`;

            const isRoot = this.state.tree.id === targetNode.id;
            this.contextMenu.addSibling.style.display = isRoot ? 'none' : 'flex';
            this.contextMenu.deleteNode.style.display = isRoot ? 'none' : 'flex';
        } else {
            this.contextMenu.el.style.display = 'none';
        }
    }

    handleNodeDblClick(e) {
        const targetNodeEl = e.target.closest('.node');
        if (targetNodeEl) {
            if (e.target.tagName.toLowerCase() === 'a') return;
            e.stopPropagation();
            this.openEditModal(targetNodeEl.id);
        }
    }
    
    handleNodeDragStart(e) {
        if (e.target.classList.contains('collapse-handle')) return;
        
        const targetNodeEl = e.target.closest('.node');
        if (e.button === 0 && targetNodeEl) {
            e.stopPropagation();
            
            const startPoint = this.getSVGPoint(e);
            const node = this.findNodeById(targetNodeEl.id).node;
            const descendants = this.getAllDescendants(targetNodeEl.id);
            
            this.dragInfo = {
                nodeId: targetNodeEl.id,
                startPoint: startPoint,
                initialPositions: new Map()
            };
            
            this.dragInfo.initialPositions.set(node.id, { x: node.x, y: node.y });
            descendants.forEach(desc => {
                this.dragInfo.initialPositions.set(desc.id, { x: desc.x, y: desc.y });
            });

            this.svg.addEventListener('mousemove', (ev) => this.handleNodeDragMove(ev));
            this.svg.addEventListener('mouseup', () => this.handleNodeDragEnd(), { once: true });
        }
    }
    
    handleNodeDragMove(e) {
        if (this.dragInfo) {
            e.preventDefault();
            const currentPoint = this.getSVGPoint(e);
            const dx = currentPoint.x - this.dragInfo.startPoint.x;
            const dy = currentPoint.y - this.dragInfo.startPoint.y;

            this.dragInfo.initialPositions.forEach((pos, id) => {
                const nodeToMove = this.findNodeById(id).node;
                if (nodeToMove) {
                    nodeToMove.x = pos.x + dx;
                    nodeToMove.y = pos.y + dy;
                }
            });
            
            this.render();
        }
    }

    handleNodeDragEnd() {
        if (this.dragInfo) {
            const movedNode = this.findNodeById(this.dragInfo.nodeId).node;
            if(movedNode) {
                const descendants = this.getAllDescendants(this.dragInfo.nodeId);
                const allMovedNodes = [movedNode, ...descendants];
                
                allMovedNodes.forEach(node => {
                    node.x = this.snapToGrid(node.x);
                    node.y = this.snapToGrid(node.y);
                });

                this.resolveCollisions(this.dragInfo.nodeId);
            }
            this.saveAndRender();
        }
        this.svg.removeEventListener('mousemove', this.handleNodeDragMove);
        this.dragInfo = null;
    }

    handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data && data.id && data.text && Array.isArray(data.children)) {
                    this.state.tree = data;
                    this.saveAndRender();
                    this.centerView();
                } else {
                    throw new Error("Format de fichier JSON invalide.");
                }
            } catch (err) {
                 this.showConfirmModal("Erreur d'importation", `Erreur : ${err.message}`, () => {});
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    handleExport() {
        const dataStr = JSON.stringify(this.state.tree, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mindmap.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    // --- MODAL HANDLERS ---
    openEditModal(nodeId) {
        this.state.editingNodeId = nodeId;
        const { node } = this.findNodeById(nodeId);
        if (!node) return;
        
        this.editModal.textInput.value = node.text;
        this.editModal.colorInput.value = node.data?.color || '#ffffff';
        
        this.editModal.el.style.display = 'flex';
    }

    closeEditModal() {
        this.editModal.el.style.display = 'none';
        this.state.editingNodeId = null;
    }
    
    handleModalSave() {
        if (!this.state.editingNodeId) return;
        const { node } = this.findNodeById(this.state.editingNodeId);
        if (!node) return;
        
        node.text = this.editModal.textInput.value;
        if (!node.data) node.data = {};
        node.data.color = this.editModal.colorInput.value;
        
        this.closeEditModal();
        this.saveAndRender();
    }
    
    showConfirmModal(title, text, onConfirm) {
        this.confirmModal.title.textContent = title;
        this.confirmModal.text.textContent = text;
        this.confirmCallback = onConfirm;
        this.confirmModal.el.style.display = 'flex';
    }

    closeConfirmModal() {
        this.confirmModal.el.style.display = 'none';
        this.confirmCallback = null;
    }

    // --- UTILITY FUNCTIONS ---
    getSVGPoint(e) {
        const pt = this.svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const screenCTM = this.mindmapGroup.getScreenCTM();
        return screenCTM ? pt.matrixTransform(screenCTM.inverse()) : pt;
    }
}
