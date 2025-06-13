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
    setTimeout(() => { feedbackElement.style.display = 'none'; }, 4000); // Extended display time
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
    }
  } catch (e) {
    console.error('Error loading from local storage:', e);
    showFeedback('Could not load data from local storage. Starting fresh.', true);
  }
  renderMindmap(mindmapData, 'mindmap-container');
}

function clearLocalStorage() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    showFeedback('Local mindmap data cleared. Default map loaded.', false);
    console.log('Local storage cleared for mindmap data.');
    mindmapData = { root: { id: 'root', text: 'Default Root', notes:'Cleared local data', children: [] } };
    nodeIdCounter = 0;
    renderMindmap(mindmapData, 'mindmap-container');
  } catch (e) {
    console.error('Error clearing local storage:', e);
    showFeedback('Error clearing local data.', true);
  }
}

// --- SIMULATED SERVER INTERACTION ---
// The following functions simulate communication with a backend server.
// For actual database persistence, these would need to be replaced with
// real API calls (e.g., using fetch) to corresponding backend endpoints.

async function saveMindmapToServer(mindmapId = 'default-map-id') {
  const jsonData = getMindmapDataAsJSON();
  // This is a conceptual API endpoint. In a real application, this would be an actual URL.
  const conceptualEndpoint = `/api/mindmap/save`;
  console.log(`Simulating SAVE to conceptual endpoint: ${conceptualEndpoint} for mindmapId: ${mindmapId}`);
  // The 'isServerSim = true' flag in showFeedback prefixes the message with "(Simulated Server) ".
  showFeedback(`Attempting to save mindmap "${mindmapId}" to server...`, false, true);

  try {
    // --- SIMULATED NETWORK DELAY ---
    // In a real application, replace this with an actual `fetch` call:
    // const response = await fetch(conceptualEndpoint, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ mindmapId, mindmapData: JSON.parse(jsonData) })
    // });
    // if (!response.ok) throw new Error(`Server responded with ${response.status}`);
    // const result = await response.json();
    // console.log("Simulated server response:", result);
    // showFeedback(`Mindmap "${mindmapId}" saved to server. ID: ${result.id || mindmapId}`, false, true);

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating network latency

    // --- END OF SIMULATED NETWORK DELAY ---

    const simulatedServerResponse = { success: true, savedId: mindmapId, timestamp: Date.now() };
    console.log("Simulated server success response:", simulatedServerResponse);
    // Message already clearly indicates simulation via showFeedback's prefix.
    showFeedback(`Mindmap "${mindmapId}" saved. (Simulated server ID: ${simulatedServerResponse.savedId})`, false, true);

  } catch (error) {
    console.error("Simulated server save error:", error);
    showFeedback(`Failed to save mindmap "${mindmapId}" to server. ${error.message}`, true, true);
  }
}

async function loadMindmapFromServer(mindmapId = 'sample-map-from-server') {
  // This is a conceptual API endpoint. In a real application, this would be an actual URL.
  const conceptualEndpoint = `/api/mindmap/load/${mindmapId}`;
  console.log(`Simulating LOAD from conceptual endpoint: ${conceptualEndpoint}`);
  // The 'isServerSim = true' flag in showFeedback prefixes the message with "(Simulated Server) ".
  showFeedback(`Attempting to load mindmap "${mindmapId}" from server...`, false, true);

  try {
    // --- SIMULATED NETWORK DELAY ---
    // In a real application, replace this with an actual `fetch` call:
    // const response = await fetch(conceptualEndpoint);
    // if (!response.ok) throw new Error(`Server responded with ${response.status}`);
    // const loadedDataFromServer = await response.json();
    // if (loadedDataFromServer && loadedDataFromServer.root) {
    //   mindmapData = loadedDataFromServer;
    //   /* ... rest of update ... */
    // } else { throw new Error("Invalid data from server."); }

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating network latency
    // --- END OF SIMULATED NETWORK DELAY ---

    // Sample data structure for simulation
    const sampleServerData = {
      root: {
        id: 'server-root', text: `Loaded: ${mindmapId}`, notes: 'This data came from a (simulated) server.',
        image: {src: 'https://via.placeholder.com/120/007bff/ffffff?text=Server+Image', alt:'Server Image'},
        children: [
          { id: generateNodeId(), text: 'Server Child 1', children: [] },
          { id: generateNodeId(), text: 'Server Child 2', notes: 'Has server notes!', children: [] }
        ]
      }
    };
    // const loadedDataFromServer = JSON.parse(sampleJsonStringFromServer); // If it was a string

    if (sampleServerData && sampleServerData.root) {
      mindmapData = sampleServerData;
      nodeIdCounter = Date.now(); // Reset counter
      renderMindmap(mindmapData, 'mindmap-container');
      saveMindmapToLocalStorage(); // Also save to local storage after loading from server
      // Message already clearly indicates simulation via showFeedback's prefix.
      showFeedback(`Mindmap "${mindmapId}" loaded from server successfully.`, false, true);
      console.log("Simulated server load successful. Data:", mindmapData);
    } else {
      throw new Error("Invalid data format from server.");
    }
  } catch (error) {
    console.error("Simulated server load error:", error);
    showFeedback(`Failed to load mindmap "${mindmapId}" from server. ${error.message}`, true, true);
  }
}


