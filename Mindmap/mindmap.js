// --- Conceptual API Endpoints ---
// const API_BASE_URL = '/api/mindmap'; // Example base
// const API_SAVE_MINDMAP = `${API_BASE_URL}/save`; // POST - Body: { mindmapData, mindmapId? }
// const API_LOAD_MINDMAP = `${API_BASE_URL}/load/:mindmapId`; // GET
// const API_LIST_MINDMAPS = `${API_BASE_URL}/list`; // GET - Returns list of user's mindmaps {id, name, lastModified}

// Global mindmap data variable
let mindmapData = {
  root: {
    id: 'root',
    text: 'Root Node',
    notes: 'This is the central idea of our mindmap.',
    table: null, image: null, chart: null,
    x: 50, y: 50, // Default global position for root
    children: [
      { id: 'child1', text: 'Child 1', notes: '', table: null, image: null, chart: null, children: [] },
      { id: 'child2', text: 'Child 2', notes: 'Initial notes.', table: null, image: null, chart: null, children: [
        { id: 'grandchild21', text: 'Grandchild 2.1', notes: '', table: null, image: null, chart: null, children: [] }
      ]},
    ],
  },
};

const LOCAL_STORAGE_KEY = 'userMindmapData';
let nodeIdCounter = 0;
let svgLayer = null; // For SVG connection lines
let mindmapContainer = null; // Reference to the main mindmap container DOM element

// --- Drag State Variables ---
let isDragging = false;
let draggedNodeElement = null;
let draggedNodeId = null;
let initialMouseOffsetX = 0;
let initialMouseOffsetY = 0;
let mindmapContainerRect = null; // To store container offset and dimensions

function generateNodeId() { return `node-${Date.now()}-${nodeIdCounter++}`; }

// --- Feedback Utility ---
function showFeedback(message, isError = false, isServerSim = false) {
  const feedbackElement = document.getElementById('feedback-message');
  if (feedbackElement) {
    const prefix = isServerSim ? "(Simulated Server) " : "";
    feedbackElement.textContent = prefix + message;
    feedbackElement.className = 'feedback-message ' + (isError ? 'error' : 'success');
    feedbackElement.style.display = 'block';
    setTimeout(() => { feedbackElement.style.display = 'none'; }, 4000);
  } else {
    console.log("Feedback:", message);
  }
}

// --- Data Persistence ---
function getMindmapDataAsJSON() { return JSON.stringify(mindmapData, null, 2); }

function saveMindmapToLocalStorage() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, getMindmapDataAsJSON());
    console.log('Mindmap saved to local storage.');
  } catch (e) {
    console.error('Error saving to local storage:', e);
    showFeedback('Error saving locally. Storage might be full.', true);
  }
}

function loadMindmapFromLocalStorage() {
  try {
    const jsonData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (jsonData) {
      const loadedData = JSON.parse(jsonData);
      if (loadedData && loadedData.root) {
        mindmapData = loadedData;
        nodeIdCounter = Date.now();
        console.log('Mindmap loaded from local storage.');
        showFeedback('Mindmap loaded from previous local session.', false);
      }
    } else {
      console.log('No mindmap data found in local storage. Starting fresh.');
      if (!mindmapData.root.x || !mindmapData.root.y) {
          mindmapData.root.x = 50;
          mindmapData.root.y = 50;
      }
    }
  } catch (e) {
    console.error('Error loading from local storage:', e);
    showFeedback('Could not load data from local storage. Starting fresh.', true);
     if (!mindmapData.root.x || !mindmapData.root.y) {
        mindmapData.root.x = 50;
        mindmapData.root.y = 50;
    }
  }
  renderMindmap(mindmapData, 'mindmap-container');
}

function clearLocalStorage() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    showFeedback('Local mindmap data cleared. Default map loaded.', false);
    console.log('Local storage cleared for mindmap data.');
    mindmapData = {
        root: {
            id: 'root', text: 'Default Root', notes:'Cleared local data', children: [],
            x: 50, y: 50
        }
    };
    nodeIdCounter = 0;
    renderMindmap(mindmapData, 'mindmap-container');
  } catch (e) {
    console.error('Error clearing local storage:', e);
    showFeedback('Error clearing local data.', true);
  }
}

// --- SIMULATED SERVER INTERACTION ---
async function saveMindmapToServer(mindmapId = 'default-map-id') {
  const jsonData = getMindmapDataAsJSON();
  const conceptualEndpoint = `/api/mindmap/save`;
  console.log(`Simulating SAVE to conceptual endpoint: ${conceptualEndpoint} for mindmapId: ${mindmapId}`);
  showFeedback(`Attempting to save mindmap "${mindmapId}" to server...`, false, true);
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const simulatedServerResponse = { success: true, savedId: mindmapId, timestamp: Date.now() };
    console.log("Simulated server success response:", simulatedServerResponse);
    showFeedback(`Mindmap "${mindmapId}" saved. (Simulated server ID: ${simulatedServerResponse.savedId})`, false, true);
  } catch (error) {
    console.error("Simulated server save error:", error);
    showFeedback(`Failed to save mindmap "${mindmapId}" to server. ${error.message}`, true, true);
  }
}

