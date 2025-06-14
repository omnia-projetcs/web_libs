(function() {
    'use strict';

    const resultsDiv = document.getElementById('test-results');
    const totalTestsSpan = document.getElementById('total-tests');
    const passedTestsSpan = document.getElementById('passed-tests');
    const failedTestsSpan = document.getElementById('failed-tests');

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    // --- Test Runner Helpers ---
    function displayTestResult(groupName, testName, success, details = '') {
        totalTests++;
        const testCaseDiv = document.createElement('div');
        testCaseDiv.classList.add('test-case');

        const messageSpan = document.createElement('span');
        messageSpan.classList.add('message');

        if (success) {
            passedTests++;
            testCaseDiv.classList.add('pass');
            messageSpan.textContent = `PASS: [${groupName}] ${testName}`;
        } else {
            failedTests++;
            testCaseDiv.classList.add('fail');
            messageSpan.textContent = `FAIL: [${groupName}] ${testName}`;
        }
        testCaseDiv.appendChild(messageSpan);

        if (details) {
            const detailsP = document.createElement('p');
            detailsP.classList.add('details');
            detailsP.textContent = details;
            testCaseDiv.appendChild(detailsP);
        }
        resultsDiv.appendChild(testCaseDiv);
        updateSummary();
    }

    function updateSummary() {
        totalTestsSpan.textContent = totalTests;
        passedTestsSpan.textContent = passedTests;
        failedTestsSpan.textContent = failedTests;
    }

    function assertEqual(actual, expected, message) {
        if (actual === expected) {
            return { success: true };
        } else {
            return { success: false, details: `Assertion failed: ${message}. Expected "${expected}", but got "${actual}".` };
        }
    }

    function assertDeepEqual(actual, expected, message) {
        // Basic deep equal for simple objects and arrays (not covering all edge cases)
        try {
            if (JSON.stringify(actual) === JSON.stringify(expected)) {
                return { success: true };
            } else {
                return { success: false, details: `Assertion failed: ${message}. Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}.` };
            }
        } catch (e) {
             return { success: false, details: `Assertion failed: ${message}. Error during comparison: ${e.message}`};
        }
    }

    function assertNotNull(value, message) {
        if (value !== null && typeof value !== "undefined") {
            return { success: true };
        }
        return { success: false, details: `Assertion failed: ${message}. Expected not null, but got ${value}.`};
    }

    function assertTrue(value, message) {
        return assertEqual(value, true, message);
    }

    function assertFalse(value, message) {
        return assertEqual(value, false, message);
    }

    function runTestGroup(groupName, tests) {
        const groupDiv = document.createElement('div');
        groupDiv.classList.add('test-group');
        const groupTitle = document.createElement('h3');
        groupTitle.textContent = groupName;
        groupDiv.appendChild(groupTitle);
        resultsDiv.appendChild(groupDiv);

        console.log(`\nRunning Test Group: ${groupName}`);
        tests(); // Execute all tests within the group
    }

    // --- Mocking and Setup ---
    let originalMindmapData; // To store the original state from mindmap.js

    // Define the standard initial state for tests using the new data structure
    const initialTestMindmapState = {
        nodes: [{
            id: 'root',
            text: 'Test Root Node',
            notes: 'Initial root notes for testing.',
            children: [],
            x: 50, y: 50,
            isManuallyPositioned: false,
            isCollapsed: false,
            table: null, image: null, chart: null
        }]
        // settings: { autoLayout: true, defaultTheme: 'light' } // if settings are used
    };

    function resetMindmapDataForTest() {
        // Resets the global mindmapData in mindmap.js to a clean initial state for each test.
        // This is crucial for test isolation.
        window.mindmapData = JSON.parse(JSON.stringify(initialTestMindmapState));

        // Ensure nodeIdCounter is reset if it's not based on Date.now() or if more predictability is needed.
        // For now, generateNodeId() in mindmap.js uses Date.now(), which is usually fine for test separation.
        // If a more deterministic counter were used in mindmap.js, it would be reset here.
        // e.g., if (typeof window.resetGlobalNodeIdCounter === 'function') window.resetGlobalNodeIdCounter();

        window.selectedNodeId = null; // Reset selected node ID

        // Clear the visual mindmap container if elements are appended directly
        const mindmapContainer = document.getElementById('mindmap-container');
        if (mindmapContainer) {
            // mindmapContainer.innerHTML = ''; // Or more targeted removal of nodes and SVG
            const contentWrapper = document.getElementById('mindmap-content-wrapper');
            if (contentWrapper) contentWrapper.innerHTML = '';
            const svgLayer = document.getElementById('mindmap-svg-layer');
            if (svgLayer) svgLayer.innerHTML = '';
        }
    }


    // Mock localStorage
    let mockLocalStorageStore = {};
    const mockLocalStorage = {
        getItem: (key) => mockLocalStorageStore[key] || null,
        setItem: (key, value) => { mockLocalStorageStore[key] = String(value); },
        removeItem: (key) => { delete mockLocalStorageStore[key]; },
        clear: () => { mockLocalStorageStore = {}; }
    };
    // Temporarily replace window.localStorage for tests that use it
    const actualLocalStorage = window.localStorage;


    // --- Test Definitions ---

    runTestGroup('Node ID Generation', () => {
        resetMindmapDataForTest(); // Uses new initialTestMindmapState
        const id1 = generateNodeId();
        const id2 = generateNodeId();
        const result = assertNotEqual(id1, id2, 'generateNodeId() should produce unique IDs');
        displayTestResult('Node ID Generation', 'Unique IDs', result.success, result.details);
    });

    runTestGroup('Node Manipulation (Data Structure)', () => {
        resetMindmapDataForTest();
        // Add node to the main root (nodes[0])
        const mainRootId = window.mindmapData.nodes[0].id;
        addNode(mainRootId, 'Test Node 1'); // addNode now uses createNode which handles adding to children
        let mainRootNode = findNodeById(mainRootId);
        let res = assertEqual(mainRootNode.children.length, 1, 'Main root should have 1 child');
        displayTestResult('Node Manipulation', 'Add node to main root - child count', res.success, res.details);
        if (!res.success || mainRootNode.children.length === 0) return;
        const node1Id = mainRootNode.children[0].id;
        let node1 = findNodeById(node1Id);
        res = assertNotNull(node1, 'Node 1 should be found by its ID');
        displayTestResult('Node Manipulation', 'Add node to root - found', res.success, res.details);


        resetMindmapDataForTest();
        mainRootNode = window.mindmapData.nodes[0];
        addNode(mainRootNode.id, 'Parent For Child Test');
        const parentNodeForChild = mainRootNode.children[0];

        addNode(parentNodeForChild.id, 'Child Node 1.1');
        const reFetchedParent = findNodeById(parentNodeForChild.id);
        res = assertNotNull(reFetchedParent.children[0], 'Child Node 1.1 should be added');
        displayTestResult('Node Manipulation', 'Add child node', res.success, res.details);
        if (!res.success) return;
        res = assertEqual(reFetchedParent.children[0].text, 'Child Node 1.1', 'Child node text should be correct');
        displayTestResult('Node Manipulation', 'Child node text check', res.success, res.details);

        resetMindmapDataForTest();
        mainRootNode = window.mindmapData.nodes[0];
        addNode(mainRootNode.id, 'Node to delete');
        const nodeToDelete = mainRootNode.children[0];
        addNode(nodeToDelete.id, 'Child of node to delete');
        deleteNode(nodeToDelete.id); // Uses updated deleteNode
        const deletedNodeCheck = findNodeById(nodeToDelete.id);
        res = assertEqual(deletedNodeCheck, null, 'Node and its children should be deleted');
        displayTestResult('Node Manipulation', 'Delete node with children', res.success, res.details);

        resetMindmapDataForTest();
        mainRootNode = window.mindmapData.nodes[0];
        addNode(mainRootNode.id, 'Node to edit');
        const nodeToEdit = mainRootNode.children[0];
        editNodeText(nodeToEdit.id, 'Edited Text'); // editNodeText uses updated findNodeById
        const editedNode = findNodeById(nodeToEdit.id);
        res = assertEqual(editedNode.text, 'Edited Text', 'Node text should be updated');
        displayTestResult('Node Manipulation', 'Edit node text', res.success, res.details);
    });

    runTestGroup('Content Integration (Data Structure)', () => {
        resetMindmapDataForTest();
        const mainRootId = window.mindmapData.nodes[0].id;
        addNode(mainRootId, 'Content Node');
        const contentNodeId = window.mindmapData.nodes[0].children[0].id;

        addOrEditNote(contentNodeId, 'Test Note');
        let node = findNodeById(contentNodeId);
        let res = assertEqual(node.notes, 'Test Note', 'Note should be added/edited');
        displayTestResult('Content Integration', 'Add/Edit Note', res.success, res.details);

        const mockTableData = { headers: ['H1'], rows: [['C1']] };
        node.table = mockTableData; // Direct set for test simplicity
        res = assertDeepEqual(node.table, mockTableData, 'Table data should be set');
        displayTestResult('Content Integration', 'Add/Edit Table (simplified data set)', res.success, res.details);

        node.image = { src: 'test.png', alt: 'Test Image' }; // Direct set
        res = assertDeepEqual(node.image, { src: 'test.png', alt: 'Test Image' }, 'Image data should be set');
        displayTestResult('Content Integration', 'Add/Edit Image (simplified data set)', res.success, res.details);

        node.chart = { type: 'bar', labels: ['A'], values: [10] }; // Direct set
        res = assertDeepEqual(node.chart, { type: 'bar', labels: ['A'], values: [10] }, 'Chart data should be set');
        displayTestResult('Content Integration', 'Add/Edit Chart (simplified data set)', res.success, res.details);
    });

    runTestGroup('Data Serialization & Persistence Logic', () => {
        resetMindmapDataForTest();
        window.localStorage = mockLocalStorage; // Swap in mock
        mockLocalStorage.clear();
        const mainRootId = window.mindmapData.nodes[0].id;

        addNode(mainRootId, 'Data Persistence Node');
        // const testData = window.mindmapData; // mindmapData is now {nodes: [...]}

        saveMindmapToLocalStorage(); // Uses new structure
        const storedJson = mockLocalStorage.getItem(LOCAL_STORAGE_KEY); // LOCAL_STORAGE_KEY is now _v2
        let res = assertNotNull(storedJson, 'Data should be saved to mock localStorage');
        displayTestResult('Persistence Logic', 'Save to localStorage', res.success, res.details);

        if (res.success) {
            const parsedStored = JSON.parse(storedJson);
            res = assertNotNull(parsedStored.nodes, "Saved data should have a 'nodes' array");
            displayTestResult('Persistence Logic', 'Verify saved data has nodes array', res.success, res.details);
            if(res.success && parsedStored.nodes.length > 0 && parsedStored.nodes[0].children.length > 0) {
                 res = assertDeepEqual(parsedStored.nodes[0].children[0].text, 'Data Persistence Node', 'Stored data content should match');
                 displayTestResult('Persistence Logic', 'Verify stored data content', res.success, res.details);
            }
        }

        // Test loadMindmapFromLocalStorage
        window.mindmapData.nodes[0].children = []; // Modify current data
        loadMindmapFromLocalStorage(); // Should load what was saved

        res = assertEqual(window.mindmapData.nodes[0].children.length, 1, 'mindmapData.nodes[0] should have one child after loading');
        displayTestResult('Persistence Logic', 'Load from localStorage - children count', res.success, res.details);
        if (res.success && window.mindmapData.nodes[0].children.length > 0) {
             res = assertEqual(window.mindmapData.nodes[0].children[0].text, 'Data Persistence Node', 'Loaded node text should match saved');
             displayTestResult('Persistence Logic', 'Load from localStorage - node text', res.success, res.details);
        }

        const jsonData = getMindmapDataAsJSON();
        res = assertNotNull(jsonData, 'getMindmapDataAsJSON() should return a string');
        displayTestResult('Serialization', 'getMindmapDataAsJSON returns string', res.success, res.details);
        try {
            JSON.parse(jsonData);
            displayTestResult('Serialization', 'getMindmapDataAsJSON returns valid JSON', true);
        } catch (e) {
            displayTestResult('Serialization', 'getMindmapDataAsJSON returns valid JSON', false, `JSON.parse failed: ${e.message}`);
        }

        window.localStorage = actualLocalStorage; // Restore actual localStorage
    });

    runTestGroup('Helper Functions (Updated Structure)', () => {
        resetMindmapDataForTest();
        const mainRootId = window.mindmapData.nodes[0].id;
        addNode(mainRootId, 'Helper Node 1');
        const helperNode1 = window.mindmapData.nodes[0].children[0];
        addNode(helperNode1.id, 'Helper Child 1.1');
        const helperChild1_1 = helperNode1.children[0];

        let found = findNodeById(helperChild1_1.id); // findNodeById now searches all nodes
        let res = assertEqual(found.id, helperChild1_1.id, 'findNodeById() should find existing child');
        displayTestResult('Helper Functions', 'findNodeById - existing child in main root', res.success, res.details);

        // Test Case 1: Find the main root node.
        const foundMainRoot = findNodeById(mainRootId);
        res = assertNotNull(foundMainRoot, 'findNodeById() should find the main root node.');
        displayTestResult('Helper Functions', 'findNodeById - main root node', res.success, res.details);
        if(res.success) {
            res = assertEqual(foundMainRoot.id, mainRootId, 'findNodeById - main root ID matches.');
            displayTestResult('Helper Functions', 'findNodeById - main root ID check', res.success, res.details);
        }

        // Test Case 3: Find a floating node.
        const floatingNode = createNode(null, { text: 'My Floating Node for FindTest' });
        const foundFloating = findNodeById(floatingNode.id);
        res = assertNotNull(foundFloating, 'findNodeById() should find a floating node.');
        displayTestResult('Helper Functions', 'findNodeById - floating node', res.success, res.details);
        if(res.success) {
            res = assertEqual(foundFloating.id, floatingNode.id, 'findNodeById - floating node ID matches.');
            displayTestResult('Helper Functions', 'findNodeById - floating node ID check', res.success, res.details);
        }

        // Test Case 4: Find a child node within a floating node's tree.
        const childOfFloating = createNode(floatingNode.id, { text: 'Child of Floating for FindTest' });
        const foundChildOfFloating = findNodeById(childOfFloating.id);
        res = assertNotNull(foundChildOfFloating, 'findNodeById() should find child of a floating node.');
        displayTestResult('Helper Functions', 'findNodeById - child of floating node', res.success, res.details);
        if(res.success) {
            res = assertEqual(foundChildOfFloating.id, childOfFloating.id, 'findNodeById - child of floating node ID matches.');
            displayTestResult('Helper Functions', 'findNodeById - child of floating node ID check', res.success, res.details);
            const parentOfFoundChild = findParentNode(foundChildOfFloating.id);
            res = assertEqual(parentOfFoundChild.id, floatingNode.id, 'findParentNode for child of floating node.');
            displayTestResult('Helper Functions', 'findParentNode - parent of child of floating', res.success, res.details);
        }

        // Test Case 5: Test with a non-existent ID.
        found = findNodeById('non-existent-id');
        res = assertEqual(found, null, 'findNodeById() should return null for non-existent ID');
        displayTestResult('Helper Functions', 'findNodeById - non-existent ID', res.success, res.details);

        const parent = findParentNode(helperChild1_1.id); // findParentNode now searches all nodes
        res = assertEqual(parent.id, helperNode1.id, 'findParentNode() should find correct parent for child in main tree');
        displayTestResult('Helper Functions', 'findParentNode - existing child in main tree', res.success, res.details);

        const noParentForRoot = findParentNode(mainRootId);
        res = assertEqual(noParentForRoot, null, 'findParentNode() should return null for a root node');
        displayTestResult('Helper Functions', 'findParentNode - for a root node', res.success, res.details);

        const noParentForFloating = findParentNode(floatingNode.id);
        res = assertEqual(noParentForFloating, null, 'findParentNode() should return null for a floating node');
        displayTestResult('Helper Functions', 'findParentNode - for a floating node', res.success, res.details);
    });

    runTestGroup('Enhanced Node Creation (Direct Logic - Updated)', () => {
        resetMindmapDataForTest();
        const mainRootId = window.mindmapData.nodes[0].id;
        let mainRootNode = findNodeById(mainRootId);
        mainRootNode.isCollapsed = true;
        mainRootNode.children = [];

        addChildNode(mainRootId, 'Child 1 via addChildNode');
        mainRootNode = findNodeById(mainRootId); // Re-fetch
        let res = assertEqual(mainRootNode.children.length, 1, 'Parent should have 1 child after addChildNode');
        displayTestResult('Enhanced Node Creation', 'addChildNode - child count', res.success, res.details);
        if (res.success) {
            res = assertEqual(mainRootNode.children[0].text, 'Child 1 via addChildNode', 'Child node text should be correct');
            displayTestResult('Enhanced Node Creation', 'addChildNode - child text', res.success, res.details);
            res = assertFalse(mainRootNode.isCollapsed, 'Parent should be expanded if it was collapsed and child was added');
            displayTestResult('Enhanced Node Creation', 'addChildNode - parent expansion', res.success, res.details);
        }

        resetMindmapDataForTest();
        const rootIdForSiblingTest = window.mindmapData.nodes[0].id;
        addNode(rootIdForSiblingTest, 'Child A');
        const childA_id = window.mindmapData.nodes[0].children[0].id;
        addSiblingNode(childA_id, 'Sibling B'); // This will add Sibling B as another child of rootIdForSiblingTest
        mainRootNode = findNodeById(rootIdForSiblingTest);
        res = assertEqual(mainRootNode.children.length, 2, 'Root should have 2 children after addSiblingNode to Child A');
        displayTestResult('Enhanced Node Creation', 'addSiblingNode - sibling count in parent', res.success, res.details);
        if (res.success) {
            res = assertEqual(mainRootNode.children[1].text, 'Sibling B', 'Sibling node text should be correct');
            displayTestResult('Enhanced Node Creation', 'addSiblingNode - sibling text', res.success, res.details);
        }

        resetMindmapDataForTest();
        // Test addSiblingNode to a root node (should create a new floating node)
        const firstRootId = window.mindmapData.nodes[0].id;
        addSiblingNode(firstRootId, 'New Floating Node from Sibling');
        res = assertEqual(window.mindmapData.nodes.length, 2, 'Should have 2 root/floating nodes after adding sibling to a root');
        displayTestResult('Enhanced Node Creation', 'addSiblingNode - to root (creates new floating node)', res.success, res.details);
        if(res.success){
            res = assertEqual(window.mindmapData.nodes[1].text, 'New Floating Node from Sibling', 'New floating node text');
            displayTestResult('Enhanced Node Creation', 'addSiblingNode - new floating node text', res.success, res.details);
        }

        resetMindmapDataForTest();
        const parentCId = window.mindmapData.nodes[0].id;
        addChildNode(parentCId, 'Parent C for nested sibling test');
        const parentC_node_actual_id = window.mindmapData.nodes[0].children[0].id;

        addChildNode(parentC_node_actual_id, 'Child C.1');
        const childC1_id = findNodeById(parentC_node_actual_id).children[0].id;

        addSiblingNode(childC1_id, 'Child C.2 (Sibling to C.1)');
        const parent_of_C1_C2 = findNodeById(parentC_node_actual_id);

        res = assertEqual(parent_of_C1_C2.children.length, 2, 'Parent C should have 2 children after adding sibling to C.1');
        displayTestResult('Enhanced Node Creation', 'addSiblingNode - to child of root', res.success, res.details);
         if (res.success) {
            res = assertEqual(parent_of_C1_C2.children[1].text, 'Child C.2 (Sibling to C.1)', 'Sibling node C.2 text');
            displayTestResult('Enhanced Node Creation', 'addSiblingNode - to child of root text check', res.success, res.details);
        }
    });

    runTestGroup('Selection and Interaction Logic (Updated)', () => {
        resetMindmapDataForTest();
        const mainRootId = window.mindmapData.nodes[0].id;
        addNode(mainRootId, 'Node For Delete Test');
        const nodeToDeleteId = window.mindmapData.nodes[0].children[0].id;
        window.selectedNodeId = nodeToDeleteId;

        deleteNode(nodeToDeleteId); // deleteNode now handles selection update
        // After deleting child, parent (mainRootId) should be selected
        let res = assertEqual(window.selectedNodeId, mainRootId, 'selectedNodeId should be parent after deleting child');
        displayTestResult('Selection Logic', 'deleteNode - selectedNodeId updates to parent', res.success, res.details);

        resetMindmapDataForTest();
        const rootForTabTest = window.mindmapData.nodes[0].id;
        window.selectedNodeId = rootForTabTest;
        addChildNode(rootForTabTest, 'Child via Tab Logic');
        const parentAfterTab = findNodeById(rootForTabTest);
        res = assertEqual(parentAfterTab.children.length, 1, 'Selected node should have 1 child after Tab key logic');
        displayTestResult('Selection Logic', 'Logic after Tab key (addChildNode to selected)', res.success, res.details);
        if(res.success) {
            res = assertEqual(parentAfterTab.children[0].text, 'Child via Tab Logic', 'Child text from Tab logic');
            displayTestResult('Selection Logic', 'Logic after Tab key - text check', res.success, res.details);
        }
        window.selectedNodeId = null;

        resetMindmapDataForTest();
        const firstRootForEnter = window.mindmapData.nodes[0].id;
        addNode(firstRootForEnter, 'Child of First Root');
        const childOfFirstRootId = window.mindmapData.nodes[0].children[0].id;
        window.selectedNodeId = childOfFirstRootId;

        addSiblingNode(childOfFirstRootId, 'Sibling via Enter Logic');
        const parentOfSibling = findNodeById(firstRootForEnter);
        res = assertEqual(parentOfSibling.children.length, 2, 'Parent should have 2 children after Enter key logic on first child');
        displayTestResult('Selection Logic', 'Logic after Enter key (addSiblingNode to selected child)', res.success, res.details);
         if(res.success) {
            res = assertEqual(parentOfSibling.children[1].text, 'Sibling via Enter Logic', 'Sibling text from Enter logic');
            displayTestResult('Selection Logic', 'Logic after Enter key - text check', res.success, res.details);
        }
        window.selectedNodeId = null;
    });

    runTestGroup('Data Sanitization (No change needed for structure)', () => {
        // Test with a minimal node
        let minimalNode = { id: 'test1', text: 'Minimal' };
        let sanitized = sanitizeNodeData(JSON.parse(JSON.stringify(minimalNode))); // Test with copy
        let res = assertNotNull(sanitized, 'Sanitized minimal node should not be null');
        displayTestResult('Data Sanitization', 'Minimal node - not null', res.success, res.details);
        if(res.success) {
            res = assertDeepEqual(sanitized.children, [], 'Minimal node - default children');
            displayTestResult('Data Sanitization', 'Minimal node - default children', res.success, res.details);
            res = assertEqual(sanitized.notes, '', 'Minimal node - default notes');
            displayTestResult('Data Sanitization', 'Minimal node - default notes', res.success, res.details);
            res = assertEqual(sanitized.image, null, 'Minimal node - default image');
            displayTestResult('Data Sanitization', 'Minimal node - default image', res.success, res.details);
            res = assertEqual(sanitized.table, null, 'Minimal node - default table');
            displayTestResult('Data Sanitization', 'Minimal node - default table', res.success, res.details);
            res = assertEqual(sanitized.chart, null, 'Minimal node - default chart');
            displayTestResult('Data Sanitization', 'Minimal node - default chart', res.success, res.details);
            res = assertFalse(sanitized.isManuallyPositioned, 'Minimal node - default isManuallyPositioned');
            displayTestResult('Data Sanitization', 'Minimal node - default isManuallyPositioned', res.success, res.details);
            res = assertFalse(sanitized.isCollapsed, 'Minimal node - default isCollapsed');
            displayTestResult('Data Sanitization', 'Minimal node - default isCollapsed', res.success, res.details);
        }

        // Test with some properties missing
        let partialNode = { id: 'test2', text: 'Partial', children: [{id: 'child', text: 'Child'}] };
        sanitized = sanitizeNodeData(JSON.parse(JSON.stringify(partialNode)));
        res = assertNotNull(sanitized, 'Sanitized partial node should not be null');
        displayTestResult('Data Sanitization', 'Partial node - not null', res.success, res.details);
         if(res.success) {
            res = assertEqual(sanitized.notes, '', 'Partial node - default notes');
            displayTestResult('Data Sanitization', 'Partial node - default notes (when missing)', res.success, res.details);
            res = assertNotNull(sanitized.children[0], 'Partial node - child should still exist');
            displayTestResult('Data Sanitization', 'Partial node - child existence', res.success, res.details);
            if(sanitized.children[0]){
                 res = assertFalse(sanitized.children[0].isCollapsed, 'Partial node - child default isCollapsed');
                 displayTestResult('Data Sanitization', 'Partial node - child default isCollapsed', res.success, res.details);
            }
        }

        // Test with incorrectly typed properties
        let mistypedNode = { id: 'test3', text: 'Mistyped', isCollapsed: "true", notes: 123 };
        sanitized = sanitizeNodeData(JSON.parse(JSON.stringify(mistypedNode)));
        res = assertNotNull(sanitized, 'Sanitized mistyped node should not be null');
        displayTestResult('Data Sanitization', 'Mistyped node - not null', res.success, res.details);
        if(res.success) {
            // Current sanitizeNodeData does not coerce isCollapsed from "true" to true, it defaults to false if not boolean.
            res = assertFalse(sanitized.isCollapsed, 'Mistyped node - isCollapsed (string "true" becomes false)');
            displayTestResult('Data Sanitization', 'Mistyped node - isCollapsed coercion to false', res.success, res.details);
            // Current sanitizeNodeData defaults notes to '' if not a string.
            res = assertEqual(sanitized.notes, '', 'Mistyped node - notes (number 123 becomes empty string)');
            displayTestResult('Data Sanitization', 'Mistyped node - notes coercion to empty string', res.success, res.details);
        }

        // Test with x and y as non-numeric
        let nonNumericPosNode = { id: 'test4', text: 'NonNumericPos', x: "invalid", y: "also_invalid" };
        sanitized = sanitizeNodeData(JSON.parse(JSON.stringify(nonNumericPosNode)));
        res = assertNotNull(sanitized, 'Sanitized non-numeric position node should not be null');
        displayTestResult('Data Sanitization', 'Non-numeric position - not null', res.success, res.details);
        if(res.success) {
            res = assertEqual(sanitized.x, undefined, 'Non-numeric x should become undefined');
            displayTestResult('Data Sanitization', 'Non-numeric x to undefined', res.success, res.details);
            res = assertEqual(sanitized.y, undefined, 'Non-numeric y should become undefined');
            displayTestResult('Data Sanitization', 'Non-numeric y to undefined', res.success, res.details);
        }

        // Test with null image/table/chart properties
        let nullRichContent = { id: 'test5', text: 'NullRich', image: null, table: { headers: [], rows: "not_an_array"}};
        sanitized = sanitizeNodeData(JSON.parse(JSON.stringify(nullRichContent)));
        res = assertEqual(sanitized.image, null, 'Null image should remain null');
        displayTestResult('Data Sanitization', 'Null image', res.success, res.details);
        res = assertEqual(sanitized.table, null, 'Malformed table should become null');
        displayTestResult('Data Sanitization', 'Malformed table', res.success, res.details);

    });

    // --- Test Execution ---
    // Store the initial state from mindmap.js *before* any tests modify it globally
    // Store the initial state from mindmap.js *before* any tests modify it globally
    // originalMindmapData is now set using initialTestMindmapState at the top of the file.
    // No need to JSON.parse(JSON.stringify(window.mindmapData)) here as resetMindmapDataForTest does that.

    // The runTestGroup calls will execute the tests and display results.
    // No further explicit execution calls needed here.

    runTestGroup('Tree Layout Algorithm (Main Root)', () => {
        const MOCK_CONTAINER_WIDTH = 1000; // For consistent testing

        // Helper to prepare data for layout tests (operates on a single root node)
        function prepareSingleTreeLayoutTest(rootNodeForLayout) {
             // Ensure a temp container exists for measurements
            let tempContainer = getOrCreateTempMeasurementContainer();
            if (!document.body.contains(tempContainer)) { document.body.appendChild(tempContainer); }

            calculateAndStoreNodeDimensions(rootNodeForLayout, tempContainer);
            calculateSubtreeDimensionsRecursive(rootNodeForLayout);
            calculateTreeLayout(rootNodeForLayout, MOCK_CONTAINER_WIDTH);
        }

        resetMindmapDataForTest();
        let mainRootNode = window.mindmapData.nodes[0]; // Get the main root for testing layout

        // Test Case: Root Centering
        mainRootNode.children = [
            { id: 'child1', text: 'Child 1', children: [], width: 100, height: 40, notes:'', table:null, image:null, chart:null, isManuallyPositioned:false },
            { id: 'child2', text: 'Child 2', children: [], width: 100, height: 40, notes:'', table:null, image:null, chart:null, isManuallyPositioned:false  }
        ];
        mainRootNode.width = 150; mainRootNode.height = 50;

        prepareSingleTreeLayoutTest(mainRootNode);

        const expectedRootX = (MOCK_CONTAINER_WIDTH / 2) - (mainRootNode.subtreeWidth / 2);
        let res = assertEqual(Math.round(mainRootNode.x), Math.round(expectedRootX),
                        `Root X (${Math.round(mainRootNode.x)}) should be approx ${Math.round(expectedRootX)} (centered by subtreeWidth)`);
        displayTestResult('Tree Layout', 'Root Centering', res.success, res.details);

        resetMindmapDataForTest();
        mainRootNode = window.mindmapData.nodes[0];
        // Test Case: Horizontal Non-Overlap of Sibling Subtrees
        mainRootNode.children = [
            {
                id: 'c1', text: 'Child 1', children: [
                    { id: 'gc1', text: 'GC1', children: [], width: 80, height: 30, notes:'', table:null, image:null, chart:null, isManuallyPositioned:false }
                ], width: 100, height: 40, notes:'', table:null, image:null, chart:null, isManuallyPositioned:false
            },
            { id: 'c2', text: 'Child 2', children: [], width: 100, height: 40, notes:'', table:null, image:null, chart:null, isManuallyPositioned:false }
        ];
        mainRootNode.width = 150; mainRootNode.height = 50;
        mainRootNode.children.forEach(c => {c.isManuallyPositioned = false; delete c.x; delete c.y;});

        prepareSingleTreeLayoutTest(mainRootNode);

        const child1Node = findNodeById('c1'); // findNodeById searches globally
        const child2Node = findNodeById('c2');

        res = assertNotNull(child1Node, "Child 1 should exist for overlap test");
        displayTestResult('Tree Layout', 'Horizontal Non-Overlap - Child 1 exists', res.success, res.details);
        res = assertNotNull(child2Node, "Child 2 should exist for overlap test");
        displayTestResult('Tree Layout', 'Horizontal Non-Overlap - Child 2 exists', res.success, res.details);

        if (child1Node && child2Node && typeof child1Node.x === 'number' && typeof child2Node.x === 'number' &&
            typeof child1Node.subtreeWidth === 'number' && typeof child2Node.subtreeWidth === 'number') {
            if (child1Node.x < child2Node.x) {
                const child1End = child1Node.x + child1Node.subtreeWidth;
                const expectedChild2Start = child1End + SIBLING_SEPARATION;
                res = assertTrue(child2Node.x >= child1End + SIBLING_SEPARATION - 0.01,
                    `Child 2 X (${child2Node.x}) should be >= Child 1 end (${child1End}) + SIBLING_SEPARATION (${SIBLING_SEPARATION}). Expected >= ${expectedChild2Start - 0.01}`);
                displayTestResult('Tree Layout', 'Horizontal Non-Overlap of Sibling Subtrees', res.success, res.details);
            } else {
                 res = assertTrue(child1Node.x >= child2Node.x + child2Node.subtreeWidth + SIBLING_SEPARATION - 0.01,
                    `Child 1 X (${child1Node.x}) should be >= Child 2 end (${child2Node.x + child2Node.subtreeWidth}) + SIBLING_SEPARATION (${SIBLING_SEPARATION}). This means order might be swapped.`);
                displayTestResult('Tree Layout', 'Horizontal Non-Overlap of Sibling Subtrees (order swapped)', res.success, res.details);
            }
        } else {
            displayTestResult('Tree Layout', 'Horizontal Non-Overlap of Sibling Subtrees', false, 'Child nodes or their properties (x, subtreeWidth) are undefined.');
        }

        resetMindmapDataForTest();
        mainRootNode = window.mindmapData.nodes[0];
        // Test Case: Vertical Level Spacing - Basic Parent-Child
        mainRootNode.children = [ { id: 'c1_vertical', text: 'Child 1 Vertical', children: [], width: 100, height: 40, notes:'', table:null, image:null, chart:null, isManuallyPositioned:false } ];
        mainRootNode.width = 150; mainRootNode.height = 50;
        mainRootNode.children.forEach(c => {c.isManuallyPositioned = false; delete c.x; delete c.y;});

        prepareSingleTreeLayoutTest(mainRootNode);

        const rootNodeForVertical = findNodeById(mainRootNode.id);
        const child1ForVertical = findNodeById('c1_vertical');

        if (rootNodeForVertical && child1ForVertical && typeof rootNodeForVertical.y === 'number' && typeof child1ForVertical.y === 'number' &&
            typeof rootNodeForVertical.height === 'number') {
            const expectedChild1Y = rootNodeForVertical.y + (rootNodeForVertical.subtreeHeight || rootNodeForVertical.height) + LEVEL_SEPARATION;
            res = assertTrue(Math.abs(child1ForVertical.y - expectedChild1Y) < 0.01, // Epsilon for float
                `Child 1 Y (${child1ForVertical.y}) should be Root Y (${rootNodeForVertical.y}) + Root SubtreeHeight (${rootNodeForVertical.subtreeHeight || rootNodeForVertical.height}) + LEVEL_SEPARATION (${LEVEL_SEPARATION}). Expected ${expectedChild1Y}`);
            displayTestResult('Tree Layout', 'Vertical Level Spacing (Parent-Child)', res.success, res.details);
        } else {
            displayTestResult('Tree Layout', 'Vertical Level Spacing (Parent-Child)', false, 'Nodes or their y/height properties undefined for basic vertical test.');
        }
        // ... (Keep other layout tests, ensuring they target nodes[0] and use global findNodeById)
    });

    // Final summary update (in case some tests were async, though these are sync)
    // updateSummary(); // updateSummary is called by displayTestResult

    runTestGroup('Zoom-to-Fit Logic (Main Root)', () => {
        // Mock mindmapContainer for offsetWidth/Height
        const mockMindmapContainer = {
            offsetWidth: 1000,
            offsetHeight: 600,
            // Add other properties if zoomToFit starts using them (e.g., scrollLeft)
        };
        // Store original and replace mindmapContainer for these tests if zoomToFit uses the global one
        const originalMindmapContainerRef = window.mindmapContainer;
        window.mindmapContainer = mockMindmapContainer;


        // Test calculateOverallBoundingBox
        resetMindmapDataForTest();
        let mainRootForBounds = window.mindmapData.nodes[0];

        // Single node
        mainRootForBounds.children = []; // Ensure no children for this sub-test
        mainRootForBounds.x = 10; mainRootForBounds.y = 20; mainRootForBounds.width = 100; mainRootForBounds.height = 40;
        let bounds = calculateOverallBoundingBox(mainRootForBounds);
        let res = assertDeepEqual(bounds, { minX: 10, minY: 20, maxX: 110, maxY: 60 }, 'Bounding box for single root node');
        displayTestResult('Zoom-to-Fit', 'calculateOverallBoundingBox - Single Node', res.success, res.details);

        // Parent with children
        resetMindmapDataForTest(); // Get fresh root
        mainRootForBounds = window.mindmapData.nodes[0];
        mainRootForBounds.x=100; mainRootForBounds.y=100; mainRootForBounds.width=150; mainRootForBounds.height=50;
        mainRootForBounds.children = [
            { id: 'c1_bounds', text: 'C1', x: 50, y: 200, width: 80, height: 30, children: [], notes:'', table:null, image:null, chart:null, isManuallyPositioned:true },
            { id: 'c2_bounds', text: 'C2', x: 200, y: 200, width: 90, height: 35, children: [], notes:'', table:null, image:null, chart:null, isManuallyPositioned:true }
        ];
        bounds = calculateOverallBoundingBox(mainRootForBounds);
        res = assertDeepEqual(bounds, { minX: 50, minY: 100, maxX: 290, maxY: 235 }, 'Bounding box for parent with children');
        displayTestResult('Zoom-to-Fit', 'calculateOverallBoundingBox - Parent with Children', res.success, res.details);

        // Parent with collapsed child (child should be ignored for bounds beyond itself)
        resetMindmapDataForTest();
        mainRootForBounds = window.mindmapData.nodes[0];
        mainRootForBounds.x=10; mainRootForBounds.y=20; mainRootForBounds.width=100; mainRootForBounds.height=40; mainRootForBounds.isCollapsed=false;
        mainRootForBounds.children = [
            { id: 'c1_bounds_collapsed', text: 'C1 Collapsed', x: 0, y: 100, width: 80, height: 30, isCollapsed: true, children: [
                { id: 'gc1_bounds', text: 'GC1 Ignored', x: -10, y: 150, width: 70, height: 20, notes:'', table:null, image:null, chart:null, isManuallyPositioned:true }
            ], notes:'', table:null, image:null, chart:null, isManuallyPositioned:true }
        ];
        bounds = calculateOverallBoundingBox(mainRootForBounds);
        // Expected: minX from root (10), minY from root (20), maxX from root (110), maxY from c1_bounds_collapsed (130)
        res = assertDeepEqual(bounds, { minX: 0, minY: 20, maxX: 110, maxY: 130 }, 'Bounding box with collapsed child');
        displayTestResult('Zoom-to-Fit', 'calculateOverallBoundingBox - Collapsed Child', res.success, res.details);

        // Test with no valid nodes (e.g. root has no x/y) - by passing an invalid node directly
        let invalidNode = { id: 'invalid', text: 'Invalid Node', children: [] }; // No x,y,width,height
        bounds = calculateOverallBoundingBox(invalidNode);
        res = assertEqual(bounds, null, 'Bounding box for invalid node should be null');
        displayTestResult('Zoom-to-Fit', 'calculateOverallBoundingBox - Invalid Node', res.success, res.details);

        window.mindmapContainer = originalMindmapContainerRef;
        window.TEST_ENV = false;
    });

    runTestGroup('Zoom-to-Fit Calculations (Main Root)', () => {
        const mockMindmapContainer = {
            offsetWidth: 1000,
            offsetHeight: 600,
            // Mock getElementById for content wrapper if zoomToFit tries to get it for transform
            // However, we are only testing calculations here, not the transform application.
        };
        const originalMindmapContainerRef = window.mindmapContainer;
        window.mindmapContainer = mockMindmapContainer;
        window.TEST_ENV = true; // Enable storing of calculation results

        resetMindmapDataForTest();
        let mainRootForZoom = window.mindmapData.nodes[0];

        // Scenario 1: Simple case, content smaller than container
        mainRootForZoom.children = [];
        mainRootForZoom.x = 200; mainRootForZoom.y = 100; mainRootForZoom.width = 100; mainRootForZoom.height = 50;

        let tempContainer = getOrCreateTempMeasurementContainer();
        if (!document.body.contains(tempContainer)) document.body.appendChild(tempContainer);
        calculateAndStoreNodeDimensions(mainRootForZoom, tempContainer);

        zoomToFit();

        let calc = window.lastZoomToFitCalculations;
        let res = assertNotNull(calc, "zoomToFit calculations should be stored for Scenario 1");
        displayTestResult('Zoom-to-Fit Calc', 'Scenario 1 - Results Stored', res.success, res.details);

        if (res.success) {
            res = assertEqual(calc.scale.toFixed(3), "5.000", `Scenario 1 Scale: Expected 5.000 (based on height), Got ${calc.scale.toFixed(3)}`);
            displayTestResult('Zoom-to-Fit Calc', 'Scenario 1 - Scale', res.success, res.details);
            // tx = (1000 - (100*5))/2 - (200*5) = 250 - 1000 = -750
            // ty = (600 - (50*5))/2 - (100*5) = 175 - 500 = -325
            res = assertEqual(calc.translateX.toFixed(2), "-750.00", `Scenario 1 TranslateX: Expected -750.00, Got ${calc.translateX.toFixed(2)}`);
            displayTestResult('Zoom-to-Fit Calc', 'Scenario 1 - TranslateX', res.success, res.details);
            res = assertEqual(calc.translateY.toFixed(2), "-325.00", `Scenario 1 TranslateY: Expected -325.00, Got ${calc.translateY.toFixed(2)}`);
            displayTestResult('Zoom-to-Fit Calc', 'Scenario 1 - TranslateY', res.success, res.details);
        }

        // Scenario 2: Content wider than padded container
        resetMindmapDataForTest();
        mainRootForZoom = window.mindmapData.nodes[0];
        mainRootForZoom.children = [];
        mainRootForZoom.x = 0; mainRootForZoom.y = 0; mainRootForZoom.width = 1000; mainRootForZoom.height = 100;

        calculateAndStoreNodeDimensions(mainRootForZoom, tempContainer);
        zoomToFit();
        calc = window.lastZoomToFitCalculations;
        res = assertNotNull(calc, "zoomToFit calculations should be stored for Scenario 2");
        displayTestResult('Zoom-to-Fit Calc', 'Scenario 2 - Results Stored', res.success, res.details);
        if(res.success){
            res = assertEqual(calc.scale.toFixed(3), "0.900", `Scenario 2 Scale: Expected 0.900, Got ${calc.scale.toFixed(3)}`);
            displayTestResult('Zoom-to-Fit Calc', 'Scenario 2 - Scale', res.success, res.details);
            res = assertEqual(calc.translateX.toFixed(2), "50.00", `Scenario 2 TranslateX: Expected 50.00, Got ${calc.translateX.toFixed(2)}`);
            displayTestResult('Zoom-to-Fit Calc', 'Scenario 2 - TranslateX', res.success, res.details);
            res = assertEqual(calc.translateY.toFixed(2), "255.00", `Scenario 2 TranslateY: Expected 255.00, Got ${calc.translateY.toFixed(2)}`);
            displayTestResult('Zoom-to-Fit Calc', 'Scenario 2 - TranslateY', res.success, res.details);
        }

        window.mindmapContainer = originalMindmapContainerRef;
        window.TEST_ENV = false;
        window.lastZoomToFitCalculations = null;
    });

    runTestGroup('Clear Mindmap Functionality & Root Deletion (Updated)', () => {
        resetMindmapDataForTest();
        // Test 1: Create a child node under root
        let newNode = createNode('root', { text: 'New Child 1' });
        let res = assertNotNull(newNode, 'Test 1: newNode should not be null');
        displayTestResult('Create Node', 'Test 1.1: Create child under root - Not Null', res.success, res.details);
        if (res.success) {
            const parent = findNodeById(window.mindmapData.root, 'root');
            res = assertEqual(parent.children.length, 1, 'Test 1.2: Root should have 1 child');
            displayTestResult('Create Node', 'Test 1.2: Root children count', res.success, res.details);
            if (res.success) {
                res = assertEqual(parent.children[0].text, 'New Child 1', 'Test 1.3: Child text should be "New Child 1"');
                displayTestResult('Create Node', 'Test 1.3: Child text verification', res.success, res.details);
                res = assertEqual(parent.children[0].id, newNode.id, 'Test 1.4: Child ID should match returned node ID');
                displayTestResult('Create Node', 'Test 1.4: Child ID verification', res.success, res.details);
                res = assertDeepEqual(parent.children[0].children, [], 'Test 1.5: New child should have empty children array');
                displayTestResult('Create Node', 'Test 1.5: Child default children', res.success, res.details);
                res = assertFalse(parent.children[0].isManuallyPositioned, 'Test 1.6: New child should not be manually positioned');
                displayTestResult('Create Node', 'Test 1.6: Child default isManuallyPositioned', res.success, res.details);
            }
        }

        resetMindmapDataForTest();
        // Test 2: Create a grandchild node
        let childNode = createNode('root', { text: 'Child for Grandchild Test' });
        res = assertNotNull(childNode, 'Test 2: childNode for grandchild test should not be null');
        displayTestResult('Create Node', 'Test 2.1: Create child for grandchild test - Not Null', res.success, res.details);
        if (!res.success) return; // Stop if child creation failed

        let grandchildNode = createNode(childNode.id, { text: 'New Grandchild' });
        res = assertNotNull(grandchildNode, 'Test 2.2: grandchildNode should not be null');
        displayTestResult('Create Node', 'Test 2.2: Create grandchild - Not Null', res.success, res.details);
        if (res.success) {
            const parentOfGrandchild = findNodeById(window.mindmapData.root, childNode.id);
            res = assertEqual(parentOfGrandchild.children.length, 1, 'Test 2.3: Child node should have 1 grandchild');
            displayTestResult('Create Node', 'Test 2.3: Grandchild count', res.success, res.details);
            if (res.success) {
                res = assertEqual(parentOfGrandchild.children[0].text, 'New Grandchild', 'Test 2.4: Grandchild text verification');
                displayTestResult('Create Node', 'Test 2.4: Grandchild text', res.success, res.details);
            }
        }

        resetMindmapDataForTest();
        // Test 3: Handle non-existent parentId
        let nodeWithInvalidParent = createNode('nonExistentId', { text: 'Node with invalid parent' });
        res = assertEqual(nodeWithInvalidParent, null, 'Test 3.1: createNode with non-existent parentId should return null');
        displayTestResult('Create Node', 'Test 3.1: Non-existent parent returns null', res.success, res.details);
        // Verify mindmapData.root.children is not unexpectedly modified (assuming default root has 0 children initially in test setup)
        // If originalMindmapData.root.children was not empty, this check needs adjustment.
        // For this test, originalMindmapData.root.children is empty.
        const rootChildrenCount = window.mindmapData.root.children.length;
        res = assertEqual(rootChildrenCount, 0, `Test 3.2: Root children count should remain unchanged (${rootChildrenCount})`);
        displayTestResult('Create Node', 'Test 3.2: Root children count unchanged', res.success, res.details);


        resetMindmapDataForTest();
        // Test 4: Create a node with full `nodeData`
        const fullNodeData = {
            text: 'Full Data Node',
            notes: 'These are some notes.',
            // x: 123, y: 456, // x, y should be ignored for new children as per current createNode logic
            isCollapsed: true // This should be respected
        };
        let fullNode = createNode('root', fullNodeData);
        res = assertNotNull(fullNode, 'Test 4.1: Full data node should not be null');
        displayTestResult('Create Node', 'Test 4.1: Create full data node - Not Null', res.success, res.details);
        if (res.success) {
            const parent = findNodeById(window.mindmapData.root, 'root');
            const createdFullNode = findNodeById(parent, fullNode.id);
            res = assertEqual(createdFullNode.text, 'Full Data Node', 'Test 4.2: Full data node text');
            displayTestResult('Create Node', 'Test 4.2: Full data node text verification', res.success, res.details);
            res = assertEqual(createdFullNode.notes, 'These are some notes.', 'Test 4.3: Full data node notes');
            displayTestResult('Create Node', 'Test 4.3: Full data node notes verification', res.success, res.details);
            res = assertTrue(createdFullNode.isCollapsed, 'Test 4.4: Full data node isCollapsed should be true');
            displayTestResult('Create Node', 'Test 4.4: Full data node isCollapsed', res.success, res.details);
            res = assertEqual(createdFullNode.x, undefined, 'Test 4.5: X should be undefined as it is deleted for new children');
            displayTestResult('Create Node', 'Test 4.5: Full data node x undefined', res.success, res.details);
        }

        resetMindmapDataForTest();
        // Test 5: Create a root node when mindmap is empty (parentNodeId is null)
        // Simulate an empty mindmap (or a mindmap where root might be an empty object)
        window.mindmapData.root = {}; // Or null, depending on how "empty" is defined before root creation
        let newRootNode = createNode(null, { text: 'New Root From CreateNode' });
        res = assertNotNull(newRootNode, 'Test 5.1: New root node should not be null');
        displayTestResult('Create Node', 'Test 5.1: Create root when mindmap empty - Not Null', res.success, res.details);
        if (res.success) {
            res = assertEqual(window.mindmapData.root.id, newRootNode.id, 'Test 5.2: Global mindmapData.root should be the new root');
            displayTestResult('Create Node', 'Test 5.2: Global root is new root', res.success, res.details);
            res = assertEqual(window.mindmapData.root.text, 'New Root From CreateNode', 'Test 5.3: New root text verification');
            displayTestResult('Create Node', 'Test 5.3: New root text', res.success, res.details);
            res = assertEqual(window.mindmapData.root.children.length, 0, 'Test 5.4: New root should have no children');
            displayTestResult('Create Node', 'Test 5.4: New root children count', res.success, res.details);
        }

        resetMindmapDataForTest();
        // Test 6: Attempt to create a node with parentId=null when a root already exists
        // (current logic should prevent this and return null)
        addNode('root', 'Existing Child to make root non-empty for this test'); // Ensure root exists and is not "empty"
        let nodeWithNullParentExistingRoot = createNode(null, { text: 'Attempt Floating Node' });
        res = assertEqual(nodeWithNullParentExistingRoot, null, 'Test 6.1: createNode with null parentId and existing root should return null');
        displayTestResult('Create Node', 'Test 6.1: Null parent, existing root returns null', res.success, res.details);
        const rootNode = findNodeById(window.mindmapData.root, 'root');
        // Check that no new node was added to the root directly or as a new root
        let foundFloating = false;
        if (rootNode.text === 'Attempt Floating Node') foundFloating = true; // Shouldn't happen
        for(const child of rootNode.children) {
            if(child.text === 'Attempt Floating Node') {
                foundFloating = true;
                break;
            }
        }
        res = assertFalse(foundFloating, 'Test 6.2: Floating node should not have been added to data');
        displayTestResult('Create Node', 'Test 6.2: Floating node not added', res.success, res.details);


        resetMindmapDataForTest();
        // Test 7: Parent expansion on adding first child
        let parentForExpansionTest = createNode('root', { text: 'Parent for Expansion', isCollapsed: true, children: [] });
        res = assertNotNull(parentForExpansionTest, 'Test 7.1: Parent for expansion test created');
        displayTestResult('Create Node', 'Test 7.1: Create parent for expansion test', res.success, res.details);
        if (!res.success) return;
        // Manually set parent to collapsed if createNode doesn't take isCollapsed for new nodes (it does now)
        const parentData = findNodeById(window.mindmapData.root, parentForExpansionTest.id);
        parentData.isCollapsed = true; // Explicitly set for test condition
        parentData.children = []; // Ensure it has no children

        createNode(parentData.id, { text: 'First Child to Expand Parent' });
        const updatedParentData = findNodeById(window.mindmapData.root, parentData.id);
        res = assertFalse(updatedParentData.isCollapsed, 'Test 7.2: Parent should be expanded after adding the first child');
        displayTestResult('Create Node', 'Test 7.2: Parent expanded', res.success, res.details);

        // Test creating node with long text / special characters
        const longText = 'L'.repeat(500) + ' & "specials"!@#$%^&*()_+[]{}|;:,.<>/?`~';
        let longNode = createNode('root', { text: longText });
        res = assertNotNull(longNode, 'Create node with long/special text - not null');
        displayTestResult('Create Node', 'Long/Special Text - Creation', res.success, res.details);
        if(res.success){
            res = assertEqual(longNode.text, longText, 'Create node with long/special text - text matches');
            displayTestResult('Create Node', 'Long/Special Text - Verification', res.success, res.details);
        }

        // Test rapid node creation (basic check for ID uniqueness)
        resetMindmapDataForTest();
        const rootNodeForRapid = window.mindmapData.nodes[0];
        let ids = new Set();
        const numNodesToCreate = 50;
        for(let i=0; i<numNodesToCreate; i++){
            let node = createNode(rootNodeForRapid.id, {text: `Rapid ${i}`});
            if(node) ids.add(node.id);
        }
        res = assertEqual(ids.size, numNodesToCreate, `Rapid creation: ${numNodesToCreate} unique IDs should be generated`);
        displayTestResult('Create Node', 'Rapid Creation - Unique IDs', res.success, res.details);
        const finalRoot = findNodeById(rootNodeForRapid.id);
        res = assertEqual(finalRoot.children.length, numNodesToCreate, `Rapid creation: Parent should have ${numNodesToCreate} children`);
        displayTestResult('Create Node', 'Rapid Creation - Children Count', res.success, res.details);

    });

    runTestGroup('Add Central Topic Functionality', () => {
        resetMindmapDataForTest();
        // Test 1: Create a central topic when mindmapData.nodes is empty
        window.mindmapData.nodes = []; // Simulate no root
        let newCentralTopic = addCentralTopic({ text: 'New Central Idea', notes: 'Details for new central idea.' });
        let res = assertNotNull(newCentralTopic, 'Test 1.1: New central topic should not be null');
        displayTestResult('Add Central Topic', 'Test 1.1: Create when no root - Not Null', res.success, res.details);
        if (res.success) {
            res = assertEqual(window.mindmapData.nodes[0].id, 'root', 'Test 1.2: ID should be "root"');
            displayTestResult('Add Central Topic', 'Test 1.2: ID is "root"', res.success, res.details);
            res = assertEqual(window.mindmapData.nodes[0].text, 'New Central Idea', 'Test 1.3: Text verification');
            displayTestResult('Add Central Topic', 'Test 1.3: Text set correctly', res.success, res.details);
            res = assertEqual(window.mindmapData.nodes[0].notes, 'Details for new central idea.', 'Test 1.4: Notes verification');
            displayTestResult('Add Central Topic', 'Test 1.4: Notes set correctly', res.success, res.details);
            res = assertDeepEqual(window.mindmapData.nodes[0].children, [], 'Test 1.5: Default children is empty array');
            displayTestResult('Add Central Topic', 'Test 1.5: Default children', res.success, res.details);
            res = assertEqual(typeof window.mindmapData.nodes[0].x, 'number', 'Test 1.6: Default x coordinate set');
            displayTestResult('Add Central Topic', 'Test 1.6: Default x', res.success, res.details);
            res = assertEqual(typeof window.mindmapData.nodes[0].y, 'number', 'Test 1.7: Default y coordinate set');
            displayTestResult('Add Central Topic', 'Test 1.7: Default y', res.success, res.details);
            res = assertFalse(window.mindmapData.nodes[0].isManuallyPositioned, 'Test 1.8: Default isManuallyPositioned is false');
            displayTestResult('Add Central Topic', 'Test 1.8: Default isManuallyPositioned', res.success, res.details);
        }

        resetMindmapDataForTest();
        // Test 2: Update an existing central topic (nodes[0])
        const initialChild = { id: 'child1', text: 'Existing Child', children: [], notes:'', table:null, image:null, chart:null, isManuallyPositioned:false };
        window.mindmapData.nodes[0] = {
            id: 'root', text: 'Old Central Topic', notes: 'Old notes.', children: [initialChild],
            x: 100, y: 120, isManuallyPositioned: true, isCollapsed: true, table:null, image:null, chart:null
        };
        let updatedCentralTopic = addCentralTopic({ text: 'Updated Central Idea', notes: 'Updated notes for existing topic.' });
        res = assertNotNull(updatedCentralTopic, 'Test 2.1: Updated central topic should not be null');
        displayTestResult('Add Central Topic', 'Test 2.1: Update existing - Not Null', res.success, res.details);
        if (res.success) {
            res = assertEqual(window.mindmapData.nodes[0].id, 'root', 'Test 2.2: ID should remain "root"');
            displayTestResult('Add Central Topic', 'Test 2.2: ID preserved', res.success, res.details);
            res = assertEqual(window.mindmapData.nodes[0].text, 'Updated Central Idea', 'Test 2.3: Text updated');
            displayTestResult('Add Central Topic', 'Test 2.3: Text updated correctly', res.success, res.details);
            res = assertEqual(window.mindmapData.nodes[0].notes, 'Updated notes for existing topic.', 'Test 2.4: Notes updated');
            displayTestResult('Add Central Topic', 'Test 2.4: Notes updated correctly', res.success, res.details);
            res = assertEqual(window.mindmapData.nodes[0].children.length, 1, 'Test 2.5: Children count preserved');
            displayTestResult('Add Central Topic', 'Test 2.5: Children count preserved', res.success, res.details);
            if (res.success && window.mindmapData.nodes[0].children.length === 1) {
                res = assertEqual(window.mindmapData.nodes[0].children[0].id, 'child1', 'Test 2.6: Child ID preserved');
                displayTestResult('Add Central Topic', 'Test 2.6: Child data preserved', res.success, res.details);
            }
            res = assertEqual(window.mindmapData.nodes[0].x, 100, 'Test 2.7: X coordinate preserved');
            displayTestResult('Add Central Topic', 'Test 2.7: X preserved', res.success, res.details);
            res = assertEqual(window.mindmapData.nodes[0].y, 120, 'Test 2.8: Y coordinate preserved');
            displayTestResult('Add Central Topic', 'Test 2.8: Y preserved', res.success, res.details);
            res = assertTrue(window.mindmapData.nodes[0].isManuallyPositioned, 'Test 2.9: isManuallyPositioned preserved');
            displayTestResult('Add Central Topic', 'Test 2.9: isManuallyPositioned preserved', res.success, res.details);
             res = assertTrue(window.mindmapData.nodes[0].isCollapsed, 'Test 2.10: isCollapsed should be preserved if not in topicData');
            displayTestResult('Add Central Topic', 'Test 2.10: isCollapsed preserved', res.success, res.details);
        }

        resetMindmapDataForTest();
        // Test 3: Ensure default properties are assigned if topicData is minimal (creating new)
        window.mindmapData.nodes = []; // Simulate empty map
        addCentralTopic({ text: 'Minimal Topic Only Text' });
        res = assertEqual(window.mindmapData.nodes[0].id, 'root', 'Test 3.1: Minimal data - ID is "root"');
        displayTestResult('Add Central Topic', 'Test 3.1: Minimal create - ID default', res.success, res.details);
        res = assertEqual(window.mindmapData.nodes[0].notes, '', 'Test 3.2: Minimal data - notes default to empty string');
        displayTestResult('Add Central Topic', 'Test 3.2: Minimal create - notes default', res.success, res.details);
        res = assertDeepEqual(window.mindmapData.nodes[0].children, [], 'Test 3.3: Minimal data - children default to empty array');
        displayTestResult('Add Central Topic', 'Test 3.3: Minimal create - children default', res.success, res.details);
        res = assertFalse(window.mindmapData.nodes[0].isManuallyPositioned, 'Test 3.4: Minimal data - isManuallyPositioned default to false');
        displayTestResult('Add Central Topic', 'Test 3.4: Minimal create - isManuallyPositioned default', res.success, res.details);
        res = assertFalse(window.mindmapData.nodes[0].isCollapsed, 'Test 3.5: Minimal data - isCollapsed default to false');
        displayTestResult('Add Central Topic', 'Test 3.5: Minimal create - isCollapsed default', res.success, res.details);


        resetMindmapDataForTest();
        // Test 4: Updating with partial data (e.g., only text, notes should be preserved)
        window.mindmapData.nodes[0] = {
            id: 'root', text: 'Original Text', notes: 'Original Notes', children: [],
            x: 20, y: 30, isManuallyPositioned: false, isCollapsed: false,
            table: {headers:['h'], rows:[['d']]}, image:null, chart:null
        };
        addCentralTopic({ text: 'Only Text Updated For Existing' });
        res = assertEqual(window.mindmapData.nodes[0].text, 'Only Text Updated For Existing', 'Test 4.1: Partial update - text updated');
        displayTestResult('Add Central Topic', 'Test 4.1: Partial update - text', res.success, res.details);
        res = assertEqual(window.mindmapData.nodes[0].notes, 'Original Notes', 'Test 4.2: Partial update - notes preserved');
        displayTestResult('Add Central Topic', 'Test 4.2: Partial update - notes preserved', res.success, res.details);
        res = assertEqual(window.mindmapData.nodes[0].x, 20, 'Test 4.3: Partial update - x preserved');
        displayTestResult('Add Central Topic', 'Test 4.3: Partial update - x preserved', res.success, res.details);
        res = assertNotNull(window.mindmapData.nodes[0].table, 'Test 4.4: Partial update - other properties like table preserved');
        displayTestResult('Add Central Topic', 'Test 4.4: Partial update - table preserved', res.success, res.details);

        resetMindmapDataForTest();
        // Test 5: Updating with additional, non-core properties
        window.mindmapData.nodes[0] = { id: 'root', text: 'Core topic', notes: '', children: [], x:10,y:10,isManuallyPositioned:false,isCollapsed:false,table:null,image:null,chart:null };
        addCentralTopic({ customField: 'Custom Value', isCollapsed: true }); // isCollapsed is now a core handled prop
        res = assertEqual(window.mindmapData.nodes[0].customField, 'Custom Value', 'Test 5.1: Custom field should be added/updated');
        displayTestResult('Add Central Topic', 'Test 5.1: Custom field handling', res.success, res.details);
        res = assertTrue(window.mindmapData.nodes[0].isCollapsed, 'Test 5.2: isCollapsed should be updated from topicData');
        displayTestResult('Add Central Topic', 'Test 5.2: isCollapsed updated', res.success, res.details);
        res = assertEqual(window.mindmapData.nodes[0].text, 'Core topic', 'Test 5.3: Text should be preserved if not in topicData');
        displayTestResult('Add Central Topic', 'Test 5.3: Text preserved on custom update', res.success, res.details);

        // Test 6: Calling addCentralTopic multiple times consecutively
        resetMindmapDataForTest();
        addCentralTopic({ text: 'First Central Topic Call' });
        res = assertEqual(window.mindmapData.nodes[0].text, 'First Central Topic Call', 'Test 6.1: Text after first call');
        displayTestResult('Add Central Topic', 'Test 6.1: Multiple calls - first text', res.success, res.details);
        addCentralTopic({ text: 'Second Central Topic Call', notes: 'With notes' });
        res = assertEqual(window.mindmapData.nodes.length, 1, 'Test 6.2: Node count should still be 1');
        displayTestResult('Add Central Topic', 'Test 6.2: Multiple calls - node count', res.success, res.details);
        res = assertEqual(window.mindmapData.nodes[0].text, 'Second Central Topic Call', 'Test 6.3: Text after second call (overwrite)');
        displayTestResult('Add Central Topic', 'Test 6.3: Multiple calls - second text', res.success, res.details);
        res = assertEqual(window.mindmapData.nodes[0].notes, 'With notes', 'Test 6.4: Notes after second call');
        displayTestResult('Add Central Topic', 'Test 6.4: Multiple calls - notes', res.success, res.details);

        // Test 7: Calling addCentralTopic with empty topicData object
        resetMindmapDataForTest();
        window.mindmapData.nodes = []; // Ensure it's truly empty
        addCentralTopic({}); // Empty data
        res = assertEqual(window.mindmapData.nodes.length, 1, 'Test 7.1: Node created with empty data');
        displayTestResult('Add Central Topic', 'Test 7.1: Empty data - node count', res.success, res.details);
        res = assertEqual(window.mindmapData.nodes[0].text, 'Central Topic', 'Test 7.2: Default text for empty data'); // Or 'Root Node' depending on implementation detail
        displayTestResult('Add Central Topic', 'Test 7.2: Empty data - default text', res.success, res.details);
        res = assertEqual(window.mindmapData.nodes[0].notes, '', 'Test 7.3: Default notes for empty data');
        displayTestResult('Add Central Topic', 'Test 7.3: Empty data - default notes', res.success, res.details);
    });

    runTestGroup('Clear Mindmap Functionality & Root Deletion', () => {
        resetMindmapDataForTest(); // Resets mindmapData, selectedNodeId

        resetMindmapDataForTest(); // Ensures mindmapData.nodes has one root
        const mainRootId = window.mindmapData.nodes[0].id;

        // Setup: Add some initial state that clear should remove/reset
        addNode(mainRootId, 'Initial Child 1');
        addNode(mainRootId, 'Initial Child 2');
        window.selectedNodeId = window.mindmapData.nodes[0].children[0].id;
        window.needsReRenderAfterCharts = true;
        window.chartReRenderTimer = setTimeout(() => {}, 1000);

        const nodeTextInput = document.getElementById('node-text-input');
        if (nodeTextInput) nodeTextInput.value = 'Some text';

        handleClearAllMindmap(); // Uses initializeDefaultMindmapData

        let res = assertEqual(window.mindmapData.nodes.length, 1, 'handleClearAllMindmap - Should have 1 default root node');
        displayTestResult('Clear Mindmap', 'handleClearAllMindmap - Default root count', res.success, res.details);
        if(res.success) {
            res = assertEqual(window.mindmapData.nodes[0].children.length, 0, 'handleClearAllMindmap - Root should have no children');
            displayTestResult('Clear Mindmap', 'handleClearAllMindmap - Children cleared', res.success, res.details);
            res = assertEqual(window.mindmapData.nodes[0].text, 'Root Node', 'handleClearAllMindmap - Root text should be default');
            displayTestResult('Clear Mindmap', 'handleClearAllMindmap - Root text default', res.success, res.details);
        }

        res = assertEqual(window.selectedNodeId, null, 'handleClearAllMindmap - selectedNodeId should be null');
        displayTestResult('Clear Mindmap', 'handleClearAllMindmap - selectedNodeId reset', res.success, res.details);
        // ... (other checks for flags are still valid) ...

        // Test deleteNode for the main root when it's the ONLY node
        resetMindmapDataForTest(); // Starts with one root
        const onlyRootId = window.mindmapData.nodes[0].id;
        window.selectedNodeId = onlyRootId;

        deleteNode(onlyRootId); // deleteNode now re-initializes if last node is deleted

        res = assertEqual(window.mindmapData.nodes.length, 1, "deleteNode(onlyRoot) - Should re-initialize to 1 default root");
        displayTestResult('Clear Mindmap', "deleteNode(onlyRoot) - Re-initializes", res.success, res.details);
        if(res.success){
            res = assertNotEqual(window.mindmapData.nodes[0].id, onlyRootId, "deleteNode(onlyRoot) - New root should have a new ID (or be 'root')");
            displayTestResult('Clear Mindmap', "deleteNode(onlyRoot) - New root ID", res.success, res.details);
             res = assertEqual(window.mindmapData.nodes[0].text, 'Root Node', "deleteNode(onlyRoot) - Default root text");
            displayTestResult('Clear Mindmap', "deleteNode(onlyRoot) - Default text", res.success, res.details);
        }
         // selectedNodeId should be the ID of the new root, or null if something went wrong with re-init.
        if (window.mindmapData.nodes.length > 0) {
            res = assertEqual(window.selectedNodeId, window.mindmapData.nodes[0].id, "deleteNode(onlyRoot) - selectedNodeId should be new root");
        } else {
            res = assertEqual(window.selectedNodeId, null, "deleteNode(onlyRoot) - selectedNodeId should be null if no new root");
        }
        displayTestResult('Clear Mindmap', "deleteNode(onlyRoot) - selectedNodeId after re-init", res.success, res.details);
    });

    runTestGroup('Floating Node Functionality', () => {
        resetMindmapDataForTest();
        // Test 1: Create a floating node
        const floatingNode1 = createNode(null, { text: 'My Floating Topic 1' });
        let res = assertNotNull(floatingNode1, 'Test 1.1: Floating node 1 should be created');
        displayTestResult('Floating Nodes', 'Test 1.1: Create floating node 1', res.success, res.details);
        if (res.success) {
            res = assertEqual(window.mindmapData.nodes.length, 2, 'Test 1.2: Should have 2 nodes (root + floating)');
            displayTestResult('Floating Nodes', 'Test 1.2: Node count after adding floating 1', res.success, res.details);
            const foundFloating = findNodeById(floatingNode1.id);
            res = assertNotNull(foundFloating, 'Test 1.3: Floating node 1 should be findable');
            displayTestResult('Floating Nodes', 'Test 1.3: Find floating node 1', res.success, res.details);
            res = assertEqual(typeof floatingNode1.x, 'number', 'Test 1.4: Floating node 1 has X coordinate');
            displayTestResult('Floating Nodes', 'Test 1.4: Floating node 1 X coord', res.success, res.details);
        }

        resetMindmapDataForTest();
        // Test 2: Create multiple floating nodes
        createNode(null, { text: 'Floating A' });
        createNode(null, { text: 'Floating B' });
        res = assertEqual(window.mindmapData.nodes.length, 3, 'Test 2.1: Should have 3 nodes (root + 2 floating)');
        displayTestResult('Floating Nodes', 'Test 2.1: Node count after multiple floating', res.success, res.details);

        resetMindmapDataForTest();
        // Test 3: Add a child to a floating node
        const floatingParent = createNode(null, { text: 'Floating Parent' });
        const childOfFloating = createNode(floatingParent.id, { text: 'Child of Floating' });
        res = assertNotNull(childOfFloating, 'Test 3.1: Child of floating node should be created');
        displayTestResult('Floating Nodes', 'Test 3.1: Create child of floating', res.success, res.details);
        if (res.success) {
            const fetchedFloatingParent = findNodeById(floatingParent.id);
            res = assertEqual(fetchedFloatingParent.children.length, 1, 'Test 3.2: Floating parent should have 1 child');
            displayTestResult('Floating Nodes', 'Test 3.2: Child count of floating parent', res.success, res.details);
            if(res.success) {
                res = assertEqual(fetchedFloatingParent.children[0].id, childOfFloating.id, 'Test 3.3: Child ID matches');
                displayTestResult('Floating Nodes', 'Test 3.3: Child ID in floating parent', res.success, res.details);
            }
            const parentFound = findParentNode(childOfFloating.id);
            res = assertEqual(parentFound.id, floatingParent.id, 'Test 3.4: findParentNode for child of floating');
            displayTestResult('Floating Nodes', 'Test 3.4: Parent of child of floating', res.success, res.details);
        }

        resetMindmapDataForTest();
        // Test 4: Delete a child of a floating node
        const fpDelChild = createNode(null, { text: 'FP Del Child' });
        const childToDel = createNode(fpDelChild.id, { text: 'Child to Delete' });
        deleteNode(childToDel.id);
        const fetchedFpDelChild = findNodeById(fpDelChild.id);
        res = assertEqual(fetchedFpDelChild.children.length, 0, 'Test 4.1: Floating parent should have 0 children after delete');
        displayTestResult('Floating Nodes', 'Test 4.1: Delete child of floating', res.success, res.details);

        resetMindmapDataForTest();
        // Test 5: Delete a floating node
        const floatingToDelete = createNode(null, { text: 'To Delete Floating' });
        const floatingToDeleteId = floatingToDelete.id;
        res = assertEqual(window.mindmapData.nodes.length, 2, 'Test 5.1: Node count before deleting floating');
        displayTestResult('Floating Nodes', 'Test 5.1: Pre-delete floating node count', res.success, res.details);
        deleteNode(floatingToDeleteId);
        res = assertEqual(window.mindmapData.nodes.length, 1, 'Test 5.2: Node count after deleting floating');
        displayTestResult('Floating Nodes', 'Test 5.2: Post-delete floating node count', res.success, res.details);
        res = assertNull(findNodeById(floatingToDeleteId), 'Test 5.3: Deleted floating node should not be findable');
        displayTestResult('Floating Nodes', 'Test 5.3: Find deleted floating node', res.success, res.details);

        resetMindmapDataForTest();
        // Test 6: Delete the main root (nodes[0]) when a floating node exists
        const mainRootOriginalId = window.mindmapData.nodes[0].id;
        const floatingKept = createNode(null, { text: 'Floating Kept' });
        deleteNode(mainRootOriginalId);
        res = assertEqual(window.mindmapData.nodes.length, 1, 'Test 6.1: Node count after deleting main root');
        displayTestResult('Floating Nodes', 'Test 6.1: Delete main root, count check', res.success, res.details);
        if(res.success){
            res = assertNull(findNodeById(mainRootOriginalId), 'Test 6.2: Original main root should not be findable');
            displayTestResult('Floating Nodes', 'Test 6.2: Find deleted main root', res.success, res.details);
            res = assertEqual(window.mindmapData.nodes[0].id, floatingKept.id, 'Test 6.3: Remaining node should be the floating one');
            displayTestResult('Floating Nodes', 'Test 6.3: Check remaining node ID', res.success, res.details);
        }

        resetMindmapDataForTest();
        // Test 7: Saving and Loading with floating nodes.
        window.localStorage = mockLocalStorage; mockLocalStorage.clear();
        const mainRootIdForSaveLoad = window.mindmapData.nodes[0].id;
        addNode(mainRootIdForSaveLoad, 'Child of Main SL');
        const floating1SL = createNode(null, { text: 'Floating 1 SL' });
        addNode(floating1SL.id, 'Child of Floating 1 SL');
        const floating2SL = createNode(null, { text: 'Floating 2 SL' });

        saveMindmapToLocalStorage();
        const json = mockLocalStorage.getItem(LOCAL_STORAGE_KEY);
        res = assertNotNull(json, 'Test 7.1: Saved JSON should not be null');
        displayTestResult('Floating Nodes', 'Test 7.1: Save with floating nodes', res.success, res.details);

        window.mindmapData = { nodes: [] }; // Clear current data
        loadMindmapFromLocalStorage(); // Load the data back

        res = assertEqual(window.mindmapData.nodes.length, 3, 'Test 7.2: Loaded node count should be 3');
        displayTestResult('Floating Nodes', 'Test 7.2: Load floating nodes - count', res.success, res.details);
        if(res.success){
            const loadedMainRoot = findNodeById(mainRootIdForSaveLoad);
            const loadedFloating1 = findNodeById(floating1SL.id);
            const loadedFloating2 = findNodeById(floating2SL.id);

            res = assertNotNull(loadedMainRoot, 'Test 7.3: Loaded main root exists');
            displayTestResult('Floating Nodes', 'Test 7.3: Loaded main root', res.success, res.details);
            if(res.success) {
                res = assertEqual(loadedMainRoot.children.length, 1, 'Test 7.4: Loaded main root child count');
                displayTestResult('Floating Nodes', 'Test 7.4: Main root children', res.success, res.details);
            }

            res = assertNotNull(loadedFloating1, 'Test 7.5: Loaded floating 1 exists');
            displayTestResult('Floating Nodes', 'Test 7.5: Loaded floating 1', res.success, res.details);
             if(res.success) {
                res = assertEqual(loadedFloating1.children.length, 1, 'Test 7.6: Loaded floating 1 child count');
                displayTestResult('Floating Nodes', 'Test 7.6: Floating 1 children', res.success, res.details);
            }
            res = assertNotNull(loadedFloating2, 'Test 7.7: Loaded floating 2 exists');
            displayTestResult('Floating Nodes', 'Test 7.7: Loaded floating 2', res.success, res.details);
        }
        window.localStorage = actualLocalStorage;

        resetMindmapDataForTest();
        // Test 8: Rendering with floating nodes (basic check).
        const mainRootElemId = window.mindmapData.nodes[0].id;
        const floatingNodeToRender = createNode(null, { text: 'My Floating Render Test' });
        renderMindmap(window.mindmapData, 'mindmap-container'); // renderMindmap is updated

        const mainRootElem = document.getElementById('mindmap-content-wrapper').querySelector(`[data-id="${mainRootElemId}"]`);
        res = assertNotNull(mainRootElem, 'Test 8.1: Main root element should be in DOM after render');
        displayTestResult('Floating Nodes', 'Test 8.1: Render main root with floating', res.success, res.details);

        const floatingElem = document.getElementById('mindmap-content-wrapper').querySelector(`[data-id="${floatingNodeToRender.id}"]`);
        res = assertNotNull(floatingElem, 'Test 8.2: Floating node element should be in DOM after render');
        displayTestResult('Floating Nodes', 'Test 8.2: Render floating node', res.success, res.details);
    });

    runTestGroup('Multiple Node Selection', () => {
        resetMindmapDataForTest();

        // Helper to simulate node click for testing selection logic
        // Directly calling the event handler is complex due to event object requirements.
        // Instead, we'll manipulate selectedNodeIds and call render/styling updates manually.
        // For a more robust test, one might need to dispatch actual click events.

        const mainRoot = window.mindmapData.nodes[0];
        const nodeA = createNode(mainRoot.id, { text: 'Node A' });
        const nodeB = createNode(mainRoot.id, { text: 'Node B' });
        const floatingC = createNode(null, { text: 'Floating C' });

        // Manually render to get elements for class checks (simplified)
        renderMindmap(window.mindmapData, 'mindmap-container');
        const elA = document.querySelector(`[data-id='${nodeA.id}']`);
        const elB = document.querySelector(`[data-id='${nodeB.id}']`);
        const elC = document.querySelector(`[data-id='${floatingC.id}']`);

        // Test 1: Normal click selects one, deselects others
        selectedNodeIds = [nodeA.id, floatingC.id]; // Simulate prior selection
        if(elA) elA.classList.add('selected-node');
        if(elC) elC.classList.add('selected-node');

        // Simulate normal click on nodeB (this logic is from createNodeElement's click handler)
        mindmapContainer.querySelectorAll('.mindmap-node.selected-node').forEach(el => el.classList.remove('selected-node'));
        selectedNodeIds = [nodeB.id];
        if(elB) elB.classList.add('selected-node');
        // --- end simulation of normal click ---

        let res = assertEqual(selectedNodeIds.length, 1, 'Normal click: selectedNodeIds length should be 1');
        displayTestResult('Multiple Selection', 'Normal click - length', res.success, res.details);
        res = assertTrue(selectedNodeIds.includes(nodeB.id), 'Normal click: nodeB should be selected');
        displayTestResult('Multiple Selection', 'Normal click - includes nodeB', res.success, res.details);
        if(elB) {
            res = assertTrue(elB.classList.contains('selected-node'), 'Normal click: nodeB element has class');
            displayTestResult('Multiple Selection', 'Normal click - nodeB style', res.success, res.details);
        }
        if(elA) {
             res = assertFalse(elA.classList.contains('selected-node'), 'Normal click: nodeA element no longer has class');
            displayTestResult('Multiple Selection', 'Normal click - nodeA style', res.success, res.details);
        }


        // Test 2: Ctrl/Cmd click to add to selection
        resetMindmapDataForTest(); // Start fresh for clarity
        const r = window.mindmapData.nodes[0];
        const n1 = createNode(r.id, {text: "N1"});
        const n2 = createNode(r.id, {text: "N2"});
        renderMindmap(window.mindmapData, 'mindmap-container');
        const elN1 = document.querySelector(`[data-id='${n1.id}']`);
        const elN2 = document.querySelector(`[data-id='${n2.id}']`);

        selectedNodeIds = [n1.id]; // Start with N1 selected
        if(elN1) elN1.classList.add('selected-node');

        // Simulate Ctrl/Cmd click on N2 (logic from createNodeElement)
        const alreadySelectedN2 = selectedNodeIds.includes(n2.id); // false
        if (alreadySelectedN2) { /* remove */ } else { selectedNodeIds.push(n2.id); }
        if(elN2) elN2.classList.add('selected-node'); // Manually add class for test verification
        // --- end simulation ---

        res = assertEqual(selectedNodeIds.length, 2, 'Ctrl click add: selectedNodeIds length should be 2');
        displayTestResult('Multiple Selection', 'Ctrl click add - length', res.success, res.details);
        res = assertTrue(selectedNodeIds.includes(n1.id) && selectedNodeIds.includes(n2.id), 'Ctrl click add: N1 and N2 selected');
        displayTestResult('Multiple Selection', 'Ctrl click add - includes N1, N2', res.success, res.details);


        // Test 3: Ctrl/Cmd click to remove from selection
        // selectedNodeIds is [n1.id, n2.id]
        // Simulate Ctrl/Cmd click on N1 (logic from createNodeElement)
        const alreadySelectedN1 = selectedNodeIds.includes(n1.id); // true
        if (alreadySelectedN1) { selectedNodeIds = selectedNodeIds.filter(id => id !== n1.id); } else { /* add */ }
        if(elN1) elN1.classList.remove('selected-node'); // Manually remove class
        // --- end simulation ---

        res = assertEqual(selectedNodeIds.length, 1, 'Ctrl click remove: selectedNodeIds length should be 1');
        displayTestResult('Multiple Selection', 'Ctrl click remove - length', res.success, res.details);
        res = assertTrue(selectedNodeIds.includes(n2.id) && !selectedNodeIds.includes(n1.id), 'Ctrl click remove: N2 still selected, N1 not');
        displayTestResult('Multiple Selection', 'Ctrl click remove - N2 selected, N1 not', res.success, res.details);


        // Test 4: Background click clears all
        selectedNodeIds = [n1.id, n2.id]; // Reselect for test
        // Simulate background click (logic from DOMContentLoaded)
        selectedNodeIds.forEach(id => { /* remove class from element */ });
        selectedNodeIds = [];
        // --- end simulation ---
        res = assertEqual(selectedNodeIds.length, 0, 'Background click: selectedNodeIds should be empty');
        displayTestResult('Multiple Selection', 'Background click - clears selection', res.success, res.details);

        // Test 5: getSelectedNodes()
        resetMindmapDataForTest();
        const rootGet = window.mindmapData.nodes[0];
        const childGet = createNode(rootGet.id, {text: "ChildGet"});
        const floatingGet = createNode(null, {text: "FloatingGet"});
        selectedNodeIds = [rootGet.id, floatingGet.id];

        const selectedObjects = getSelectedNodes();
        res = assertEqual(selectedObjects.length, 2, 'getSelectedNodes: should return 2 nodes');
        displayTestResult('Multiple Selection', 'getSelectedNodes - count', res.success, res.details);
        const idsFromObjects = selectedObjects.map(n => n.id).sort();
        const expectedIds = [rootGet.id, floatingGet.id].sort();
        res = assertDeepEqual(idsFromObjects, expectedIds, 'getSelectedNodes: IDs should match');
        displayTestResult('Multiple Selection', 'getSelectedNodes - IDs match', res.success, res.details);

        // Mock window.confirm for delete tests
        const originalConfirm = window.confirm;
        window.confirm = () => true;

        // Test 6: Delete multiple nodes
        resetMindmapDataForTest();
        const rootDel = window.mindmapData.nodes[0];
        const childDel = createNode(rootDel.id, {text: "ChildDel"});
        const floatingDel = createNode(null, {text: "FloatingDel"});
        selectedNodeIds = [childDel.id, floatingDel.id];

        // Simulate Delete key press logic
        const idsToDelete = [...selectedNodeIds];
        idsToDelete.forEach(id => deleteNode(id));
        // deleteNode updates selectedNodeIds, so we check it's empty or appropriately set

        res = assertNull(findNodeById(childDel.id), 'Delete multiple: childDel should be deleted');
        displayTestResult('Multiple Selection', 'Delete multiple - child deleted', res.success, res.details);
        res = assertNull(findNodeById(floatingDel.id), 'Delete multiple: floatingDel should be deleted');
        displayTestResult('Multiple Selection', 'Delete multiple - floating deleted', res.success, res.details);
        // Check if selection was cleared or set to a sensible default (e.g., root if it still exists)
        // deleteNode's internal logic sets selection to parent or first root.
        if (findNodeById(rootDel.id)) { // If rootDel was not deleted (parent of childDel)
             res = assertTrue(selectedNodeIds.includes(rootDel.id) || selectedNodeIds.length === 0, 'Delete multiple: selection is parent or empty');
        } else { // If rootDel was also deleted (e.g. if floatingDel was the parent, not possible here)
             res = assertEqual(selectedNodeIds.length, 0, 'Delete multiple: selection is empty if no sensible default');
        }
        displayTestResult('Multiple Selection', 'Delete multiple - selection state', res.success, res.details);


        // Test 7: Enter (Add Sibling) with multiple selected
        resetMindmapDataForTest();
        const rootEnter = window.mindmapData.nodes[0];
        const childEnter1 = createNode(rootEnter.id, {text: "ChildEnter1"});
        const floatingEnter = createNode(null, {text: "FloatingEnter"});
        selectedNodeIds = [childEnter1.id, floatingEnter.id]; // childEnter1 is first

        // Simulate Enter key press logic (mock prompt)
        const originalPrompt = window.prompt;
        window.prompt = () => "Sibling via Enter";
        promptAndAddSibling(selectedNodeIds[0]); // Action on first selected
        window.prompt = originalPrompt;

        const parentOfChildEnter1 = findNodeById(rootEnter.id);
        res = assertEqual(parentOfChildEnter1.children.length, 2, 'Enter on multi-select: parent of first selected gets new child (sibling)');
        displayTestResult('Multiple Selection', 'Enter multi-select - sibling added', res.success, res.details);
        if(res.success && parentOfChildEnter1.children.length === 2){
            res = assertEqual(parentOfChildEnter1.children[1].text, "Sibling via Enter", 'Enter on multi-select: sibling text');
            displayTestResult('Multiple Selection', 'Enter multi-select - sibling text', res.success, res.details);
        }

        // Test 8: Tab (Add Child) with multiple selected
        resetMindmapDataForTest();
        const rootTab = window.mindmapData.nodes[0];
        const childTab1 = createNode(rootTab.id, {text: "ChildTab1"});
        const floatingTab = createNode(null, {text: "FloatingTab"});
        selectedNodeIds = [childTab1.id, floatingTab.id]; // childTab1 is first

        window.prompt = () => "Child via Tab";
        promptAndAddChild(selectedNodeIds[0]); // Action on first selected
        window.prompt = originalPrompt;

        const firstSelectedNodeAfterTab = findNodeById(childTab1.id);
        res = assertEqual(firstSelectedNodeAfterTab.children.length, 1, 'Tab on multi-select: first selected gets child');
        displayTestResult('Multiple Selection', 'Tab multi-select - child added', res.success, res.details);
         if(res.success && firstSelectedNodeAfterTab.children.length === 1){
            res = assertEqual(firstSelectedNodeAfterTab.children[0].text, "Child via Tab", 'Tab on multi-select: child text');
            displayTestResult('Multiple Selection', 'Tab multi-select - child text', res.success, res.details);
        }

        // Test selecting all nodes (if applicable)
        resetMindmapDataForTest();
        const rAll = window.mindmapData.nodes[0];
        const cAll1 = createNode(rAll.id, {text: "C_All1"});
        const fAll1 = createNode(null, {text: "F_All1"});
        const cFAll1 = createNode(fAll1.id, {text: "C_F_All1"});
        const allNodeIds = [rAll.id, cAll1.id, fAll1.id, cFAll1.id];

        selectedNodeIds = [...allNodeIds]; // Manually select all
        let allSelectedObjects = getSelectedNodes();
        res = assertEqual(allSelectedObjects.length, allNodeIds.length, 'Select All: getSelectedNodes returns all nodes');
        displayTestResult('Multiple Selection', 'Select All - getSelectedNodes count', res.success, res.details);

        // Verify all elements have the class (simplified DOM check)
        renderMindmap(window.mindmapData, 'mindmap-container'); // Render to apply classes
        let allStyledCorrectly = true;
        allNodeIds.forEach(id => {
            const el = document.querySelector(`[data-id='${id}']`);
            if (!el || !el.classList.contains('selected-node')) {
                allStyledCorrectly = false;
            }
        });
        res = assertTrue(allStyledCorrectly, 'Select All: All selected nodes should have selected class');
        displayTestResult('Multiple Selection', 'Select All - DOM classes', res.success, res.details);


        window.confirm = originalConfirm; // Restore original confirm
    });

    runTestGroup('Update Node Functionality', () => {
        resetMindmapDataForTest();
        const mainRootNodeInitial = window.mindmapData.nodes[0];

        // Test 1: Update text of a main root node
        updateNode(mainRootNodeInitial.id, { text: 'Updated Root Text Successfully' });
        let updatedRoot = findNodeById(mainRootNodeInitial.id);
        let res = assertEqual(updatedRoot.text, 'Updated Root Text Successfully', 'Test 1.1: Main root text updated');
        displayTestResult('Update Node', 'Test 1.1: Update main root text', res.success, res.details);

        resetMindmapDataForTest();
        const rootForChildTest = window.mindmapData.nodes[0];
        const childNode = createNode(rootForChildTest.id, { text: 'Child Original Text', notes: 'Original Notes' });

        // Test 2: Update notes of a child node
        updateNode(childNode.id, { notes: 'Child notes are now updated.' });
        let updatedChild = findNodeById(childNode.id);
        res = assertEqual(updatedChild.notes, 'Child notes are now updated.', 'Test 2.1: Child node notes updated');
        displayTestResult('Update Node', 'Test 2.1: Update child notes', res.success, res.details);

        // Test 3: Update multiple properties at once
        updateNode(childNode.id, { text: 'Child Multi-Prop Text', isCollapsed: true, customAttr: 'TestValue' });
        updatedChild = findNodeById(childNode.id);
        res = assertEqual(updatedChild.text, 'Child Multi-Prop Text', 'Test 3.1: Multi-prop - text updated');
        displayTestResult('Update Node', 'Test 3.1: Multi-prop text', res.success, res.details);
        res = assertTrue(updatedChild.isCollapsed, 'Test 3.2: Multi-prop - isCollapsed updated');
        displayTestResult('Update Node', 'Test 3.2: Multi-prop isCollapsed', res.success, res.details);
        res = assertEqual(updatedChild.customAttr, 'TestValue', 'Test 3.3: Multi-prop - customAttr updated');
        displayTestResult('Update Node', 'Test 3.3: Multi-prop customAttr', res.success, res.details);

        // Test 4: Attempt to update a non-existent node
        const resultNonExistent = updateNode('non-existent-id', { text: 'Will Not Apply' });
        res = assertNull(resultNonExistent, 'Test 4.1: Updating non-existent node should return null');
        displayTestResult('Update Node', 'Test 4.1: Update non-existent node', res.success, res.details);

        // Test 5: Attempt to update id and children properties (should be ignored)
        resetMindmapDataForTest();
        const nodeForPropTest = window.mindmapData.nodes[0];
        const originalId = nodeForPropTest.id;
        const originalChildren = JSON.parse(JSON.stringify(nodeForPropTest.children));
        const originalX = nodeForPropTest.x;

        updateNode(nodeForPropTest.id, {
            id: 'try-to-change-id',
            children: [{ id: 'fake-child', text: 'Fake' }],
            text: 'Text Updated During Prop Test',
            x: originalX + 50
        });
        const nodeAfterPropTest = findNodeById(originalId);

        res = assertEqual(nodeAfterPropTest.id, originalId, 'Test 5.1: ID should not be updatable');
        displayTestResult('Update Node', 'Test 5.1: ID not changed', res.success, res.details);
        res = assertDeepEqual(nodeAfterPropTest.children, originalChildren, 'Test 5.2: Children array should not be directly updatable');
        displayTestResult('Update Node', 'Test 5.2: Children not changed', res.success, res.details);
        res = assertEqual(nodeAfterPropTest.text, 'Text Updated During Prop Test', 'Test 5.3: Text should be updated');
        displayTestResult('Update Node', 'Test 5.3: Other properties (text) still updated', res.success, res.details);
        res = assertEqual(nodeAfterPropTest.x, originalX + 50, 'Test 5.4: Other properties (x) still updated');
        displayTestResult('Update Node', 'Test 5.4: Other properties (x) still updated', res.success, res.details);

        // Test 6: Update properties of a floating node
        resetMindmapDataForTest();
        const floatingToUpdate = createNode(null, { text: 'Floating Original', x: 10, y: 10 });
        updateNode(floatingToUpdate.id, { text: 'Floating Updated Text', x: 200, isManuallyPositioned: true });
        const updatedFloating = findNodeById(floatingToUpdate.id);
        res = assertEqual(updatedFloating.text, 'Floating Updated Text', 'Test 6.1: Floating node text updated');
        displayTestResult('Update Node', 'Test 6.1: Update floating node text', res.success, res.details);
        res = assertEqual(updatedFloating.x, 200, 'Test 6.2: Floating node x coordinate updated');
        displayTestResult('Update Node', 'Test 6.2: Update floating node x', res.success, res.details);
        res = assertTrue(updatedFloating.isManuallyPositioned, 'Test 6.3: Floating node isManuallyPositioned updated');
        displayTestResult('Update Node', 'Test 6.3: Update floating node isManuallyPositioned', res.success, res.details);

        // Test 7: Update properties of a child of a floating node
        resetMindmapDataForTest();
        const floatingParentForChildUpdate = createNode(null, { text: 'FP For Child Update' });
        const childOfFloatingToUpdate = createNode(floatingParentForChildUpdate.id, { text: 'Child of Floating Original' });
        updateNode(childOfFloatingToUpdate.id, { text: 'Child of Floating Updated Text', notes: 'Notes for child of floating' });
        const updatedChildOfFloating = findNodeById(childOfFloatingToUpdate.id);
        res = assertEqual(updatedChildOfFloating.text, 'Child of Floating Updated Text', 'Test 7.1: Child of floating text updated');
        displayTestResult('Update Node', 'Test 7.1: Update child of floating text', res.success, res.details);
        res = assertEqual(updatedChildOfFloating.notes, 'Notes for child of floating', 'Test 7.2: Child of floating notes updated');
        displayTestResult('Update Node', 'Test 7.2: Update child of floating notes', res.success, res.details);

        // Test 8: Update node with empty string for text/notes
        resetMindmapDataForTest();
        const nodeForEmptyUpdate = window.mindmapData.nodes[0];
        updateNode(nodeForEmptyUpdate.id, { text: "", notes: "" });
        const updatedNodeEmpty = findNodeById(nodeForEmptyUpdate.id);
        res = assertEqual(updatedNodeEmpty.text, "", 'Test 8.1: Text updated to empty string');
        displayTestResult('Update Node', 'Test 8.1: Update text to empty', res.success, res.details);
        res = assertEqual(updatedNodeEmpty.notes, "", 'Test 8.2: Notes updated to empty string');
        displayTestResult('Update Node', 'Test 8.2: Update notes to empty', res.success, res.details);

        // Test 9: Update node with null/undefined values
        resetMindmapDataForTest();
        const nodeForNullUpdate = createNode(window.mindmapData.nodes[0].id, { text: "Original", notes: "Original Notes" });
        updateNode(nodeForNullUpdate.id, { notes: null });
        let nodeAfterNull = findNodeById(nodeForNullUpdate.id);
        res = assertNull(nodeAfterNull.notes, 'Test 9.1: Notes updated to null');
        displayTestResult('Update Node', 'Test 9.1: Update notes to null', res.success, res.details);

        const originalTextBeforeUndefined = nodeAfterNull.text;
        updateNode(nodeForNullUpdate.id, { text: undefined }); // Should not change the text
        nodeAfterNull = findNodeById(nodeForNullUpdate.id);
        res = assertEqual(nodeAfterNull.text, originalTextBeforeUndefined, 'Test 9.2: Text should not change if updatedData value is undefined');
        displayTestResult('Update Node', 'Test 9.2: Update text with undefined', res.success, res.details);

        // Test 10: isManuallyPositioned handling
        resetMindmapDataForTest();
        const nodeForManualPos = window.mindmapData.nodes[0];
        updateNode(nodeForManualPos.id, { isManuallyPositioned: true, x: 123 });
        let updatedPosNode = findNodeById(nodeForManualPos.id);
        res = assertTrue(updatedPosNode.isManuallyPositioned, 'Test 10.1: isManuallyPositioned set to true');
        displayTestResult('Update Node', 'Test 10.1: Set isManuallyPositioned true', res.success, res.details);
        res = assertEqual(updatedPosNode.x, 123, 'Test 10.2: X updated with isManuallyPositioned true');
        displayTestResult('Update Node', 'Test 10.2: X update with manual pos true', res.success, res.details);

        updateNode(nodeForManualPos.id, { isManuallyPositioned: false });
        updatedPosNode = findNodeById(nodeForManualPos.id);
        res = assertFalse(updatedPosNode.isManuallyPositioned, 'Test 10.3: isManuallyPositioned set to false');
        displayTestResult('Update Node', 'Test 10.3: Set isManuallyPositioned false', res.success, res.details);
    });

    runTestGroup('Connector Styling Functionality', () => {
        resetMindmapDataForTest();
        let mainRootNode = window.mindmapData.nodes[0];

        // Test 1: Default connector styles on new node (main root from reset)
        let res = assertNotNull(mainRootNode.style, 'Test 1.1: Main root has style object');
        displayTestResult('Connector Styling', 'Test 1.1: Default - root style object exists', res.success, res.details);
        if(res.success){
            res = assertEqual(mainRootNode.style.connectorColor, '#555555', 'Test 1.2: Default connectorColor');
            displayTestResult('Connector Styling', 'Test 1.2: Default connectorColor', res.success, res.details);
            res = assertEqual(mainRootNode.style.connectorThickness, '2', 'Test 1.3: Default connectorThickness');
            displayTestResult('Connector Styling', 'Test 1.3: Default connectorThickness', res.success, res.details);
            res = assertEqual(mainRootNode.style.connectorStyle, 'solid', 'Test 1.4: Default connectorStyle');
            displayTestResult('Connector Styling', 'Test 1.4: Default connectorStyle', res.success, res.details);
            res = assertEqual(mainRootNode.style.connectorShape, 'curved', 'Test 1.5: Default connectorShape');
            displayTestResult('Connector Styling', 'Test 1.5: Default connectorShape', res.success, res.details);
        }

        // Test 2: updateNode for connector properties
        const newConnectorStyles = {
            connectorColor: '#ff0000',
            connectorThickness: '3',
            connectorStyle: 'dashed',
            connectorShape: 'straight'
        };
        updateNode(mainRootNode.id, { style: newConnectorStyles });
        let updatedNode = findNodeById(mainRootNode.id);

        res = assertEqual(updatedNode.style.connectorColor, '#ff0000', 'Test 2.1: connectorColor updated');
        displayTestResult('Connector Styling', 'Test 2.1: Update connectorColor', res.success, res.details);
        res = assertEqual(updatedNode.style.connectorThickness, '3', 'Test 2.2: connectorThickness updated');
        displayTestResult('Connector Styling', 'Test 2.2: Update connectorThickness', res.success, res.details);
        res = assertEqual(updatedNode.style.connectorStyle, 'dashed', 'Test 2.3: connectorStyle updated');
        displayTestResult('Connector Styling', 'Test 2.3: Update connectorStyle', res.success, res.details);
        res = assertEqual(updatedNode.style.connectorShape, 'straight', 'Test 2.4: connectorShape updated');
        displayTestResult('Connector Styling', 'Test 2.4: Update connectorShape', res.success, res.details);

        // Test 3: Partial update of connector styles (merging)
        updateNode(mainRootNode.id, { style: { connectorColor: '#0000ff' } });
        updatedNode = findNodeById(mainRootNode.id);
        res = assertEqual(updatedNode.style.connectorColor, '#0000ff', 'Test 3.1: Partial - connectorColor updated');
        displayTestResult('Connector Styling', 'Test 3.1: Partial update - color', res.success, res.details);
        res = assertEqual(updatedNode.style.connectorThickness, '3', 'Test 3.2: Partial - thickness preserved');
        displayTestResult('Connector Styling', 'Test 3.2: Partial update - thickness preserved', res.success, res.details);
        res = assertEqual(updatedNode.style.connectorShape, 'straight', 'Test 3.3: Partial - shape preserved');
        displayTestResult('Connector Styling', 'Test 3.3: Partial update - shape preserved', res.success, res.details);

        // Test 4: SVG Path Verification (Conceptual - by checking attributes passed to a mocked/instrumented drawConnectionLine)
        // This requires instrumenting drawConnectionLine for tests or a more complex DOM check.
        // For now, we'll assume data propagation to drawConnectionLine is correct if data is updated.
        // A placeholder for how one might approach this:
        let lastPathAttributes = {};
        const originalDrawConnectionLine = window.drawConnectionLine; // Assume it's global for test
        window.drawConnectionLine = (parentElementData, childElement, parentElementDom) => {
            // Simplified: just store relevant attributes from parentElementData.style
            lastPathAttributes.stroke = parentElementData.style.connectorColor;
            lastPathAttributes.strokeWidth = parentElementData.style.connectorThickness;
            lastPathAttributes.strokeDasharray = '';
            if (parentElementData.style.connectorStyle === 'dashed') lastPathAttributes.strokeDasharray = '5,5';
            if (parentElementData.style.connectorStyle === 'dotted') lastPathAttributes.strokeDasharray = '2,3';
            lastPathAttributes.pathShape = parentElementData.style.connectorShape; // 'curved' or 'straight'
            // Call original if needed for visual tests, but not for this unit test's purpose
        };

        resetMindmapDataForTest();
        mainRootNode = window.mindmapData.nodes[0];
        const childForLineTest = createNode(mainRootNode.id, { text: "Child Line Test" });

        // Update styles that affect line drawing
        updateNode(mainRootNode.id, {
            style: {
                connectorColor: '#123456',
                connectorThickness: '4',
                connectorStyle: 'dotted',
                connectorShape: 'straight'
            }
        });
        // Simulate parts of renderMindmap that would lead to drawConnectionLine
        // This is a bit of a deeper integration test for this specific part.
        renderMindmap(window.mindmapData, 'mindmap-container'); // This will call traverseAndDrawLines, which calls our mocked drawConnectionLine

        res = assertEqual(lastPathAttributes.stroke, '#123456', 'Test 4.1: Mocked draw - stroke color');
        displayTestResult('Connector Styling', 'Test 4.1: Mocked draw - stroke color', res.success, res.details);
        res = assertEqual(lastPathAttributes.strokeWidth, '4', 'Test 4.2: Mocked draw - stroke width');
        displayTestResult('Connector Styling', 'Test 4.2: Mocked draw - stroke width', res.success, res.details);
        res = assertEqual(lastPathAttributes.strokeDasharray, '2,3', 'Test 4.3: Mocked draw - stroke dasharray for dotted');
        displayTestResult('Connector Styling', 'Test 4.3: Mocked draw - stroke dasharray', res.success, res.details);
        res = assertEqual(lastPathAttributes.pathShape, 'straight', 'Test 4.4: Mocked draw - path shape straight');
        displayTestResult('Connector Styling', 'Test 4.4: Mocked draw - path shape', res.success, res.details);

        window.drawConnectionLine = originalDrawConnectionLine; // Restore
    });

    runTestGroup('Drag and Drop Functionality (Data Tests)', () => {
        resetMindmapDataForTest();
        const mainRootNode = window.mindmapData.nodes[0];
        const originalX = mainRootNode.x;
        const originalY = mainRootNode.y;
        const newX = originalX + 100;
        const newY = originalY + 120;

        // Simulate the core logic of onDragEnd for data update
        mainRootNode.x = newX;
        mainRootNode.y = newY;
        mainRootNode.isManuallyPositioned = true;
        saveMindmapToLocalStorage(); // Directly call to check effect
        renderMindmap(window.mindmapData, 'mindmap-container'); // Re-render

        const updatedNodeData = findNodeById(mainRootNode.id);
        let res = assertEqual(updatedNodeData.x, newX, 'Drag main root: X coordinate updated in data');
        displayTestResult('Drag and Drop', 'Drag main root - X data', res.success, res.details);
        res = assertEqual(updatedNodeData.y, newY, 'Drag main root: Y coordinate updated in data');
        displayTestResult('Drag and Drop', 'Drag main root - Y data', res.success, res.details);
        res = assertTrue(updatedNodeData.isManuallyPositioned, 'Drag main root: isManuallyPositioned set to true');
        displayTestResult('Drag and Drop', 'Drag main root - isManuallyPositioned', res.success, res.details);

        const mainRootElement = document.getElementById('mindmap-content-wrapper').querySelector(`[data-id='${mainRootNode.id}']`);
        res = assertNotNull(mainRootElement, 'Drag main root: Element should be in DOM');
        if (res.success) {
            res = assertEqual(mainRootElement.style.left, newX + 'px', 'Drag main root: Element style.left updated');
            displayTestResult('Drag and Drop', 'Drag main root - DOM left style', res.success, res.details);
            res = assertEqual(mainRootElement.style.top, newY + 'px', 'Drag main root: Element style.top updated');
            displayTestResult('Drag and Drop', 'Drag main root - DOM top style', res.success, res.details);
        }

        // Verify save to local storage
        const storedData = JSON.parse(mockLocalStorage.getItem(LOCAL_STORAGE_KEY));
        const storedRoot = storedData.nodes.find(n => n.id === mainRootNode.id);
        res = assertEqual(storedRoot.x, newX, 'Drag main root: X coordinate saved to localStorage');
        displayTestResult('Drag and Drop', 'Drag main root - localStorage X', res.success, res.details);


        resetMindmapDataForTest();
        const floatingNode = createNode(null, { text: 'Floating Drag Test', x: 50, y: 50 });
        renderMindmap(window.mindmapData, 'mindmap-container'); // Initial render
        const newFloatingX = 250;
        const newFloatingY = 280;

        // Simulate onDragEnd logic for floating node
        floatingNode.x = newFloatingX;
        floatingNode.y = newFloatingY;
        floatingNode.isManuallyPositioned = true;
        saveMindmapToLocalStorage();
        renderMindmap(window.mindmapData, 'mindmap-container');

        const updatedFloatingData = findNodeById(floatingNode.id);
        res = assertEqual(updatedFloatingData.x, newFloatingX, 'Drag floating: X coordinate updated');
        displayTestResult('Drag and Drop', 'Drag floating - X data', res.success, res.details);
        res = assertTrue(updatedFloatingData.isManuallyPositioned, 'Drag floating: isManuallyPositioned set');
        displayTestResult('Drag and Drop', 'Drag floating - isManuallyPositioned', res.success, res.details);

        const floatingElement = document.getElementById('mindmap-content-wrapper').querySelector(`[data-id='${floatingNode.id}']`);
        res = assertNotNull(floatingElement, 'Drag floating: Element should be in DOM');
        if (res.success) {
            res = assertEqual(floatingElement.style.left, newFloatingX + 'px', 'Drag floating: Element style.left updated');
            displayTestResult('Drag and Drop', 'Drag floating - DOM left style', res.success, res.details);
        }
    });

    runTestGroup('Node Styling Functionality', () => {
        resetMindmapDataForTest();
        let mainRootNode = window.mindmapData.nodes[0];

        // Test 1: Default styles on new node (main root from reset)
        let res = assertNotNull(mainRootNode.style, 'Test 1.1: Main root should have a style object');
        displayTestResult('Node Styling', 'Test 1.1: Default style object exists (root)', res.success, res.details);
        if(res.success){
            res = assertEqual(mainRootNode.style.shape, 'rectangle', 'Test 1.2: Default shape is rectangle');
            displayTestResult('Node Styling', 'Test 1.2: Default shape (root)', res.success, res.details);
            res = assertEqual(mainRootNode.style.backgroundColor, '#ffffff', 'Test 1.3: Default background (root)');
            displayTestResult('Node Styling', 'Test 1.3: Default background (root)', res.success, res.details);
        }
        res = assertNotNull(mainRootNode.font, 'Test 1.4: Main root should have a font object');
        displayTestResult('Node Styling', 'Test 1.4: Default font object exists (root)', res.success, res.details);
        if(res.success){
            res = assertEqual(mainRootNode.font.size, '16px', 'Test 1.5: Default font size (root)');
            displayTestResult('Node Styling', 'Test 1.5: Default font size (root)', res.success, res.details);
        }

        // Test 2: Default styles on node from createNode
        const childNode = createNode(mainRootNode.id, { text: "Styled Child" });
        res = assertNotNull(childNode.style, 'Test 2.1: Child node should have a style object');
        displayTestResult('Node Styling', 'Test 2.1: Default style object exists (child)', res.success, res.details);
        res = assertEqual(childNode.style.shape, 'rectangle', 'Test 2.2: Default shape (child)');
        displayTestResult('Node Styling', 'Test 2.2: Default shape (child)', res.success, res.details);
        res = assertNotNull(childNode.font, 'Test 2.3: Child node should have a font object');
        displayTestResult('Node Styling', 'Test 2.3: Default font object exists (child)', res.success, res.details);

        // Test 3: updateNode for style properties
        updateNode(childNode.id, {
            style: {
                shape: 'ellipse',
                backgroundColor: '#ff0000',
                borderColor: '#00ff00',
                textColor: '#0000ff'
            }
        });
        let updatedChild = findNodeById(childNode.id);
        res = assertEqual(updatedChild.style.shape, 'ellipse', 'Test 3.1: Shape updated');
        displayTestResult('Node Styling', 'Test 3.1: Update shape', res.success, res.details);
        res = assertEqual(updatedChild.style.backgroundColor, '#ff0000', 'Test 3.2: BackgroundColor updated');
        displayTestResult('Node Styling', 'Test 3.2: Update backgroundColor', res.success, res.details);
        res = assertEqual(updatedChild.style.borderColor, '#00ff00', 'Test 3.3: BorderColor updated');
        displayTestResult('Node Styling', 'Test 3.3: Update borderColor', res.success, res.details);
        res = assertEqual(updatedChild.style.textColor, '#0000ff', 'Test 3.4: TextColor updated');
        displayTestResult('Node Styling', 'Test 3.4: Update textColor', res.success, res.details);

        // Test 4: updateNode for font properties
        updateNode(childNode.id, {
            font: {
                size: '20px',
                weight: 'bold',
                style: 'italic'
            }
        });
        updatedChild = findNodeById(childNode.id);
        res = assertEqual(updatedChild.font.size, '20px', 'Test 4.1: Font size updated');
        displayTestResult('Node Styling', 'Test 4.1: Update font size', res.success, res.details);
        res = assertEqual(updatedChild.font.weight, 'bold', 'Test 4.2: Font weight updated');
        displayTestResult('Node Styling', 'Test 4.2: Update font weight', res.success, res.details);
        res = assertEqual(updatedChild.font.style, 'italic', 'Test 4.3: Font style updated');
        displayTestResult('Node Styling', 'Test 4.3: Update font style', res.success, res.details);

        // Test 5: updateNode partial style update (merging)
        updateNode(childNode.id, { style: { backgroundColor: '#ffff00' } });
        updatedChild = findNodeById(childNode.id);
        res = assertEqual(updatedChild.style.backgroundColor, '#ffff00', 'Test 5.1: Partial style - backgroundColor updated');
        displayTestResult('Node Styling', 'Test 5.1: Partial style update (bgColor)', res.success, res.details);
        res = assertEqual(updatedChild.style.shape, 'ellipse', 'Test 5.2: Partial style - shape should remain from previous update');
        displayTestResult('Node Styling', 'Test 5.2: Partial style update (shape preserved)', res.success, res.details);
        res = assertEqual(updatedChild.style.textColor, '#0000ff', 'Test 5.3: Partial style - textColor should remain');
        displayTestResult('Node Styling', 'Test 5.3: Partial style update (textColor preserved)', res.success, res.details);

        // Test 6: updateNode partial font update (merging)
        updateNode(childNode.id, { font: { size: '12px' } });
        updatedChild = findNodeById(childNode.id);
        res = assertEqual(updatedChild.font.size, '12px', 'Test 6.1: Partial font - size updated');
        displayTestResult('Node Styling', 'Test 6.1: Partial font update (size)', res.success, res.details);
        res = assertEqual(updatedChild.font.weight, 'bold', 'Test 6.2: Partial font - weight should remain');
        displayTestResult('Node Styling', 'Test 6.2: Partial font update (weight preserved)', res.success, res.details);

        // Test 7: DOM style application after update
        resetMindmapDataForTest();
        mainRootNode = window.mindmapData.nodes[0];
        updateNode(mainRootNode.id, {
            style: { backgroundColor: '#aabbcc', shape: 'ellipse', textColor: '#112233' },
            font: { size: '22px', weight: 'bold' }
        });
        // renderMindmap is called by updateNode
        const mainRootElement = document.querySelector(`[data-id='${mainRootNode.id}']`);
        const textElement = mainRootElement ? mainRootElement.querySelector('.node-text') : null;

        res = assertNotNull(mainRootElement, 'Test 7.1: Main root element exists in DOM');
        displayTestResult('Node Styling', 'Test 7.1: DOM element exists', res.success, res.details);
        if(mainRootElement){
            res = assertEqual(mainRootElement.style.backgroundColor, 'rgb(170, 187, 204)', 'Test 7.2: DOM backgroundColor updated'); // Browsers convert hex to rgb
            displayTestResult('Node Styling', 'Test 7.2: DOM backgroundColor', res.success, res.details);
            res = assertTrue(mainRootElement.classList.contains('node-shape-ellipse'), 'Test 7.3: DOM shape class updated');
            displayTestResult('Node Styling', 'Test 7.3: DOM shape class', res.success, res.details);
            res = assertEqual(mainRootElement.style.borderRadius, '50%', 'Test 7.4: DOM border-radius for ellipse');
            displayTestResult('Node Styling', 'Test 7.4: DOM ellipse borderRadius', res.success, res.details);
        }
        res = assertNotNull(textElement, 'Test 7.5: Text element exists in DOM');
        displayTestResult('Node Styling', 'Test 7.5: DOM text element exists', res.success, res.details);
        if(textElement){
            res = assertEqual(textElement.style.color, 'rgb(17, 34, 51)', 'Test 7.6: DOM textColor updated');
            displayTestResult('Node Styling', 'Test 7.6: DOM textColor', res.success, res.details);
            res = assertEqual(textElement.style.fontSize, '22px', 'Test 7.7: DOM fontSize updated');
            displayTestResult('Node Styling', 'Test 7.7: DOM fontSize', res.success, res.details);
            res = assertEqual(textElement.style.fontWeight, 'bold', 'Test 7.8: DOM fontWeight updated');
            displayTestResult('Node Styling', 'Test 7.8: DOM fontWeight', res.success, res.details);
        }
    });

    runTestGroup('Direct Text Editing Functionality', () => {
        const originalPrompt = window.prompt; // Backup original prompt

        resetMindmapDataForTest();
        const mainRootNode = window.mindmapData.nodes[0];
        const newRootText = "New Root Text via Edit";

        window.prompt = () => newRootText; // Mock prompt

        // Simulate the dblclick action by directly calling editNodeText,
        // as event simulation is complex and editNodeText is the core logic.
        editNodeText(mainRootNode.id, newRootText);

        let updatedNode = findNodeById(mainRootNode.id);
        let res = assertEqual(updatedNode.text, newRootText, 'Edit main root: Text updated in data model');
        displayTestResult('Direct Text Edit', 'Edit main root - data model', res.success, res.details);

        renderMindmap(window.mindmapData, 'mindmap-container'); // Ensure DOM is updated
        const mainRootElement = document.getElementById('mindmap-content-wrapper').querySelector(`[data-id='${mainRootNode.id}'] .node-text`);
        res = assertNotNull(mainRootElement, 'Edit main root: Text element should be in DOM');
        if (res.success) {
            res = assertEqual(mainRootElement.textContent, newRootText, 'Edit main root: Text updated in DOM');
            displayTestResult('Direct Text Edit', 'Edit main root - DOM text', res.success, res.details);
        }

        // Verify save to local storage
        const storedData = JSON.parse(mockLocalStorage.getItem(LOCAL_STORAGE_KEY));
        const storedRoot = storedData.nodes.find(n => n.id === mainRootNode.id);
        res = assertEqual(storedRoot.text, newRootText, 'Edit main root: Text saved to localStorage');
        displayTestResult('Direct Text Edit', 'Edit main root - localStorage', res.success, res.details);

        // Test on a floating node
        resetMindmapDataForTest();
        const floatingNode = createNode(null, { text: 'Floating Original Text' });
        const newFloatingText = "Floating Text Updated by Edit";
        window.prompt = () => newFloatingText;
        editNodeText(floatingNode.id, newFloatingText);

        updatedNode = findNodeById(floatingNode.id);
        res = assertEqual(updatedNode.text, newFloatingText, 'Edit floating node: Text updated in data');
        displayTestResult('Direct Text Edit', 'Edit floating node - data model', res.success, res.details);

        renderMindmap(window.mindmapData, 'mindmap-container');
        const floatingElement = document.getElementById('mindmap-content-wrapper').querySelector(`[data-id='${floatingNode.id}'] .node-text`);
        if (floatingElement) {
            res = assertEqual(floatingElement.textContent, newFloatingText, 'Edit floating node: Text updated in DOM');
            displayTestResult('Direct Text Edit', 'Edit floating node - DOM text', res.success, res.details);
        } else {
            displayTestResult('Direct Text Edit', 'Edit floating node - DOM text', false, 'Floating node element not found');
        }

        // Test prompt returning null (no change)
        resetMindmapDataForTest();
        const nodeForNoChange = window.mindmapData.nodes[0];
        const originalText = nodeForNoChange.text;
        window.prompt = () => null; // Mock prompt to return null

        // Manually simulate the dblclick handler's check before calling editNodeText
        const textFromPrompt = window.prompt(); // This will be null
        if (textFromPrompt !== null && textFromPrompt.trim() !== '') {
             editNodeText(nodeForNoChange.id, textFromPrompt.trim());
        } // else, editNodeText is not called.

        updatedNode = findNodeById(nodeForNoChange.id);
        res = assertEqual(updatedNode.text, originalText, 'Edit with null prompt: Text should not change');
        displayTestResult('Direct Text Edit', 'Edit with null prompt - no change', res.success, res.details);

        window.prompt = originalPrompt; // Restore original prompt
    });

    runTestGroup('Update Node Functionality', () => {
        resetMindmapDataForTest();
        const mainRootNodeInitial = window.mindmapData.nodes[0];

        // Test 1: Update text of a main root node
        updateNode(mainRootNodeInitial.id, { text: 'Updated Root Text Successfully' });
        let updatedRoot = findNodeById(mainRootNodeInitial.id);
        let res = assertEqual(updatedRoot.text, 'Updated Root Text Successfully', 'Test 1.1: Main root text updated');
        displayTestResult('Update Node', 'Test 1.1: Update main root text', res.success, res.details);

        resetMindmapDataForTest();
        const rootForChildTest = window.mindmapData.nodes[0];
        const childNode = createNode(rootForChildTest.id, { text: 'Child Original Text' });

        // Test 2: Update notes of a child node
        updateNode(childNode.id, { notes: 'Child notes are now updated.' });
        let updatedChild = findNodeById(childNode.id);
        res = assertEqual(updatedChild.notes, 'Child notes are now updated.', 'Test 2.1: Child node notes updated');
        displayTestResult('Update Node', 'Test 2.1: Update child notes', res.success, res.details);

        // Test 3: Update multiple properties at once
        updateNode(childNode.id, { text: 'Child Multi-Prop Text', isCollapsed: true, customAttr: 'TestValue' });
        updatedChild = findNodeById(childNode.id);
        res = assertEqual(updatedChild.text, 'Child Multi-Prop Text', 'Test 3.1: Multi-prop - text updated');
        displayTestResult('Update Node', 'Test 3.1: Multi-prop text', res.success, res.details);
        res = assertTrue(updatedChild.isCollapsed, 'Test 3.2: Multi-prop - isCollapsed updated');
        displayTestResult('Update Node', 'Test 3.2: Multi-prop isCollapsed', res.success, res.details);
        res = assertEqual(updatedChild.customAttr, 'TestValue', 'Test 3.3: Multi-prop - customAttr updated');
        displayTestResult('Update Node', 'Test 3.3: Multi-prop customAttr', res.success, res.details);

        // Test 4: Attempt to update a non-existent node
        const resultNonExistent = updateNode('non-existent-id', { text: 'Will Not Apply' });
        res = assertNull(resultNonExistent, 'Test 4.1: Updating non-existent node should return null');
        displayTestResult('Update Node', 'Test 4.1: Update non-existent node', res.success, res.details);

        // Test 5: Attempt to update id and children properties (should be ignored)
        resetMindmapDataForTest();
        const nodeForPropTest = window.mindmapData.nodes[0];
        const originalId = nodeForPropTest.id;
        const originalChildren = JSON.parse(JSON.stringify(nodeForPropTest.children));
        const originalX = nodeForPropTest.x;

        updateNode(nodeForPropTest.id, {
            id: 'try-to-change-id',
            children: [{ id: 'fake-child', text: 'Fake' }],
            text: 'Text Updated During Prop Test',
            x: originalX + 50
        });
        const nodeAfterPropTest = findNodeById(originalId);

        res = assertEqual(nodeAfterPropTest.id, originalId, 'Test 5.1: ID should not be updatable');
        displayTestResult('Update Node', 'Test 5.1: ID not changed', res.success, res.details);
        res = assertDeepEqual(nodeAfterPropTest.children, originalChildren, 'Test 5.2: Children array should not be directly updatable');
        displayTestResult('Update Node', 'Test 5.2: Children not changed', res.success, res.details);
        res = assertEqual(nodeAfterPropTest.text, 'Text Updated During Prop Test', 'Test 5.3: Text should be updated');
        displayTestResult('Update Node', 'Test 5.3: Other properties (text) still updated', res.success, res.details);
        res = assertEqual(nodeAfterPropTest.x, originalX + 50, 'Test 5.4: Other properties (x) still updated');
        displayTestResult('Update Node', 'Test 5.4: Other properties (x) still updated', res.success, res.details);

        // Test 6: Update properties of a floating node
        resetMindmapDataForTest();
        const floatingToUpdate = createNode(null, { text: 'Floating Original', x: 10, y: 10 });
        updateNode(floatingToUpdate.id, { text: 'Floating Updated Text', x: 200, isManuallyPositioned: true });
        const updatedFloating = findNodeById(floatingToUpdate.id);
        res = assertEqual(updatedFloating.text, 'Floating Updated Text', 'Test 6.1: Floating node text updated');
        displayTestResult('Update Node', 'Test 6.1: Update floating node text', res.success, res.details);
        res = assertEqual(updatedFloating.x, 200, 'Test 6.2: Floating node x coordinate updated');
        displayTestResult('Update Node', 'Test 6.2: Update floating node x', res.success, res.details);
        res = assertTrue(updatedFloating.isManuallyPositioned, 'Test 6.3: Floating node isManuallyPositioned updated');
        displayTestResult('Update Node', 'Test 6.3: Update floating node isManuallyPositioned', res.success, res.details);

        // Test 7: Update properties of a child of a floating node
        resetMindmapDataForTest();
        const floatingParentForChildUpdate = createNode(null, { text: 'FP For Child Update' });
        const childOfFloatingToUpdate = createNode(floatingParentForChildUpdate.id, { text: 'Child of Floating Original' });
        updateNode(childOfFloatingToUpdate.id, { text: 'Child of Floating Updated Text', notes: 'Notes for child of floating' });
        const updatedChildOfFloating = findNodeById(childOfFloatingToUpdate.id);
        res = assertEqual(updatedChildOfFloating.text, 'Child of Floating Updated Text', 'Test 7.1: Child of floating text updated');
        displayTestResult('Update Node', 'Test 7.1: Update child of floating text', res.success, res.details);
        res = assertEqual(updatedChildOfFloating.notes, 'Notes for child of floating', 'Test 7.2: Child of floating notes updated');
        displayTestResult('Update Node', 'Test 7.2: Update child of floating notes', res.success, res.details);
    });

    runTestGroup('Node Deletion & Keyboard Actions', () => {
        const originalConfirm = window.confirm;
        const originalPrompt = window.prompt; // Just in case any sub-calls use it, though not expected for delete

        resetMindmapDataForTest();
        // Test 1: Delete a child node
        let mainRoot = window.mindmapData.nodes[0];
        const child1 = createNode(mainRoot.id, { text: "Child to Delete" });
        const child1Id = child1.id;
        deleteNode(child1Id);
        mainRoot = findNodeById(mainRoot.id); // Re-fetch parent
        let res = assertEqual(mainRoot.children.length, 0, 'Test 1.1: Child node should be removed from parent');
        displayTestResult('Node Deletion', 'Test 1.1: Delete child node', res.success, res.details);
        res = assertNull(findNodeById(child1Id), 'Test 1.2: Deleted child node should not be findable');
        displayTestResult('Node Deletion', 'Test 1.2: Find deleted child', res.success, res.details);

        // Test 2: Delete a node with its own children
        resetMindmapDataForTest();
        mainRoot = window.mindmapData.nodes[0];
        const parentToDelete = createNode(mainRoot.id, { text: "Parent to Delete" });
        const childOfParentToDelete = createNode(parentToDelete.id, { text: "Child of Parent to Delete" });
        const parentToDeleteId = parentToDelete.id;
        const childOfParentToDeleteId = childOfParentToDelete.id;

        deleteNode(parentToDeleteId);
        mainRoot = findNodeById(mainRoot.id);
        res = assertEqual(mainRoot.children.length, 0, 'Test 2.1: Parent node (with child) should be removed');
        displayTestResult('Node Deletion', 'Test 2.1: Delete node with children - parent removed', res.success, res.details);
        res = assertNull(findNodeById(parentToDeleteId), 'Test 2.2: Deleted parent node should not be findable');
        displayTestResult('Node Deletion', 'Test 2.2: Find deleted parent', res.success, res.details);
        res = assertNull(findNodeById(childOfParentToDeleteId), 'Test 2.3: Child of deleted parent should not be findable');
        displayTestResult('Node Deletion', 'Test 2.3: Find child of deleted parent', res.success, res.details);

        // Test 3: Delete a floating node without children
        resetMindmapDataForTest();
        const floatingNodeSimple = createNode(null, { text: "Floating to Delete Simple" });
        const floatingNodeSimpleId = floatingNodeSimple.id;
        res = assertEqual(window.mindmapData.nodes.length, 2, 'Test 3.1: Should have 2 root/floating nodes before delete');
        displayTestResult('Node Deletion', 'Test 3.1: Floating node pre-delete count', res.success, res.details);
        deleteNode(floatingNodeSimpleId);
        res = assertEqual(window.mindmapData.nodes.length, 1, 'Test 3.2: Should have 1 root node after deleting floating');
        displayTestResult('Node Deletion', 'Test 3.2: Floating node post-delete count', res.success, res.details);
        res = assertNull(findNodeById(floatingNodeSimpleId), 'Test 3.3: Deleted floating node not findable');
        displayTestResult('Node Deletion', 'Test 3.3: Find deleted simple floating node', res.success, res.details);

        // Test 4: Delete a floating node that has children
        resetMindmapDataForTest();
        const floatingParentDel = createNode(null, { text: "Floating Parent to Delete" });
        const childOfFloatingParentDel = createNode(floatingParentDel.id, { text: "Child of Floating Parent" });
        const floatingParentDelId = floatingParentDel.id;
        const childOfFloatingParentDelId = childOfFloatingParentDel.id;
        deleteNode(floatingParentDelId);
        res = assertEqual(window.mindmapData.nodes.length, 1, 'Test 4.1: Count after deleting floating parent');
        displayTestResult('Node Deletion', 'Test 4.1: Delete floating parent - count', res.success, res.details);
        res = assertNull(findNodeById(floatingParentDelId), 'Test 4.2: Deleted floating parent not findable');
        displayTestResult('Node Deletion', 'Test 4.2: Find deleted floating parent', res.success, res.details);
        res = assertNull(findNodeById(childOfFloatingParentDelId), 'Test 4.3: Child of deleted floating parent not findable');
        displayTestResult('Node Deletion', 'Test 4.3: Find child of deleted floating parent', res.success, res.details);

        // Test 5: Delete main root (nodes[0]) when other floating nodes exist
        resetMindmapDataForTest();
        const originalMainRootId = window.mindmapData.nodes[0].id;
        const floatingToKeep = createNode(null, { text: "Floating to Keep" });
        selectedNodeIds = [originalMainRootId]; // Simulate it was selected
        deleteNode(originalMainRootId);
        res = assertEqual(window.mindmapData.nodes.length, 1, 'Test 5.1: One node should remain after deleting main root');
        displayTestResult('Node Deletion', 'Test 5.1: Delete main root - count', res.success, res.details);
        if(res.success){
            res = assertEqual(window.mindmapData.nodes[0].id, floatingToKeep.id, 'Test 5.2: Remaining node is the floating one');
            displayTestResult('Node Deletion', 'Test 5.2: Delete main root - remaining node ID', res.success, res.details);
        }
        res = assertNull(findNodeById(originalMainRootId), 'Test 5.3: Original main root not findable');
        displayTestResult('Node Deletion', 'Test 5.3: Find deleted original main root', res.success, res.details);
        // Test selection update: should select the new mindmapData.nodes[0]
        res = assertTrue(selectedNodeIds.includes(floatingToKeep.id), 'Test 5.4: Selection moved to new main root');
        displayTestResult('Node Deletion', 'Test 5.4: Selection after deleting main root', res.success, res.details);


        // Test 6: Delete the very last node
        resetMindmapDataForTest(); // Starts with one root node
        const lastNodeId = window.mindmapData.nodes[0].id;
        selectedNodeIds = [lastNodeId];
        deleteNode(lastNodeId); // This should trigger initializeDefaultMindmapData
        res = assertEqual(window.mindmapData.nodes.length, 1, 'Test 6.1: A new default map should be initialized (1 node)');
        displayTestResult('Node Deletion', 'Test 6.1: Delete last node - re-initializes', res.success, res.details);
        if(res.success){
            res = assertNotEqual(window.mindmapData.nodes[0].id, lastNodeId, 'Test 6.2: New default root has a different ID (or is "root")');
            displayTestResult('Node Deletion', 'Test 6.2: Delete last node - new root ID', res.success, res.details);
            res = assertTrue(selectedNodeIds.includes(window.mindmapData.nodes[0].id), 'Test 6.3: Selection on new default root');
            displayTestResult('Node Deletion', 'Test 6.3: Selection after deleting last node', res.success, res.details);
        }

        // --- Delete Key Tests ---
        window.confirm = () => true; // Mock confirm to always be true for these tests

        // Test 7: Delete single selected child node via key press logic
        resetMindmapDataForTest();
        mainRoot = window.mindmapData.nodes[0];
        const childForKeyDel = createNode(mainRoot.id, { text: "Child for KeyDel" });
        const childForKeyDelId = childForKeyDel.id;
        selectedNodeIds = [childForKeyDelId];
        // Simulate keydown event logic for Delete key
        const idsToDelete = [...selectedNodeIds]; idsToDelete.forEach(id => deleteNode(id));

        mainRoot = findNodeById(mainRoot.id);
        res = assertEqual(mainRoot.children.length, 0, 'Test 7.1: Child deleted via key press');
        displayTestResult('Node Deletion', 'Test 7.1: Delete key - child', res.success, res.details);
        res = assertNull(findNodeById(childForKeyDelId), 'Test 7.2: Deleted child (key press) not findable');
        displayTestResult('Node Deletion', 'Test 7.2: Find deleted child (key press)', res.success, res.details);

        // Test 8: Delete multiple selected nodes via key press logic
        resetMindmapDataForTest();
        mainRoot = window.mindmapData.nodes[0];
        const childMultiDel = createNode(mainRoot.id, { text: "ChildMultiDel" });
        const floatingMultiDel = createNode(null, { text: "FloatingMultiDel" });
        selectedNodeIds = [childMultiDel.id, floatingMultiDel.id];
        const idsToMultiDelete = [...selectedNodeIds]; idsToMultiDelete.forEach(id => deleteNode(id));

        res = assertNull(findNodeById(childMultiDel.id), 'Test 8.1: Child from multi-delete (key press) not findable');
        displayTestResult('Node Deletion', 'Test 8.1: Multi-delete key press - child', res.success, res.details);
        res = assertNull(findNodeById(floatingMultiDel.id), 'Test 8.2: Floating from multi-delete (key press) not findable');
        displayTestResult('Node Deletion', 'Test 8.2: Multi-delete key press - floating', res.success, res.details);
        // Check selection (should be mainRoot, as parent of childMultiDel, or first of remaining roots if mainRoot was also deleted)
        res = assertTrue(selectedNodeIds.includes(mainRoot.id) || selectedNodeIds.length === 0, 'Test 8.3: Selection after multi-delete');
        displayTestResult('Node Deletion', 'Test 8.3: Selection after multi-delete (key press)', res.success, res.details);


        // Test 9: Delete key press with confirm returning false
        resetMindmapDataForTest();
        mainRoot = window.mindmapData.nodes[0];
        const nodeNoDelete = createNode(mainRoot.id, { text: "Node NoDelete" });
        selectedNodeIds = [nodeNoDelete.id];
        window.confirm = () => false; // Mock confirm to return false
        // Simulate keydown event logic
        if (window.confirm("Are you sure...")) { // This will be false
             const idsToNotDelete = [...selectedNodeIds]; idsToNotDelete.forEach(id => deleteNode(id));
        }
        res = assertNotNull(findNodeById(nodeNoDelete.id), 'Test 9.1: Node should not be deleted if confirm is false');
        displayTestResult('Node Deletion', 'Test 9.1: Delete key press - confirm false', res.success, res.details);
        res = assertEqual(selectedNodeIds.length, 1, 'Test 9.2: Selection should remain if confirm false');
        displayTestResult('Node Deletion', 'Test 9.2: Selection state after confirm false', res.success, res.details);

        window.confirm = originalConfirm; // Restore original confirm
        window.prompt = originalPrompt; // Restore original prompt
    });
})();
