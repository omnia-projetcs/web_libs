// --- Conceptual API Endpoints ---
// const API_BASE_URL = '/api/mindmap'; // Example base
// const API_SAVE_MINDMAP = `${API_BASE_URL}/save`; // POST - Body: { mindmapData, mindmapId? }
// const API_LOAD_MINDMAP = `${API_BASE_URL}/load/:mindmapId`; // GET
// const API_LIST_MINDMAPS = `${API_BASE_URL}/list`; // GET - Returns list of user's mindmaps {id, name, lastModified}

// Global mindmap data variable
let mindmapData = {
  nodes: [ // Array to hold all root/floating nodes
    { // The first node is typically the main root
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
    }
  ],
  // Future global settings like viewbox, zoom level, etc. could go here
  // settings: { autoLayout: true, defaultTheme: 'light' }
};

const mindmapThemes = {
  'default': {
    node: {
      shape: 'rectangle',
      backgroundColor: '#ffffff',
      borderColor: '#000000',
      textColor: '#000000',
      font: { size: '16px', weight: 'normal', style: 'normal' },
      connectorColor: '#555555',
      connectorThickness: '2',
      connectorStyle: 'solid',
      connectorShape: 'curved'
    }
  },
  'professional': {
    node: {
      shape: 'rectangle',
      backgroundColor: '#f0f4f8',
      borderColor: '#5d6d7e',
      textColor: '#34495e',
      font: { size: '15px', weight: 'normal', style: 'normal' },
      connectorColor: '#5d6d7e',
      connectorThickness: '2',
      connectorStyle: 'solid',
      connectorShape: 'curved'
    }
  },
  'creative': {
    node: {
      shape: 'ellipse',
      backgroundColor: '#fff5e6',
      borderColor: '#ff8c00',
      textColor: '#d2691e',
      font: { size: '16px', weight: 'bold', style: 'italic' },
      connectorColor: '#ff8c00',
      connectorThickness: '2',
      connectorStyle: 'dashed',
      connectorShape: 'curved'
    }
  }
};
let currentThemeName = 'default';

const LOCAL_STORAGE_KEY = 'userMindmapData_v2'; // Changed key to avoid conflict with old structure
const SIBLING_SEPARATION = 40; // Moved from calculateTreeLayout
const LEVEL_SEPARATION = 90;   // Moved from calculateTreeLayout

let nodeIdCounter = 0;
let needsReRenderAfterCharts = false;
let chartReRenderTimer = null;
let svgLayer = null; // For SVG connection lines
let mindmapContainer = null; // Reference to the main mindmap container DOM element
let selectedNodeIds = []; // Array to store IDs of selected nodes

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
      // Check for new structure (nodes array) or old structure (root object)
      if (loadedData && Array.isArray(loadedData.nodes)) {
        mindmapData = loadedData;
        // Sanitize all loaded nodes after loading the entire structure
        mindmapData.nodes = mindmapData.nodes.map(node => sanitizeNodeData(node)).filter(node => node !== null);
        if (mindmapData.nodes.length === 0) { // If all nodes were invalid or empty array
            initializeDefaultMindmapData(); // Initialize with a default valid structure
            showFeedback('Loaded data contained no valid nodes. Loaded default map.', true);
        } else {
            nodeIdCounter = Date.now(); // Reset based on load time
            console.log('Mindmap (v2 structure) loaded from local storage.');
            showFeedback('Mindmap loaded from previous local session.', false);
        }
      } else if (loadedData && loadedData.root) {
        // Old structure found, migrate it
        console.log('Old mindmap structure found in local storage. Migrating...');
        const oldRoot = sanitizeNodeData(loadedData.root); // Sanitize the old root
        if (oldRoot) {
            mindmapData.nodes = [oldRoot]; // Place old root as the first node
        } else {
            initializeDefaultMindmapData(); // Old root was invalid, start fresh
        }
        nodeIdCounter = Date.now();
        saveMindmapToLocalStorage(); // Save in new format
        showFeedback('Old mindmap data migrated to new format and loaded.', false);
      } else {
        // No valid data or unrecognized format, start fresh with default structure
        initializeDefaultMindmapData();
        console.log('No valid mindmap data found in local storage. Starting fresh with default (nodes array).');
      }
    } else {
      initializeDefaultMindmapData();
      console.log('No mindmap data found in local storage. Starting fresh with default (nodes array).');
    }
  } catch (e) {
    console.error('Error loading from local storage:', e);
    showFeedback('Could not load data from local storage. Starting fresh.', true);
    initializeDefaultMindmapData();
  }
  renderMindmap(mindmapData, 'mindmap-container');
}

function initializeDefaultMindmapData() {
  mindmapData = {
    nodes: [
      {
        id: 'root', text: 'Root Node', notes: 'Default central idea.', children: [],
        x: 50, y: 50, isManuallyPositioned: false, isCollapsed: false,
        table:null, image:null, chart:null, // Ensure all relevant properties are present
        // Apply default theme styles
        style: JSON.parse(JSON.stringify(mindmapThemes[currentThemeName].node)), // Deep copy
        font: JSON.parse(JSON.stringify(mindmapThemes[currentThemeName].node.font)) // Deep copy
      }
    ]
    // settings: { autoLayout: true, defaultTheme: 'light' } // Example for future settings
  };
  // Remove font from style object as it's a separate top-level property in nodeData
  if (mindmapData.nodes[0].style && mindmapData.nodes[0].style.font) {
    delete mindmapData.nodes[0].style.font;
  }
  nodeIdCounter = Date.now(); // Or 0 if preferred for fresh start
}

function clearLocalStorage() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY); // Removes _v2 key
    localStorage.removeItem('userMindmapData'); // Attempt to remove old key too
    showFeedback('Local mindmap data cleared. Default map loaded.', false);
    console.log('Local storage cleared for mindmap data (v2 and old).');
    initializeDefaultMindmapData(); // Use the new initializer
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
  // console.log("Calculating tree layout for root:", rootNodeData.id, "within width:", mindmapContainerWidth);
  const initialYOffset = 50;
  // Using global SIBLING_SEPARATION and LEVEL_SEPARATION

  // 1. Assign Levels and Y-coordinates using BFS (modified)
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

      // Only consider children for next level if parent is not collapsed
      if (currentNode.children && !currentNode.isCollapsed) {
          currentNode.children.forEach(child => {
              child.level = currentNode.level + 1;
              q.push(child);
          });
      }
  }

  let levelYPosition = initialYOffset; // Starting Y for the current level being processed
  for (let i = 0; i <= maxLevel; i++) {
      if (!nodesByLevel[i] || nodesByLevel[i].length === 0) continue;

      let maxSubtreeReachInCurrentLevel = 0;
      nodesByLevel[i].forEach(node => {
          if (!node.isManuallyPositioned || typeof node.y !== 'number') {
              node.y = levelYPosition;
          } else {
              // If manually positioned, its Y might influence levelYPosition for this level if it's lower
              // However, all nodes in the same algorithmic level should share the same base Y.
              // So, if a manual node is 'pulled up', it doesn't change the level's Y.
              // If it's 'pushed down', other nodes in this level are not affected by its manual Y directly,
              // but the start of the NEXT level will be affected.
              // For simplicity now: manual Y is respected, but doesn't push other nodes in same level down.
              // The `levelYPosition` for the *next* level will be determined by max reach.
              // This means a manually positioned node might visually appear at a different "level"
              // if its Y is significantly different from `levelYPosition`.
              // This behavior might need further refinement if strict level alignment is desired for manual nodes.
              // For now, `node.y` will be its manual y.
          }
          // Track the furthest point this node's subtree reaches FROM THE TOP (0)
          // node.y is the top of the current node. node.subtreeHeight is its full vertical extent.
          maxSubtreeReachInCurrentLevel = Math.max(maxSubtreeReachInCurrentLevel, node.y + (node.subtreeHeight || node.height || 0));
      });
      // Next level should start after the current level's deepest subtree and separation
      // Only update if there was some content in the level, otherwise levelYPosition remains for potentially empty levels
      if (nodesByLevel[i].length > 0) {
           levelYPosition = maxSubtreeReachInCurrentLevel + LEVEL_SEPARATION;
      }
  }

  // 2. Assign X-coordinates recursively
  function assignAlgorithmicXRecursive(parentNodeData) {
    if (!parentNodeData.children || parentNodeData.children.length === 0 || parentNodeData.isCollapsed) {
      return; // No children to position or parent is collapsed
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
    // Use subtreeWidth to center the entire tree, not just the root node's own width
    rootNodeData.x = (mindmapContainerWidth / 2) - ((rootNodeData.subtreeWidth || rootNodeData.width || 50) / 2);
  }
  if (typeof rootNodeData.y !== 'number') { // Ensure root Y is set if it was 'isManuallyPositioned' but Y was missing
      rootNodeData.y = initialYOffset;
  }

  assignAlgorithmicXRecursive(rootNodeData);
}

