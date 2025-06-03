// Simple Assertion Helpers
const assertions = {
    count: 0,
    failures: 0,
};

function assertEquals(expected, actual, message) {
    assertions.count++;
    if (expected !== actual) {
        assertions.failures++;
        console.error(`Assertion Failed: ${message || ''}. Expected: ${expected}, Actual: ${actual}`);
    }
}

function assertTrue(condition, message) {
    assertions.count++;
    if (!condition) {
        assertions.failures++;
        console.error(`Assertion Failed: ${message || ''}. Condition was false.`);
    }
}

function printTestSummary() {
    console.log(`\n--- Test Summary ---`);
    console.log(`Total Assertions: ${assertions.count}`);
    console.log(`Failures: ${assertions.failures}`);
    if (assertions.failures === 0) {
        console.log("All tests passed!");
    } else {
        console.error(`${assertions.failures} tests failed.`);
    }
}

// Mock CanvasRenderingContext2D
class MockContext {
    constructor() {
        this.font = '';
        this.fillStyle = '';
        this.strokeStyle = '';
        this.textAlign = '';
        this.textBaseline = '';
        this.lineWidth = 1;
        this.filledTexts = [];
        this.strokedPaths = []; // To track beginPath/stroke calls
    }

    measureText(text) {
        // Simple mock: width is proportional to text length, adjust factor as needed
        // A more sophisticated mock might take this.font into account
        return { width: String(text).length * 6 }; // Assume avg 6px per char
    }

    fillText(text, x, y) {
        this.filledTexts.push({ text: String(text), x, y, font: this.font, fillStyle: this.fillStyle, textAlign: this.textAlign });
    }

    beginPath() {
        this.currentPath = [];
    }

    moveTo(x, y) {
        if (this.currentPath) this.currentPath.push({ type: 'moveTo', x, y });
    }

    lineTo(x, y) {
        if (this.currentPath) this.currentPath.push({ type: 'lineTo', x, y });
    }

    stroke() {
        if (this.currentPath) this.strokedPaths.push(this.currentPath);
        this.currentPath = null;
    }

    save() {}
    restore() {}
    setLineDash() {}
}

// Simplified PureChart structure for testing _drawAxesAndGrid
class TestPureChart {
    constructor(config, drawArea) {
        this.config = { // Provide defaults similar to the original
            options: {
                padding: { top: 10, right: 10, bottom: 30, left: 40 }, // Simplified
                xAxis: { display: true, title: '', gridLines: false, labelFont: '10px Arial', titleFont: '12px Arial', color: '#666', forceShowFirstAndLastLabel: true },
                gridColor: '#e0e0e0',
                ...config.options, // User overrides for options
            },
            data: {
                labels: [],
                datasets: [],
                ...config.data, // User overrides for data
            },
        };
        this.config.options.xAxis = { // Ensure xAxis options are well-defined
            display: true,
            title: '',
            gridLines: false,
            labelFont: '10px Arial',
            titleFont: '12px Arial',
            color: '#666',
            forceShowFirstAndLastLabel: true, // Default for tests
            ...this.config.options.xAxis, // Apply specific xAxis options from test
        };

        this.drawArea = drawArea || { x: 40, y: 10, width: 250, height: 110 }; // Simplified
        this.ctx = new MockContext();
        this.activePalette = { // Minimal palette
            axisColor: '#666666',
            gridColor: '#E0E0E0',
            labelColor: '#333333',
        };
    }