async function loadMindmapFromServer(mindmapId = 'sample-map-from-server') {
  const conceptualEndpoint = `/api/mindmap/load/${mindmapId}`;
  console.log(`Simulating LOAD from conceptual endpoint: ${conceptualEndpoint}`);
  showFeedback(`Attempting to load mindmap "${mindmapId}" from server...`, false, true);
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const sampleServerData = {
      root: {
        id: 'server-root', text: `Loaded: ${mindmapId}`, notes: 'This data came from a (simulated) server.',
        x: 50, y: 50,
        image: {src: 'https://via.placeholder.com/120/007bff/ffffff?text=Server+Image', alt:'Server Image'},
        children: [
          { id: generateNodeId(), text: 'Server Child 1', children: [] },
          { id: generateNodeId(), text: 'Server Child 2', notes: 'Has server notes!', children: [] }
        ]
      }
    };
    if (sampleServerData && sampleServerData.root) {
      mindmapData = sampleServerData;
      nodeIdCounter = Date.now();
      renderMindmap(mindmapData, 'mindmap-container');
      saveMindmapToLocalStorage();
      showFeedback(`Mindmap "${mindmapId}" loaded from server successfully.`, false, true);
    } else {
      throw new Error("Invalid data format from server.");
    }
  } catch (error) {
    console.error("Simulated server load error:", error);
    showFeedback(`Failed to load mindmap "${mindmapId}" from server. ${error.message}`, true, true);
  }
}

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
  mindmapContainer = document.getElementById('mindmap-container');
  svgLayer = document.getElementById('mindmap-svg-layer');

  function updateContainerRect() {
    if (mindmapContainer) {
        mindmapContainerRect = mindmapContainer.getBoundingClientRect();
    }
  }
  updateContainerRect();
  window.addEventListener('resize', updateContainerRect);

  loadMindmapFromLocalStorage();

  const addNodeBtn = document.getElementById('add-node-btn');
  const nodeTextInput = document.getElementById('node-text-input');
  const saveLocallyBtn = document.getElementById('save-locally-btn');
  const saveToServerBtn = document.getElementById('save-to-server-btn');
  const clearLocalBtn = document.getElementById('clear-local-storage-btn');
  const loadFromServerBtn = document.getElementById('load-from-server-btn');
  const importFileInput = document.getElementById('import-file-input');
  const exportJsonBtn = document.getElementById('export-json-btn');

  if (addNodeBtn) addNodeBtn.addEventListener('click', () => {
    const text = nodeTextInput.value.trim();
    if (text) { addNode('root', text); nodeTextInput.value = ''; }
    else { alert('Please enter text for the node.'); }
  });
  if (saveLocallyBtn) saveLocallyBtn.addEventListener('click', () => {
    saveMindmapToLocalStorage();
    showFeedback('Mindmap explicitly saved locally!', false);
  });
  if (saveToServerBtn) saveToServerBtn.addEventListener('click', () => saveMindmapToServer('user123-map-alpha'));
  if (loadFromServerBtn) loadFromServerBtn.addEventListener('click', () => loadMindmapFromServer('official-sample-map'));
  if (clearLocalBtn) clearLocalBtn.addEventListener('click', clearLocalStorage);
  if (importFileInput) importFileInput.addEventListener('change', handleFileUpload);
  if (exportJsonBtn) exportJsonBtn.addEventListener('click', handleExportMindmapAsJson);
});