function calculateSubtreeDimensionsRecursive(nodeData) {
  if (!nodeData) return;

  // Assumes nodeData.width and nodeData.height are already calculated.
  if (typeof nodeData.width !== 'number' || typeof nodeData.height !== 'number') {
    // console.warn("Node dimensions not calculated for:", nodeData.id, " Subtree calculation might be inaccurate.");
    nodeData.width = nodeData.width || 100;
    nodeData.height = nodeData.height || 40;
  }

  if (!nodeData.children || nodeData.children.length === 0 || nodeData.isCollapsed) {
    nodeData.subtreeWidth = nodeData.width;
    nodeData.subtreeHeight = nodeData.height;
    return;
  }

  let currentChildrenTotalSubtreeWidth = 0;
  let maxChildSubtreeHeight = 0;

  for (let i = 0; i < nodeData.children.length; i++) {
    const child = nodeData.children[i];
    calculateSubtreeDimensionsRecursive(child); // Recursive call

    currentChildrenTotalSubtreeWidth += child.subtreeWidth;
    if (i < nodeData.children.length - 1) {
      currentChildrenTotalSubtreeWidth += SIBLING_SEPARATION;
    }
    maxChildSubtreeHeight = Math.max(maxChildSubtreeHeight, child.subtreeHeight);
  }

  nodeData.subtreeWidth = Math.max(nodeData.width, currentChildrenTotalSubtreeWidth);
  nodeData.subtreeHeight = nodeData.height;
  if (maxChildSubtreeHeight > 0) { // Only add separation if there were actual children processed
    nodeData.subtreeHeight += LEVEL_SEPARATION + maxChildSubtreeHeight;
  }
}

function calculateOverallBoundingBox(node) {
    // If node is not valid or lacks position/dimensions, it cannot contribute.
    if (!node || typeof node.x !== 'number' || typeof node.y !== 'number' ||
        typeof node.width !== 'number' || typeof node.height !== 'number') {
        return null;
    }

    // Initialize bounds with the current node's dimensions
    let minX = node.x;
    let minY = node.y;
    let maxX = node.x + node.width;
    let maxY = node.y + node.height;

    // If the node has children and is not collapsed, recurse for children
    if (node.children && node.children.length > 0 && !node.isCollapsed) {
        node.children.forEach(child => {
            const childBounds = calculateOverallBoundingBox(child);
            if (childBounds) { // If child (and its descendants) contributed valid bounds
                minX = Math.min(minX, childBounds.minX);
                minY = Math.min(minY, childBounds.minY);
                maxX = Math.max(maxX, childBounds.maxX);
                maxY = Math.max(maxY, childBounds.maxY);
            }
        });
    }

    // Check if initial node was valid but had no valid children to expand bounds
    if (minX === Infinity && node.x !== undefined) { // Should not happen with current logic if node itself is valid
        return { minX: node.x, minY: node.y, maxX: node.x + node.width, maxY: node.y + node.height };
    }
    if (minX === Infinity) return null; // No valid nodes found at all starting from this path

    return { minX, minY, maxX, maxY };
}

function zoomToFit() {
    if (!mindmapData || !mindmapData.nodes || mindmapData.nodes.length === 0) {
        // console.warn("[ZoomToFit] No mindmap data or no nodes available.");
        return;
    }
    if (!mindmapContainer) {
        // console.warn("[ZoomToFit] Mindmap container not found.");
        return;
    }

    // For now, zoomToFit will operate on the first node (main root)
    // Later, it could calculate bounds encompassing all floating nodes.
    const mainRootNode = mindmapData.nodes[0];
    if (!mainRootNode) {
        // console.warn("[ZoomToFit] Main root node not found.");
        return;
    }

    const bounds = calculateOverallBoundingBox(mainRootNode);

    if (!bounds || bounds.minX === Infinity) {
        // console.warn("[ZoomToFit] Could not calculate valid bounds for the main root content.");
        if (mainRootNode && typeof mainRootNode.x === 'number') {
             // console.log(`[ZoomToFit] Fallback: Centering on main root node. X: ${mainRootNode.x}, Y: ${mainRootNode.y}`);
        }
        return;
    }

    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;

    if (contentWidth <= 0 || contentHeight <= 0) {
        // console.warn("[ZoomToFit] Content has zero or negative dimensions. Cannot calculate scale.", bounds);
        return;
    }

    const containerWidth = mindmapContainer.offsetWidth;
    const containerHeight = mindmapContainer.offsetHeight;
    const PADDING = 50; // Add some padding around the content

    const scaleX = (containerWidth - 2 * PADDING) / contentWidth;
    const scaleY = (containerHeight - 2 * PADDING) / contentHeight;
    const scale = Math.min(scaleX, scaleY); // Use the smaller scale to fit both dimensions

    // Calculate translation to center the scaled content
    // Target bounding box of scaled content
    const scaledContentWidth = contentWidth * scale;
    const scaledContentHeight = contentHeight * scale;

    // Desired top-left corner of the scaled content *within the container*
    const desiredX = (containerWidth - scaledContentWidth) / 2;
    const desiredY = (containerHeight - scaledContentHeight) / 2;

    // The translation needed for the original content's top-left corner (bounds.minX, bounds.minY)
    // such that after scaling by 'scale' and then translating, it ends up at (desiredX, desiredY)
    // Let T = (tx, ty) be the translation.
    // (bounds.minX * scale) + tx = desiredX  => tx = desiredX - (bounds.minX * scale)
    // (bounds.minY * scale) + ty = desiredY  => ty = desiredY - (bounds.minY * scale)
    const translateX = desiredX - (bounds.minX * scale);
    const translateY = desiredY - (bounds.minY * scale);

    // console.log(`[ZoomToFit] Calculated Bounding Box:`, bounds);
    // console.log(`[ZoomToFit] Content Dimensions: width=${contentWidth}, height=${contentHeight}`);
    // console.log(`[ZoomToFit] Container Dimensions: width=${containerWidth}, height=${containerHeight}`);
    // console.log(`[ZoomToFit] Required Scale: ${scale.toFixed(3)} (scaleX: ${scaleX.toFixed(3)}, scaleY: ${scaleY.toFixed(3)})`);
    // console.log(`[ZoomToFit] Required Translation: tx=${translateX.toFixed(2)}, ty=${translateY.toFixed(2)}`);

    const mindmapContentWrapper = document.getElementById('mindmap-content-wrapper');
    if (mindmapContentWrapper) {
        mindmapContentWrapper.style.transformOrigin = '0 0'; // Top left origin
        mindmapContentWrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

        // After applying the transform, we might need to redraw lines.
        // A full renderMindmap() could be too much as it recalculates layout based on original data.
        // For now, let's just clear and redraw lines based on current visual positions.
        // This assumes node elements inside wrapper now have transformed getBoundingClientRect().
        if (svgLayer && mindmapData.nodes && mindmapData.nodes.length > 0) {
            clearSvgLayer();
            // Redraw lines for all root/floating nodes after zoom.
            // This assumes zoomToFit applies a global transform on mindmap-content-wrapper.
            // For now, just redraw for the main root as a simplification.
            const mainRootNodeData = mindmapData.nodes[0];
            if (mainRootNodeData) {
                const rootElementForLines = mindmapContentWrapper.querySelector(`.mindmap-node[data-id='${mainRootNodeData.id}']`);
                if (rootElementForLines) {
                    requestAnimationFrame(() => { // Ensure DOM has updated from transform
                        traverseAndDrawLines(rootElementForLines);
                    });
                }
            }
        }
        showFeedback(`Zoomed to fit. Scale: ${scale.toFixed(2)}. Note: Further interactions may reset zoom.`, false);

    } else {
        // console.error("[ZoomToFit] mindmap-content-wrapper not found. Cannot apply transform.");
    }

    // For testing purposes:
    if (typeof window.TEST_ENV !== 'undefined' && window.TEST_ENV) {
        window.lastZoomToFitCalculations = { scale, translateX, translateY, bounds, contentWidth, contentHeight };
    }
}