    _drawAxesAndGrid() {
        const { options, data } = this.config;
        this.ctx.save();
        this.ctx.lineWidth = 1;
        // this.ctx.font = options.font; // Global font, axis specific is used later

        // Simplified Y-Axis part
        if (options.yAxes && options.yAxes[0] && options.yAxes[0].display) {
             this.ctx.strokeStyle = options.yAxes[0].color || this.activePalette.axisColor;
             this.ctx.beginPath();
             this.ctx.moveTo(this.drawArea.x, this.drawArea.y);
             this.ctx.lineTo(this.drawArea.x, this.drawArea.y + this.drawArea.height);
             this.ctx.stroke();
        }

        // X-Axis
        const oX = options.xAxis;
        if (oX.display && this.drawArea.width > 0) {
            this.ctx.strokeStyle = oX.color || this.activePalette.axisColor;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(this.drawArea.x, this.drawArea.y + this.drawArea.height);
            this.ctx.lineTo(this.drawArea.x + this.drawArea.width, this.drawArea.y + this.drawArea.height);
            this.ctx.stroke();

            if (data.labels && data.labels.length > 0) {
                this.ctx.fillStyle = oX.labelColor || this.activePalette.labelColor || this.activePalette.axisColor;
                this.ctx.font = oX.labelFont;
                this.ctx.textBaseline = 'top';

                const labels = data.labels;
                const numLabels = labels.length;
                const forceShowFirstAndLast = oX.forceShowFirstAndLastLabel !== undefined ? oX.forceShowFirstAndLastLabel : true;
                let maxLabelsToShow = oX.maxLabelsToShow;
                const minSpacingBetweenLabels = oX.minSpacingBetweenLabels !== undefined ? oX.minSpacingBetweenLabels : 5;
                const labelYOffset = oX.labelYOffset || 8;
                const labelYPos = this.drawArea.y + this.drawArea.height + labelYOffset;

                const xLabelSlotWidth = numLabels > 0 ? this.drawArea.width / numLabels : this.drawArea.width;

                const isLineChartMode = this.config.type === 'line'; // Simplified for tests

                if (maxLabelsToShow === undefined && numLabels > 0) {
                    let totalTextWidth = 0;
                    const originalFont = this.ctx.font; this.ctx.font = oX.labelFont;
                    labels.forEach(l => { totalTextWidth += this.ctx.measureText(String(l)).width; });
                    this.ctx.font = originalFont;
                    const avgLabelWidth = numLabels > 0 ? totalTextWidth / numLabels : 0;
                    if (avgLabelWidth + minSpacingBetweenLabels > 0) {
                        maxLabelsToShow = Math.floor(this.drawArea.width / (avgLabelWidth + minSpacingBetweenLabels));
                    } else { maxLabelsToShow = numLabels; }
                    maxLabelsToShow = Math.max(1, maxLabelsToShow);
                } else if (maxLabelsToShow === undefined && numLabels === 0) { maxLabelsToShow = 0;}

                let indexesToDraw = [];
                if (numLabels > 0 && maxLabelsToShow > 0) {
                    if (numLabels <= maxLabelsToShow) {
                        indexesToDraw = labels.map((_, i) => i);
                    } else {
                        if (forceShowFirstAndLast) {
                            indexesToDraw.push(0);
                            if (numLabels > 1) indexesToDraw.push(numLabels - 1);
                        }
                        const remainingSlots = maxLabelsToShow - indexesToDraw.length;
                        if (remainingSlots > 0) {
                            let availableInnerLabels = [];
                            for(let i = 0; i < numLabels; i++) { if (!indexesToDraw.includes(i)) availableInnerLabels.push(i); }
                            if (availableInnerLabels.length > 0) {
                                 const step = Math.max(1, Math.floor(availableInnerLabels.length / remainingSlots));
                                 for (let i = 0; i < availableInnerLabels.length && indexesToDraw.length < maxLabelsToShow; i += step) {
                                    if (!indexesToDraw.includes(availableInnerLabels[i])) indexesToDraw.push(availableInnerLabels[i]);
                                 }
                            }
                        }
                        indexesToDraw = [...new Set(indexesToDraw)].sort((a, b) => a - b);
                    }
                }

                if (oX.gridLines) {
                    indexesToDraw.forEach(index => {
                        if (index > 0) {
                            const xPosGrid = this.drawArea.x + (index * xLabelSlotWidth);
                            if (xPosGrid > this.drawArea.x + 0.5 && xPosGrid < this.drawArea.x + this.drawArea.width - 0.5) {
                                this.ctx.save();
                                this.ctx.strokeStyle = options.gridColor || this.activePalette.gridColor;
                                this.ctx.lineWidth = 0.5; this.ctx.beginPath();
                                this.ctx.moveTo(xPosGrid, this.drawArea.y);
                                this.ctx.lineTo(xPosGrid, this.drawArea.y + this.drawArea.height - (this.ctx.lineWidth % 2 === 0 ? 0 : 0.5));
                                this.ctx.stroke(); this.ctx.restore();
                            }
                        }
                    });
                }
                // New X-axis label display logic (Iterative Fitting)
                // Based on PureChart.js implementation
                if (indexesToDraw.length > 0) { // Check if there are any candidate labels
                    this.ctx.font = oX.labelFont; // Set font for width measurements (already done but good for safety)
                    const initialLabelCandidates = indexesToDraw.map(index => {
                        const text = String(labels[index]);
                        return {
                            text: text,
                            width: this.ctx.measureText(text).width, // Using mock ctx.measureText
                            originalIndex: index
                        };
                    }).filter(l => l.width > 0);

                    if (initialLabelCandidates.length > 0) {
                        let currentSubsetToDisplay = [...initialLabelCandidates];
                        let finalLabelsToDraw = [];
                        let calculatedSpacing = 0;
                        // minSpacingBetweenLabels is already defined
                        // forceShowFirstAndLast is already defined

                        // Iterative Fitting and Subset Selection
                        while (true) {
                            if (currentSubsetToDisplay.length === 0) {
                                finalLabelsToDraw = [];
                                break;
                            }

                            const totalWidthOfCurrentSubset = currentSubsetToDisplay.reduce((sum, label) => sum + label.width, 0);

                            if (currentSubsetToDisplay.length <= 1) {
                                finalLabelsToDraw = [...currentSubsetToDisplay];
                                break;
                            }

                            const numberOfGaps = currentSubsetToDisplay.length - 1;
                            calculatedSpacing = (this.drawArea.width - totalWidthOfCurrentSubset) / numberOfGaps;

                            if (calculatedSpacing >= minSpacingBetweenLabels) {
                                finalLabelsToDraw = [...currentSubsetToDisplay];
                                break;
                            } else {
                                if (currentSubsetToDisplay.length <= 2 && forceShowFirstAndLast) {
                                    finalLabelsToDraw = [...currentSubsetToDisplay];
                                    break;
                                }
                                if (currentSubsetToDisplay.length <= 1) {
                                   finalLabelsToDraw = [...currentSubsetToDisplay];
                                   break;
                                }

                                let removalIndex = Math.floor(currentSubsetToDisplay.length / 2);
                                if (forceShowFirstAndLast && currentSubsetToDisplay.length > 2) {
                                    if (removalIndex === 0) removalIndex = 1;
                                    else if (removalIndex === currentSubsetToDisplay.length - 1) removalIndex = currentSubsetToDisplay.length - 2;
                                }

                                if (removalIndex === 0 && currentSubsetToDisplay.length === 2 && forceShowFirstAndLast) {
                                    // This specific condition implies we cannot remove if only first/last are left and forced.
                                    // The outer if (currentSubsetToDisplay.length <= 2 && forceShowFirstAndLast) handles this break.
                                } else if (removalIndex >= currentSubsetToDisplay.length -1 && currentSubsetToDisplay.length > 2 && forceShowFirstAndLast) {
                                     removalIndex = currentSubsetToDisplay.length -2;
                                } else if (removalIndex === 0 && currentSubsetToDisplay.length === 1) {
                                    // Caught by length <= 1 check
                                }

                                if (currentSubsetToDisplay.length > 0 && removalIndex < currentSubsetToDisplay.length && removalIndex >=0 ) {
                                    if (forceShowFirstAndLast && currentSubsetToDisplay.length === 2 &&
                                        initialLabelCandidates.length >=2 && // Check initial candidates has enough elements
                                        currentSubsetToDisplay[0].originalIndex === initialLabelCandidates[0].originalIndex &&
                                        currentSubsetToDisplay[1].originalIndex === initialLabelCandidates[initialLabelCandidates.length-1].originalIndex) {
                                            finalLabelsToDraw = [...currentSubsetToDisplay];
                                            break;
                                    }
                                    currentSubsetToDisplay.splice(removalIndex, 1);
                                } else {
                                     finalLabelsToDraw = [...currentSubsetToDisplay];
                                     break;
                                }
                            }
                        }

                        // Positioning and Drawing the Final Subset
                        if (finalLabelsToDraw.length > 0) {
                            this.ctx.textAlign = 'center';
                            this.ctx.textBaseline = 'top';
                            this.ctx.fillStyle = oX.labelColor || this.activePalette.labelColor || this.activePalette.axisColor;
                            this.ctx.font = oX.labelFont; // Ensure font is set for drawing

                            if (finalLabelsToDraw.length === 1) {
                                const label = finalLabelsToDraw[0];
                                let xPos = this.drawArea.x + this.drawArea.width / 2;

                                xPos = Math.max(xPos, this.drawArea.x + label.width / 2);
                                xPos = Math.min(xPos, this.drawArea.x + this.drawArea.width - label.width / 2);
                                if (label.width > this.drawArea.width) { // If label wider than area, center it in the area
                                    xPos = this.drawArea.x + this.drawArea.width / 2;
                                }
                                this.ctx.fillText(label.text, xPos, labelYPos);
                            } else {
                                const totalWidthFinal = finalLabelsToDraw.reduce((sum, l) => sum + l.width, 0);
                                const finalSpacing = Math.max(minSpacingBetweenLabels, (this.drawArea.width - totalWidthFinal) / (finalLabelsToDraw.length - 1));

                                let currentX = this.drawArea.x;
                                finalLabelsToDraw.forEach((label, k) => {
                                    const xPos = currentX + label.width / 2;
                                    // Basic visibility check (more for conceptual alignment, mock fillText just records)
                                    const visibleStart = Math.max(this.drawArea.x, currentX);
                                    const visibleEnd = Math.min(this.drawArea.x + this.drawArea.width, currentX + label.width);
                                    if (visibleEnd - visibleStart >= 1 || label.width === 0) { // Draw if any part is visible or if it's an empty string (width 0)
                                         this.ctx.fillText(label.text, xPos, labelYPos);
                                    }
                                    currentX += label.width + finalSpacing;
                                });
                            }
                        }
                    }
                }
            }
            if (oX.displayTitle && oX.title) {
                this.ctx.font = oX.titleFont;
                this.ctx.fillStyle = oX.titleColor || this.activePalette.titleColor || this.activePalette.axisColor;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'bottom';
                const titleYPos = this.canvas.height - options.padding.bottom / 2;
                this.ctx.fillText(oX.title, this.drawArea.x + this.drawArea.width / 2, titleYPos);
            }
        }
        this.ctx.restore();
    }

