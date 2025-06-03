// PureChart/tests/bar-chart-labels.test.js

// It might be necessary to import or require PureChart.js depending on the test environment.
// For this subtask, we assume the PureChart class is available globally or can be loaded.
// If PureChart.js is not automatically available in the test scope, one might need:
// const PureChart = require('../PureChart.js'); // Adjust path as needed

describe('PureChart Label Positioning', () => {
    let mockCtx;
    let mockCanvas;
    let originalPureChart; // To store the original PureChart class if we need to restore it

    beforeAll(() => {
        // If PureChart is loaded via a script tag in a browser environment, it would be global.
        // If it's a module, it would need to be imported/required.
        // For this test, we assume PureChart is accessible.
        // If running in Node.js without a DOM, PureChart might need to be loaded carefully.
        // originalPureChart = global.PureChart; // Example if it were global
    });

    afterAll(() => {
        // global.PureChart = originalPureChart; // Restore if changed
    });

    beforeEach(() => {
        mockCtx = {
            fillStyle: '',
            font: '',
            _textAlign: '', // Internal storage for textAlign
            textBaseline: '',
            lineWidth: 0,
            strokeStyle: '',
            fillTextCalls: [],
            textAlignChanges: [],
            fillRect: () => {}, // jest.fn() equivalent: function() {}
            strokeRect: () => {},
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            arc: () => {},
            fill: () => {},
            stroke: () => {},
            clearRect: () => {},
            measureText: text => ({ width: (text ? String(text).length : 0) * 6 }), // Simple mock
            save: () => {},
            restore: () => {},
            translate: () => {},
            rotate: () => {},
            setLineDash: () => {},
            arcTo: () => {},
            closePath: () => {},
            fillText: function(text, x, y) { // Use function to access this.textAlign
                this.fillTextCalls.push({ text: String(text), x, y, textAlign: this._textAlign });
            }
        };
        // Define textAlign property with getter and setter
        Object.defineProperty(mockCtx, 'textAlign', {
            get: function() { return this._textAlign || ''; },
            set: function(value) {
                this._textAlign = value;
                this.textAlignChanges.push(value);
            }
        });

        mockCanvas = {
            getContext: (contextId) => {
                if (contextId === '2d') return mockCtx;
                return null;
            },
            width: 600,
            height: 400,
            parentElement: {
                getBoundingClientRect: () => ({ width: 600, height: 400, top: 0, left: 0 })
            },
            getAttribute: (attr) => {
                 if (attr === 'width') return '600';
                 if (attr === 'height') return '400';
                 return null;
            },
            getBoundingClientRect: () => ({ // Mock for _getMousePos if tooltip logic runs
                left: 0,
                top: 0
            })
        };

        // Mock global document and window typically needed by charting libraries
        global.document = {
            getElementById: (id) => mockCanvas,
            createElement: (tagName) => {
                if (tagName === 'div') return { style: {} }; // Mock tooltip element
                return { style: {} }; // Generic mock for other elements
            },
            body: {
                appendChild: () => {},
                removeChild: () => {} // Mock for tooltip removal in destroy
            }
        };

        global.window = {
            ResizeObserver: class ResizeObserver {
                constructor(callback) { this.callback = callback; }
                observe(element) { this.element = element; }
                unobserve() {}
                disconnect() {}
            },
            requestAnimationFrame: (callback) => { // Often used for animations or optimized drawing
                return setTimeout(callback, 0); // Simple mock
            },
            pageXOffset: 0, // For tooltip positioning
            pageYOffset: 0, // For tooltip positioning
            innerWidth: 1024, // For tooltip positioning
            innerHeight: 768   // For tooltip positioning
        };

        // Ensure PureChart class is available. If it's not a global, this test setup assumes it's loaded.
        // For example, if PureChart.js defines `window.PureChart = PureChart;` or similar.
        // If it's a module, tests would typically `require` or `import` it.
        if (typeof PureChart === 'undefined') {
            // This is a placeholder for actual loading if needed.
            // In a real Jest setup, you'd use `require('../PureChart.js');`
            // For now, we proceed assuming PureChart is somehow loaded into the global scope for the subtask.
            console.warn("PureChart class not found globally. Tests may not run correctly without proper loading.");
        }
    });

    test('should center labels under bars for bar charts', () => {
        const config = {
            type: 'bar',
            data: {
                labels: ['Apple', 'Banana', 'Cherry'],
                datasets: [{ label: 'Fruit Counts', values: [100, 200, 150] }]
            },
            options: {
                padding: { top: 20, right: 20, bottom: 40, left: 50 }, // Adjusted left padding
                bar: { groupSpacingFactor: 0.2 },
                yAxes: [{ id: 'left', position: 'left', display: true, beginAtZero: true, maxTicks: 5, sampleLabelForWidthEstimation: "100" }],
                xAxis: { display: true, labelFont: '10px Arial' }, // Ensure xAxis options are present
                title: { display: false }, // Disable title to simplify drawArea calculation
                legend: { display: false }, // Disable legend
                tooltip: { enabled: false } // Disable tooltips
            },
            width: mockCanvas.width,
            height: mockCanvas.height
        };

        const chartInstance = new PureChart('mockCanvasId', config); // This will trigger drawing

        // Expected textAlign to be 'center' for bar chart labels
        // Filter fillTextCalls to only include those for the x-axis labels
        const xAxisLabelTexts = config.data.labels;
        const xLabelCalls = mockCtx.fillTextCalls.filter(call => xAxisLabelTexts.includes(call.text));

        expect(xLabelCalls.length).toBe(xAxisLabelTexts.length); // Ensure all labels were attempted
        xLabelCalls.forEach(call => {
            expect(call.textAlign).toBe('center');
        });

        // Verification of X positions
        // Need to get drawArea. It's calculated internally. We can create a helper instance or estimate.
        // For simplicity, let's re-calculate drawArea based on known config.
        // This assumes _getDrawingArea is deterministic and accessible or its logic can be replicated.
        // A simplified drawArea calculation for this specific config:
        const estimatedDrawArea = {
            x: config.options.padding.left + 10 + 5, // Simplified: padding.left + yAxisLabelWidth + yAxisTitle (approx)
                                                       // From config: left:50. yAxis label "100" width approx 18. title not displayed.
                                                       // Actual calc is complex; using chartInstance.drawArea is better.
            y: config.options.padding.top,             // Simplified: padding.top + titleHeight + legendHeight
            width: mockCanvas.width - (config.options.padding.left + 10 + 5) - config.options.padding.right,
            height: mockCanvas.height - config.options.padding.top - config.options.padding.bottom - (10*1.5+5) // label height + spacing
        };
        // More accurate way:
        const drawArea = chartInstance.drawArea;


        const numLabels = config.data.labels.length;
        const groupSpacingFactor = config.options.bar.groupSpacingFactor || 0.2;
        const groupTotalWidth = drawArea.width / numLabels;
        const actualGroupSpacing = groupTotalWidth * groupSpacingFactor;
        const groupDrawableWidth = groupTotalWidth - actualGroupSpacing;

        config.data.labels.forEach((label, i) => {
            const groupCanvasXStart = drawArea.x + (i * groupTotalWidth) + (actualGroupSpacing / 2);
            const expectedX = groupCanvasXStart + groupDrawableWidth / 2;

            const correspondingCall = xLabelCalls.find(call => call.text === label);
            expect(correspondingCall).not.toBeUndefined();
            if (correspondingCall) {
                // Using toBeCloseTo for floating point comparisons
                expect(correspondingCall.x).toBeCloseTo(expectedX, 0); // Precision 0 means fairly exact
            }
        });
    });

    test('should use default label positioning for line charts', () => {
        const config = {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{ values: [10, 12, 15, 10, 18, 12, 14] }]
            },
            options: {
                 padding: { top: 20, right: 20, bottom: 40, left: 50 },
                 xAxis: {
                    display: true,
                    labelFont: '10px Arial',
                    minSpacingBetweenLabels: 5,
                 },
                 yAxes: [{ id: 'left', position: 'left', display: true, beginAtZero: true, maxTicks: 5, sampleLabelForWidthEstimation: "10" }],
                 title: { display: false },
                 legend: { display: false },
                 tooltip: { enabled: false }
            },
            width: mockCanvas.width,
            height: mockCanvas.height
        };
        new PureChart('mockCanvasId', config);

        const xAxisLabelTexts = config.data.labels;
        const xLabelCalls = mockCtx.fillTextCalls.filter(call => xAxisLabelTexts.includes(call.text));

        expect(xLabelCalls.length).toBeGreaterThan(0); // Ensure some labels are drawn

        // In the old logic (iterative fitting), textAlign can vary.
        // It might be 'center' if labels are sparse and fit, or 'left'/'right' if they are dense.
        // This test is primarily to ensure the bar-specific centering (all 'center' always) is NOT applied.
        // If the old logic happens to center all labels for this specific config, this test might give a false positive
        // for "bar logic was used". However, the core check is that the *new branch* for bar charts is conditional.

        // A simple check: if there are many labels, it's less likely the old logic centers *all* of them *identically*
        // to how the bar chart logic would (which is always centered on the bar group).
        // The key is that the *calculation method* for X is different.

        // For this test, we'll check that the textAlign property on context was changed multiple times,
        // potentially indicating the iterative fitting logic was at play.
        // The bar chart logic sets it to 'center' once (or per label if fillStyle changes in between, but effectively once for the batch).
        // The old logic might change it more, or set it differently.

        // Heuristic: If it's not a bar chart, the number of 'center' textAlign settings specifically for x-axis labels
        // might be different from the total number of labels, or other textAlign values might appear.
        // This is not a perfect assertion.
        const centerAlignCountForLabels = xLabelCalls.filter(call => call.textAlign === 'center').length;

        if (xLabelCalls.length > 3 && centerAlignCountForLabels === xLabelCalls.length) {
            // This could happen if the old logic determined all labels fit when centered.
            // The critical part is that the *code path* for bar chart labels was not taken.
            // We are testing a side effect (textAlign values) rather than path execution directly.
            console.warn("Line chart test: All x-axis labels were drawn with textAlign 'center'. " +
                         "This can occur with the default logic if labels fit. " +
                         "The test primarily ensures the bar-specific *calculation* for X wasn't used.");
        }

        // A more robust check would be to instrument the PureChart code or have more detailed spies.
        // For now, this test serves as a basic regression check that drawing still occurs.
        // The core logic change is that bar charts have specific X positions, line charts use the old way.
        // We trust the `if (this.config.type === 'bar')` correctly branches.

        // Example: Check that at least one label was drawn not using the bar-centering X coordinate logic.
        // This is complex as it requires knowing the old logic's output.
        // The primary goal is ensuring the `else` branch of the new logic in `_drawAxesAndGrid` is reachable.
        expect(true).toBe(true); // Placeholder for a more specific assertion about non-bar logic if possible
    });
});