// Example of how node positions might be adjusted (NOT part of this subtask's core implementation)
/*
function adjustAllNodePositions(scale, tx, ty) { // Needs to iterate all roots in mindmapData.nodes
  mindmapData.nodes.forEach(node => {
    adjustSingleTreePositions(scale, tx, ty, node);
  });
}
function adjustSingleTreePositions(scale, tx, ty, node) {
    if (!node) return;
    if (typeof node.x === 'number' && typeof node.y === 'number') {
        node.x = node.x * scale + tx;
        node.y = node.y * scale + ty;
        // node.width and node.height would also need scaling if visual zoom is applied
        // node.width *= scale;
        // node.height *= scale;
        // node.isManuallyPositioned = true; // After zoom-to-fit, positions are effectively manual relative to new viewport
    }
    if (node.children) {
        node.children.forEach(child => adjustAllNodePositions(scale, tx, ty, child));
    }
}
*/

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
  // appendToDiagLog('DOMContentLoaded event fired.');
  mindmapContainer = document.getElementById('mindmap-container');
  svgLayer = document.getElementById('mindmap-svg-layer');

  if (mindmapContainer) {
    mindmapContainer.addEventListener('click', (event) => {
      // If the click is directly on the container and not on a node or its controls
      if (event.target === mindmapContainer) {
        if (selectedNodeIds.length > 0) {
          selectedNodeIds.forEach(id => {
            const el = mindmapContainer.querySelector(`.mindmap-node[data-id='${id}']`);
            if (el) el.classList.remove('selected-node');
          });
          selectedNodeIds = [];
          // console.log('Mindmap container clicked, all nodes deselected.');
        }
      }
    });
  }

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
  const themeSelector = document.getElementById('theme-selector');

  // appendToDiagLog('Attempting to find #toolbar.');
  // if (document.getElementById('toolbar')) {
      // appendToDiagLog('#toolbar element found in DOM.');
  // } else {
      // appendToDiagLog('#toolbar element NOT found in DOM.');
  // }

  // appendToDiagLog('Attempting to find #clear-mindmap-btn.');
  const clearMindmapBtn = document.getElementById('clear-mindmap-btn');
  if (clearMindmapBtn) {
      // appendToDiagLog('#clear-mindmap-btn element found. Attaching click listener.');
      // Revert to simple listener:
      clearMindmapBtn.addEventListener('click', handleClearAllMindmap);
  } else {
      // appendToDiagLog('#clear-mindmap-btn element NOT found in DOM.');
  }

  // appendToDiagLog('Attempting to find #zoom-to-fit-btn.');
  const zoomToFitBtn = document.getElementById('zoom-to-fit-btn');
  if (zoomToFitBtn) {
      // appendToDiagLog('#zoom-to-fit-btn element found. Attaching click listener.');
      zoomToFitBtn.addEventListener('click', zoomToFit); // Simple listener
  } else {
      // appendToDiagLog('#zoom-to-fit-btn element NOT found in DOM.');
  }

  if (addNodeBtn) addNodeBtn.addEventListener('click', () => {
    const text = nodeTextInput.value.trim();
    if (text) {
      // Add to the first root node by default, or create one if none exist.
      let targetParentId = null;
      if (mindmapData.nodes.length > 0) {
        targetParentId = mindmapData.nodes[0].id; // Target the first root node
         addChildNode(targetParentId, text); // Use addChildNode which calls createNode
      } else {
        // If no nodes exist, addCentralTopic can create the very first node.
        addCentralTopic({ text: text });
      }
      nodeTextInput.value = '';
    } else {
      alert('Please enter text for the node.');
    }
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
  if (themeSelector) {
    // Populate options from mindmapThemes
    for (const themeName in mindmapThemes) {
      const option = document.createElement('option');
      option.value = themeName;
      option.textContent = themeName.charAt(0).toUpperCase() + themeName.slice(1);
      themeSelector.appendChild(option);
    }
    themeSelector.value = currentThemeName; // Set initial value
    themeSelector.addEventListener('change', (event) => {
      applyTheme(event.target.value);
    });
  }
  // The clearMindmapBtn listener is now correctly set up above.
  // No need for this line: if (clearMindmapBtn) clearMindmapBtn.addEventListener('click', handleClearAllMindmap);


  // Keyboard shortcuts
  document.addEventListener('keydown', (event) => {
    if (selectedNodeIds.length === 0) return; // No nodes selected, do nothing

    // For single-node actions (like add child/sibling), operate on the first selected node.
    const firstSelectedId = selectedNodeIds[0];
    const firstNodeData = findNodeById(firstSelectedId);

    if (!firstNodeData && (event.key === 'Enter' || event.key === 'Tab')) {
        console.warn("Primary selected node data not found for Enter/Tab keydown event:", firstSelectedId);
        return;
    }

    let preventDefault = false;

    if (event.key === 'Enter') {
      if (firstNodeData) { // Ensure node data exists for this action
        promptAndAddSibling(firstNodeData.id);
      }
      preventDefault = true;
    } else if (event.key === 'Tab') {
      if (firstNodeData) { // Ensure node data exists for this action
         promptAndAddChild(firstNodeData.id);
      }
      preventDefault = true;
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      let confirmMessage = `Are you sure you want to delete ${selectedNodeIds.length} selected node(s)?`;
      if (selectedNodeIds.length === 1 && firstNodeData) {
          const childrenCount = firstNodeData.children ? firstNodeData.children.length : 0;
          confirmMessage = `Are you sure you want to delete "${firstNodeData.text || 'this node'}"?`;
          if (childrenCount > 0) {
            confirmMessage += `\n\nThis node has ${childrenCount} direct child/children, which will also be deleted.`;
          }
      }

      if (confirm(confirmMessage)) {
        // Store IDs to delete as deleteNode might modify selection and array
        const idsToDelete = [...selectedNodeIds];
        idsToDelete.forEach(id => {
            // deleteNode itself handles rules about not deleting the last node etc.
            // and updates selection.
            deleteNode(id);
        });
        // selectedNodeIds should be empty or updated by the last deleteNode call.
      }
      preventDefault = true;
    }

    if (preventDefault) {
      event.preventDefault();
    }
  });
});

