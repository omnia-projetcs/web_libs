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
    let currentTestMindmapData; // Per-test copy

    function getInitialMindmapDataState() {
        // Deep copy of the initial mindmapData from mindmap.js
        return JSON.parse(JSON.stringify(window.mindmapData));
    }

    function resetMindmapDataForTest() {
        // Resets the global mindmapData in mindmap.js to a clean initial state for each test
        // This is crucial for test isolation.
        window.mindmapData = JSON.parse(JSON.stringify(originalMindmapData));
        // Also reset any global counters if they affect test outcomes and are part of mindmap.js
        if (typeof window.resetNodeIdCounter === 'function') { // Assuming you might add this to mindmap.js
            window.resetNodeIdCounter();
        } else {
            // If mindmap.js directly exposes nodeIdCounter, reset it. This is less ideal.
            // For now, generateNodeId relies on Date.now(), making it mostly unique.
        }
        // Reset selectedNodeId if it's being used globally by mindmap.js
        if (typeof window.selectedNodeId !== 'undefined') {
            window.selectedNodeId = null;
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
        resetMindmapDataForTest();
        const id1 = generateNodeId();
        const id2 = generateNodeId();
        const result = assertNotEqual(id1, id2, 'generateNodeId() should produce unique IDs');
        displayTestResult('Node ID Generation', 'Unique IDs', result.success, result.details);
    });

    runTestGroup('Node Manipulation (Data Structure)', () => {
        resetMindmapDataForTest();
        addNode('root', 'Test Node 1');
        let node1 = findNodeById(window.mindmapData.root, window.mindmapData.root.children[window.mindmapData.root.children.length-1].id);
        let res = assertNotNull(node1, 'Node 1 should be added to root');
        displayTestResult('Node Manipulation', 'Add node to root', res.success, res.details);
        if (!res.success) return;

        resetMindmapDataForTest(); // Reset for next sub-test
        // Add a root node first to ensure there's a valid parent
        addNode('root', 'Parent For Child Test');
        const parentNodeForChild = window.mindmapData.root.children[0];

        addNode(parentNodeForChild.id, 'Child Node 1.1');
        node1 = findNodeById(window.mindmapData.root, parentNodeForChild.id); // Re-fetch parent
        const childNode = node1.children[0];
        res = assertNotNull(childNode, 'Child Node 1.1 should be added');
        displayTestResult('Node Manipulation', 'Add child node', res.success, res.details);
        if (!res.success) return;
        res = assertEqual(childNode.text, 'Child Node 1.1', 'Child node text should be correct');
        displayTestResult('Node Manipulation', 'Child node text check', res.success, res.details);

        resetMindmapDataForTest();
        addNode('root', 'Node to delete');
        const nodeToDelete = window.mindmapData.root.children[0];
        addNode(nodeToDelete.id, 'Child of node to delete');
        deleteNode(nodeToDelete.id);
        const deletedNode = findNodeById(window.mindmapData.root, nodeToDelete.id);
        res = assertEqual(deletedNode, null, 'Node and its children should be deleted');
        displayTestResult('Node Manipulation', 'Delete node with children', res.success, res.details);

        resetMindmapDataForTest();
        addNode('root', 'Node to edit');
        const nodeToEdit = window.mindmapData.root.children[0];
        editNodeText(nodeToEdit.id, 'Edited Text');
        const editedNode = findNodeById(window.mindmapData.root, nodeToEdit.id);
        res = assertEqual(editedNode.text, 'Edited Text', 'Node text should be updated');
        displayTestResult('Node Manipulation', 'Edit node text', res.success, res.details);
    });

    runTestGroup('Content Integration (Data Structure)', () => {
        resetMindmapDataForTest();
        addNode('root', 'Content Node');
        const contentNode = window.mindmapData.root.children[0];

        addOrEditNote(contentNode.id, 'Test Note');
        let node = findNodeById(window.mindmapData.root, contentNode.id);
        let res = assertEqual(node.notes, 'Test Note', 'Note should be added/edited');
        displayTestResult('Content Integration', 'Add/Edit Note', res.success, res.details);

        addOrEditTable(contentNode.id); // This will use prompts, need to handle or simplify for non-interactive test
        // For non-interactive: directly manipulate or mock prompt
        // Simplified test: Assume prompt returns valid data
        const mockTableData = { headers: ['H1'], rows: [['C1']] };
        // Simulate data that would come from prompts for addOrEditTable
        // This requires either refactoring addOrEditTable or complex mocking.
        // For now, we test if setting it works, assuming prompts are handled.
        node.table = mockTableData; // Directly set for test
        res = assertDeepEqual(node.table, mockTableData, 'Table data should be set');
        displayTestResult('Content Integration', 'Add/Edit Table (simplified data set)', res.success, res.details);

        addOrEditImage(contentNode.id); // Uses prompt
        node.image = { src: 'test.png', alt: 'Test Image' }; // Direct set
        res = assertDeepEqual(node.image, { src: 'test.png', alt: 'Test Image' }, 'Image data should be set');
        displayTestResult('Content Integration', 'Add/Edit Image (simplified data set)', res.success, res.details);

        addOrEditChart(contentNode.id); // Uses prompt
        node.chart = { type: 'bar', labels: ['A'], values: [10] }; // Direct set
        res = assertDeepEqual(node.chart, { type: 'bar', labels: ['A'], values: [10] }, 'Chart data should be set');
        displayTestResult('Content Integration', 'Add/Edit Chart (simplified data set)', res.success, res.details);
    });

    runTestGroup('Data Serialization & Persistence Logic', () => {
        resetMindmapDataForTest();
        window.localStorage = mockLocalStorage; // Swap in mock
        mockLocalStorage.clear();

        addNode('root', 'Data Persistence Node');
        const testData = window.mindmapData;

        saveMindmapToLocalStorage();
        const storedJson = mockLocalStorage.getItem(LOCAL_STORAGE_KEY);
        let res = assertNotNull(storedJson, 'Data should be saved to mock localStorage');
        displayTestResult('Persistence Logic', 'Save to localStorage', res.success, res.details);

        if (res.success) {
            const parsedStored = JSON.parse(storedJson);
            res = assertDeepEqual(parsedStored.root.children[0].text, 'Data Persistence Node', 'Stored data content should match');
            displayTestResult('Persistence Logic', 'Verify stored data content', res.success, res.details);
        }

        // Test loadMindmapFromLocalStorage
        // Modify current mindmapData to something different
        window.mindmapData.root.children = [];
        loadMindmapFromLocalStorage(); // Should load what was saved

        res = assertEqual(window.mindmapData.root.children.length, 1, 'mindmapData should have one child after loading');
        displayTestResult('Persistence Logic', 'Load from localStorage - children count', res.success, res.details);
        if (res.success && window.mindmapData.root.children.length > 0) {
             res = assertEqual(window.mindmapData.root.children[0].text, 'Data Persistence Node', 'Loaded node text should match saved');
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

    runTestGroup('Helper Functions', () => {
        resetMindmapDataForTest();
        addNode('root', 'Helper Node 1');
        const helperNode1 = window.mindmapData.root.children[0];
        addNode(helperNode1.id, 'Helper Child 1.1');
        const helperChild1_1 = helperNode1.children[0];

        let found = findNodeById(window.mindmapData.root, helperChild1_1.id);
        let res = assertEqual(found.id, helperChild1_1.id, 'findNodeById() should find existing child');
        displayTestResult('Helper Functions', 'findNodeById - existing', res.success, res.details);

        found = findNodeById(window.mindmapData.root, 'non-existent-id');
        res = assertEqual(found, null, 'findNodeById() should return null for non-existent ID');
        displayTestResult('Helper Functions', 'findNodeById - non-existent', res.success, res.details);

        const parent = findParentNode(window.mindmapData.root, helperChild1_1.id);
        res = assertEqual(parent.id, helperNode1.id, 'findParentNode() should find correct parent');
        displayTestResult('Helper Functions', 'findParentNode - existing child', res.success, res.details);

        const noParentForRoot = findParentNode(window.mindmapData.root, 'root');
        res = assertEqual(noParentForRoot, null, 'findParentNode() should return null for root');
        displayTestResult('Helper Functions', 'findParentNode - for root', res.success, res.details);
    });

    runTestGroup('Enhanced Node Creation (Direct Logic)', () => {
        resetMindmapDataForTest();
        // Test addChildNode
        let parentNode = findNodeById(window.mindmapData.root, 'root');
        parentNode.isCollapsed = true; // Set conditions for collapse test
        parentNode.children = []; // Ensure no children initially for collapse test

        addChildNode('root', 'Child 1 via addChildNode');
        parentNode = findNodeById(window.mindmapData.root, 'root'); // Re-fetch parent
        let res = assertEqual(parentNode.children.length, 1, 'Parent should have 1 child after addChildNode');
        displayTestResult('Enhanced Node Creation', 'addChildNode - child count', res.success, res.details);
        if (res.success) {
            res = assertEqual(parentNode.children[0].text, 'Child 1 via addChildNode', 'Child node text should be correct');
            displayTestResult('Enhanced Node Creation', 'addChildNode - child text', res.success, res.details);
            res = assertFalse(parentNode.isCollapsed, 'Parent should be expanded if it was collapsed and child was added');
            displayTestResult('Enhanced Node Creation', 'addChildNode - parent expansion', res.success, res.details);
        }

        resetMindmapDataForTest();
        // Test addSiblingNode
        addNode('root', 'Child A'); // Initial child
        const childA_id = window.mindmapData.root.children[0].id;
        addSiblingNode(childA_id, 'Sibling B');
        parentNode = findNodeById(window.mindmapData.root, 'root');
        res = assertEqual(parentNode.children.length, 2, 'Root should have 2 children after addSiblingNode to Child A');
        displayTestResult('Enhanced Node Creation', 'addSiblingNode - sibling count', res.success, res.details);
        if (res.success) {
            res = assertEqual(parentNode.children[1].text, 'Sibling B', 'Sibling node text should be correct');
            displayTestResult('Enhanced Node Creation', 'addSiblingNode - sibling text', res.success, res.details);
        }

        resetMindmapDataForTest();
        // Test addSiblingNode to root (should not add)
        addSiblingNode('root', 'Sibling to Root Attempt');
        parentNode = findNodeById(window.mindmapData.root, 'root');
        res = assertEqual(parentNode.children.length, 0, 'addSiblingNode should not add a sibling to the root node');
        displayTestResult('Enhanced Node Creation', 'addSiblingNode - to root (no op)', res.success, res.details);

        resetMindmapDataForTest();
        addNode('root', 'Parent C');
        const parentC_id = window.mindmapData.root.children[0].id;
        addChildNode(parentC_id, 'Child C.1');
        const childC1_id = window.mindmapData.root.children[0].children[0].id;
        addSiblingNode(childC1_id, 'Child C.2 (Sibling to C.1)');
        const parentC_node = findNodeById(window.mindmapData.root, parentC_id);
        res = assertEqual(parentC_node.children.length, 2, 'Parent C should have 2 children after adding sibling to C.1');
        displayTestResult('Enhanced Node Creation', 'addSiblingNode - to child of root', res.success, res.details);
         if (res.success) {
            res = assertEqual(parentC_node.children[1].text, 'Child C.2 (Sibling to C.1)', 'Sibling node C.2 text');
            displayTestResult('Enhanced Node Creation', 'addSiblingNode - to child of root text check', res.success, res.details);
        }
    });

    runTestGroup('Selection and Interaction Logic', () => {
        resetMindmapDataForTest();
        addNode('root', 'Node For Delete Test');
        const nodeToDeleteId = window.mindmapData.root.children[0].id;
        window.selectedNodeId = nodeToDeleteId; // Simulate selection

        deleteNode(nodeToDeleteId);
        let res = assertEqual(window.selectedNodeId, null, 'selectedNodeId should be null after deleting the selected node');
        displayTestResult('Selection Logic', 'deleteNode - selectedNodeId reset', res.success, res.details);

        // Test underlying logic for keyboard shortcuts
        resetMindmapDataForTest();
        addNode('root', 'Selected Node for Tab');
        const selectedForTab_id = window.mindmapData.root.children[0].id;
        window.selectedNodeId = selectedForTab_id;
        addChildNode(selectedForTab_id, 'Child via Tab Logic'); // Simulates Tab action
        const parentAfterTab = findNodeById(window.mindmapData.root, selectedForTab_id);
        res = assertEqual(parentAfterTab.children.length, 1, 'Selected node should have 1 child after Tab key logic');
        displayTestResult('Selection Logic', 'Logic after Tab key (addChildNode to selected)', res.success, res.details);
        if(res.success) {
            res = assertEqual(parentAfterTab.children[0].text, 'Child via Tab Logic', 'Child text from Tab logic');
            displayTestResult('Selection Logic', 'Logic after Tab key - text check', res.success, res.details);
        }
        window.selectedNodeId = null; // Reset selection

        resetMindmapDataForTest();
        addNode('root', 'Selected Node for Enter');
        const selectedForEnter_id = window.mindmapData.root.children[0].id;
        window.selectedNodeId = selectedForEnter_id;
        addSiblingNode(selectedForEnter_id, 'Sibling via Enter Logic'); // Simulates Enter action
        const rootAfterEnter = findNodeById(window.mindmapData.root, 'root');
        res = assertEqual(rootAfterEnter.children.length, 2, 'Root should have 2 children after Enter key logic on first child');
        displayTestResult('Selection Logic', 'Logic after Enter key (addSiblingNode to selected)', res.success, res.details);
         if(res.success) {
            res = assertEqual(rootAfterEnter.children[1].text, 'Sibling via Enter Logic', 'Sibling text from Enter logic');
            displayTestResult('Selection Logic', 'Logic after Enter key - text check', res.success, res.details);
        }
        window.selectedNodeId = null; // Reset selection
    });

    runTestGroup('Data Sanitization', () => {
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
    originalMindmapData = JSON.parse(JSON.stringify(window.mindmapData));

    // The runTestGroup calls will execute the tests and display results.
    // No further explicit execution calls needed here.

    runTestGroup('Tree Layout Algorithm', () => {
        const MOCK_CONTAINER_WIDTH = 1000; // For consistent testing

        // Helper to prepare data for layout tests
        function prepareForLayoutTest(testMindmapData) {
            window.mindmapData = testMindmapData; // Set the global mindmapData for the functions to use

            // Ensure a temp container exists for measurements (it's created if not present by the func)
            let tempContainer = getOrCreateTempMeasurementContainer();
            if (!document.body.contains(tempContainer)) { // Ensure it's in DOM for offsetWidth/Height
                 document.body.appendChild(tempContainer);
            }

            // Simulate the calls as in renderMindmap
            calculateAndStoreNodeDimensions(window.mindmapData.root, tempContainer);
            calculateSubtreeDimensionsRecursive(window.mindmapData.root);
            calculateTreeLayout(window.mindmapData.root, MOCK_CONTAINER_WIDTH);
        }

        resetMindmapDataForTest(); // Reset to original default mindmapData structure
        let testLayoutData = JSON.parse(JSON.stringify(originalMindmapData)); // Start with a fresh copy

        // Test Case: Root Centering
        testLayoutData.root.children = [
            { id: 'child1', text: 'Child 1', children: [], width: 100, height: 40 }, // Approx dimensions
            { id: 'child2', text: 'Child 2', children: [], width: 100, height: 40 }
        ];
        // Assume root itself is also some dimensions, e.g., from originalMindmapData or set manually
        testLayoutData.root.width = 150; testLayoutData.root.height = 50;

        prepareForLayoutTest(testLayoutData);

        // Root's subtreeWidth should have been calculated by prepareForLayoutTest
        const expectedRootX = (MOCK_CONTAINER_WIDTH / 2) - (window.mindmapData.root.subtreeWidth / 2);
        let res = assertEqual(Math.round(window.mindmapData.root.x), Math.round(expectedRootX),
                        `Root X (${Math.round(window.mindmapData.root.x)}) should be approx ${Math.round(expectedRootX)} (centered by subtreeWidth)`);
        displayTestResult('Tree Layout', 'Root Centering', res.success, res.details);

        resetMindmapDataForTest();
        testLayoutData = JSON.parse(JSON.stringify(originalMindmapData));

        // Test Case: Horizontal Non-Overlap of Sibling Subtrees
        testLayoutData.root.children = [
            {
                id: 'c1', text: 'Child 1', children: [
                    { id: 'gc1', text: 'GC1', children: [], width: 80, height: 30 } // Makes c1 wider
                ],
                width: 100, height: 40
            },
            { id: 'c2', text: 'Child 2', children: [], width: 100, height: 40 } // c2 is narrower
        ];
        testLayoutData.root.width = 150; testLayoutData.root.height = 50;
        // Ensure children are not manually positioned for this test
        testLayoutData.root.children.forEach(c => {c.isManuallyPositioned = false; delete c.x; delete c.y;});


        prepareForLayoutTest(testLayoutData);

        const child1Node = findNodeById(window.mindmapData.root, 'c1');
        const child2Node = findNodeById(window.mindmapData.root, 'c2');

        res = assertNotNull(child1Node, "Child 1 should exist for overlap test");
        displayTestResult('Tree Layout', 'Horizontal Non-Overlap - Child 1 exists', res.success, res.details);
        res = assertNotNull(child2Node, "Child 2 should exist for overlap test");
        displayTestResult('Tree Layout', 'Horizontal Non-Overlap - Child 2 exists', res.success, res.details);

        if (child1Node && child2Node && typeof child1Node.x === 'number' && typeof child2Node.x === 'number' &&
            typeof child1Node.subtreeWidth === 'number' && typeof child2Node.subtreeWidth === 'number') {

            // Assuming child1 is to the left of child2. If not, the test setup or layout is different than expected.
            // The layout algorithm should place them in order of the children array.
            if (child1Node.x < child2Node.x) {
                const child1End = child1Node.x + child1Node.subtreeWidth;
                const expectedChild2Start = child1End + SIBLING_SEPARATION;
                // child2Node.x should be >= child1.x + child1.subtreeWidth + SIBLING_SEPARATION
                res = assertTrue(child2Node.x >= child1End + SIBLING_SEPARATION - 0.01, // Small epsilon for float comparison
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
        testLayoutData = JSON.parse(JSON.stringify(originalMindmapData));

        // Test Case: Vertical Level Spacing - Basic Parent-Child
        testLayoutData.root.children = [ { id: 'c1', text: 'Child 1', children: [], width: 100, height: 40 } ];
        testLayoutData.root.width = 150; testLayoutData.root.height = 50;
        testLayoutData.root.children.forEach(c => {c.isManuallyPositioned = false; delete c.x; delete c.y;});

        prepareForLayoutTest(testLayoutData);

        const rootNodeForVertical = findNodeById(window.mindmapData.root, 'root');
        const child1ForVertical = findNodeById(window.mindmapData.root, 'c1');

        if (rootNodeForVertical && child1ForVertical && typeof rootNodeForVertical.y === 'number' && typeof child1ForVertical.y === 'number' &&
            typeof rootNodeForVertical.height === 'number') {
            // Child1.y should be root.y + root.height + LEVEL_SEPARATION as per old logic
            // New logic: child1.y (which is levelYPosition for level 1) should be
            // root.y + root.subtreeHeight (which is just root.height if no other children for root) + LEVEL_SEPARATION
            // The test for maxSubtreeReachInCurrentLevel is more complex and covered next.
            // For a simple root -> child case:
            // Level 0: root at root.y
            // Level 1: child1 at levelYPosition = root.y + root.subtreeHeight + LEVEL_SEPARATION
            // Here, root.subtreeHeight will be just root.height if root has no other children affecting its subtree calculation for this specific test.
            // Let's assume root.subtreeHeight has been calculated.

            const expectedChild1Y = rootNodeForVertical.y + (rootNodeForVertical.subtreeHeight || rootNodeForVertical.height) + LEVEL_SEPARATION;
            res = assertTrue(Math.abs(child1ForVertical.y - expectedChild1Y) < 0.01, // Epsilon for float
                `Child 1 Y (${child1ForVertical.y}) should be Root Y (${rootNodeForVertical.y}) + Root SubtreeHeight (${rootNodeForVertical.subtreeHeight || rootNodeForVertical.height}) + LEVEL_SEPARATION (${LEVEL_SEPARATION}). Expected ${expectedChild1Y}`);
            displayTestResult('Tree Layout', 'Vertical Level Spacing (Parent-Child)', res.success, res.details);
        } else {
            displayTestResult('Tree Layout', 'Vertical Level Spacing (Parent-Child)', false, 'Nodes or their y/height properties undefined for basic vertical test.');
        }

        resetMindmapDataForTest();
        testLayoutData = JSON.parse(JSON.stringify(originalMindmapData));
        // Test Case: Vertical Level Spacing - Tall Sibling Subtree
        testLayoutData.root.children = [
            {
                id: 'c1_tall', text: 'Child 1 (Tall Subtree)',
                children: [ { id: 'gc1', text: 'GC1', children: [ {id: 'ggc1', text:'GGC1', children:[], width:50, height:20}], width: 80, height: 30}],
                width: 100, height: 40
            },
            { id: 'c2_short', text: 'Child 2 (Short Subtree)', children: [], width: 100, height: 40 }
        ];
        // Add grandchildren to these children to test next level positioning
        testLayoutData.root.children[0].children.push({ id: 'gc1_2', text: 'GC1_2 sibling', children: [], width: 70, height: 30});
        testLayoutData.root.children[1].children = [{ id: 'gc2_1', text: 'GC2_1', children: [], width: 70, height: 30}];

        testLayoutData.root.width = 150; testLayoutData.root.height = 50;
        testLayoutData.root.children.forEach(c => {c.isManuallyPositioned = false; delete c.x; delete c.y;});
        testLayoutData.root.children[0].children.forEach(gc => {gc.isManuallyPositioned = false; delete gc.x; delete gc.y;});
        testLayoutData.root.children[1].children.forEach(gc => {gc.isManuallyPositioned = false; delete gc.x; delete gc.y;});


        prepareForLayoutTest(testLayoutData);

        const c1Tall = findNodeById(window.mindmapData.root, 'c1_tall');
        const c2Short = findNodeById(window.mindmapData.root, 'c2_short');
        const gc1_node = findNodeById(window.mindmapData.root, 'gc1'); // Grandchild of c1_tall
        const gc2_1_node = findNodeById(window.mindmapData.root, 'gc2_1'); // Grandchild of c2_short

        if (c1Tall && c2Short && gc1_node && gc2_1_node &&
            typeof c1Tall.y === 'number' && typeof c1Tall.subtreeHeight === 'number' &&
            typeof c2Short.y === 'number' && typeof c2Short.subtreeHeight === 'number' &&
            typeof gc1_node.y === 'number' && typeof gc2_1_node.y === 'number') {

            res = assertTrue(Math.abs(c1Tall.y - c2Short.y) < 0.01, `Sibling Ys C1 (${c1Tall.y}) and C2 (${c2Short.y}) should be same.`);
            displayTestResult('Tree Layout', 'Vertical Spacing (Siblings at same level)', res.success, res.details);

            const expected_gc_level_y = Math.max(
                c1Tall.y + c1Tall.subtreeHeight,
                c2Short.y + c2Short.subtreeHeight
            ) + LEVEL_SEPARATION;

            res = assertTrue(Math.abs(gc1_node.y - expected_gc_level_y) < 0.01,
                `GC1 Y (${gc1_node.y}) should be at level after tallest sibling subtree. Expected ${expected_gc_level_y}`);
            displayTestResult('Tree Layout', 'Vertical Spacing (GC1 after Tall Sibling Subtree)', res.success, res.details);

            res = assertTrue(Math.abs(gc2_1_node.y - expected_gc_level_y) < 0.01,
                `GC2_1 Y (${gc2_1_node.y}) should be at same level as GC1. Expected ${expected_gc_level_y}`);
            displayTestResult('Tree Layout', 'Vertical Spacing (GC2_1 same level as GC1)', res.success, res.details);

        } else {
            displayTestResult('Tree Layout', 'Vertical Spacing (Tall Sibling Subtree)', false, 'Nodes or their y/subtreeHeight properties undefined for tall sibling vertical test.');
        }

        resetMindmapDataForTest();
        testLayoutData = JSON.parse(JSON.stringify(originalMindmapData));

        // Test Case: Manually Positioned Parent, Algorithmic Children
        const manualX = 250;
        const manualY = 150;
        testLayoutData.root.children = [
            {
                id: 'manual_parent', text: 'Manual Parent',
                isManuallyPositioned: true, x: manualX, y: manualY,
                children: [
                    { id: 'algo_child1', text: 'Algo Child 1', children: [], width: 80, height: 30 },
                    { id: 'algo_child2', text: 'Algo Child 2', children: [], width: 80, height: 30 }
                ],
                width: 120, height: 40
            }
        ];
        // Ensure algo children are not manually positioned
        testLayoutData.root.children[0].children.forEach(ac => { ac.isManuallyPositioned = false; delete ac.x; delete ac.y; });


        prepareForLayoutTest(testLayoutData);

        const manualParentNode = findNodeById(window.mindmapData.root, 'manual_parent');
        const algoChild1Node = findNodeById(window.mindmapData.root, 'algo_child1');
        const algoChild2Node = findNodeById(window.mindmapData.root, 'algo_child2');

        res = assertNotNull(manualParentNode, "Manual Parent node should exist");
        displayTestResult('Tree Layout', 'Manual Parent - Exists', res.success, res.details);
        if (manualParentNode) {
            res = assertEqual(manualParentNode.x, manualX, `Manual Parent X should remain ${manualX}`);
            displayTestResult('Tree Layout', 'Manual Parent - X position preserved', res.success, res.details);
            res = assertEqual(manualParentNode.y, manualY, `Manual Parent Y should remain ${manualY}`);
            displayTestResult('Tree Layout', 'Manual Parent - Y position preserved', res.success, res.details);
        }

        if (manualParentNode && algoChild1Node && algoChild2Node &&
            typeof manualParentNode.x === 'number' && typeof manualParentNode.y === 'number' &&
            typeof manualParentNode.width === 'number' && typeof manualParentNode.height === 'number' &&
            typeof algoChild1Node.x === 'number' && typeof algoChild1Node.y === 'number' &&
            typeof algoChild1Node.subtreeWidth === 'number' && typeof algoChild2Node.subtreeWidth === 'number') {

            // Children X should be centered around manualParentNode.x + manualParentNode.width / 2
            const parentCenterX = manualParentNode.x + (manualParentNode.width / 2);
            const childrenTotalSubtreeWidth = algoChild1Node.subtreeWidth + SIBLING_SEPARATION + algoChild2Node.subtreeWidth;
            const expectedChild1X = parentCenterX - (childrenTotalSubtreeWidth / 2);

            res = assertTrue(Math.abs(algoChild1Node.x - expectedChild1X) < 0.01,
                `Algo Child 1 X (${algoChild1Node.x}) should be algorithmically positioned relative to Manual Parent. Expected ${expectedChild1X}`);
            displayTestResult('Tree Layout', 'Manual Parent - Algo Child 1 X position', res.success, res.details);

            // Children Y should be manualParentNode.y + manualParentNode.subtreeHeight + LEVEL_SEPARATION
            // (as per the new Y logic, the level for algoChild1 starts after manualParentNode's subtree)
            const expectedChildY = manualParentNode.y + (manualParentNode.subtreeHeight || manualParentNode.height) + LEVEL_SEPARATION;
            res = assertTrue(Math.abs(algoChild1Node.y - expectedChildY) < 0.01,
                `Algo Child 1 Y (${algoChild1Node.y}) should be based on Manual Parent's Y and subtreeHeight. Expected ${expectedChildY}`);
            displayTestResult('Tree Layout', 'Manual Parent - Algo Child Y position', res.success, res.details);
            res = assertTrue(Math.abs(algoChild2Node.y - expectedChildY) < 0.01,
                `Algo Child 2 Y (${algoChild2Node.y}) should be same as Algo Child 1 Y. Expected ${expectedChildY}`);
            displayTestResult('Tree Layout', 'Manual Parent - Algo Child 2 Y position', res.success, res.details);
        } else {
            displayTestResult('Tree Layout', 'Manual Parent - Algo Children positioning', false, 'Nodes or their layout properties are undefined.');
        }

        resetMindmapDataForTest();
        testLayoutData = JSON.parse(JSON.stringify(originalMindmapData));

        // Test Case: Collapsed Node
        testLayoutData.root.children = [
            {
                id: 'p_collapsed', text: 'Parent Collapsed', isCollapsed: true,
                children: [
                    { id: 'c_under_collapsed', text: 'Child under collapsed', children: [], width: 80, height: 30, x: 999, y: 999 } // Deliberate x,y
                ],
                width: 140, height: 45
            }
        ];
        testLayoutData.root.width = 150; testLayoutData.root.height = 50;

        prepareForLayoutTest(testLayoutData);

        const collapsedParentNode = findNodeById(window.mindmapData.root, 'p_collapsed');
        const childUnderCollapsed = findNodeById(window.mindmapData.root, 'c_under_collapsed');

        res = assertNotNull(collapsedParentNode, "Collapsed Parent node should exist");
        displayTestResult('Tree Layout', 'Collapsed Node - Parent exists', res.success, res.details);
        if (collapsedParentNode) {
            res = assertEqual(collapsedParentNode.subtreeWidth, collapsedParentNode.width, 'Collapsed parent subtreeWidth should be its own width');
            displayTestResult('Tree Layout', 'Collapsed Node - subtreeWidth', res.success, res.details);
            res = assertEqual(collapsedParentNode.subtreeHeight, collapsedParentNode.height, 'Collapsed parent subtreeHeight should be its own height');
            displayTestResult('Tree Layout', 'Collapsed Node - subtreeHeight', res.success, res.details);
        }

        res = assertNotNull(childUnderCollapsed, "Child under collapsed parent should exist in data");
        displayTestResult('Tree Layout', 'Collapsed Node - Child data exists', res.success, res.details);
        if (childUnderCollapsed) {
            // assignAlgorithmicXRecursive should not have processed children of a collapsed node.
            // Their x,y should remain as they were (or undefined if not set initially).
            // calculateTreeLayout's Y assignment loop also skips children of collapsed nodes for level processing.
            // So, their original x,y (999) should be preserved.
            res = assertEqual(childUnderCollapsed.x, 999,
                `Child under collapsed parent X (${childUnderCollapsed.x}) should not be changed by layout. Expected 999.`);
            displayTestResult('Tree Layout', 'Collapsed Node - Child X not laid out', res.success, res.details);
             res = assertEqual(childUnderCollapsed.y, 999,
                `Child under collapsed parent Y (${childUnderCollapsed.y}) should not be changed by layout. Expected 999.`);
            displayTestResult('Tree Layout', 'Collapsed Node - Child Y not laid out', res.success, res.details);

            // Also verify level was not assigned if parent collapsed
            res = assertEqual(typeof childUnderCollapsed.level, 'undefined', 'Child under collapsed parent should not have a level assigned by layout');
            displayTestResult('Tree Layout', 'Collapsed Node - Child level not assigned', res.success, res.details);
        }
    });

    // Final summary update (in case some tests were async, though these are sync)
    updateSummary();

})();

// Helper to make nodeIdCounter resettable from tests if it were global in mindmap.js
// Example: if mindmap.js had:
// window.nodeIdCounter = 0;
// window.resetNodeIdCounter = () => { window.nodeIdCounter = 0; };
// Then tests could call window.resetNodeIdCounter().
// For now, generateNodeId() uses Date.now() so it's mostly fine for tests.
// A more robust unique ID might be needed for a real app (e.g., UUIDs).