// --- File Export/Import & Utility Functions ---
function handleExportMindmapAsJson() {
  try {
    const mindmapJsonString = JSON.stringify(mindmapData, null, 2);
    const blob = new Blob([mindmapJsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    let filename = 'mindmap.json';
    if (mindmapData && mindmapData.root && mindmapData.root.text) {
      const safeFilename = mindmapData.root.text.replace(/[^a-z0-9_\-\.]/gi, '_').substring(0, 50);
      if (safeFilename) filename = `${safeFilename}.json`;
    }
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showFeedback('Mindmap data prepared for download as ' + filename, false);
  } catch (error) {
    console.error('Error exporting mindmap as JSON:', error);
    showFeedback('Could not export mindmap. An error occurred.', true);
  }
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  const importFileInput = document.getElementById('import-file-input');
  if (!file) return;
  if (file.type !== "application/json") {
    showFeedback("Please select a valid JSON file (.json).", true);
    if (importFileInput) importFileInput.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const jsonText = e.target.result;
      const loadedData = JSON.parse(jsonText);
      if (loadedData && loadedData.root && typeof loadedData.root.text !== 'undefined') {
        mindmapData = loadedData;
        nodeIdCounter = Date.now();
        renderMindmap(mindmapData, 'mindmap-container');
        saveMindmapToLocalStorage();
        showFeedback('Mindmap loaded successfully from file!', false);
      } else {
        showFeedback('Invalid mindmap file format. Missing root node or essential data.', true);
      }
    } catch (error) {
      console.error('Error parsing JSON file:', error);
      showFeedback('Error reading or parsing the mindmap file. Ensure it is valid JSON.', true);
    } finally {
      if (importFileInput) importFileInput.value = '';
    }
  };
  reader.onerror = () => {
    console.error('Error reading file.');
    showFeedback('An error occurred while trying to read the file.', true);
    if (importFileInput) importFileInput.value = '';
  };
  reader.readAsText(file);
}

function getBoundingBox(nodeElement, mindmapContainerElement) {
  if (!nodeElement || !mindmapContainerElement) return null;
  const nodeRect = nodeElement.getBoundingClientRect();
  const containerRect = mindmapContainerElement.getBoundingClientRect();
  const x = nodeRect.left - containerRect.left + mindmapContainerElement.scrollLeft;
  const y = nodeRect.top - containerRect.top + mindmapContainerElement.scrollTop;
  return { x, y, width: nodeElement.offsetWidth, height: nodeElement.offsetHeight, id: nodeElement.dataset.id };
}

function doNodesOverlap(box1, box2) {
  if (!box1 || !box2) return false;
  if (box1.x + box1.width <= box2.x || box2.x + box2.width <= box1.x) return false;
  if (box1.y + box1.height <= box2.y || box2.y + box2.height <= box1.y) return false;
  return true;
}

// --- Core Mindmap Logic ---
function findNodeById(node, id) {
    if (node.id === id) return node;
    if (node.children) {
        for (const child of node.children) {
            const found = findNodeById(child, id);
            if (found) return found;
        }
    }
    return null;
}
function findParentNode(node, childId) {
    if (node.children) {
        for (const child of node.children) {
            if (child.id === childId) return node;
            const foundParent = findParentNode(child, childId);
            if (foundParent) return foundParent;
        }
    }
    return null;
}
function addNode(parentId, text) {
  const parentNode = findNodeById(mindmapData.root, parentId);
  if (!parentNode) return;
  if (!parentNode.children) parentNode.children = [];
  const newNode = { id: generateNodeId(), text: text, notes: '', children: [] };
  // Remove x,y from newNode so it's algorithmically placed
  delete newNode.x;
  delete newNode.y;
  parentNode.children.push(newNode);
  if (parentNode.children.length === 1) parentNode.isCollapsed = false;
  renderMindmap(mindmapData, 'mindmap-container');
  saveMindmapToLocalStorage();
}
function deleteNode(nodeId) {
  if (nodeId === mindmapData.root.id) { alert("Cannot delete root."); return; }
  let parentNode = findParentNode(mindmapData.root, nodeId);
  if (parentNode && parentNode.children) {
    parentNode.children = parentNode.children.filter(child => child.id !== nodeId);
  } else {
    function removeInChildren(node, idToRemove) {
        if (!node.children) return false;
        const initialLength = node.children.length;
        node.children = node.children.filter(child => child.id !== idToRemove);
        if (node.children.length < initialLength) return true;
        for (const child of node.children) { if (removeInChildren(child, idToRemove)) return true; }
        return false;
    }
    if (!removeInChildren(mindmapData.root, nodeId)) {
        alert(`Node with ID "${nodeId}" not found for deletion.`); return;
    }
  }
  renderMindmap(mindmapData, 'mindmap-container');
  saveMindmapToLocalStorage();
}
function editNodeText(nodeId, newText) {
  const node = findNodeById(mindmapData.root, nodeId);
  if (node) {
    node.text = newText;
    renderMindmap(mindmapData, 'mindmap-container');
    saveMindmapToLocalStorage();
  }
}
function addOrEditNote(nodeId) {
  const node = findNodeById(mindmapData.root, nodeId);
  if (node) {
    const newNote = prompt(`Notes for "${node.text}":`, node.notes || '');
    if (newNote !== null) {
      node.notes = newNote.trim();
      renderMindmap(mindmapData, 'mindmap-container');
      saveMindmapToLocalStorage();
    }
  }
}
function addOrEditTable(nodeId) {
  const node = findNodeById(mindmapData.root, nodeId);
  if (!node) return;
  const currentTable = node.table;
  let headersInput = currentTable ? currentTable.headers.join(',') : '';
  let rowsInput = currentTable ? currentTable.rows.map(r => r.join(',')).join(';') : '';
  headersInput = prompt("Table Headers (comma-separated):", headersInput);
  if (headersInput === null) return;
  rowsInput = prompt("Table Rows (semicolon-separated rows; comma-separated cells):", rowsInput);
  if (rowsInput === null) return;
  const headers = headersInput.split(',').map(h => h.trim()).filter(h => h);
  let rows = [];
  if (rowsInput.trim() !== '') {
    rows = rowsInput.split(';').map(rowStr => rowStr.split(',').map(cell => cell.trim())).filter(row => row.length > 0 && (row.length > 1 || row[0] !== ''));
  }
  let changed = false;
  if (headers.length === 0 && rows.length === 0) {
    if (node.table !== null) changed = true;
    node.table = null;
  } else if (headers.length > 0 && rows.every(row => row.length === headers.length)) {
    node.table = { headers, rows };
    changed = true;
  } else if (headers.length > 0 && rows.length === 0) {
    node.table = { headers, rows: [] };
    changed = true;
  } else {
    alert("Invalid table data. All rows must match header count. Table not saved.");
    if (!currentTable) node.table = null;
  }
  if (changed) {
    renderMindmap(mindmapData, 'mindmap-container');
    saveMindmapToLocalStorage();
  }
}
function addOrEditImage(nodeId) {
  const node = findNodeById(mindmapData.root, nodeId);
  if (!node) return;
  const currentImage = node.image;
  let src = currentImage ? currentImage.src : '';
  let alt = currentImage ? currentImage.alt : '';
  src = prompt("Image URL:", src);
  if (src === null) return;
  alt = prompt("Image Alt Text:", alt);
  if (alt === null) return;
  let changed = false;
  if (src.trim()) {
    if (!node.image || node.image.src !== src.trim() || node.image.alt !== alt.trim()) changed = true;
    node.image = { src: src.trim(), alt: alt.trim() };
  } else {
    if (node.image !== null) changed = true;
    node.image = null;
  }
  if (changed) {
    renderMindmap(mindmapData, 'mindmap-container');
    saveMindmapToLocalStorage();
  }
}
function addOrEditChart(nodeId) {
  const node = findNodeById(mindmapData.root, nodeId);
  if (!node) return;
  const currentChart = node.chart;
  let type = currentChart ? currentChart.type : 'bar';
  let title = currentChart ? currentChart.title : '';
  let labelsStr = currentChart ? currentChart.labels.join(',') : '';
  let valuesStr = currentChart ? currentChart.values.join(',') : '';
  type = prompt("Chart Type ('bar', 'line', 'pie'):", type);
  if (type === null) return; type = type.trim().toLowerCase();
  title = prompt("Chart Title:", title);
  if (title === null) return;
  labelsStr = prompt("Chart Labels (comma-separated):", labelsStr);
  if (labelsStr === null) return;
  valuesStr = prompt("Chart Values (comma-separated numbers):", valuesStr);
  if (valuesStr === null) return;
  const labels = labelsStr.split(',').map(l => l.trim()).filter(l => l);
  const values = valuesStr.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
  let changed = false;
  if (labels.length > 0 && values.length > 0 && labels.length === values.length && ['bar', 'line', 'pie'].includes(type)) {
    node.chart = { type, title: title.trim(), labels, values };
    changed = true;
  } else if (labels.length === 0 && values.length === 0 && type && ['bar', 'line', 'pie'].includes(type)) {
    node.chart = { type, title: title.trim(), labels: [], values: [] };
    changed = true;
  } else {
    alert("Invalid chart data. Ensure type is valid, and labels/values counts match. Chart not saved.");
    if (!currentChart) node.chart = null;
  }
  if (changed) {
    renderMindmap(mindmapData, 'mindmap-container');
    saveMindmapToLocalStorage();
  }
}

// --- Rendering ---
function createNodeElement(nodeData) {
  const nodeElement = document.createElement('div');
  nodeElement.classList.add('mindmap-node');
  nodeElement.setAttribute('data-id', nodeData.id);

  const textElement = document.createElement('span');
  textElement.classList.add('node-text');
  textElement.textContent = nodeData.text;
  nodeElement.appendChild(textElement);

  if (nodeData.children && nodeData.children.length > 0) {
    const toggleButton = document.createElement('span');
    toggleButton.classList.add('collapse-toggle');
    toggleButton.textContent = nodeData.isCollapsed ? '+' : '-';
    toggleButton.title = nodeData.isCollapsed ? 'Expand' : 'Collapse';
    toggleButton.addEventListener('click', (e) => {
      e.stopPropagation();
      nodeData.isCollapsed = !nodeData.isCollapsed;
      renderMindmap(mindmapData, 'mindmap-container');
      saveMindmapToLocalStorage();
    });
    nodeElement.insertBefore(toggleButton, textElement);
  }

  textElement.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    const newText = prompt(`Edit node text for "${nodeData.text}":`, nodeData.text);
    if (newText !== null && newText.trim() !== '') editNodeText(nodeData.id, newText.trim());
  });

  if (nodeData.image && nodeData.image.src) {
    const imgElement = document.createElement('img');
    imgElement.classList.add('node-image');
    imgElement.src = nodeData.image.src; imgElement.alt = nodeData.image.alt || 'Node image';
    nodeElement.appendChild(imgElement);
  }
  if (nodeData.notes) {
    const noteElement = document.createElement('p');
    noteElement.classList.add('node-notes');
    noteElement.textContent = nodeData.notes;
    nodeElement.appendChild(noteElement);
  }
  if (nodeData.table && nodeData.table.headers) {
    const tableElement = document.createElement('table');
    tableElement.classList.add('node-table');
    const thead = tableElement.createTHead();
    const headerRow = thead.insertRow();
    nodeData.table.headers.forEach(ht => { const th = document.createElement('th'); th.textContent = ht; headerRow.appendChild(th); });
    if (nodeData.table.rows && nodeData.table.rows.length > 0) {
        const tbody = tableElement.createTBody();
        nodeData.table.rows.forEach(rd => {
          const row = tbody.insertRow();
          rd.forEach(cd => { const td = row.insertCell(); td.textContent = cd; });
        });
    }
    nodeElement.appendChild(tableElement);
  }
  if (nodeData.chart && nodeData.chart.labels && nodeData.chart.values) {
    const chartContainer = document.createElement('div');
    chartContainer.classList.add('node-chart-container');
    chartContainer.id = `chart-container-${nodeData.id}`;
    nodeElement.appendChild(chartContainer);
    if (typeof PureChart !== 'undefined') {
      try {
        const oldCanvas = document.getElementById(`chart-canvas-${nodeData.id}`);
        if(oldCanvas) oldCanvas.remove();
        new PureChart(
            [{ Data: nodeData.chart.values, Label: nodeData.chart.title || 'Chart' }],
            nodeData.chart.labels,
            nodeData.chart.type,
            chartContainer.id,
            nodeData.chart.title || `${nodeData.chart.type.toUpperCase()} Chart`,
            `chart-canvas-${nodeData.id}`
        );
      } catch (e) {
        console.error("Error rendering PureChart:", e);
        chartContainer.textContent = `Chart Error. Data: ${nodeData.chart.type} - L: ${nodeData.chart.labels.join(',')}, V: ${nodeData.chart.values.join(',')}`;
      }
    } else {
      chartContainer.textContent = `Chart (PureChart N/A): ${nodeData.chart.type} - L: ${nodeData.chart.labels.join(',')}, V: ${nodeData.chart.values.join(',')}`;
    }
  }

  const controlsContainer = document.createElement('div');
  controlsContainer.classList.add('node-controls');
  const buttons = [
    { text: nodeData.notes ? 'Edit Note' : 'Add Note', action: () => addOrEditNote(nodeData.id) },
    { text: nodeData.table ? 'Edit Table' : 'Add Table', action: () => addOrEditTable(nodeData.id) },
    { text: nodeData.image ? 'Edit Image' : 'Add Image', action: () => addOrEditImage(nodeData.id) },
    { text: nodeData.chart ? 'Edit Chart' : 'Add Chart', action: () => addOrEditChart(nodeData.id) },
  ];
  buttons.forEach(btnInfo => {
    const btn = document.createElement('button');
    btn.textContent = btnInfo.text;
    btn.onclick = (e) => { e.stopPropagation(); btnInfo.action(); };
    controlsContainer.appendChild(btn);
  });

  if (nodeData.id !== 'root') {
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-node-btn'); deleteBtn.textContent = 'X'; deleteBtn.title = 'Delete node';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      const nodeName = nodeData.text || "this node";
      const childrenCount = nodeData.children ? nodeData.children.length : 0;
      let confirmMessage = `Are you sure you want to delete "${nodeName}"?`;
      if (childrenCount > 0) {
        confirmMessage += `\n\nThis node has ${childrenCount} direct child/children, which will also be deleted.`;
      }
      if (confirm(confirmMessage)) {
        deleteNode(nodeData.id);
      }
    };
    controlsContainer.appendChild(deleteBtn);
  }
  nodeElement.appendChild(controlsContainer);

  nodeElement.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    onDragStart(event, nodeData.id, nodeElement);
  });

  if (!nodeElement.querySelector('.mindmap-children-container')) {
    const childrenDiv = document.createElement('div');
    childrenDiv.classList.add('mindmap-children-container');
    nodeElement.appendChild(childrenDiv);
  }
  return nodeElement;
}