document.addEventListener('DOMContentLoaded', () => {
  loadMindmapFromLocalStorage();

  const addNodeBtn = document.getElementById('add-node-btn');
  const nodeTextInput = document.getElementById('node-text-input');
  const saveLocallyBtn = document.getElementById('save-locally-btn');
  const saveToServerBtn = document.getElementById('save-to-server-btn');
  const clearLocalBtn = document.getElementById('clear-local-storage-btn');
  const loadFromServerBtn = document.getElementById('load-from-server-btn');
  const importFileInput = document.getElementById('import-file-input');
  const exportJsonBtn = document.getElementById('export-json-btn');
  svgLayer = document.getElementById('mindmap-svg-layer');

  const mindmapContainer = document.getElementById('mindmap-container');
  function updateContainerRect() {
    if (mindmapContainer) { // Ensure container exists
        mindmapContainerRect = mindmapContainer.getBoundingClientRect();
    }
  }
  updateContainerRect(); // Initial call
  window.addEventListener('resize', updateContainerRect); // Update on resize


  if (addNodeBtn) addNodeBtn.addEventListener('click', () => {
    const text = nodeTextInput.value.trim();
    if (text) { addNode('root', text); nodeTextInput.value = ''; }
    else { alert('Please enter text for the node.'); }
  });

  if (saveLocallyBtn) saveLocallyBtn.addEventListener('click', () => {
    saveMindmapToLocalStorage();
    showFeedback('Mindmap explicitly saved locally!', false);
  });

  if (saveToServerBtn) saveToServerBtn.addEventListener('click', () => {
    saveMindmapToServer('user123-map-alpha'); // Example ID
  });

  if (loadFromServerBtn) loadFromServerBtn.addEventListener('click', () => {
    loadMindmapFromServer('official-sample-map'); // Example ID
  });

  if (clearLocalBtn) clearLocalBtn.addEventListener('click', clearLocalStorage);

  if (importFileInput) importFileInput.addEventListener('change', handleFileUpload);
  if (exportJsonBtn) exportJsonBtn.addEventListener('click', handleExportMindmapAsJson);
});

// --- File Export Logic ---
function handleExportMindmapAsJson() {
  try {
    const mindmapJsonString = JSON.stringify(mindmapData, null, 2); // Pretty print JSON
    const blob = new Blob([mindmapJsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);

    // Create a filename, e.g., based on root node text or a default
    let filename = 'mindmap.json';
    if (mindmapData && mindmapData.root && mindmapData.root.text) {
      // Sanitize the root text to create a safe filename
      const safeFilename = mindmapData.root.text.replace(/[^a-z0-9_\-\.]/gi, '_').substring(0, 50);
      if (safeFilename) { // Ensure safeFilename is not empty after sanitization
        filename = `${safeFilename}.json`;
      }
    }

    link.setAttribute('download', filename);

    // Append link to the body, click it, and remove it (standard practice for triggering download)
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url); // Clean up the object URL
    showFeedback('Mindmap data prepared for download as ' + filename, false);
  } catch (error) {
    console.error('Error exporting mindmap as JSON:', error);
    showFeedback('Could not export mindmap. An error occurred.', true);
  }
}