    getDrawnLabels() {
        return this.ctx.filledTexts.filter(ft => ft.y === this.drawArea.y + this.drawArea.height + 8);
    }
}


// --- Test Cases ---
console.log("Starting PureChart Label Filtering Tests...");

// Test 1: Basic overlap prevention
let chart1Config = {
    data: { labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] }, // 12 labels
    options: { xAxis: { forceShowFirstAndLastLabel: true, minSpacingBetweenLabels: 5 } }
};
let chart1DrawArea = { x: 0, y: 0, width: 100, height: 50 };
let chart1 = new TestPureChart(chart1Config, chart1DrawArea);
const chart1LabelWidths = (text) => ({width: String(text).length * 10}); // Jan=30, Feb=30, etc.
chart1.ctx.measureText = chart1LabelWidths;
chart1._drawAxesAndGrid();
let drawn1 = chart1.getDrawnLabels().sort((a,b)=>a.x-b.x);
// Expected: Dynamic maxLabelsToShow = floor(100 / (30+5)) = 2. So, "Jan", "Dec".
// Widths: Jan=30, Dec=30. Total=60. Spacing = (100-60)/1 = 40. Fits.
assertEquals(2, drawn1.length, "Test 1: Expected 2 labels ('Jan', 'Dec')");
if (drawn1.length === 2) {
    assertEquals("Jan", drawn1[0].text, "Test 1: First label should be Jan");
    assertTrue(Math.abs(drawn1[0].x - (0 + 30/2)) < 0.01, `Test 1: Jan X pos. Expected: 15, Actual: ${drawn1[0].x.toFixed(1)}`);
    assertEquals("Dec", drawn1[1].text, "Test 1: Second label should be Dec");
    assertTrue(Math.abs(drawn1[1].x - (0 + 30 + 40 + 30/2)) < 0.01, `Test 1: Dec X pos. Expected: 85, Actual: ${drawn1[1].x.toFixed(1)}`);
}
console.log(`Test 1: Drawn ${drawn1.length} labels: ${drawn1.map(l=>`${l.text}@${l.x.toFixed(0)}`).join(', ')}`);