// --- New/Clear Map Function ---
function handleClearAllMindmap() {
    // appendToDiagLog('[handleClearAllMindmap] Function called.');
    // console.log('[handleClearAllMindmap] Called. Current mindmapData:', JSON.stringify(window.mindmapData, null, 2));

    // Reset global states related to rendering or selection
    selectedNodeId = null;
    if (chartReRenderTimer) {
        clearTimeout(chartReRenderTimer);
        chartReRenderTimer = null;
    }
    needsReRenderAfterCharts = false;

    const nodeTextInput = document.getElementById('node-text-input');
    if (nodeTextInput) nodeTextInput.value = '';

    const defaultRootText = 'Root Node';
    const initialX = 50; // Default X if container width not available
  const initialY = 50; // Default Y

  const measureContainer = getOrCreateTempMeasurementContainer();
  // For a new map, we initialize with one root node.
  initializeDefaultMindmapData(); // This sets up mindmapData.nodes with one root

  // Measure the default root
  const defaultRootNodeData = mindmapData.nodes[0]; // Access the first node
  if (defaultRootNodeData) { // Check if defaultRootNodeData exists
    const tempNodeElement = createNodeElement(defaultRootNodeData); // createNodeElement needs to be robust
    measureContainer.innerHTML = '';
    measureContainer.appendChild(tempNodeElement);
    defaultRootNodeData.width = tempNodeElement.offsetWidth || 100;
    defaultRootNodeData.height = tempNodeElement.offsetHeight || 40;
    measureContainer.innerHTML = '';

    // Ensure dimensions are calculated for the new root before layout
    if (typeof calculateAndStoreNodeDimensions === 'function') {
        calculateAndStoreNodeDimensions(defaultRootNodeData, measureContainer);
    }
    // Update root width/height based on actual calculation
    defaultRootNodeData.width = defaultRootNodeData.width || 100;
    defaultRootNodeData.height = defaultRootNodeData.height || 40;

    // Position the new root node (typically centered)
    if (typeof calculateTreeLayout === 'function' && mindmapContainer && mindmapContainer.offsetWidth > 0) {
        defaultRootNodeData.x = (mindmapContainer.offsetWidth / 2) - (defaultRootNodeData.width / 2);
        defaultRootNodeData.y = initialY;
    } else {
        defaultRootNodeData.x = 50; // Fallback X if container width not available
        defaultRootNodeData.y = initialY;
    }
  } else {
      console.error("handleClearAllMindmap: No default root node found after initialization.");
  }
  // console.log('[handleClearAllMindmap] mindmapData reset. New structure:', JSON.stringify(mindmapData, null, 2));

  renderMindmap(mindmapData, 'mindmap-container'); // renderMindmap needs to handle the new data structure
  saveMindmapToLocalStorage();
  showFeedback('Mindmap cleared. New map started.', false);

  // console.log('[handleClearAllMindmap] Completed.');
  // appendToDiagLog('[handleClearAllMindmap] Function completed.');
}