function onDragStart(event, nodeId, nodeElement) {
  if (!nodeElement) return;
  isDragging = true;
  draggedNodeElement = nodeElement;
  draggedNodeId = nodeId;
  updateContainerRect();
  const nodeRect = nodeElement.getBoundingClientRect();
  initialMouseOffsetX = event.clientX - nodeRect.left;
  initialMouseOffsetY = event.clientY - nodeRect.top;
  draggedNodeElement.style.cursor = 'grabbing';
  draggedNodeElement.style.opacity = '0.8';
  event.preventDefault();
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
}

function onDragMove(event) {
  if (!isDragging || !draggedNodeElement || !mindmapContainerRect || !mindmapContainer) return;
  event.preventDefault();
  let newLeft = event.clientX - initialMouseOffsetX - mindmapContainerRect.left + mindmapContainer.scrollLeft;
  let newTop = event.clientY - initialMouseOffsetY - mindmapContainerRect.top + mindmapContainer.scrollTop;
  draggedNodeElement.style.left = newLeft + 'px';
  draggedNodeElement.style.top = newTop + 'px';
  requestAnimationFrame(() => {
    clearSvgLayer();
    const rootNodeForLines = mindmapContainer.querySelector(`.mindmap-node[data-id='${mindmapData.root.id}']`);
    if (rootNodeForLines && svgLayer) {
        traverseAndDrawLines(rootNodeForLines);
    }
  });
}

