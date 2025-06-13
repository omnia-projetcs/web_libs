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
  return nodeElement;
}

function renderMindmap(data, containerId) {
  const container = document.getElementById(containerId);
  if (!container) { console.error("Mindmap container not found!"); return; }
  container.innerHTML = ''; // Clear previous rendering

  // Create and position the root node
  const rootNodeElement = createNodeElement(data.root);
  // For the root node, we can set its position here or assume it's handled by CSS (e.g., normal flow or specific ID style)
  // If it needs to be positioned by JS:
  rootNodeElement.style.position = 'absolute'; // Explicitly position root
  rootNodeElement.style.left = '50px';
  rootNodeElement.style.top = '50px';
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
  // parentNodeElement is the DOM element of the parent node.
  const childrenContainer = parentNodeElement.querySelector('.mindmap-children-container');

  if (!childrenContainer) {
    // This case should ideally be handled by createNodeElement ensuring such a container exists if nodeData.children is present.
    // For robustness, if it's missing for a node that *should* have one (because it has children and isn't collapsed), create it.
    if (childrenData && childrenData.length > 0) {
        console.warn("Missing .mindmap-children-container for parent:", parentNodeElement, "Creating one.");
        const newContainer = document.createElement('div');
        newContainer.classList.add('mindmap-children-container');
        parentNodeElement.appendChild(newContainer);
        // It's tricky to re-assign childrenContainer here without affecting outer scope if it was passed.
        // The most robust way is to ensure createNodeElement *always* creates it if children might exist.
        // For now, we'll assume createNodeElement has added it if children are present.
        // If not, the querySelector above would be null.
        // Let's re-query, though ideally createNodeElement should handle this.
        const reQueriedContainer = parentNodeElement.querySelector('.mindmap-children-container');
        if (!reQueriedContainer) {
            console.error("Failed to create and find .mindmap-children-container for parent:", parentNodeElement);
            return;
        }
        // This direct reassignment won't work due to scope. Better to ensure createNodeElement does its job.
        // For this implementation, we'll rely on createNodeElement having done this.
        // If childrenContainer is null, it means the parent node didn't render one, which is an issue in createNodeElement.
    } else {
        // No children data, so no container needed.
        if (childrenContainer) childrenContainer.innerHTML = ''; // Clear if it exists but no data.
        return;
    }
  }

  childrenContainer.innerHTML = ''; // Clear previous children before re-rendering/re-positioning

  let currentX = 10; // Start with padding inside childrenContainer (matches CSS padding)
  let currentY = 10; // Start with padding
  let maxChildHeightInRow = 0;
  const horizontalSpacing = 25; // Space between horizontal nodes
  const verticalSpacing = 20; // Space between rows if wrapping were fully implemented

  childrenData.forEach(childData => {
    const childNodeElement = createNodeElement(childData);

    // Temporarily append to get dimensions, then position
    childNodeElement.style.visibility = 'hidden'; // Avoid flicker
    childrenContainer.appendChild(childNodeElement);

    const childWidth = childNodeElement.offsetWidth;
    const childHeight = childNodeElement.offsetHeight;
    maxChildHeightInRow = Math.max(maxChildHeightInRow, childHeight);

    // Basic wrapping logic (optional, for now, simple horizontal row)
    // const containerMaxWidth = childrenContainer.offsetWidth - 20; // Example: childrenContainer.clientWidth
    // if (containerMaxWidth > 0 && currentX + childWidth > containerMaxWidth && currentX > 10) { // Check currentX > 10 to ensure at least one item is in the row
    //   currentX = 10;
    //   currentY += maxChildHeightInRow + verticalSpacing;
    //   maxChildHeightInRow = childHeight;
    // }

    childNodeElement.style.position = 'absolute';
    childNodeElement.style.left = currentX + 'px';
    childNodeElement.style.top = currentY + 'px';
    childNodeElement.style.visibility = 'visible';

    currentX += childWidth + horizontalSpacing;

    // If child itself has children and is not collapsed, recursively call renderChildren for it.
    // Ensure the childNodeElement has a children-container, typically added by createNodeElement.
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