// --- File Export/Import & Utility Functions ---
function handleExportMindmapAsJson() {
  try {
    const mindmapJsonString = JSON.stringify(mindmapData, null, 2); // mindmapData is now { nodes: [...] }
    const blob = new Blob([mindmapJsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    let filename = 'mindmap_export.json'; // Generic name as there might be multiple roots
    if (mindmapData && mindmapData.nodes && mindmapData.nodes.length > 0 && mindmapData.nodes[0].text) {
      const safeFilename = mindmapData.nodes[0].text.replace(/[^a-z0-9_\-\.]/gi, '_').substring(0, 50);
      if (safeFilename) filename = `${safeFilename}_mindmap.json`;
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
      const loadedFileContent = JSON.parse(jsonText);

      if (loadedFileContent && Array.isArray(loadedFileContent.nodes)) { // New format
        mindmapData = loadedFileContent;
        // Sanitize all loaded nodes
        mindmapData.nodes = mindmapData.nodes.map(node => sanitizeNodeData(node)).filter(node => node !== null);
        if (mindmapData.nodes.length === 0) { // If all nodes were invalid or empty array
            initializeDefaultMindmapData();
            showFeedback('Imported file contained no valid nodes. Loaded default map.', true);
        } else {
            nodeIdCounter = Date.now();
            renderMindmap(mindmapData, 'mindmap-container');
            saveMindmapToLocalStorage();
            showFeedback('Mindmap (v2 structure) loaded successfully from file!', false);
        }
      } else if (loadedFileContent && loadedFileContent.root && typeof loadedFileContent.root.text !== 'undefined') { // Old format
        const sanitizedRoot = sanitizeNodeData(loadedFileContent.root);
        if (sanitizedRoot) {
            mindmapData.nodes = [sanitizedRoot];
            nodeIdCounter = Date.now();
            renderMindmap(mindmapData, 'mindmap-container');
            saveMindmapToLocalStorage(); // Save in new format
            showFeedback('Old format mindmap loaded and migrated from file!', false);
        } else {
            initializeDefaultMindmapData();
            showFeedback('Old format mindmap file was invalid. Loaded default map.', true);
        }
      } else {
        showFeedback('Invalid mindmap file format. Missing root node or nodes array.', true);
        initializeDefaultMindmapData(); // Ensure a valid state if import fails badly
        renderMindmap(mindmapData, 'mindmap-container');
      }
    } catch (error) {
      console.error('Error parsing JSON file:', error);
      initializeDefaultMindmapData(); // Ensure a valid state on error
      renderMindmap(mindmapData, 'mindmap-container');
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

function sanitizeNodeData(node) {
  if (!node) return null;

  // Ensure basic properties exist
  node.id = node.id || generateNodeId();
  node.text = node.text || 'Untitled Node';
  node.children = Array.isArray(node.children) ? node.children : [];
  node.notes = typeof node.notes === 'string' ? node.notes : '';

  // Initialize or validate rich content fields
  node.image = (node.image && typeof node.image.src === 'string' && typeof node.image.alt === 'string') ? node.image : null;
  if (node.table && Array.isArray(node.table.headers) && Array.isArray(node.table.rows)) {
    // Basic check, could be more thorough (e.g. row lengths matching header length)
  } else {
    node.table = null;
  }
  if (node.chart && typeof node.chart.type === 'string' && Array.isArray(node.chart.labels) && Array.isArray(node.chart.values)) {
    // Basic check
  } else {
    node.chart = null;
  }

  // Positional and state properties
  node.x = typeof node.x === 'number' ? node.x : undefined; // Rely on layout if undefined
  node.y = typeof node.y === 'number' ? node.y : undefined; // Rely on layout if undefined
  // width and height are typically calculated at render time, so not strictly needed from import unless to preserve exact previous render.
  // For now, let them be recalculated. If width/height are present, they will be used by calculateAndStoreNodeDimensions then layout.
  // node.width = typeof node.width === 'number' ? node.width : undefined;
  // node.height = typeof node.height === 'number' ? node.height : undefined;
  node.isManuallyPositioned = typeof node.isManuallyPositioned === 'boolean' ? node.isManuallyPositioned : false;
  node.isCollapsed = typeof node.isCollapsed === 'boolean' ? node.isCollapsed : false;

  // Recursively sanitize children
  node.children = node.children.map(child => sanitizeNodeData(child)).filter(child => child !== null);

  return node;
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
// Updated findNodeById: Searches all root nodes and their children.
function findNodeById(id) {
  if (!id || !mindmapData.nodes) return null;

  function findRecursive(currentNode, targetId) {
    if (currentNode.id === targetId) return currentNode;
    if (currentNode.children) {
      for (const child of currentNode.children) {
        const found = findRecursive(child, targetId);
        if (found) return found;
      }
    }
    return null;
  }

  for (const rootNode of mindmapData.nodes) {
    const foundInTree = findRecursive(rootNode, id);
    if (foundInTree) return foundInTree;
  }
  return null;
}

// Updated findParentNode: Searches all trees for the child's parent.
function findParentNode(childId) {
  if (!childId || !mindmapData.nodes) return null;

  function findParentRecursive(currentNode, targetChildId) {
    if (currentNode.children) {
      for (const child of currentNode.children) {
        if (child.id === targetChildId) return currentNode; // Current node is the parent
        const foundParent = findParentRecursive(child, targetChildId);
        if (foundParent) return foundParent;
      }
    }
    return null;
  }

  for (const rootNode of mindmapData.nodes) {
    // Check if the rootNode itself is the parent (this case is unlikely unless childId is a root node's ID,
    // in which case it has no parent in the traditional sense of being in a children array).
    // The main loop handles finding parents of children within a tree.
    const parentInTree = findParentRecursive(rootNode, childId);
    if (parentInTree) return parentInTree;
  }
  return null;
}

function addNode(parentId, text) { // This function is now mostly for adding children to existing nodes
  const parentNode = findNodeById(parentId); // Uses updated findNodeById
  if (!parentNode) {
    console.error(`addNode: Parent node with ID "${parentId}" not found.`);
    showFeedback(`Error: Could not find parent "${parentId}" to add child to.`, true);
    return;
  }
  if (!parentNode.children) parentNode.children = [];
  const newNode = {
    id: generateNodeId(), text: text, notes: '', children: [],
    isManuallyPositioned: false // New nodes are not manually positioned
  };
  delete newNode.x; // New children are laid out, not explicitly positioned.
  delete newNode.y;
  parentNode.children.push(newNode);
  if (parentNode.children.length === 1) parentNode.isCollapsed = false; // Expand parent if it was collapsed
  renderMindmap(mindmapData, 'mindmap-container');
  saveMindmapToLocalStorage();
}

// Updated deleteNode: Handles deleting root/floating nodes or child nodes.
function deleteNode(nodeId) {
  let deleted = false;
  let parentNode = findParentNode(nodeId); // Updated

  if (parentNode && parentNode.children) {
    // It's a child node
    const originalLength = parentNode.children.length;
    parentNode.children = parentNode.children.filter(child => child.id !== nodeId);
    if (parentNode.children.length < originalLength) {
        deleted = true;
        showFeedback(`Node "${nodeId}" and its children deleted from parent "${parentNode.id}".`, false);
    }
  } else {
    // Not found as a child, try to remove from root nodes array
    const originalRootsLength = mindmapData.nodes.length;
    mindmapData.nodes = mindmapData.nodes.filter(rootNode => rootNode.id !== nodeId);
    if (mindmapData.nodes.length < originalRootsLength) {
        deleted = true;
        showFeedback(`Floating/Root node "${nodeId}" and its children deleted.`, false);
    }
  }

  if (!deleted) {
    console.warn(`deleteNode: Node with ID "${nodeId}" not found.`);
    showFeedback(`Node "${nodeId}" not found for deletion.`, true);
    return;
  }

  if (selectedNodeId === nodeId) {
    selectedNodeId = null; // Clear selection if deleted node was selected
    // Optionally, select parent or another root node here
     if (parentNode) {
        selectedNodeId = parentNode.id;
        // Attempt to visually select the parent element if it exists in DOM
        const parentElement = mindmapContainer.querySelector(`.mindmap-node[data-id='${parentNode.id}']`);
        if (parentElement) parentElement.classList.add('selected-node');
    } else if (mindmapData.nodes.length > 0) {
        selectedNodeId = mindmapData.nodes[0].id; // Select the first available root
        const firstRootElement = mindmapContainer.querySelector(`.mindmap-node[data-id='${selectedNodeId}']`);
        if (firstRootElement) firstRootElement.classList.add('selected-node');
    }
  }

  // Handle case of empty mindmap after deletion
  if (mindmapData.nodes.length === 0) {
    // Option 1: Initialize a new default root
    initializeDefaultMindmapData();
    showFeedback("All nodes deleted. New default map started.", false);
    // Option 2: Allow an empty map (comment out initializeDefaultMindmapData above)
    // console.log("All nodes deleted. Mindmap is now empty.");
    // showFeedback("All nodes deleted. Mindmap is empty.", false);
  }

  renderMindmap(mindmapData, 'mindmap-container');
  saveMindmapToLocalStorage();
}

function editNodeText(nodeId, newText) {
  const node = findNodeById(nodeId); // Updated
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

// --- New Node Creation Functions ---
// (promptAndAddChild, addChildNode, promptAndAddSibling, addSiblingNode can largely remain the same,
// as they rely on findNodeById and findParentNode which are being updated)

function promptAndAddChild(parentId) {
  const text = prompt('Enter text for new child node:');
  if (text !== null && text.trim() !== '') {
    addChildNode(parentId, text.trim()); // addChildNode uses createNode internally now if parent exists
  }
}

function addChildNode(parentId, text) {
  // This function now primarily serves as a wrapper for createNode when a parent is specified.
  // createNode itself handles adding to parent's children.
  const parentNode = findNodeById(parentId); // Check if parent exists
  if (!parentNode) {
    console.error(`addChildNode: Parent node with ID "${parentId}" not found.`);
    showFeedback(`Error: Could not find parent to add child to.`, true);
    return null;
  }
  // Pass through nodeData object
  return createNode(parentId, { text: text, notes: '', table: null, image: null, chart: null });
}

function promptAndAddSibling(siblingId) {
  const text = prompt('Enter text for new sibling node:');
  if (text !== null && text.trim() !== '') {
    addSiblingNode(siblingId, text.trim());
  }
}

function addSiblingNode(siblingId, text) {
  const parentNode = findParentNode(siblingId); // Updated findParentNode
  if (!parentNode) {
    // If no parent, it means siblingId might be a root/floating node.
    // In this case, adding a "sibling" means creating another root/floating node.
    // console.log(`addSiblingNode: Node ID "${siblingId}" has no parent. Creating a new floating node.`);
    return createNode(null, { text: text, notes: '', table: null, image: null, chart: null }); // Create a new floating node
  }
  // If parent exists, create a new child under that same parent.
  return createNode(parentNode.id, { text: text, notes: '', table: null, image: null, chart: null });
}


// Updated createNode: Handles creating floating nodes or child nodes.
function createNode(parentNodeId, nodeData) {
  const newNode = {
    id: generateNodeId(),
    text: nodeData.text || 'New Node',
    notes: nodeData.notes || '',
    table: nodeData.table || null,
    image: nodeData.image || null,
    chart: nodeData.chart || null,
    children: Array.isArray(nodeData.children) ? nodeData.children : [],
    isManuallyPositioned: nodeData.isManuallyPositioned || false,
    isCollapsed: nodeData.isCollapsed || false,
    // Spread other properties from nodeData first
    ...nodeData,
    // Then apply/override with defaults or theme-based styles for style and font
    style: JSON.parse(JSON.stringify(mindmapThemes[currentThemeName].node)),
    font: JSON.parse(JSON.stringify(mindmapThemes[currentThemeName].node.font)),
  };
  // Merge any specific style or font data passed in nodeData over the theme defaults
  if(nodeData.style) {
    Object.assign(newNode.style, nodeData.style);
  }
  if(nodeData.font) {
    Object.assign(newNode.font, nodeData.font);
  }
  // Remove font from style object as it's a separate top-level property in nodeData for the node itself
  if (newNode.style && newNode.style.font) {
    delete newNode.style.font;
  }

   // Re-apply specific defaults if they were overwritten by spread of a partial nodeData
  newNode.id = newNode.id || generateNodeId(); // Ensure ID is always there
  newNode.text = nodeData.text || 'New Node'; // Prioritize nodeData.text
  newNode.notes = nodeData.notes || '';
  newNode.children = Array.isArray(nodeData.children) ? nodeData.children : [];
  newNode.isManuallyPositioned = typeof (nodeData.isManuallyPositioned) === 'boolean' ? nodeData.isManuallyPositioned : false;
  newNode.isCollapsed = typeof (nodeData.isCollapsed) === 'boolean' ? nodeData.isCollapsed : false;


  if (parentNodeId === null || parentNodeId === undefined) {
    // Create a new floating/root node
    newNode.x = newNode.x || Math.random() * 200 + 10; // Random initial position for new floating nodes
    newNode.y = newNode.y || Math.random() * 100 + 10; // Add some randomness to avoid exact stacking
    if (mindmapData.nodes.length === 0) { // If this is the VERY first node ever, position it like a root
        newNode.x = 50;
        newNode.y = 50;
    }
    mindmapData.nodes.push(newNode);
    showFeedback(`Floating node "${newNode.text}" created.`, false);
  } else {
    const parentNode = findNodeById(parentNodeId); // Updated findNodeById
    if (!parentNode) {
      console.error(`createNode: Parent node with ID "${parentNodeId}" not found.`);
      showFeedback(`Error: Parent node "${parentNodeId}" not found. Cannot create new node.`, true);
      return null;
    }
    // New child nodes are laid out, so x/y are not taken from nodeData directly for child.
    delete newNode.x;
    delete newNode.y;

    if (!parentNode.children) {
      parentNode.children = [];
    }
    parentNode.children.push(newNode);

    if (parentNode.isCollapsed && parentNode.children.length === 1) {
      parentNode.isCollapsed = false;
    }
    showFeedback(`Node "${newNode.text}" added as child to "${parentNode.text}".`, false);
  }

  renderMindmap(mindmapData, 'mindmap-container');
  saveMindmapToLocalStorage();
  return newNode;
}

// Updated addCentralTopic: Works with the new mindmapData.nodes structure.
function addCentralTopic(topicData) {
  if (mindmapData.nodes && mindmapData.nodes.length > 0) {
    // Update the first node in the array as the main root
    let mainRootNode = mindmapData.nodes[0];
    mainRootNode.text = topicData.text !== undefined ? topicData.text : mainRootNode.text;
    mainRootNode.notes = topicData.notes !== undefined ? topicData.notes : mainRootNode.notes;
    // Preserve other essential properties if not in topicData
    mainRootNode.children = mainRootNode.children || []; // Should always exist, but good practice
    mainRootNode.x = topicData.x !== undefined ? topicData.x : (mainRootNode.x || 50);
    mainRootNode.y = topicData.y !== undefined ? topicData.y : (mainRootNode.y || 50);
    mainRootNode.isManuallyPositioned = topicData.isManuallyPositioned !== undefined ? topicData.isManuallyPositioned : mainRootNode.isManuallyPositioned;
    mainRootNode.isCollapsed = topicData.isCollapsed !== undefined ? topicData.isCollapsed : mainRootNode.isCollapsed;


    // Update any other properties provided in topicData (except those handled above)
    for (const key in topicData) {
      if (topicData.hasOwnProperty(key) && !['id', 'children', 'x', 'y', 'isManuallyPositioned', 'text', 'notes', 'isCollapsed'].includes(key)) {
        mainRootNode[key] = topicData[key];
      }
    }
    showFeedback(`Central topic "${mainRootNode.text}" updated.`, false);
  } else {
    // Create the first node as the main root
    const newRoot = {
      id: 'root', // Default ID for the primary central topic
      text: topicData.text || 'Central Topic',
      notes: topicData.notes || '',
      table: topicData.table || null,
      image: topicData.image || null,
      chart: topicData.chart || null,
      children: topicData.children || [],
      x: topicData.x || 50,
      y: topicData.y || 50,
      isManuallyPositioned: topicData.isManuallyPositioned !== undefined ? topicData.isManuallyPositioned : false,
      isCollapsed: topicData.isCollapsed !== undefined ? topicData.isCollapsed : false,
      // Apply theme defaults first, then merge topicData specifics
      style: JSON.parse(JSON.stringify(mindmapThemes[currentThemeName].node)),
      font: JSON.parse(JSON.stringify(mindmapThemes[currentThemeName].node.font)),
      ...topicData, // Spread topicData to override any defaults including potentially style/font objects
    };
    // Explicitly merge style and font from topicData if they exist, over the theme defaults applied by spread
    if(topicData.style) Object.assign(newRoot.style, topicData.style);
    if(topicData.font) Object.assign(newRoot.font, topicData.font);

    // Remove font from style as it's a top-level property on the node itself
    if (newRoot.style && newRoot.style.font) {
        delete newRoot.style.font;
    }

    // Ensure core properties are correctly typed and defaulted after spread
    newRoot.id = newRoot.id || 'root';
    newRoot.text = newRoot.text || 'Central Topic'; // Default if topicData.text was also missing
    newRoot.notes = newRoot.notes || '';
    newRoot.children = Array.isArray(newRoot.children) ? newRoot.children : [];
    newRoot.x = typeof newRoot.x === 'number' ? newRoot.x : 50;
    newRoot.y = typeof newRoot.y === 'number' ? newRoot.y : 50;

    mindmapData.nodes = [newRoot]; // Initialize nodes array with the new root
    showFeedback(`Central topic "${newRoot.text}" created.`, false);
  }

  renderMindmap(mindmapData, 'mindmap-container');
  saveMindmapToLocalStorage();
  return mindmapData.nodes[0]; // Return the main root node
}

function applyTheme(themeName) {
  if (!mindmapThemes[themeName]) {
    console.error(`Theme "${themeName}" not found.`);
    showFeedback(`Error: Theme "${themeName}" not found.`, true);
    return;
  }
  currentThemeName = themeName; // Update the global current theme name
  const themeNodeStyle = mindmapThemes[themeName].node;

  function applyStyleToNodeRecursive(node, currentThemeNodeStyle) {
    // Deep copy theme style and font to avoid modifying the theme object itself
    // and to ensure each node gets its own style objects.
    node.style = JSON.parse(JSON.stringify(currentThemeNodeStyle));
    node.font = JSON.parse(JSON.stringify(currentThemeNodeStyle.font));

    // Remove font from style object as it's a separate top-level property in nodeData
    if (node.style && node.style.font) {
        delete node.style.font;
    }

    // Apply other direct properties from themeNodeStyle if they existed at top level of theme (not the case here)
    // Example: if themeNodeStyle had { someOtherProp: 'value' } then node.someOtherProp = ...

    if (node.children && node.children.length > 0) {
      node.children.forEach(child => applyStyleToNodeRecursive(child, currentThemeNodeStyle));
    }
  }

  mindmapData.nodes.forEach(rootNode => {
    applyStyleToNodeRecursive(rootNode, themeNodeStyle);
  });

  renderMindmap(mindmapData, 'mindmap-container');
  saveMindmapToLocalStorage();
  showFeedback(`Theme "${themeName}" applied.`, false);
}


function getSelectedNodes() {
  if (!mindmapData || !mindmapData.nodes) return [];
  return selectedNodeIds.map(id => findNodeById(id)).filter(node => node !== null);
}

function updateNode(nodeId, updatedData) {
  const nodeToUpdate = findNodeById(nodeId);

  if (!nodeToUpdate) {
    console.warn(`updateNode: Node with ID "${nodeId}" not found.`);
    showFeedback(`Error: Node "${nodeId}" not found. Cannot update.`, true);
    return null; // Or false, to indicate failure
  }

  let changed = false;
  for (const key in updatedData) {
    if (updatedData.hasOwnProperty(key)) {
      if (key === 'id' || key === 'children') {
        console.warn(`updateNode: Attempted to update restricted property "${key}". Skipping.`);
        continue;
      }
      // Handle nested style and font objects by merging
      if (key === 'style' && typeof updatedData.style === 'object' && updatedData.style !== null) {
        if (!nodeToUpdate.style) nodeToUpdate.style = {}; // Ensure style object exists
        for (const styleKey in updatedData.style) {
          if (updatedData.style.hasOwnProperty(styleKey) && nodeToUpdate.style[styleKey] !== updatedData.style[styleKey]) {
            nodeToUpdate.style[styleKey] = updatedData.style[styleKey];
            changed = true;
          }
        }
      } else if (key === 'font' && typeof updatedData.font === 'object' && updatedData.font !== null) {
        if (!nodeToUpdate.font) nodeToUpdate.font = {}; // Ensure font object exists
        for (const fontKey in updatedData.font) {
          if (updatedData.font.hasOwnProperty(fontKey) && nodeToUpdate.font[fontKey] !== updatedData.font[fontKey]) {
            nodeToUpdate.font[fontKey] = updatedData.font[fontKey];
            changed = true;
          }
        }
      } else {
        // For other properties, direct assignment if value changed
        if (nodeToUpdate[key] !== updatedData[key]) {
          nodeToUpdate[key] = updatedData[key];
          changed = true;
        }
      }
    }
  }

  if (changed) {
    // Ensure default style and font objects exist if they were not present before update
    // (though createNode and addCentralTopic should already initialize them)
    nodeToUpdate.style = {
        shape: 'rectangle', backgroundColor: '#ffffff', borderColor: '#000000', textColor: '#000000',
        ...(nodeToUpdate.style || {})
    };
    nodeToUpdate.font = {
        size: '16px', weight: 'normal', style: 'normal',
        ...(nodeToUpdate.font || {})
    };

    renderMindmap(mindmapData, 'mindmap-container');
    saveMindmapToLocalStorage();
    showFeedback(`Node "${nodeToUpdate.text}" (ID: ${nodeId}) updated.`, false);
  } else {
    showFeedback(`No changes applied to node "${nodeToUpdate.text}" (ID: ${nodeId}).`, false, true);
  }

  return nodeToUpdate;
}

// --- Rendering ---
function createNodeElement(nodeData) {
  const nodeElement = document.createElement('div');
  nodeElement.classList.add('mindmap-node');
  nodeElement.setAttribute('data-id', nodeData.id);

  // Apply styles
  if (nodeData.style) {
    nodeElement.style.backgroundColor = nodeData.style.backgroundColor || '#ffffff';
    nodeElement.style.borderColor = nodeData.style.borderColor || '#000000';
    nodeElement.style.borderWidth = '1px'; // Default border width
    nodeElement.style.borderStyle = 'solid'; // Default border style

    // Remove previous shape classes before adding the new one
    nodeElement.className = nodeElement.className.replace(/\bnode-shape-\w+/g, '').trim();
    if (nodeData.style.shape) {
      nodeElement.classList.add(`node-shape-${nodeData.style.shape}`);
    } else {
      nodeElement.classList.add('node-shape-rectangle'); // Default shape
    }
    // Example for ellipse using border-radius, actual shapes might need more complex CSS or SVG
    if (nodeData.style.shape === 'ellipse') {
        nodeElement.style.borderRadius = '50%';
    } else {
        nodeElement.style.borderRadius = '0px'; // Default for rectangle
    }
  }

  const textElement = document.createElement('span');
  textElement.classList.add('node-text');
  textElement.textContent = nodeData.text;

  // Apply font and text color
  if (nodeData.font) {
    textElement.style.fontSize = nodeData.font.size || '16px';
    textElement.style.fontWeight = nodeData.font.weight || 'normal';
    textElement.style.fontStyle = nodeData.font.style || 'normal';
  }
  if (nodeData.style && nodeData.style.textColor) {
    textElement.style.color = nodeData.style.textColor || '#000000';
  }
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
    imgElement.src = nodeData.image.src;
    imgElement.alt = nodeData.image.alt || 'Node image';

    imgElement.onload = () => {
        // console.log(`Image loaded: ${nodeData.image.src}, for node: ${nodeData.id}. Triggering re-render.`);
        if (window.mindmapData && typeof renderMindmap === 'function') {
            renderMindmap(window.mindmapData, 'mindmap-container');
        } else {
            // console.error("renderMindmap or window.mindmapData not available for image onload handler.");
        }
    };

    imgElement.onerror = () => {
        // console.error(`Failed to load image: ${nodeData.image.src}, for node: ${nodeData.id}.`);
    };

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
        needsReRenderAfterCharts = true; // Flag that a chart was encountered
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

  // "Add Child" button (always shown)
  const addChildBtn = document.createElement('button');
  addChildBtn.textContent = '+ Child';
  addChildBtn.title = 'Add a child node';
  addChildBtn.onclick = (e) => { e.stopPropagation(); promptAndAddChild(nodeData.id); };
  controlsContainer.appendChild(addChildBtn);

  // "Add Sibling" button: Now it can also mean "add new floating node" if current is a root.
  // The logic in promptAndAddSibling / addSiblingNode handles this.
  const addSiblingBtn = document.createElement('button');
  addSiblingBtn.textContent = '+ Sibling/Topic';
  addSiblingBtn.title = 'Add a sibling node or a new floating topic';
  addSiblingBtn.onclick = (e) => { e.stopPropagation(); promptAndAddSibling(nodeData.id); };
  controlsContainer.appendChild(addSiblingBtn);

  // Delete button: deleteNode function handles logic for not deleting last root etc.
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
      deleteNode(nodeData.id); // Uses updated deleteNode
    }
  };
  nodeElement.appendChild(deleteBtn); // Append to nodeElement directly
  nodeElement.appendChild(controlsContainer);

  nodeElement.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return; // Only main button
    // If the click is on a button within controls, don't treat as node selection/drag start
    if (event.target.closest && event.target.closest('.node-controls button, .collapse-toggle')) {
        // event.stopPropagation(); // Stop propagation if it's a control button
        return;
    }
    onDragStart(event, nodeData.id, nodeElement);
  });

  nodeElement.addEventListener('click', (event) => {
    // Prevent selection when clicking on controls (buttons, etc.) within the node
    if (event.target.closest && (event.target.closest('.node-controls') || event.target.closest('.collapse-toggle'))) {
      // Let button clicks propagate for their own handlers but don't select the node itself.
      return;
    }
    // If a drag didn't happen (isDragging is false or check some threshold)
    if (isDragging && draggedNodeId === nodeData.id) {
        // This logic might need refinement based on desired UX for click-vs-drag.
        // For now, if a drag happened, selection is handled by onDragEnd or this click.
    }

    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const alreadySelected = selectedNodeIds.includes(nodeData.id);

    if (isCtrlOrCmd) {
        if (alreadySelected) {
            selectedNodeIds = selectedNodeIds.filter(id => id !== nodeData.id);
            nodeElement.classList.remove('selected-node');
        } else {
            selectedNodeIds.push(nodeData.id);
            nodeElement.classList.add('selected-node');
        }
    } else {
        // Normal click: deselect all others, select this one.
        mindmapContainer.querySelectorAll('.mindmap-node.selected-node').forEach(el => {
            el.classList.remove('selected-node');
        });
        selectedNodeIds = [nodeData.id];
        nodeElement.classList.add('selected-node');
    }

    // Visually update all selections (could be optimized by only updating changes)
    // For now, simpler to clear and re-apply, or ensure above logic correctly handles individual changes.
    // The above logic should handle individual changes, but a full sync might be safer:
    mindmapContainer.querySelectorAll('.mindmap-node').forEach(el => {
        if (selectedNodeIds.includes(el.dataset.id)) {
            el.classList.add('selected-node');
        } else {
            el.classList.remove('selected-node');
        }
    });

    // console.log('Selected node IDs:', selectedNodeIds);
    event.stopPropagation(); // Stop click from bubbling to mindmapContainer to prevent immediate deselection
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

  // Redraw lines for the tree whose root is being dragged, or for all trees.
  // For simplicity during drag, we can focus on the dragged node's tree if it's a root,
  // or just the main root's tree.
  requestAnimationFrame(() => {
    clearSvgLayer();
    // Option 1: Redraw lines for the specific tree being dragged if it's a root node.
    // This requires identifying if draggedNodeId is one of mindmapData.nodes.
    // Option 2: Simpler - redraw lines for the main root (nodes[0]) or all roots.
    // Let's go with redrawing for all roots for now, as it's more generally correct.
    if (mindmapData.nodes && svgLayer) {
        mindmapData.nodes.forEach(rootNodeData => {
            const rootElement = mindmapContainer.querySelector(`.mindmap-node[data-id='${rootNodeData.id}']`);
            if (rootElement) { // Check if the root element is in the DOM
                 traverseAndDrawLines(rootElement);
            }
        });
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
      // console.error("Could not get bounding box for dragged node in onDragEnd.");
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

  const nodeData = findNodeById(draggedNodeId); // Updated
  if (nodeData) {
    nodeData.x = currentPosition.x;
    nodeData.y = currentPosition.y;
    nodeData.isManuallyPositioned = true; // Mark as manually positioned
  }
  saveMindmapToLocalStorage();
  renderMindmap(mindmapData, 'mindmap-container'); // Re-render with new position
  isDragging = false;
  draggedNodeElement = null;
  draggedNodeId = null;
}

// Updated renderMindmap: Handles the new data structure with multiple roots/floating nodes.
function renderMindmap(currentMindmapData, containerId) { // Parameter renamed for clarity
  const container = document.getElementById(containerId);
  if (!container) { console.error("Mindmap container not found!"); return; }

  let contentWrapper = document.getElementById('mindmap-content-wrapper');
  if (!contentWrapper) {
    contentWrapper = document.createElement('div');
    contentWrapper.id = 'mindmap-content-wrapper';
    // Basic styling for the wrapper, adjust as needed
    contentWrapper.style.position = 'relative'; // Or 'absolute' if container has fixed size
    contentWrapper.style.width = '100%';    // Or a large fixed size for scrollable area
    contentWrapper.style.height = '100%';   // Or a large fixed size
    container.insertBefore(contentWrapper, container.firstChild);
  }
  contentWrapper.innerHTML = ''; // Clear previous render

  let svgLayerElement = container.querySelector('#mindmap-svg-layer');
  if (!svgLayerElement) {
    svgLayerElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgLayerElement.id = 'mindmap-svg-layer';
    if (contentWrapper.nextSibling) {
        container.insertBefore(svgLayerElement, contentWrapper.nextSibling);
    } else {
        container.appendChild(svgLayerElement);
    }
  }
  svgLayer = svgLayerElement;
  clearSvgLayer();

  if (!currentMindmapData || !currentMindmapData.nodes || currentMindmapData.nodes.length === 0) {
    console.log("No nodes to render.");
    // Optionally, display a message in the UI like "Mindmap is empty. Add a central topic or a new node."
    return;
  }

  const tempContainer = getOrCreateTempMeasurementContainer();

  // Iterate over each root/floating node in mindmapData.nodes
  currentMindmapData.nodes.forEach((rootNodeData, index) => {
    // 1. Calculate dimensions for this tree
    calculateAndStoreNodeDimensions(rootNodeData, tempContainer);
    calculateSubtreeDimensionsRecursive(rootNodeData);

    // 2. Calculate layout for this tree
    // The first node (index 0) is treated as the main root and centered.
    // Other nodes (floating topics) will use their stored x/y or a default.
    if (index === 0) { // If it's the main root
      if (mindmapContainer) {
        calculateTreeLayout(rootNodeData, mindmapContainer.offsetWidth);
      } else {
        calculateTreeLayout(rootNodeData, 600); // Fallback width
      }
    } else {
      // For other floating nodes, ensure they have x/y.
      // If not manually positioned and no x/y, assign a default cascaded/random position.
      if (!rootNodeData.isManuallyPositioned && (typeof rootNodeData.x !== 'number' || typeof rootNodeData.y !== 'number')) {
        rootNodeData.x = 50 + (index * 20); // Simple cascade for now
        rootNodeData.y = 50 + (index * 20); // Will need better placement strategy
      }
    }

    // 3. Create and append the DOM element for this root/floating node
    const nodeElement = createNodeElement(rootNodeData);
    nodeElement.style.position = 'absolute';
    nodeElement.style.left = (rootNodeData.x || 0) + 'px';
    nodeElement.style.top = (rootNodeData.y || 0) + 'px';
    contentWrapper.appendChild(nodeElement);

    // Recapture final dimensions after DOM insertion (optional, but good for accuracy)
    const finalBox = getBoundingBox(nodeElement, mindmapContainer);
    if (finalBox) {
      rootNodeData.width = finalBox.width;
      rootNodeData.height = finalBox.height;
    }
    // Children are rendered recursively by createNodeElement calling renderChildren.
  });

  // Draw connection lines for all rendered trees
  requestAnimationFrame(() => {
    clearSvgLayer();
    currentMindmapData.nodes.forEach(rootNodeData => {
      const rootElementForLines = contentWrapper.querySelector(`.mindmap-node[data-id='${rootNodeData.id}']`);
      if (rootElementForLines && svgLayer) {
        traverseAndDrawLines(rootElementForLines); // traverseAndDrawLines works per tree
      }
    });
  });


  if (needsReRenderAfterCharts) {
    if (chartReRenderTimer) {
        clearTimeout(chartReRenderTimer); // Clear any existing timer
    }
    chartReRenderTimer = setTimeout(() => {
        // console.log('[Mindmap Log] Executing delayed re-render after chart rendering.');
        needsReRenderAfterCharts = false; // Reset flag BEFORE the call
        chartReRenderTimer = null; // Clear the timer ID
        if (window.mindmapData && typeof renderMindmap === 'function') { // Ensure globals still exist
            renderMindmap(window.mindmapData, 'mindmap-container');
        } else {
            // console.error("[Mindmap Log] Cannot execute delayed re-render: mindmapData or renderMindmap no longer available.");
        }
    }, 250); // Delay of 250ms (adjust if needed)
  }
}

function clearSvgLayer() {
  if (svgLayer) {
    while (svgLayer.firstChild) svgLayer.removeChild(svgLayer.firstChild);
  }
}

// Updated drawConnectionLine: Takes parentElementData to access connector styles.
function drawConnectionLine(parentElementData, childElement, parentElementDom) { // Renamed parentElement to parentElementDom for clarity
  if (!svgLayer || !parentElementDom || !childElement || !parentElementData || !parentElementData.style) return;

  const mindmapContainerElem = document.getElementById('mindmap-container');
  if (!mindmapContainerElem) return;

  const containerRect = mindmapContainerElem.getBoundingClientRect();
  const scrollLeft = mindmapContainerElem.scrollLeft;
  const scrollTop = mindmapContainerElem.scrollTop;

  const parentRect = parentElementDom.getBoundingClientRect();
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

// Updated traverseAndDrawLines: Operates on a single tree starting from nodeElement.
// findNodeById is now global, doesn't need mindmapData.root passed.
function traverseAndDrawLines(nodeElement) { // nodeElement is a root of a tree (or subtree)
  if (!nodeElement) return;
  const nodeId = nodeElement.getAttribute('data-id');
  if (!nodeId) return;

  const nodeData = findNodeById(nodeId); // Uses updated findNodeById

  if (nodeData && nodeData.children && nodeData.children.length > 0 && !nodeData.isCollapsed) {
    const childrenContainer = nodeElement.querySelector('.mindmap-children-container');
    if (childrenContainer) {
      const childNodeElements = Array.from(childrenContainer.children).filter(el => el.matches('.mindmap-node'));
      childNodeElements.forEach(childElement => {
        // Ensure childElement is actually a direct child node element
        if (childElement.classList.contains('mindmap-node')) {
            drawConnectionLine(nodeElement, childElement);
            traverseAndDrawLines(childElement); // Recurse for children of this child
        }
      });
    }
  }
}

// Updated renderChildren: Renders children of a given parentNodeElement.
// mainMindmapContainer is the top-level container for coordinate calculations.
function renderChildren(childrenData, parentNodeElement, mainMindmapContainer) {
  const childrenContainer = parentNodeElement.querySelector('.mindmap-children-container');
  if (!childrenContainer) {
    console.error("Critical: .mindmap-children-container missing in parent for renderChildren:", parentNodeElement.dataset.id);
    return;
  }
  childrenContainer.innerHTML = ''; // Clear previous children in this container

  // Child node elements created by createNodeElement will be appended here.
  // Their positions (childData.x, childData.y) are assumed to be global,
  // so they need to be made relative to the parentNodeElement for correct placement
  // within its childrenContainer.

  const parentNodeData = findNodeById(parentNodeElement.dataset.id);
  if (!parentNodeData || typeof parentNodeData.x !== 'number' || typeof parentNodeData.y !== 'number') {
      console.error("renderChildren: Parent node data or its position is invalid for node ID:", parentNodeElement.dataset.id);
      return;
  }


  childrenData.forEach(childData => {
    const childNodeElement = createNodeElement(childData); // This will recursively call renderChildren if childData has children

    // Position childNodeElement relative to its parentNodeElement.
    // childData.x and childData.y are global coordinates from calculateTreeLayout.
    // parentNodeData.x and parentNodeData.y are also global.
    // The child's CSS left/top should be (childGlobalX - parentGlobalX) and (childGlobalY - parentGlobalY).
    if (typeof childData.x === 'number' && typeof childData.y === 'number') {
        childNodeElement.style.position = 'absolute';
        childNodeElement.style.left = (childData.x - parentNodeData.x) + 'px';
        childNodeElement.style.top = (childData.y - parentNodeData.y) + 'px';
    } else {
        // Fallback if child positions are not set (should not happen after layout)
        childNodeElement.style.position = 'absolute';
        childNodeElement.style.left = '10px'; // Default relative position
        childNodeElement.style.top = '10px';
        console.warn("renderChildren: Child node", childData.id, "missing x/y coordinates.");
    }
    childrenContainer.appendChild(childNodeElement);
  });

  // Adjust height of childrenContainer based on the relative positions of children
  // This might not be strictly necessary if parent's height is determined by its own content + CSS.
  // However, if explicit height is needed for line drawing or layout:
  if (childrenData.length > 0) {
    let maxRelativeY = 0;
    childrenData.forEach(cd => {
        const childNode = findNodeById(cd.id); // Re-fetch to ensure updated height
        if (childNode && typeof childNode.y === 'number' && typeof childNode.height === 'number') {
            const relativeY = childNode.y - parentNodeData.y;
            maxRelativeY = Math.max(maxRelativeY, relativeY + childNode.height);
        }
    });
    childrenContainer.style.height = (maxRelativeY + 10) + 'px'; // 10 for some padding
  } else {
    childrenContainer.style.height = 'auto';
  }
}