// --- File Import Logic ---
function handleFileUpload(event) {
  const file = event.target.files[0];
  const importFileInput = document.getElementById('import-file-input'); // Get ref for resetting

  if (!file) {
    return; // No file selected
  }

  if (file.type !== "application/json") {
    showFeedback("Please select a valid JSON file (.json).", true);
    if (importFileInput) importFileInput.value = ''; // Reset file input
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const jsonText = e.target.result;
      const loadedData = JSON.parse(jsonText);

      // Basic validation: Check for root and some essential property like text
      if (loadedData && loadedData.root && typeof loadedData.root.text !== 'undefined') {
        mindmapData = loadedData;
        nodeIdCounter = Date.now(); // Reset counter to avoid potential ID issues with imported data
        renderMindmap(mindmapData, 'mindmap-container');
        saveMindmapToLocalStorage(); // Save the newly imported map to local storage
        showFeedback('Mindmap loaded successfully from file!', false);
      } else {
        showFeedback('Invalid mindmap file format. Missing root node or essential data.', true);
      }
    } catch (error) {
      console.error('Error parsing JSON file:', error);
      showFeedback('Error reading or parsing the mindmap file. Ensure it is valid JSON.', true);
    } finally {
      // Reset the file input to allow re-uploading the same file if needed,
      // or if the user cancels and then wants to upload again.
      if (importFileInput) importFileInput.value = '';
    }
  };

  reader.onerror = () => {
    console.error('Error reading file.');
    showFeedback('An error occurred while trying to read the file.', true);
    if (importFileInput) importFileInput.value = ''; // Reset file input on error
  };

  reader.readAsText(file);
}

// --- Utility Functions ---
/**
 * Calculates the bounding box of a node element relative to its offsetParent.
 * Assumes nodeElement is positioned absolutely or relatively within a container
 * that serves as the coordinate system for layout (e.g., #mindmap-container or .mindmap-children-container).
 * @param {HTMLElement} nodeElement The DOM element of the node.
 * @returns {object} An object { x, y, width, height, id }.
 */
function getBoundingBox(nodeElement) {
  if (!nodeElement) return null;
  return {
    x: nodeElement.offsetLeft,
    y: nodeElement.offsetTop,
    width: nodeElement.offsetWidth,
    height: nodeElement.offsetHeight,
    id: nodeElement.dataset.id
  };
}

/**
 * Checks if two rectangular boxes overlap.
 * @param {object} box1 - An object with { x, y, width, height }.
 * @param {object} box2 - An object with { x, y, width, height }.
 * @returns {boolean} True if the rectangles overlap, false otherwise.
 */
function doNodesOverlap(box1, box2) {
  if (!box1 || !box2) return false;

  // Check if one rectangle is entirely to the side of the other
  if (box1.x + box1.width <= box2.x || box2.x + box2.width <= box1.x) {
    return false;
  }
  // Check if one rectangle is entirely above or below the other
  if (box1.y + box1.height <= box2.y || box2.y + box2.height <= box1.y) {
    return false;
  }
  // If neither of the above (no overlap) conditions are met, they overlap
  return true;
}


// --- Core Mindmap Logic (adapted for auto-save) ---
// ... (All existing functions: findNodeById, findParentNode, addNode, deleteNode, editNodeText, etc.)
// ... (These functions should continue to call saveMindmapToLocalStorage() for auto-save)

