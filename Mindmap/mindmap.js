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
    isManuallyPositioned: false,
    children: [
      { id: 'child1', text: 'Child 1', notes: '', table: null, image: null, chart: null, children: [], isManuallyPositioned: false },
      { id: 'child2', text: 'Child 2', notes: 'Initial notes.', table: null, image: null, chart: null, children: [
        { id: 'grandchild21', text: 'Grandchild 2.1', notes: '', table: null, image: null, chart: null, children: [], isManuallyPositioned: false }
      ],isManuallyPositioned: false },
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
          mindmapData.root.isManuallyPositioned = false;
      }
    }
  } catch (e) {
    console.error('Error loading from local storage:', e);
    showFeedback('Could not load data from local storage. Starting fresh.', true);
     if (!mindmapData.root.x || !mindmapData.root.y) {
        mindmapData.root.x = 50;
        mindmapData.root.y = 50;
        mindmapData.root.isManuallyPositioned = false;
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
            x: 50, y: 50, isManuallyPositioned: false
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
        x: 50, y: 50, isManuallyPositioned: false,
        image: {src: 'https://via.placeholder.com/120/007bff/ffffff?text=Server+Image', alt:'Server Image'},
        children: [
          { id: generateNodeId(), text: 'Server Child 1', children: [], isManuallyPositioned: false },
          { id: generateNodeId(), text: 'Server Child 2', notes: 'Has server notes!', children: [], isManuallyPositioned: false }
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

// --- Layout & Dimension Calculation ---
function getOrCreateTempMeasurementContainer() {
  let container = document.getElementById('mindmap-temp-measurement-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'mindmap-temp-measurement-container';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.visibility = 'hidden';
    document.body.appendChild(container);
  }
  return container;
}

function calculateAndStoreNodeDimensions(nodeData, tempContainer) {
  const tempNodeElement = createNodeElement(nodeData); // createNodeElement should not append to main DOM
  tempContainer.innerHTML = '';
  tempContainer.appendChild(tempNodeElement);

  nodeData.width = tempNodeElement.offsetWidth;
  nodeData.height = tempNodeElement.offsetHeight;

  if (nodeData.children && nodeData.children.length > 0) {
    nodeData.children.forEach(child => calculateAndStoreNodeDimensions(child, tempContainer));
  }
}

function calculateTreeLayout(rootNodeData, mindmapContainerWidth) {
  console.log("Calculating tree layout for root:", rootNodeData.id, "within width:", mindmapContainerWidth);
  const initialYOffset = 50;
  const levelSeparation = 75;
  const siblingSeparation = 30;

  // 1. Assign Levels and Y-coordinates using BFS
  if (!rootNodeData) return;

  let nodesByLevel = {};
  let q = [];

  rootNodeData.level = 0;
  q.push(rootNodeData);

  let maxLevel = 0;

  while(q.length > 0) {
      const currentNode = q.shift();
      if (!nodesByLevel[currentNode.level]) {
          nodesByLevel[currentNode.level] = [];
      }
      nodesByLevel[currentNode.level].push(currentNode);
      maxLevel = Math.max(maxLevel, currentNode.level);

      if (currentNode.children) {
          currentNode.children.forEach(child => {
              child.level = currentNode.level + 1;
              q.push(child);
          });
      }
  }

  let currentY = initialYOffset;
  for (let i = 0; i <= maxLevel; i++) {
      if (!nodesByLevel[i] || nodesByLevel[i].length === 0) continue;

      let maxHeightInLevel = 0;
      nodesByLevel[i].forEach(node => {
          if (!node.isManuallyPositioned || typeof node.y !== 'number') {
              node.y = currentY;
          } else {
            // If manually positioned, its Y might influence currentY for this level if it's lower
            currentY = Math.max(currentY, node.y);
            // Then ensure this node also uses this possibly updated currentY if it was the one pushing it down
            if (node.y < currentY) node.y = currentY;
          }
          maxHeightInLevel = Math.max(maxHeightInLevel, node.height || 50);
      });
      currentY += maxHeightInLevel + levelSeparation;
  }

  // 2. Assign X-coordinates recursively
  function assignAlgorithmicXRecursive(parentNodeData) {
    if (!parentNodeData.children || parentNodeData.children.length === 0) {
      return;
    }

    const algoChildren = parentNodeData.children.filter(
      child => !(child.isManuallyPositioned && typeof child.x === 'number')
    );

    if (algoChildren.length > 0) {
      const totalAlgoChildrenWidth = algoChildren.reduce((sum, child) => sum + (child.width || 50), 0) +
                                   (Math.max(0, algoChildren.length - 1) * siblingSeparation);

      let currentXForAlgoBlock = (parentNodeData.x + (parentNodeData.width || 50) / 2) - totalAlgoChildrenWidth / 2;

      algoChildren.forEach(child => {
        child.x = currentXForAlgoBlock;
        currentXForAlgoBlock += (child.width || 50) + siblingSeparation;
      });
    }

    parentNodeData.children.forEach(child => {
      assignAlgorithmicXRecursive(child);
    });
  }

  if (!rootNodeData.isManuallyPositioned || typeof rootNodeData.x !== 'number') {
    rootNodeData.x = (mindmapContainerWidth / 2) - (rootNodeData.width || 50) / 2;
  }
  if (typeof rootNodeData.y !== 'number') { // Ensure root Y is set if it was 'isManuallyPositioned' but Y was missing
      rootNodeData.y = initialYOffset;
  }

  assignAlgorithmicXRecursive(rootNodeData);
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
  const newNode = {
    id: generateNodeId(), text: text, notes: '', children: [],
    isManuallyPositioned: false // New nodes are not manually positioned
  };
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

  const nodeData = findNodeById(mindmapData.root, draggedNodeId);
  if (nodeData) {
    nodeData.x = currentPosition.x;
    nodeData.y = currentPosition.y;
    nodeData.isManuallyPositioned = true; // Mark as manually positioned
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

  // 1. Ensure all node dimensions are calculated and stored in nodeData
  const tempContainer = getOrCreateTempMeasurementContainer();
  calculateAndStoreNodeDimensions(data.root, tempContainer);

  // 2. Calculate tree layout (populates nodeData.x and nodeData.y for all nodes)
  if (mindmapContainer) {
        calculateTreeLayout(data.root, mindmapContainer.offsetWidth);
  } else {
      console.error("mindmapContainer DOM element not found for layout calculation.");
      calculateTreeLayout(data.root, 600); // Fallback width
  }

  let svgLayerElement = container.querySelector('#mindmap-svg-layer');
  const existingNodes = container.querySelectorAll('.mindmap-node');
  existingNodes.forEach(node => node.remove());

  if (!svgLayerElement) {
    svgLayerElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgLayerElement.id = 'mindmap-svg-layer';
    container.insertBefore(svgLayerElement, container.firstChild);
  }
  svgLayer = svgLayerElement;
  clearSvgLayer();


  const rootNodeElement = createNodeElement(data.root);
  rootNodeElement.style.position = 'absolute';
  rootNodeElement.style.left = (data.root.x || 50) + 'px';
  rootNodeElement.style.top = (data.root.y || 50) + 'px';

  container.appendChild(rootNodeElement);

  // Update global dimensions for root again AFTER it's in the main DOM and styled
  const finalRootBox = getBoundingBox(rootNodeElement, mindmapContainer);
  if (finalRootBox) {
    data.root.width = finalRootBox.width;
    data.root.height = finalRootBox.height;
  }


  if (data.root.children && data.root.children.length > 0) {
    let childrenContainer = rootNodeElement.querySelector('.mindmap-children-container');
    if (!childrenContainer) {
        childrenContainer = document.createElement('div');
        childrenContainer.classList.add('mindmap-children-container');
        rootNodeElement.appendChild(childrenContainer);
    }
    // Vertical stacking for root's children was already handled by calculateTreeLayout setting their global Y
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

    if (childData.isManuallyPositioned && typeof childData.x === 'number' && typeof childData.y === 'number') {
      const childrenContainerGlobalBox = getBoundingBox(childrenContainer, mainMindmapContainer);
      if (childrenContainerGlobalBox) {
        actualRelativeX = childData.x - childrenContainerGlobalBox.x;
        actualRelativeY = childData.y - childrenContainerGlobalBox.y;

        currentXLocal = Math.max(currentXLocal, actualRelativeX + (childData.width || childNodeElement.offsetWidth) + horizontalSpacing);
        maxChildHeightInRow = Math.max(maxChildHeightInRow, (actualRelativeY - currentYLocal) + (childData.height || childNodeElement.offsetHeight) );

      } else {
        console.error("Could not get childrenContainer global box for positioning child:", childData.id);
        actualRelativeX = currentXLocal;
        actualRelativeY = currentYLocal;
        maxChildHeightInRow = Math.max(maxChildHeightInRow, (childData.height || childNodeElement.offsetHeight));
        currentXLocal += (childData.width || childNodeElement.offsetWidth) + horizontalSpacing;
      }
      placedSiblingBoxesLocal.push({
            x: actualRelativeX, y: actualRelativeY,
            width: (childData.width || childNodeElement.offsetWidth), height: (childData.height || childNodeElement.offsetHeight),
            id: childData.id
      });
    } else {
      // Algorithmic placement: X is determined by this function, Y by calculateTreeLayout (converted to local)
      const childrenContainerGlobalBox = getBoundingBox(childrenContainer, mainMindmapContainer);
      if (childrenContainerGlobalBox && typeof childData.y === 'number') { // childData.y is global from layout
          actualRelativeY = childData.y - childrenContainerGlobalBox.y;
      } else {
          actualRelativeY = currentYLocal; // Fallback if global Y somehow not set
          if(typeof childData.y !== 'number') childData.y = actualRelativeY + (childrenContainerGlobalBox ? childrenContainerGlobalBox.y : 0); // Store an estimated global Y
      }
      childNodeElement.style.top = actualRelativeY + 'px';

      let overlapResolved = false;
      let tempCurrentX = currentXLocal;
      let nudges = 0;

      do {
        const currentChildBoxLocal = {
            x: tempCurrentX, y: actualRelativeY,
            width: (childData.width || childNodeElement.offsetWidth), height: (childData.height || childNodeElement.offsetHeight),
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
          width: (childData.width || childNodeElement.offsetWidth), height: (childData.height || childNodeElement.offsetHeight),
          id: childData.id
      });
      currentXLocal = actualRelativeX + (childData.width || childNodeElement.offsetWidth) + horizontalSpacing;
      maxChildHeightInRow = Math.max(maxChildHeightInRow, (childData.height || childNodeElement.offsetHeight));

      // Store the calculated global X for this algorithmically placed node
      if (childrenContainerGlobalBox) {
        childData.x = actualRelativeX + childrenContainerGlobalBox.x;
      } else {
        childData.x = actualRelativeX; // Fallback, less accurate
      }
    }

    childNodeElement.style.left = actualRelativeX + 'px';
    childNodeElement.style.top = actualRelativeY + 'px';

    // After child is positioned, update its global data fields (width/height might have changed slightly if content wrapped)
    const globalChildBox = getBoundingBox(childNodeElement, mainMindmapContainer);
    if (globalChildBox) {
        childData.width = globalChildBox.width; // Re-capture final width/height
        childData.height = globalChildBox.height;
        // childData.x and childData.y should already be global from logic above or drag
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
    // Adjust height based on the maximum extent of children, considering their individual Ys
    let maxBottom = 0;
    placedSiblingBoxesLocal.forEach(box => {
        maxBottom = Math.max(maxBottom, box.y + box.height);
    });
    childrenContainer.style.height = (maxBottom + 10) + 'px'; // 10 for bottom padding
  } else {
    childrenContainer.style.height = 'auto';
  }
}