function onDragEnd(event) {
  if (!isDragging || !draggedNodeId || !draggedNodeElement || !mindmapContainerRect || !mindmapContainer) return;
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
  draggedNodeElement.style.cursor = 'move';
  draggedNodeElement.style.opacity = '1';

  const DRAG_NUDGE_AMOUNT = 10;
  const MAX_DRAG_NUDGES = 30;

  let currentDraggedNodeBox = getBoundingBox(draggedNodeElement, mindmapContainer);
  if (!currentDraggedNodeBox) {
      console.error("Could not get bounding box for dragged node in onDragEnd.");
      isDragging = false; draggedNodeElement = null; draggedNodeId = null;
      return;
  }

  let currentPosition = { x: currentDraggedNodeBox.x, y: currentDraggedNodeBox.y };

  const allOtherNodeElements = mindmapContainer.querySelectorAll('.mindmap-node');
  let allOtherNodeBoxes = [];
  allOtherNodeElements.forEach(otherNodeEl => {
    if (otherNodeEl.dataset.id !== draggedNodeId) {
      const box = getBoundingBox(otherNodeEl, mindmapContainer);
      if (box) allOtherNodeBoxes.push(box);
    }
  });

  for (let nudgeCount = 0; nudgeCount < MAX_DRAG_NUDGES; nudgeCount++) {
    let isOverlappingGlobal = false;
    let overlappedWith = null;
    let draggedBoxForCheck = { ...currentDraggedNodeBox, x: currentPosition.x, y: currentPosition.y };

    for (const otherBox of allOtherNodeBoxes) {
      if (doNodesOverlap(draggedBoxForCheck, otherBox)) {
        isOverlappingGlobal = true;
        overlappedWith = otherBox;
        break;
      }
    }
    if (isOverlappingGlobal && overlappedWith) {
      const overlapCenterX = overlappedWith.x + overlappedWith.width / 2;
      const overlapCenterY = overlappedWith.y + overlappedWith.height / 2;
      const draggedCenterX = currentPosition.x + draggedBoxForCheck.width / 2;
      const draggedCenterY = currentPosition.y + draggedBoxForCheck.height / 2;
      const deltaX = draggedCenterX - overlapCenterX;
      const deltaY = draggedCenterY - overlapCenterY;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        currentPosition.x += (deltaX > 0 ? DRAG_NUDGE_AMOUNT : -DRAG_NUDGE_AMOUNT);
      } else {
        currentPosition.y += (deltaY > 0 ? DRAG_NUDGE_AMOUNT : -DRAG_NUDGE_AMOUNT);
      }
    } else {
      break;
    }
  }

  // The style update here is primarily for immediate visual feedback if renderMindmap was slow.
  // However, renderMindmap will be called right after and is the source of truth for positioning.
  // draggedNodeElement.style.left = currentPosition.x + 'px';
  // draggedNodeElement.style.top = currentPosition.y + 'px';

  const nodeData = findNodeById(mindmapData.root, draggedNodeId);
  if (nodeData) {
    nodeData.x = currentPosition.x;
    nodeData.y = currentPosition.y;
  }
  saveMindmapToLocalStorage();
  renderMindmap(mindmapData, 'mindmap-container');
  isDragging = false;
  draggedNodeElement = null;
  draggedNodeId = null;
}