function findNodeById(node, id) { /* ... unchanged ... */
    if (node.id === id) return node;
    if (node.children) {
        for (const child of node.children) {
            const found = findNodeById(child, id);
            if (found) return found;
        }
    }
    return null;
}
function findParentNode(node, childId) { /* ... unchanged ... */
    if (node.children) {
        for (const child of node.children) {
            if (child.id === childId) return node;
            const foundParent = findParentNode(child, childId);
            if (foundParent) return foundParent;
        }
    }
    return null;
}
function addNode(parentId, text) { /* ... unchanged ... calls saveMindmapToLocalStorage() ... */
  const parentNode = findNodeById(mindmapData.root, parentId);
  if (!parentNode) return;
  if (!parentNode.children) {
    parentNode.children = [];
  }

  const hadNoChildren = parentNode.children.length === 0;

  const newNode = {
    id: generateNodeId(), text: text, notes: '', table: null, image: null, chart: null, children: [],
    // New nodes with children should default to expanded, so isCollapsed is not set to true here
  };
  parentNode.children.push(newNode);

  if (hadNoChildren && parentNode.children.length === 1) {
    // If parent had no children and now has one, ensure it's expanded to show the new child.
    // If isCollapsed was undefined, it's treated as false (expanded), so this handles cases where it might have been true.
    parentNode.isCollapsed = false;
  }

  renderMindmap(mindmapData, 'mindmap-container');
  saveMindmapToLocalStorage();
}
function deleteNode(nodeId) { /* ... unchanged ... calls saveMindmapToLocalStorage() ... */
  if (nodeId === 'root') { alert("Cannot delete root."); return; }
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
function editNodeText(nodeId, newText) { /* ... unchanged ... calls saveMindmapToLocalStorage() ... */
  const node = findNodeById(mindmapData.root, nodeId);
  if (node) {
    node.text = newText;
    renderMindmap(mindmapData, 'mindmap-container');
    saveMindmapToLocalStorage();
  }
}
function addOrEditNote(nodeId) { /* ... unchanged ... calls saveMindmapToLocalStorage() ... */
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
function addOrEditTable(nodeId) { /* ... unchanged ... calls saveMindmapToLocalStorage() if changed ... */
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
function addOrEditImage(nodeId) { /* ... unchanged ... calls saveMindmapToLocalStorage() if changed ... */
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
function addOrEditChart(nodeId) { /* ... unchanged ... calls saveMindmapToLocalStorage() if changed ... */
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
  if (labels.length > 0 && values.length > 0 && labels.length === values.length) {
    node.chart = { type, title: title.trim(), labels, values };
    changed = true;
  } else if (labels.length === 0 && values.length === 0 && type) {
    node.chart = { type, title: title.trim(), labels: [], values: [] };
    changed = true;
  } else {
    alert("Invalid chart data. Labels/values counts must match. Chart not saved.");
    if (!currentChart) node.chart = null;
  }
  if (changed) {
    renderMindmap(mindmapData, 'mindmap-container');
    saveMindmapToLocalStorage();
  }
}

// --- Rendering ---
// createNodeElement, renderMindmap, renderChildren are unchanged from previous step.
// Make sure they are present here. I'll copy the last known good versions.
function createNodeElement(nodeData) {
  const nodeElement = document.createElement('div');
  nodeElement.classList.add('mindmap-node');
  nodeElement.setAttribute('data-id', nodeData.id);
  // Note: position:absolute will be set by the layouting function (renderChildren or renderMindmap for root)

  const textElement = document.createElement('span');
  textElement.classList.add('node-text');
  textElement.textContent = nodeData.text;
  nodeElement.appendChild(textElement);

  // Add collapse/expand toggle button
  // Check if nodeData.children exists and has elements
  if (nodeData.children && nodeData.children.length > 0) {
    const toggleButton = document.createElement('span');
    toggleButton.classList.add('collapse-toggle');
    // Set initial state: if isCollapsed is undefined, treat as false (expanded)
    toggleButton.textContent = nodeData.isCollapsed ? '+' : '-';
    toggleButton.title = nodeData.isCollapsed ? 'Expand' : 'Collapse'; // Add tooltip
    toggleButton.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent node dragging or other parent events
      nodeData.isCollapsed = !nodeData.isCollapsed; // Toggle the state
      renderMindmap(mindmapData, 'mindmap-container'); // Re-render the whole mindmap
      saveMindmapToLocalStorage(); // Save state change
    });
    // Insert the toggle button before the text element for conventional UI placement
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
      // Confirmation dialog
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

  // Add mousedown event listener for dragging
  nodeElement.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return; // Only allow dragging with the primary mouse button
    onDragStart(event, nodeData.id, nodeElement);
  });

  return nodeElement;
}

function onDragStart(event, nodeId, nodeElement) {
  if (!nodeElement) return;
  isDragging = true;
  draggedNodeElement = nodeElement;
  draggedNodeId = nodeId;

  updateContainerRect(); // Refresh container dimensions and position

  const nodeRect = nodeElement.getBoundingClientRect();
  // Calculate mouse offset relative to the node's top-left corner
  // This accounts for where on the node the user clicked.
  initialMouseOffsetX = event.clientX - nodeRect.left;
  initialMouseOffsetY = event.clientY - nodeRect.top;

  // Improve visual feedback during drag
  draggedNodeElement.style.cursor = 'grabbing';
  draggedNodeElement.style.opacity = '0.8'; // Make it slightly transparent

  event.preventDefault(); // Prevent default text selection or other drag behaviors

  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
}

function onDragMove(event) {
  if (!isDragging || !draggedNodeElement || !mindmapContainerRect) return;
  event.preventDefault();

  // Calculate new position relative to the mindmap-container
  // event.clientX/Y are viewport-relative.
  // mindmapContainerRect.left/top are also viewport-relative.
  // window.scrollX/Y are needed if the *page* scrolls, not just the container.
  // If mindmap-container is the scrollable element, its own scrollLeft/Top are needed.

  let newLeft = event.clientX - initialMouseOffsetX - mindmapContainerRect.left + mindmapContainer.scrollLeft;
  let newTop = event.clientY - initialMouseOffsetY - mindmapContainerRect.top + mindmapContainer.scrollTop;

  // Boundary checks (optional, to keep node within container)
  // newLeft = Math.max(0, Math.min(newLeft, mindmapContainerRect.width - draggedNodeElement.offsetWidth));
  // newTop = Math.max(0, Math.min(newTop, mindmapContainerRect.height - draggedNodeElement.offsetHeight));


  draggedNodeElement.style.left = newLeft + 'px';
  draggedNodeElement.style.top = newTop + 'px';

  requestAnimationFrame(() => {
    clearSvgLayer();
    const rootNodeForLines = document.querySelector(`#mindmap-container > .mindmap-node[data-id='${mindmapData.root.id}']`);
    if (rootNodeForLines && svgLayer) {
        traverseAndDrawLines(rootNodeForLines);
    }
  });
}

function onDragEnd(event) {
  if (!isDragging || !draggedNodeId || !draggedNodeElement || !mindmapContainerRect) return;

  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);

  draggedNodeElement.style.cursor = 'move'; // Reset cursor
  draggedNodeElement.style.opacity = '1';   // Reset opacity

  // --- Collision Detection and Avoidance on Drag End ---
  const DRAG_NUDGE_AMOUNT = 10;
  const MAX_DRAG_NUDGES = 30;

  // Initial intended position (where the mouse was released)
  // Note: draggedNodeElement.style.left and top are already set by the last onDragMove
  // but these might be slightly different due to RAF, so recalculate from final mouse.
  // However, for simplicity and consistency with what user saw last, we can use current style.left/top
  // OR recalculate based on event - for now, let's assume onDragMove set it sufficiently.
  // The critical part is that these are relative to the *parent container* of the dragged node.
  // If draggedNodeElement is root, parent is mindmapContainer. If child, parent is a .mindmap-children-container.

  // We need the position relative to the direct positioning parent (offsetParent) for getBoundingBox
  // and for storing in nodeData (x,y should be relative to childrenContainer for children).
  let finalProposedLeft = parseFloat(draggedNodeElement.style.left);
  let finalProposedTop = parseFloat(draggedNodeElement.style.top);

  const draggedNodeWidth = draggedNodeElement.offsetWidth;
  const draggedNodeHeight = draggedNodeElement.offsetHeight;

  let currentPosition = { x: finalProposedLeft, y: finalProposedTop };
  let draggedNodeBox = {
    x: currentPosition.x, y: currentPosition.y,
    width: draggedNodeWidth, height: draggedNodeHeight,
    id: draggedNodeId
  };

  // Collect bounding boxes of all *other* nodes within the same positioning context
  // This is tricky because getBoundingBox uses offsetLeft/Top, which is relative to offsetParent.
  // We only need to check against siblings within the same childrenContainer, or all nodes if root.
  const parentOfDragged = draggedNodeElement.parentElement;
  let allOtherNodeBoxes = [];
  const potentialSiblings = parentOfDragged ? parentOfDragged.querySelectorAll('.mindmap-node') : [];

  potentialSiblings.forEach(otherNodeEl => {
    if (otherNodeEl.dataset.id !== draggedNodeId) {
      const box = getBoundingBox(otherNodeEl); // This is relative to parentOfDragged
      if (box) allOtherNodeBoxes.push(box);
    }
  });

  // If dragging the root node, check against all other top-level nodes (none in current structure, but for future)
  // For now, this primarily handles sibling collision within a childrenContainer.

  let isOverlappingGlobal = false;
  for (let nudgeCount = 0; nudgeCount < MAX_DRAG_NUDGES; nudgeCount++) {
    isOverlappingGlobal = false;
    let overlappedWith = null;
    for (const otherBox of allOtherNodeBoxes) {
      if (doNodesOverlap(draggedNodeBox, otherBox)) {
        isOverlappingGlobal = true;
        overlappedWith = otherBox;
        break;
      }
    }

    if (isOverlappingGlobal && overlappedWith) {
      const overlapCenterX = overlappedWith.x + overlappedWith.width / 2;
      const overlapCenterY = overlappedWith.y + overlappedWith.height / 2;
      const draggedCenterX = currentPosition.x + draggedNodeWidth / 2;
      const draggedCenterY = currentPosition.y + draggedNodeHeight / 2;

      const deltaX = draggedCenterX - overlapCenterX;
      const deltaY = draggedCenterY - overlapCenterY;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        currentPosition.x += (deltaX > 0 ? DRAG_NUDGE_AMOUNT : -DRAG_NUDGE_AMOUNT);
      } else {
        currentPosition.y += (deltaY > 0 ? DRAG_NUDGE_AMOUNT : -DRAG_NUDGE_AMOUNT);
      }
      draggedNodeBox.x = currentPosition.x;
      draggedNodeBox.y = currentPosition.y;
    } else {
      break;
    }
  }

  // Update node style with the final (potentially nudged) position
  draggedNodeElement.style.left = currentPosition.x + 'px';
  draggedNodeElement.style.top = currentPosition.y + 'px';

  const nodeData = findNodeById(mindmapData.root, draggedNodeId);
  if (nodeData) {
    nodeData.x = currentPosition.x; // These are relative to the node's direct container
    nodeData.y = currentPosition.y;
    // If it's the root, x/y are relative to mindmap-container.
    // If it's a child, x/y are relative to its parent's .mindmap-children-container.
    // This is consistent with how getBoundingBox and renderChildren are set up.
  }

  saveMindmapToLocalStorage();

  // Re-render to ensure all lines are correct after potential nudging,
  // especially if the nudging changed the visual position significantly from the last onDragMove.
  // This also ensures that if other nodes were algorithmically placed, they might adjust (though current algo is simple).
  renderMindmap(mindmapData, 'mindmap-container');

  isDragging = false;
  draggedNodeElement = null;
  draggedNodeId = null;
  // A final redraw of lines happens implicitly if onDragMove's last RAF call executes after this.
  // Or explicitly call renderMindmap if needed, but might be redundant if positions are directly set.
  // For now, the RAF in onDragMove should cover the final state.
}