// Test 2: xAxis.maxLabelsToShow
let chart2Config = {
    data: { labels: ["L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8", "L9", "L10"] }, // 10 labels
    options: { xAxis: { maxLabelsToShow: 3, forceShowFirstAndLastLabel: true, minSpacingBetweenLabels: 5 } }
};
let chart2DrawArea = { x: 0, y: 0, width: 300, height: 50 }; // Enough width
let chart2 = new TestPureChart(chart2Config, chart2DrawArea);
const chart2LabelWidths = (text) => ({width: String(text).length * 10}); // L1=20px
chart2.ctx.measureText = chart2LabelWidths;
chart2._drawAxesAndGrid();
let drawn2 = chart2.getDrawnLabels().sort((a,b)=>a.x-b.x);
// Expected: indexesToDraw = [0, 9, 4] (L1, L10, L5). All 20px wide. Total width = 60. Spacing = (300-60)/2 = 120. Fits.
assertEquals(3, drawn2.length, "Test 2: Should draw 3 labels");
if (drawn2.length === 3) {
    assertEquals("L1", drawn2[0].text, "Test 2: First label L1");
    assertTrue(Math.abs(drawn2[0].x - (0 + 20/2)) < 0.01, "Test 2: L1 X pos"); // Exp 10
    assertEquals("L5", drawn2[1].text, "Test 2: Middle label L5");
    assertTrue(Math.abs(drawn2[1].x - (0 + 20 + 120 + 20/2)) < 0.01, "Test 2: L5 X pos"); // Exp 150
    assertEquals("L10", drawn2[2].text, "Test 2: Last label L10");
    assertTrue(Math.abs(drawn2[2].x - (0 + 20 + 120 + 20 + 120 + 20/2)) < 0.01, "Test 2: L10 X pos"); // Exp 290
}
console.log(`Test 2: Drawn ${drawn2.length} labels: ${drawn2.map(l=>`${l.text}@${l.x.toFixed(0)}`).join(', ')}`);


// Test 3: forceShowFirstAndLastLabel: false
let chart3Config = {
    data: { labels: ["VeryLongLabel1", "S2", "S3", "S4", "S5", "VeryLongLabel6"] }, // 6 labels
    options: { xAxis: { forceShowFirstAndLastLabel: false, maxLabelsToShow: 2, minSpacingBetweenLabels: 5 } }
};
let chart3DrawArea = { x: 0, y: 0, width: 150, height: 50 };
let chart3 = new TestPureChart(chart3Config, chart3DrawArea);
const chart3LabelWidths = (text) => ({width: String(text).length * 10}); // VLL1=140, S2=20
chart3.ctx.measureText = chart3LabelWidths;
chart3._drawAxesAndGrid();
let drawn3 = chart3.getDrawnLabels().sort((a,b)=>a.x-b.x);
// Expected: maxLabelsToShow=2, not forced. indexesToDraw likely [S2, S3] (indices 1,2).
// S2(20), S3(20). Total width 40. Spacing (150-40)/1 = 110. Fits.
assertEquals(2, drawn3.length, `Test 3: Labels drawn (${drawn3.length}) should be 2`);
if (drawn3.length === 2) {
    assertEquals("S2", drawn3[0].text, "Test 3: First label S2");
    assertTrue(Math.abs(drawn3[0].x - (0 + 20/2)) < 0.01, "Test 3: S2 X pos"); // Exp 10
    assertEquals("S3", drawn3[1].text, "Test 3: Second label S3");
    assertTrue(Math.abs(drawn3[1].x - (0 + 20 + 110 + 20/2)) < 0.01, "Test 3: S3 X pos"); // Exp 140
}
console.log(`Test 3: Drawn ${drawn3.length} labels (forceShowFirstAndLast=false): ${drawn3.map(l=>`${l.text}@${l.x.toFixed(0)}`).join(', ')}`);