function renderMindmap(data, containerId) {
  const container = document.getElementById(containerId);
  if (!container) { console.error("Mindmap container not found!"); return; }

  let svgLayerElement = container.querySelector('#mindmap-svg-layer');
  // Clear only node elements, not the SVG layer itself
  const existingNodes = container.querySelectorAll('.mindmap-node');
  existingNodes.forEach(node => node.remove());

  if (!svgLayerElement) { // If it wasn't found (e.g. first render or was removed by full container.innerHTML)
    svgLayerElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgLayerElement.id = 'mindmap-svg-layer';
    container.insertBefore(svgLayerElement, container.firstChild); // Insert SVG layer before any nodes
  }
  svgLayer = svgLayerElement; // Update global reference
  clearSvgLayer(); // Clear previous lines from SVG layer


  const rootNodeElement = createNodeElement(data.root);
  rootNodeElement.style.position = 'absolute';
  if (typeof data.root.x === 'number' && typeof data.root.y === 'number') {
    rootNodeElement.style.left = data.root.x + 'px';
    rootNodeElement.style.top = data.root.y + 'px';
  } else {
    rootNodeElement.style.left = '50px';
    rootNodeElement.style.top = '50px';
    if (data.root.x === undefined || data.root.y === undefined) {
        data.root.x = 50;
        data.root.y = 50;
    }
  }
  container.appendChild(rootNodeElement);

  const globalRootBox = getBoundingBox(rootNodeElement, mindmapContainer);
  if (globalRootBox) {
    data.root.width = globalRootBox.width; // Update width/height based on rendered size
    data.root.height = globalRootBox.height;
    // data.root.x and data.root.y are already global, so no need to update them from globalRootBox here
    // unless there's a discrepancy we want to correct, but style should match data.
  }

  if (data.root.children && data.root.children.length > 0) {
    let childrenContainer = rootNodeElement.querySelector('.mindmap-children-container');
    if (!childrenContainer) {
        childrenContainer = document.createElement('div');
        childrenContainer.classList.add('mindmap-children-container');
        rootNodeElement.appendChild(childrenContainer);
    }

    const verticalBranchSpacing = 50;
    const estimatedNodeHeight = data.root.height || 50;
    const estimatedChildrenAreaHeight = 100;
    let currentGlobalYForBranch = (data.root.y || 50) + estimatedNodeHeight + verticalBranchSpacing;
    const horizontalIndentForBranch = (data.root.x || 50) + (data.root.width ? data.root.width / 4 : 20);

    data.root.children.forEach(rootChildData => {
      if (typeof rootChildData.x !== 'number' || typeof rootChildData.y !== 'number') {
        rootChildData.x = horizontalIndentForBranch;
        rootChildData.y = currentGlobalYForBranch;

        const selfHeight = rootChildData.height || 50; // Use self estimate if available
        const childrenHeightEstimate = (rootChildData.children && rootChildData.children.length > 0 && !rootChildData.isCollapsed) ? estimatedChildrenAreaHeight : 0;
        currentGlobalYForBranch += selfHeight + childrenHeightEstimate + verticalBranchSpacing;
      } else {
        const selfHeight = rootChildData.height || 50;
        const childrenHeightEstimate = (rootChildData.children && rootChildData.children.length > 0 && !rootChildData.isCollapsed) ? estimatedChildrenAreaHeight : 0;
        const draggedBranchBottom = rootChildData.y + selfHeight + childrenHeightEstimate;
        currentGlobalYForBranch = Math.max(currentGlobalYForBranch, draggedBranchBottom + verticalBranchSpacing);
      }
    });

    if (!data.root.isCollapsed) {
        renderChildren(data.root.children, rootNodeElement, mindmapContainer);
    }
  }

  requestAnimationFrame(() => {
    clearSvgLayer();
    const rootElementForLines = container.querySelector(`.mindmap-node[data-id='${data.root.id}']`);
    if (rootElementForLines && svgLayer) {
      traverseAndDrawLines(rootElementForLines);
    }
  });
}