function renderMindmap(data, containerId) {
  const container = document.getElementById(containerId);
  if (!container) { console.error("Mindmap container not found!"); return; }
  const mindmapSvgLayer = container.querySelector('#mindmap-svg-layer');
  container.innerHTML = '';
  if(mindmapSvgLayer) container.appendChild(mindmapSvgLayer);

  const rootNodeElement = createNodeElement(data.root);
  rootNodeElement.style.position = 'absolute';
  if (typeof data.root.x === 'number' && typeof data.root.y === 'number') {
    rootNodeElement.style.left = data.root.x + 'px';
    rootNodeElement.style.top = data.root.y + 'px';
  } else {
    // Default initial position for root if not dragged before
    rootNodeElement.style.left = '50px';
    rootNodeElement.style.top = '50px';
  }
  container.appendChild(rootNodeElement);

  // Create a children container for the root node if it has children
  // This container is essential for renderChildren to find and manage.
  if (data.root.children && data.root.children.length > 0) {
    let childrenContainer = rootNodeElement.querySelector('.mindmap-children-container');
    if (!childrenContainer) {
        childrenContainer = document.createElement('div');
        childrenContainer.classList.add('mindmap-children-container');
        rootNodeElement.appendChild(childrenContainer);
    }
    // Render children only if the root is not collapsed
    if (!data.root.isCollapsed) {
        renderChildren(data.root.children, rootNodeElement);
    }
  }


  // Ensure this runs after the DOM has been updated and layout computed.
  // Using requestAnimationFrame helps defer execution until the browser is ready to paint.
  requestAnimationFrame(() => {
    clearSvgLayer();
    const rootElement = document.querySelector(`#${containerId} > .mindmap-node[data-id='${data.root.id}']`);
    if (rootElement && svgLayer) { // Check svgLayer is not null
      traverseAndDrawLines(rootElement);
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
  const mindmapContainer = document.getElementById('mindmap-container');
  if (!mindmapContainer) return;

  const containerRect = mindmapContainer.getBoundingClientRect();

  // Adjust for scroll position of the container IF it's the scrolling element.
  // If body/document scrolls, window.scrollX/Y is needed.
  // Assuming mindmapContainer is the scrollable parent for node positions.
  const scrollLeft = mindmapContainer.scrollLeft;
  const scrollTop = mindmapContainer.scrollTop;

  const parentRect = parentElement.getBoundingClientRect();
  const childRect = childElement.getBoundingClientRect();

  // Connection points: Middle-right of parent to middle-left of child.
  // Calculations are relative to the viewport, then adjusted for container's viewport offset and scroll.
  const startX = (parentRect.right - containerRect.left) + scrollLeft;
  const startY = (parentRect.top + parentRect.height / 2 - containerRect.top) + scrollTop;
  const endX = (childRect.left - containerRect.left) + scrollLeft;
  const endY = (childRect.top + childRect.height / 2 - containerRect.top) + scrollTop;

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

  // Control points for a cubic Bezier curve to make it S-shaped horizontally
  // The control point offset can be a percentage of the distance or a fixed value.
  const controlOffsetX = Math.max(50, Math.abs(endX - startX) * 0.4);

  const c1X = startX + controlOffsetX;
  const c1Y = startY; // Keep Y the same for horizontal start of curve
  const c2X = endX - controlOffsetX;
  const c2Y = endY;   // Keep Y the same for horizontal end of curve

  const pathData = `M ${startX} ${startY} C ${c1X} ${c1Y}, ${c2X} ${c2Y}, ${endX} ${endY}`;

  path.setAttribute('d', pathData);
  path.setAttribute('stroke', '#555'); // Line color
  path.setAttribute('stroke-width', '2'); // Line thickness
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
      // Get child .mindmap-node elements that are direct children of this childrenContainer
      const childNodeElements = Array.from(childrenContainer.children).filter(el => el.matches('.mindmap-node'));

      childNodeElements.forEach(childElement => {
        // Ensure childElement is indeed a direct .mindmap-node intended for connection
        // This check is somewhat redundant if the selector above is precise, but good for safety.
        if (childElement.classList.contains('mindmap-node')) {
            drawConnectionLine(nodeElement, childElement);
            traverseAndDrawLines(childElement); // Recurse for grandchildren
        }
      });
    }
  }
}


function renderChildren(childrenData, parentNodeElement) {
  const childrenContainer = parentNodeElement.querySelector('.mindmap-children-container');

  if (!childrenContainer) {
    if (childrenData && childrenData.length > 0) {
      console.error("Critical: .mindmap-children-container missing in parent for renderChildren:", parentNodeElement);
      // Fallback: try to create it, though createNodeElement should handle this.
      const newContainer = document.createElement('div');
      newContainer.classList.add('mindmap-children-container');
      parentNodeElement.appendChild(newContainer);
      // This re-assignment won't work as childrenContainer is const.
      // The original logic in renderMindmap/createNodeElement should ensure container exists.
      // For now, if it's still not found, we must exit.
      if (!parentNodeElement.querySelector('.mindmap-children-container')) return;
    } else {
      if (childrenContainer) childrenContainer.innerHTML = '';
      return;
    }
  }

  childrenContainer.innerHTML = ''; // Clear previous children

  let placedSiblingBoxes = [];
  let currentX = 10; // Initial X offset (from CSS padding of childrenContainer)
  let currentY = 10; // Initial Y offset (from CSS padding of childrenContainer)
  let maxChildHeightInRow = 0;
  const horizontalSpacing = 25; // Defined space between non-overlapping nodes
  const nudgeAmount = 10;       // Amount to shift X if overlap detected
  const maxNudges = 50;         // Max attempts to resolve overlap for one node

  childrenData.forEach(childData => {
    const childNodeElement = createNodeElement(childData);
    childrenContainer.appendChild(childNodeElement); // Append to DOM to allow measurements

    childNodeElement.style.position = 'absolute';
    childNodeElement.style.top = currentY + 'px'; // Y is constant for a simple horizontal row for now

    if (typeof childData.x === 'number' && typeof childData.y === 'number') {
      // Node has been manually dragged, use its stored position relative to its container
      childNodeElement.style.left = childData.x + 'px';
      childNodeElement.style.top = childData.y + 'px'; // Respect dragged Y as well
      // Add its box to placedSiblingBoxes to be considered by subsequent algorithmically placed nodes
      placedSiblingBoxes.push(getBoundingBox(childNodeElement));
      // Update currentX to be to the right of this dragged node for the next potential algorithmic node
      // This is a simple approach; a more complex one might try to fill gaps.
      currentX = Math.max(currentX, childData.x + childNodeElement.offsetWidth + horizontalSpacing);
      maxChildHeightInRow = Math.max(maxChildHeightInRow, childNodeElement.offsetHeight + (childData.y - currentY) );


    } else {
      // Algorithmic placement with overlap detection
      let overlapResolved = false;
      let nudges = 0;
      let tempCurrentX = currentX;

      do {
        childNodeElement.style.left = tempCurrentX + 'px';
        // getBoundingBox uses offsetLeft/Top, which are relative to the offsetParent (childrenContainer).
        // This is correct as placedSiblingBoxes will also have coordinates relative to childrenContainer.
        const currentChildBox = getBoundingBox(childNodeElement);

        let isOverlapping = false;
        if (currentChildBox) { // Ensure box was created
            for (const siblingBox of placedSiblingBoxes) {
                if (doNodesOverlap(currentChildBox, siblingBox)) {
                    isOverlapping = true;
                    break;
                }
            }
        } else { // Should not happen if nodeElement is valid
            console.error("Could not get bounding box for child", childNodeElement);
            overlapResolved = true; // Break loop to prevent infinite loop
            break;
        }

        if (isOverlapping) {
          tempCurrentX += nudgeAmount;
          nudges++;
        } else {
          overlapResolved = true;
        }
      } while (!overlapResolved && nudges < maxNudges);

      if (nudges >= maxNudges) {
        console.warn("Max nudges reached for node:", childData.text, "Layout may not be optimal.");
      }

      childNodeElement.style.left = tempCurrentX + 'px'; // Set final position

      const finalBox = getBoundingBox(childNodeElement);
      if (finalBox) {
        placedSiblingBoxes.push(finalBox);
        currentX = finalBox.x + finalBox.width + horizontalSpacing;
        maxChildHeightInRow = Math.max(maxChildHeightInRow, finalBox.height);
      } else { // Fallback if box couldn't be determined
        currentX = tempCurrentX + childNodeElement.offsetWidth + horizontalSpacing;
        maxChildHeightInRow = Math.max(maxChildHeightInRow, childNodeElement.offsetHeight);
      }
    }

    // Ensure children container exists within this child, then recurse if needed
    if (childData.children && childData.children.length > 0) {
        let grandChildrenContainer = childNodeElement.querySelector('.mindmap-children-container');
        if (!grandChildrenContainer) {
            grandChildrenContainer = document.createElement('div');
            grandChildrenContainer.classList.add('mindmap-children-container');
            childNodeElement.appendChild(grandChildrenContainer);
        }
        if (!childData.isCollapsed) {
            renderChildren(childData.children, childNodeElement);
        }
    }
  });

  // Adjust height of childrenContainer to fit content
  if (childrenData.length > 0) {
    childrenContainer.style.height = (currentY + maxChildHeightInRow + 10) + 'px'; // Add last row height + bottom padding
  } else {
    childrenContainer.style.height = 'auto'; // Or '0px' if it should truly collapse, 'auto' is safer.
  }
}
