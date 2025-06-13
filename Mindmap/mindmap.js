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

// --- Simulated Server Interaction ---
async function saveMindmapToServer(mindmapId = 'default-map-id') {
  const jsonData = getMindmapDataAsJSON();
  const endpoint = `/api/mindmap/save`; // Conceptual
  console.log(`Simulating SAVE to endpoint: ${endpoint} for mindmapId: ${mindmapId}`);
  showFeedback(`Attempting to save mindmap "${mindmapId}" to server...`, false, true);

  // Simulate fetch
  try {
    // const response = await fetch(endpoint, { // Actual fetch would be:
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ mindmapId, mindmapData: JSON.parse(jsonData) }) // Send parsed object
    // });
    // if (!response.ok) throw new Error(`Server responded with ${response.status}`);
    // const result = await response.json();
    // console.log("Simulated server response:", result);
    // showFeedback(`Mindmap "${mindmapId}" saved to server successfully. (Simulated ID: ${result.id || mindmapId})`, false, true);

    // Simplified simulation without actual fetch
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    const simulatedServerResponse = { success: true, savedId: mindmapId, timestamp: Date.now() };
    console.log("Simulated server success response:", simulatedServerResponse);
    showFeedback(`Mindmap "${mindmapId}" saved. (Simulated server ID: ${simulatedServerResponse.savedId})`, false, true);

  } catch (error) {
    console.error("Simulated server save error:", error);
    showFeedback(`Failed to save mindmap "${mindmapId}" to server. ${error.message}`, true, true);
  }
}

async function loadMindmapFromServer(mindmapId = 'sample-map-from-server') {
  const endpoint = `/api/mindmap/load/${mindmapId}`; // Conceptual
  console.log(`Simulating LOAD from endpoint: ${endpoint}`);
  showFeedback(`Attempting to load mindmap "${mindmapId}" from server...`, false, true);

  // Simulate fetch
  try {
    // const response = await fetch(endpoint); // Actual fetch
    // if (!response.ok) throw new Error(`Server responded with ${response.status}`);
    // const loadedDataFromServer = await response.json();

    // Simplified simulation without actual fetch
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
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
});

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
  parentNode.children = parentNode.children || [];
  const newNode = {
    id: generateNodeId(), text: text, notes: '', table: null, image: null, chart: null, children: [],
  };
  parentNode.children.push(newNode);
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

  const textElement = document.createElement('span');
  textElement.classList.add('node-text');
  textElement.textContent = nodeData.text;
  nodeElement.appendChild(textElement);
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
  container.innerHTML = '';
  const rootNodeElement = createNodeElement(data.root);
  container.appendChild(rootNodeElement);
  if (data.root.children && data.root.children.length > 0) {
    renderChildren(data.root.children, rootNodeElement);
  }
}

function renderChildren(children, parentElement) {
  const childrenContainer = document.createElement('div');
  childrenContainer.classList.add('mindmap-children-container');
  parentElement.appendChild(childrenContainer);
  children.forEach(childNodeData => {
    const childNodeElement = createNodeElement(childNodeData);
    childrenContainer.appendChild(childNodeElement);
    if (childNodeData.children && childNodeData.children.length > 0) {
      renderChildren(childNodeData.children, childNodeElement);
    }
  });
}
