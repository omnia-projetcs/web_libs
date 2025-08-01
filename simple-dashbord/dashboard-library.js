/**
 * Dashboard Library
 * A simple vanilla JS library to create dynamic dashboards.
 * @version 1.3
 */
const Dashboard = (() => {
    // --- Private variables ---
    let workspace = null;
    let editModal = null;
    let confirmModal = null;
    let draggedWidget = null;
    let currentResizingWidget = null;

    // --- Private Functions ---

    /**
     * Creates a widget and appends it to the workspace.
     * @param {string} id - Unique ID for the widget.
     * @param {string} type - Type of widget ('text', 'image', etc.).
     * @param {object} content - The widget's data.
     * @param {object} [size] - Grid size {colSpan, rowSpan}.
     */
    function createWidget(id, type, content, size) {
        const widget = document.createElement('div');
        widget.id = id;
        widget.className = 'widget';
        widget.dataset.type = type;
        widget.draggable = true;
        widget.dataset.content = JSON.stringify(content);

        if (size) {
            widget.style.gridColumn = size.colSpan;
            widget.style.gridRow = size.rowSpan;
        } else if (type === 'text' || type === 'link') {
            widget.style.gridRow = 'span 3'; // Smaller by default
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'widget-delete-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showCustomConfirm('Êtes-vous sûr de vouloir supprimer ce widget ?', () => widget.remove());
        });
        widget.appendChild(deleteBtn);
        
        const widgetContent = document.createElement('div');
        widgetContent.className = 'widget-content';
        widget.appendChild(widgetContent);

        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        widget.appendChild(resizeHandle);
        
        updateWidgetContent(widget);
        addEventListenersToWidget(widget);
        workspace.appendChild(widget);
    }
    
    /**
     * Updates the inner HTML of a widget based on its content.
     * @param {HTMLElement} widget - The widget element to update.
     */
    function updateWidgetContent(widget) {
        const type = widget.dataset.type;
        const content = JSON.parse(widget.dataset.content);
        const widgetContent = widget.querySelector('.widget-content');
        widgetContent.innerHTML = '';

        switch (type) {
            case 'text':
                widgetContent.innerHTML = `<h3>${content.title || 'Titre'}</h3><p>${content.text || 'Paragraphe.'}</p>`;
                break;
            case 'image':
                const img = document.createElement('img');
                img.src = content.url || 'https://placehold.co/600x400/e0e0e0/333333?text=Image';
                img.alt = content.alt || 'Image du widget';
                img.draggable = false; // **BUG FIX HERE**
                img.onerror = () => { img.src = 'https://placehold.co/600x400/e94560/ffffff?text=Erreur+URL'; };
                widgetContent.appendChild(img);
                break;
            case 'video':
                widgetContent.innerHTML = `<h3>${content.title || 'Vidéo'}</h3>`;
                widgetContent.appendChild(generateYouTubeEmbed(content.url));
                break;
            case 'link':
                widgetContent.innerHTML = `<h3>${content.title || 'Lien'}</h3><a href="${content.url || '#'}" target="_blank">${content.label || 'Cliquez ici'}</a>`;
                break;
            case 'chart':
                widgetContent.innerHTML = `<h3>${content.title || 'Graphique'}</h3>`;
                widgetContent.appendChild(generateBarChart(content.data));
                break;
        }
    }

    /**
     * Generates a responsive YouTube embed container.
     * @param {string} url - The full YouTube URL.
     * @returns {HTMLElement} - The container div with the iframe.
     */
    function generateYouTubeEmbed(url) {
        const container = document.createElement('div');
        container.className = 'video-container';
        
        const videoId = getYouTubeID(url);

        if (videoId) {
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube.com/embed/${videoId}`;
            iframe.title = "Lecteur vidéo YouTube";
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
            iframe.setAttribute('allowfullscreen', '');
            container.appendChild(iframe);
        } else {
            container.textContent = "URL de la vidéo YouTube invalide ou non reconnue.";
            container.style.paddingBottom = '0';
            container.style.height = '100%';
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
        }
        return container;
    }

    /**
     * Extracts YouTube video ID from various URL formats.
     * @param {string} url - The YouTube URL.
     * @returns {string|null} - The video ID or null.
     */
    function getYouTubeID(url) {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    /**
     * Generates an SVG bar chart.
     * @param {Array<object>} data - Array of {label, value}.
     * @returns {SVGElement} - The generated SVG element.
     */
    function generateBarChart(data) {
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.setAttribute('viewBox', `0 0 400 250`);

        if (!data || data.length === 0) {
            const text = document.createElementNS(svgNS, 'text');
            text.setAttribute('x', '50%'); text.setAttribute('y', '50%');
            text.setAttribute('fill', 'var(--font-color)'); text.setAttribute('text-anchor', 'middle');
            text.textContent = 'Pas de données';
            svg.appendChild(text);
            return svg;
        }

        const maxValue = Math.max(...data.map(d => d.value), 0);
        const padding = { top: 20, right: 20, bottom: 30, left: 40 };
        const chartWidth = 400 - padding.left - padding.right;
        const chartHeight = 250 - padding.top - padding.bottom;
        const barWidth = (chartWidth / data.length) * 0.8;
        const barSpacing = (chartWidth / data.length) * 0.2;

        data.forEach((d, i) => {
            const barHeight = maxValue > 0 ? (d.value / maxValue) * chartHeight : 0;
            const x = padding.left + i * (barWidth + barSpacing);
            const y = padding.top + chartHeight - barHeight;
            const rect = document.createElementNS(svgNS, 'rect');
            rect.setAttribute('x', x); rect.setAttribute('y', y);
            rect.setAttribute('width', barWidth); rect.setAttribute('height', barHeight);
            rect.setAttribute('fill', 'var(--secondary-color)');
            svg.appendChild(rect);
            const text = document.createElementNS(svgNS, 'text');
            text.setAttribute('x', x + barWidth / 2); text.setAttribute('y', 250 - padding.bottom + 15);
            text.setAttribute('fill', 'var(--font-color)'); text.setAttribute('font-size', '12');
            text.setAttribute('text-anchor', 'middle');
            text.textContent = d.label;
            svg.appendChild(text);
        });
        return svg;
    }

    /**
     * Attaches all necessary event listeners to a widget.
     * @param {HTMLElement} widget - The widget element.
     */
    function addEventListenersToWidget(widget) {
        widget.addEventListener('dblclick', (e) => {
            if (!e.target.classList.contains('widget-delete-btn') && !e.target.classList.contains('resize-handle')) {
                openEditModal(widget);
            }
        });
        widget.addEventListener('dragstart', handleDragStart);
        widget.addEventListener('dragend', handleDragEnd);
        widget.querySelector('.resize-handle').addEventListener('mousedown', initResize);
    }
    
    // --- Drag & Drop Logic ---
    function handleDragStart(e) {
        if (e.target.classList.contains('resize-handle') || e.target.tagName === 'IMG') {
            e.preventDefault();
            return;
        }
        draggedWidget = e.target;
        setTimeout(() => e.target.classList.add('dragging'), 0);
    }

    function handleDragEnd() {
        if (draggedWidget) {
            draggedWidget.classList.remove('dragging');
            draggedWidget = null;
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        if (!draggedWidget) return;
        const afterElement = getDragAfterElement(workspace, e.clientY);
        if (afterElement == null) {
            workspace.appendChild(draggedWidget);
        } else {
            workspace.insertBefore(draggedWidget, afterElement);
        }
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.widget:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else { return closest; }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // --- Grid Resize Logic ---
    function initResize(e) {
        e.preventDefault();
        currentResizingWidget = e.target.closest('.widget');
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResize);
    }

    function resize(e) {
        if (!currentResizingWidget) return;
        
        const widget = currentResizingWidget;
        const rect = widget.getBoundingClientRect();
        const gridStyles = window.getComputedStyle(workspace);
        const rowHeight = parseFloat(gridStyles.getPropertyValue('grid-auto-rows'));
        const gap = parseFloat(gridStyles.getPropertyValue('gap'));
        
        const colCount = gridStyles.getPropertyValue('grid-template-columns').split(' ').length;
        const colWidth = (workspace.clientWidth - (colCount - 1) * gap) / colCount;

        const newWidth = e.clientX - rect.left;
        const newHeight = e.clientY - rect.top;

        const colSpan = Math.max(1, Math.ceil(newWidth / (colWidth + gap)));
        const rowSpan = Math.max(1, Math.ceil(newHeight / (rowHeight + gap)));
        
        widget.style.gridColumn = `span ${colSpan}`;
        widget.style.gridRow = `span ${rowSpan}`;
    }

    function stopResize() {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResize);
        currentResizingWidget = null;
    }

    // --- Modal Logic ---
    function openEditModal(widget) {
        let currentEditingWidget = widget;
        const type = widget.dataset.type;
        const content = JSON.parse(widget.dataset.content);
        const modalBody = editModal.querySelector('#modal-body');
        modalBody.innerHTML = '';
        editModal.querySelector('#modal-title').textContent = `Éditer le Widget ${type.charAt(0).toUpperCase() + type.slice(1)}`;

        switch(type) {
            case 'text': modalBody.innerHTML = `<label for="modal-text-title">Titre</label><input type="text" id="modal-text-title" value="${content.title || ''}"><label for="modal-text-content">Texte</label><textarea id="modal-text-content">${content.text || ''}</textarea>`; break;
            case 'image': modalBody.innerHTML = `<label for="modal-image-url">URL de l'image</label><input type="text" id="modal-image-url" value="${content.url || ''}"><label for="modal-image-alt">Texte alternatif</label><input type="text" id="modal-image-alt" value="${content.alt || ''}">`; break;
            case 'video': modalBody.innerHTML = `<label for="modal-video-title">Titre</label><input type="text" id="modal-video-title" value="${content.title || ''}"><label for="modal-video-url">URL de la vidéo YouTube</label><input type="text" id="modal-video-url" value="${content.url || ''}">`; break;
            case 'link': modalBody.innerHTML = `<label for="modal-link-title">Titre</label><input type="text" id="modal-link-title" value="${content.title || ''}"><label for="modal-link-url">URL du lien</label><input type="text" id="modal-link-url" value="${content.url || ''}"><label for="modal-link-label">Libellé du lien</label><input type="text" id="modal-link-label" value="${content.label || ''}">`; break;
            case 'chart': modalBody.innerHTML = `<label for="modal-chart-title">Titre du graphique</label><input type="text" id="modal-chart-title" value="${content.title || ''}"><label for="modal-chart-data">Données (JSON)</label><textarea id="modal-chart-data" placeholder='[{"label": "A", "value": 10}]'>${JSON.stringify(content.data, null, 2)}</textarea>`; break;
        }
        editModal.style.display = 'flex';

        const saveHandler = () => {
            let newContent = {};
            try {
                switch(type) {
                    case 'text': newContent = { title: document.getElementById('modal-text-title').value, text: document.getElementById('modal-text-content').value }; break;
                    case 'image': newContent = { url: document.getElementById('modal-image-url').value, alt: document.getElementById('modal-image-alt').value }; break;
                    case 'video': newContent = { title: document.getElementById('modal-video-title').value, url: document.getElementById('modal-video-url').value }; break;
                    case 'link': newContent = { title: document.getElementById('modal-link-title').value, url: document.getElementById('modal-link-url').value, label: document.getElementById('modal-link-label').value }; break;
                    case 'chart': newContent = { title: document.getElementById('modal-chart-title').value, data: JSON.parse(document.getElementById('modal-chart-data').value) }; break;
                }
                currentEditingWidget.dataset.content = JSON.stringify(newContent);
                updateWidgetContent(currentEditingWidget);
                closeEditModal();
            } catch (error) { alert("Erreur dans les données fournies.\n" + error); }
        };

        const closeEditModal = () => {
            editModal.style.display = 'none';
            editModal.querySelector('#modal-save-btn').removeEventListener('click', saveHandler);
        };

        editModal.querySelector('#modal-save-btn').addEventListener('click', saveHandler, { once: true });
        editModal.querySelector('#modal-cancel-btn').addEventListener('click', closeEditModal, { once: true });
    }

    function showCustomConfirm(message, callback) {
        const modalText = confirmModal.querySelector('#confirm-modal-text');
        const yesBtn = confirmModal.querySelector('#confirm-modal-yes');
        const noBtn = confirmModal.querySelector('#confirm-modal-no');
        modalText.textContent = message;
        
        const yesHandler = () => { callback(); closeConfirm(); };
        const closeConfirm = () => {
            confirmModal.style.display = 'none';
            yesBtn.removeEventListener('click', yesHandler);
            noBtn.removeEventListener('click', closeConfirm);
        };
        yesBtn.addEventListener('click', yesHandler, { once: true });
        noBtn.addEventListener('click', closeConfirm, { once: true });
        confirmModal.style.display = 'flex';
    }

    // --- Save & Import Logic ---
    function saveState() {
        const dashboardState = { widgets: [] };
        document.querySelectorAll('.widget').forEach(widget => {
            dashboardState.widgets.push({
                id: widget.id, type: widget.dataset.type,
                content: JSON.parse(widget.dataset.content),
                size: { colSpan: widget.style.gridColumn, rowSpan: widget.style.gridRow }
            });
        });
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dashboardState, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "dashboard-layout.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    function importState(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const dashboardState = JSON.parse(e.target.result);
                workspace.innerHTML = '';
                if (dashboardState.widgets && Array.isArray(dashboardState.widgets)) {
                    dashboardState.widgets.forEach(ws => createWidget(ws.id, ws.type, ws.content, ws.size));
                }
            } catch (error) { alert("Erreur lors de la lecture du fichier.\n" + error); }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    // --- Public API ---
    return {
        /**
         * Initializes the dashboard, finds DOM elements, and attaches all event listeners.
         */
        init: () => {
            // Find required DOM elements
            workspace = document.getElementById('workspace');
            editModal = document.getElementById('edit-modal');
            confirmModal = document.getElementById('confirm-modal');

            if (!workspace || !editModal || !confirmModal) {
                console.error("Dashboard Error: Un ou plusieurs éléments HTML requis (workspace, edit-modal, confirm-modal) sont manquants.");
                return;
            }

            document.getElementById('new-dashboard-btn')?.addEventListener('click', () => {
                showCustomConfirm(
                    'Voulez-vous vraiment effacer le tableau de bord actuel ? Cette action est irréversible.',
                    () => {
                        workspace.innerHTML = '';
                    }
                );
            });
            document.getElementById('add-text-btn')?.addEventListener('click', () => createWidget(`widget-${Date.now()}`, 'text', { title: 'Nouveau Texte', text: 'Double-cliquez pour éditer.' }));
            document.getElementById('add-image-btn')?.addEventListener('click', () => createWidget(`widget-${Date.now()}`, 'image', { url: '', alt: 'Nouvelle image' }));
            document.getElementById('add-video-btn')?.addEventListener('click', () => createWidget(`widget-${Date.now()}`, 'video', { title: 'Nouvelle Vidéo', url: '' }));
            document.getElementById('add-link-btn')?.addEventListener('click', () => createWidget(`widget-${Date.now()}`, 'link', { title: 'Nouveau Lien', url: 'https://google.com', label: 'Google' }));
            document.getElementById('add-chart-btn')?.addEventListener('click', () => createWidget(`widget-${Date.now()}`, 'chart', { title: 'Nouveau Graphique', data: [{ label: 'A', value: 20 }, { label: 'B', value: 50 }] }));
            
            document.getElementById('save-btn')?.addEventListener('click', saveState);
            document.getElementById('import-input')?.addEventListener('change', importState);

            workspace.addEventListener('dragover', handleDragOver);
        }
    };
})();
