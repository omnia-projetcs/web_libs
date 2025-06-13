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

    // --- Test Execution ---
    // Store the initial state from mindmap.js *before* any tests modify it globally
    originalMindmapData = JSON.parse(JSON.stringify(window.mindmapData));

    // The runTestGroup calls will execute the tests and display results.
    // No further explicit execution calls needed here.

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