// Test 4: Dynamic calculation of maxLabelsToShow (no explicit maxLabelsToShow)
let chart4Config = {
    data: { labels: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"] }, // 15 labels
    options: { xAxis: { forceShowFirstAndLastLabel: true, minSpacingBetweenLabels: 5 } }
};
let chart4DrawArea = { x: 0, y: 0, width: 100, height: 50 };
let chart4 = new TestPureChart(chart4Config, chart4DrawArea);
const chart4LabelWidths = (text) => ({width: String(text).length * 10}); // A=10px
chart4.ctx.measureText = chart4LabelWidths;
chart4._drawAxesAndGrid();
let drawn4 = chart4.getDrawnLabels().sort((a,b)=>a.x-b.x);
// Expected: dynamic maxLabelsToShow = floor(100 / (10+5)) = 6.
// indexesToDraw: [0,14, 2,5,8,11] (A,O,C,F,I,L) approx.
// All are 10px wide. Total width = 60. Spacing = (100-60)/5 = 8. Fits.
assertEquals(6, drawn4.length, "Test 4: Dynamically calculated labels should be 6");
if (drawn4.length === 6) {
    const expectedSpacing = 8;
    const labelWidth = 10;
    assertEquals("A", drawn4[0].text, "Test 4: First label A");
    assertTrue(Math.abs(drawn4[0].x - (0 + labelWidth/2)) < 0.01, "Test 4: A X pos");
    // Check other labels based on uniform spacing
    let currentX = 0 + labelWidth + expectedSpacing;
    for(let i=1; i<drawn4.length-1; i++) { // Check intermediate labels
        assertTrue(Math.abs(drawn4[i].x - (currentX + labelWidth/2)) < 0.01, `Test 4: Label ${drawn4[i].text} X pos`);
        currentX += labelWidth + expectedSpacing;
    }
    assertEquals("O", drawn4[drawn4.length-1].text, "Test 4: Last label O");
    assertTrue(Math.abs(drawn4[drawn4.length-1].x - (currentX + labelWidth/2)) < 0.01, `Test 4: O X pos`);
}
console.log(`Test 4: Drawn ${drawn4.length} labels (dynamic): ${drawn4.map(l=>`${l.text}@${l.x.toFixed(0)}`).join(', ')}`);


// Test 5: No labels
let chart5Config = { data: { labels: [] } };
let chart5 = new TestPureChart(chart5Config, chart4DrawArea); // Using chart4DrawArea
chart5._drawAxesAndGrid();
let drawn5 = chart5.getDrawnLabels();
assertEquals(0, drawn5.length, "Test 5: No labels should be drawn");

// Test 6: One label
let chart6Config = { data: { labels: ["Single"] } };
let chart6 = new TestPureChart(chart6Config, chart4DrawArea); // Using chart4DrawArea
const chart6LabelWidth = chart6.ctx.measureText("Single").width;
chart6._drawAxesAndGrid();
let drawn6 = chart6.getDrawnLabels();
assertEquals(1, drawn6.length, "Test 6: One label should be drawn");
assertEquals("Single", drawn6[0].text, "Test 6: The single label should be 'Single'");
if (drawn6.length === 1) {
    let expectedX = chart4DrawArea.x + chart4DrawArea.width / 2;
    expectedX = Math.max(expectedX, chart4DrawArea.x + chart6LabelWidth / 2);
    expectedX = Math.min(expectedX, chart4DrawArea.x + chart4DrawArea.width - chart6LabelWidth / 2);
    if (chart6LabelWidth > chart4DrawArea.width) expectedX = chart4DrawArea.x + chart4DrawArea.width / 2;
    assertTrue(Math.abs(drawn6[0].x - expectedX) < 0.01, `Test 6: Single label X position. Expected: ${expectedX.toFixed(1)}, Actual: ${drawn6[0].x.toFixed(1)}`);
}


// Test 7: Extremely wide label, forceShowFirstAndLast=true
let chart7Config = {
    data: { labels: ["ThisIsAnExtremelyLongLabelThatWillNotFit", "Mid", "Short"] },
    options: { xAxis: { forceShowFirstAndLastLabel: true, minSpacingBetweenLabels: 5 } }
};
let chart7DrawArea = { x: 0, y: 0, width: 50, height: 50 };
let chart7 = new TestPureChart(chart7Config, chart7DrawArea);
const chart7LabelWidths = (text) => ({width: String(text).length * 10}); // Long=400, Mid=30, Short=50
chart7.ctx.measureText = chart7LabelWidths;
chart7._drawAxesAndGrid();
let drawn7 = chart7.getDrawnLabels().sort((a,b)=>a.x-b.x);
// Expected: dynamic maxLabelsToShow is low. indexesToDraw likely [Long, Short] (indices 0, 2).
// Subset [Long(400), Short(50)]. Total width 450. Spacing (50-450)/1 = -400.
// Because length <=2 and forceShowFirstAndLast, these two are kept.
// finalSpacing = max(5, -400) = 5.
assertEquals(2, drawn7.length, "Test 7: Expected 2 labels (Long, Short) due to forceShowFirstAndLast, despite overlap.");
if (drawn7.length === 2) {
    assertEquals("ThisIsAnExtremelyLongLabelThatWillNotFit", drawn7[0].text, "Test 7: First label is the long one.");
    assertTrue(Math.abs(drawn7[0].x - (0 + 400/2)) < 0.01, "Test 7: Long label X pos"); // Exp 200
    assertEquals("Short", drawn7[1].text, "Test 7: Second label is Short.");
    assertTrue(Math.abs(drawn7[1].x - (0 + 400 + 5 + 50/2)) < 0.01, "Test 7: Short label X pos"); // Exp 430
}
console.log(`Test 7: Drawn ${drawn7.length} labels (long first/last, force=true): ${drawn7.map(l=>`${l.text}@${l.x.toFixed(0)}`).join(', ')}`);


// Test 8: forceShowFirstAndLastLabel: false, with very wide first/last that shouldn't appear
let chart8Config = {
    type: 'bar',
    data: { labels: ["VeryLongLabel1", "Mid1", "Mid2", "Mid3", "VeryLongLabel2"] },
    options: { xAxis: { forceShowFirstAndLastLabel: false, maxLabelsToShow: 3, minSpacingBetweenLabels: 5 } }
};
let chart8DrawArea = { x: 0, y: 0, width: 200, height: 50 };
let chart8 = new TestPureChart(chart8Config, chart8DrawArea);
const labelWidths8 = { "VeryLongLabel1": 112, "Mid1": 32, "Mid2": 32, "Mid3": 32, "VeryLongLabel2": 112};
chart8.ctx.measureText = (text) => ({width: labelWidths8[text] || String(text).length * 8});
chart8._drawAxesAndGrid();
let drawn8 = chart8.getDrawnLabels().sort((a,b)=>a.x-b.x);
// Expected: maxLabelsToShow=3, not forced. indexesToDraw likely [M1,M2,M3] (indices 1,2,3).
// All 32px wide. Total width 32*3=96. Spacing (200-96)/2 = 52. Fits.
assertEquals(3, drawn8.length, "Test 8: Expected 3 labels (Mid1, Mid2, Mid3).");
if(drawn8.length === 3) {
    const expectedSpacing = 52;
    const labelWidth = 32;
    assertEquals("Mid1", drawn8[0].text, "Test 8: First drawn is Mid1");
    assertTrue(Math.abs(drawn8[0].x - (0 + labelWidth/2)) < 0.01, "Test 8: Mid1 X pos");
    assertEquals("Mid2", drawn8[1].text, "Test 8: Second drawn is Mid2");
    assertTrue(Math.abs(drawn8[1].x - (0 + labelWidth + expectedSpacing + labelWidth/2)) < 0.01, "Test 8: Mid2 X pos");
    assertEquals("Mid3", drawn8[2].text, "Test 8: Third drawn is Mid3");
    assertTrue(Math.abs(drawn8[2].x - (0 + labelWidth + expectedSpacing + labelWidth + expectedSpacing + labelWidth/2)) < 0.01, "Test 8: Mid3 X pos");
}
console.log(`Test 8: Drawn ${drawn8.length} labels: ${drawn8.map(l=>`${l.text}@${l.x.toFixed(0)}`).join(', ')}`);

// Test 9: All labels fit comfortably with default settings
let chart9Config = {
    data: { labels: ["One", "Two", "Three"] },
    options: { xAxis: { forceShowFirstAndLastLabel: true, minSpacingBetweenLabels: 5 } }
};
let chart9DrawArea = { x: 0, y: 0, width: 300, height: 50 };
let chart9 = new TestPureChart(chart9Config, chart9DrawArea);
const chart9LabelWidths = { "One": 24, "Two": 24, "Three": 40 };
chart9.ctx.measureText = (text) => ({width: chart9LabelWidths[text]});
chart9._drawAxesAndGrid();
let drawn9 = chart9.getDrawnLabels().sort((a,b)=>a.x-b.x);
// Expected: All 3 fit. Total width 24+24+40 = 88. Spacing (300-88)/2 = 106. Fits.
assertEquals(3, drawn9.length, "Test 9: All 3 labels should be drawn.");
if (drawn9.length === 3) {
    const expectedSpacing = 106;
    assertEquals("One", drawn9[0].text, "Test 9: First label 'One'");
    assertTrue(Math.abs(drawn9[0].x - (0 + 24/2)) < 0.01, "Test 9: One X pos");
    assertEquals("Two", drawn9[1].text, "Test 9: Second label 'Two'");
    assertTrue(Math.abs(drawn9[1].x - (0 + 24 + expectedSpacing + 24/2)) < 0.01, "Test 9: Two X pos");
    assertEquals("Three", drawn9[2].text, "Test 9: Third label 'Three'");
    assertTrue(Math.abs(drawn9[2].x - (0 + 24 + expectedSpacing + 24 + expectedSpacing + 40/2)) < 0.01, "Test 9: Three X pos");
}
console.log(`Test 9: Drawn ${drawn9.length} labels: ${drawn9.map(l=>`${l.text}@${l.x.toFixed(0)}`).join(', ')}`);


// Test 10: Overlap check logic - ensure labels don't visually overlap
let chart10Config = {
    data: { labels: ["LabelOne", "LabelTwo", "LabelThree", "LabelFour", "LabelFive"] },
    options: { xAxis: { forceShowFirstAndLastLabel: true, minSpacingBetweenLabels: 5 } }
};
let chart10DrawArea = { x: 0, y: 0, width: 200, height: 50 };
let chart10 = new TestPureChart(chart10Config, chart10DrawArea);
const chart10LabelWidths = (text) => ({width: String(text).length * 7}); // L1=56, L2=56, L3=70, L4=63, L5=70
chart10.ctx.measureText = chart10LabelWidths;
chart10._drawAxesAndGrid();
let drawn10 = chart10.getDrawnLabels().sort((a,b)=>a.x-b.x);
// Expected: Dynamic maxLabelsToShow = floor(200 / (avg(width ~63)+5)) = floor(200/68) = 2.
// indexesToDraw: [LabelOne (idx 0), LabelFive (idx 4)]. Widths 56, 70. Total 126. Spacing (200-126)/1 = 74. Fits.
assertEquals(2, drawn10.length, "Test 10: Expected 2 labels (LabelOne, LabelFive)");
if (drawn10.length === 2) {
    assertEquals("LabelOne", drawn10[0].text, "Test 10: First label LabelOne");
    assertTrue(Math.abs(drawn10[0].x - (0 + 56/2)) < 0.01, "Test 10: LabelOne X pos");
    assertEquals("LabelFive", drawn10[1].text, "Test 10: Second label LabelFive");
    assertTrue(Math.abs(drawn10[1].x - (0 + 56 + 74 + 70/2)) < 0.01, "Test 10: LabelFive X pos");
}
console.log(`Test 10: Drawn ${drawn10.length} labels: ${drawn10.map(l=>`${l.text}@${l.x.toFixed(0)}`).join(', ')}`);


// Test 11: Verify Line Chart Label Positioning (Pinned First/Last, Proportional Intermediate)
// Name historical. Logic is now universal.
let chart11Config = {
    type: 'line',
    data: { labels: ["Start", "Middle1", "Middle2", "End"] },
    options: { xAxis: { maxLabelsToShow: undefined, forceShowFirstAndLastLabel: true, minSpacingBetweenLabels: 5 } }
};
let chart11DrawArea = { x: 10, y: 0, width: 400, height: 50 };
let chart11 = new TestPureChart(chart11Config, chart11DrawArea);
const labelWidths11 = { "Start": 40, "Middle1": 50, "Middle2": 50, "End": 30 };
chart11.ctx.measureText = (text) => ({ width: labelWidths11[text] || String(text).length * 8 });
chart11._drawAxesAndGrid();
let drawn11 = chart11.getDrawnLabels().sort((a,b)=>a.x-b.x);
// Expected: All 4 fit. Total width 40+50+50+30=170. Spacing (400-170)/3 = 76.66...
assertEquals(4, drawn11.length, "Test 11: All 4 labels should be drawn.");
if (drawn11.length === 4) {
    const expectedSpacing = (400.0 - (40+50+50+30)) / 3.0;
    assertEquals("Start", drawn11[0].text);
    assertTrue(Math.abs(drawn11[0].x - (10 + 40/2)) < 0.01, `Test 11: Start X`);
    assertEquals("Middle1", drawn11[1].text);
    assertTrue(Math.abs(drawn11[1].x - (10 + 40 + expectedSpacing + 50/2)) < 0.01, `Test 11: Middle1 X`);
    assertEquals("Middle2", drawn11[2].text);
    assertTrue(Math.abs(drawn11[2].x - (10 + 40 + expectedSpacing + 50 + expectedSpacing + 50/2)) < 0.01, `Test 11: Middle2 X`);
    assertEquals("End", drawn11[3].text);
    assertTrue(Math.abs(drawn11[3].x - (10 + 40 + expectedSpacing + 50 + expectedSpacing + 50 + expectedSpacing + 30/2)) < 0.01, `Test 11: End X`);
}
console.log(`Test 11: Drawn ${drawn11.length} labels. Actual positions: ${drawn11.map(l=>l.text + '@' + (l.x !== undefined ? l.x.toFixed(0) : 'undef')).join(', ')}`);

// Test 12: Verify Line Chart Label Positioning with 3 labels (Pinned First/Last)
// Name historical.
let chart12Config = {
    type: 'line',
    data: { labels: ["Short", "VeryLongLabelText", "Mid"] },
    options: { xAxis: { forceShowFirstAndLastLabel: true, minSpacingBetweenLabels: 5 } }
};
let chart12DrawArea = { x: 5, y: 0, width: 500, height: 50 };
let chart12 = new TestPureChart(chart12Config, chart12DrawArea);
const labelWidths12 = { "Short": 30, "VeryLongLabelText": 150, "Mid": 50 };
chart12.ctx.measureText = (text) => ({ width: labelWidths12[text] || String(text).length * 8 });
chart12._drawAxesAndGrid();
let drawn12 = chart12.getDrawnLabels().sort((a,b)=>a.x-b.x);
// Expected: All 3 fit. Total width 30+150+50 = 230. Spacing (500-230)/2 = 135.
assertEquals(3, drawn12.length, "Test 12: All 3 labels should be drawn.");
if (drawn12.length === 3) {
    const expectedSpacing = (500.0 - (30+150+50)) / 2.0;
    assertEquals("Short", drawn12[0].text);
    assertTrue(Math.abs(drawn12[0].x - (5 + 30/2)) < 0.01, `Test 12: Short X`);
    assertEquals("VeryLongLabelText", drawn12[1].text);
    assertTrue(Math.abs(drawn12[1].x - (5 + 30 + expectedSpacing + 150/2)) < 0.01, `Test 12: VLLT X`);
    assertEquals("Mid", drawn12[2].text);
    assertTrue(Math.abs(drawn12[2].x - (5 + 30 + expectedSpacing + 150 + expectedSpacing + 50/2)) < 0.01, `Test 12: Mid X`);
}
console.log(`Test 12: Drawn ${drawn12.length} labels. Actual positions: ${drawn12.map(l=>l.text + '@' + (l.x !== undefined ? l.x.toFixed(0) : 'undef')).join(', ')}`);

// Test 13: Verify Bar Chart X-Axis Label Positioning (Slot-Based Centering)
// Name historical.
let chart13Config = {
    type: 'bar',
    data: { labels: ["Bar1", "BarTwo", "BarThreeLonger"] },
    options: {
        xAxis: {
            forceShowFirstAndLastLabel: true,
            maxLabelsToShow: undefined,
            minSpacingBetweenLabels: 5
        }
    }
};
let chart13DrawArea = { x: 20, y: 0, width: 300, height: 50 };
let chart13 = new TestPureChart(chart13Config, chart13DrawArea);
const labelWidths13 = { "Bar1": 40, "BarTwo": 50, "BarThreeLonger": 90 };
chart13.ctx.measureText = (text) => ({ width: labelWidths13[text] || String(text).length * 8 });
chart13._drawAxesAndGrid();
let drawn13 = chart13.getDrawnLabels().sort((a,b)=>a.x-b.x);
// Expected: All 3 fit. Total width 40+50+90 = 180. Spacing (300-180)/2 = 60.
assertEquals(3, drawn13.length, "Test 13: All 3 labels should be drawn.");
if (drawn13.length === 3) {
    const expectedSpacing = (300.0 - (40+50+90)) / 2.0;
    assertEquals("Bar1", drawn13[0].text);
    assertTrue(Math.abs(drawn13[0].x - (20 + 40/2)) < 0.01, `Test 13: Bar1 X`);
    assertEquals("BarTwo", drawn13[1].text);
    assertTrue(Math.abs(drawn13[1].x - (20 + 40 + expectedSpacing + 50/2)) < 0.01, `Test 13: BarTwo X`);
    assertEquals("BarThreeLonger", drawn13[2].text);
    assertTrue(Math.abs(drawn13[2].x - (20 + 40 + expectedSpacing + 50 + expectedSpacing + 90/2)) < 0.01, `Test 13: BarThreeLonger X`);
}
console.log(`Test 13: Bar chart labels: ${drawn13.map(l=>l.text + '@' + (l.x !== undefined ? l.x.toFixed(0) : 'undef')).join(', ')}`);

printTestSummary();
// To run this in a browser, you'd save it as an HTML file or include this script
// and open the browser's developer console to see the output.
// To run in Node.js, you might need to adapt parts if it relies on browser-specific APIs
// (though this setup tries to minimize that).
// e.g. `node PureChart/tests/label-filtering.test.js`
// For the actual PureChart.js, it's designed for browsers.
// This test file makes a standalone copy of the relevant logic.