function clearSvgLayer() {
  if (svgLayer) {
    while (svgLayer.firstChild) {
      svgLayer.removeChild(svgLayer.firstChild);
    }
  }
}

function drawConnectionLine(parentElement, childElement) {
  if (!svgLayer || !parentElement || !childElement) return;
  const mindmapContainerElem = document.getElementById('mindmap-container');
  if (!mindmapContainerElem) return;

  const containerRect = mindmapContainerElem.getBoundingClientRect();
  const scrollLeft = mindmapContainerElem.scrollLeft;
  const scrollTop = mindmapContainerElem.scrollTop;

  const parentRect = parentElement.getBoundingClientRect();
  const childRect = childElement.getBoundingClientRect();

  const startX = (parentRect.right - containerRect.left) + scrollLeft;
  const startY = (parentRect.top + parentRect.height / 2 - containerRect.top) + scrollTop;
  const endX = (childRect.left - containerRect.left) + scrollLeft;
  const endY = (childRect.top + childRect.height / 2 - containerRect.top) + scrollTop;

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const controlOffsetX = Math.max(50, Math.abs(endX - startX) * 0.4);
  const c1X = startX + controlOffsetX;
  const c1Y = startY;
  const c2X = endX - controlOffsetX;
  const c2Y = endY;
  const pathData = `M ${startX} ${startY} C ${c1X} ${c1Y}, ${c2X} ${c2Y}, ${endX} ${endY}`;
  path.setAttribute('d', pathData);
  path.setAttribute('stroke', '#555');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('fill', 'none');
  svgLayer.appendChild(path);
}

function traverseAndDrawLines(nodeElement) {
  if (!nodeElement || !findNodeById) return;
  const nodeId = nodeElement.getAttribute('data-id');
  if (!nodeId) return;

  const nodeData = findNodeById(mindmapData.root, nodeId);

  if (nodeData && nodeData.children && nodeData.children.length > 0 && !nodeData.isCollapsed) {
    const childrenContainer = nodeElement.querySelector('.mindmap-children-container');
    if (childrenContainer) {
      const childNodeElements = Array.from(childrenContainer.children).filter(el => el.matches('.mindmap-node'));
      childNodeElements.forEach(childElement => {
        if (childElement.classList.contains('mindmap-node')) {
            drawConnectionLine(nodeElement, childElement);
            traverseAndDrawLines(childElement);
        }
      });
    }
  }
}

function renderChildren(childrenData, parentNodeElement, mainMindmapContainer) {
  const childrenContainer = parentNodeElement.querySelector('.mindmap-children-container');
  if (!childrenContainer) {
    console.error("Critical: .mindmap-children-container missing in parent for renderChildren:", parentNodeElement);
    return;
  }
  childrenContainer.innerHTML = '';

  let placedSiblingBoxesLocal = [];
  let currentXLocal = 10;
  let currentYLocal = 10;
  let maxChildHeightInRow = 0;
  const horizontalSpacing = 25;
  const nudgeAmount = 10;
  const maxNudges = 50;

  childrenData.forEach(childData => {
    const childNodeElement = createNodeElement(childData);
    childrenContainer.appendChild(childNodeElement);

    childNodeElement.style.position = 'absolute';
    let actualRelativeX, actualRelativeY;

    if (typeof childData.x === 'number' && typeof childData.y === 'number') {
      const childrenContainerGlobalBox = getBoundingBox(childrenContainer, mainMindmapContainer);
      if (childrenContainerGlobalBox) {
        actualRelativeX = childData.x - childrenContainerGlobalBox.x;
        actualRelativeY = childData.y - childrenContainerGlobalBox.y;

        currentXLocal = Math.max(currentXLocal, actualRelativeX + childNodeElement.offsetWidth + horizontalSpacing);
        maxChildHeightInRow = Math.max(maxChildHeightInRow, (actualRelativeY - currentYLocal) + childNodeElement.offsetHeight );

      } else {
        console.error("Could not get childrenContainer global box for positioning child:", childData.id);
        actualRelativeX = currentXLocal;
        actualRelativeY = currentYLocal;
        currentXLocal += childNodeElement.offsetWidth + horizontalSpacing;
        maxChildHeightInRow = Math.max(maxChildHeightInRow, childNodeElement.offsetHeight);
      }
      placedSiblingBoxesLocal.push({
            x: actualRelativeX, y: actualRelativeY,
            width: childNodeElement.offsetWidth, height: childNodeElement.offsetHeight,
            id: childData.id
      });
    } else {
      actualRelativeY = currentYLocal;
      childNodeElement.style.top = actualRelativeY + 'px';

      let overlapResolved = false;
      let tempCurrentX = currentXLocal;
      let nudges = 0;

      do {
        const currentChildBoxLocal = {
            x: tempCurrentX, y: actualRelativeY,
            width: childNodeElement.offsetWidth, height: childNodeElement.offsetHeight,
            id: childData.id
        };
        let isOverlapping = false;
        for (const siblingBoxLocal of placedSiblingBoxesLocal) {
            if (doNodesOverlap(currentChildBoxLocal, siblingBoxLocal)) {
                isOverlapping = true;
                break;
            }
        }
        if (isOverlapping) {
          tempCurrentX += nudgeAmount;
          nudges++;
        } else {
          overlapResolved = true;
        }
      } while (!overlapResolved && nudges < maxNudges);

      if (nudges >= maxNudges) console.warn("Max nudges reached for node (algorithmic):", childData.text);
      actualRelativeX = tempCurrentX;

      placedSiblingBoxesLocal.push({
          x: actualRelativeX, y: actualRelativeY,
          width: childNodeElement.offsetWidth, height: childNodeElement.offsetHeight,
          id: childData.id
      });
      currentXLocal = actualRelativeX + childNodeElement.offsetWidth + horizontalSpacing;
      maxChildHeightInRow = Math.max(maxChildHeightInRow, childNodeElement.offsetHeight);
    }

    childNodeElement.style.left = actualRelativeX + 'px';
    childNodeElement.style.top = actualRelativeY + 'px';

    // After child is positioned, update its global data fields
    const globalChildBox = getBoundingBox(childNodeElement, mainMindmapContainer);
    if (globalChildBox) {
        childData.x = globalChildBox.x;
        childData.y = globalChildBox.y;
        childData.width = globalChildBox.width;
        childData.height = globalChildBox.height;
    }

    if (childData.children && childData.children.length > 0) {
      let grandChildrenContainer = childNodeElement.querySelector('.mindmap-children-container');
      if (!grandChildrenContainer) {
          grandChildrenContainer = document.createElement('div');
          grandChildrenContainer.classList.add('mindmap-children-container');
          childNodeElement.appendChild(grandChildrenContainer);
      }
      if (!childData.isCollapsed) {
          renderChildren(childData.children, childNodeElement, mainMindmapContainer);
      }
    }
  });

  if (childrenData.length > 0) {
    childrenContainer.style.height = (currentYLocal + maxChildHeightInRow + 10) + 'px';
  } else {
    childrenContainer.style.height = 'auto';
  }
}
