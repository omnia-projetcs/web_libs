// Simple Assertion Helpers
const assertions = {
    count: 0,
    failures: 0,
};

function assertEquals(expected, actual, message) {
    assertions.count++;
    if (expected !== actual) {
        assertions.failures++;
        const resultsDiv = document.getElementById('test-results');
        const failureMsg = `Assertion Failed: ${message || ''}. Expected: ${expected}, Actual: ${actual}`;
        console.error(failureMsg);
        const p = document.createElement('p');
        p.style.color = 'red';
        p.textContent = failureMsg;
        resultsDiv.appendChild(p);
    }
}

function printTestSummary() {
    const resultsDiv = document.getElementById('test-results');
    const summaryMsg = document.createElement('h2');
    if (assertions.failures === 0) {
        summaryMsg.style.color = 'green';
        summaryMsg.textContent = 'All tests passed!';
        console.log('All tests passed!');
    } else {
        summaryMsg.style.color = 'red';
        summaryMsg.textContent = `${assertions.failures} of ${assertions.count} tests failed.`;
        console.error(`${assertions.failures} of ${assertions.count} tests failed.`);
    }
    resultsDiv.appendChild(summaryMsg);
}

class TestPureChart {
    constructor(config, drawArea) {
        this.config = {
            options: {},
            ...config,
        };
        this.drawArea = drawArea || { x: 0, y: 0, width: 400, height: 200 };
    }

    _getPointPosition(value, index, yAxisScaleInfo, numLabels, chartType) {
        if (numLabels === 0 || this.drawArea.width === 0) {
            return { x: this.drawArea.x + this.drawArea.width / 2, y: this.drawArea.y + this.drawArea.height / 2 };
        }

        let x;
        if (chartType === 'bar') {
            const groupTotalWidth = this.drawArea.width / numLabels;
            x = this.drawArea.x + (index * groupTotalWidth) + (groupTotalWidth / 2);
        } else {
            if (numLabels === 1) {
                x = this.drawArea.x + this.drawArea.width / 2;
            } else {
                const xSpacing = this.drawArea.width / (numLabels - 1);
                x = this.drawArea.x + (index * xSpacing);
            }
        }

        const yValue = parseFloat(value);
        const scaleMin = yAxisScaleInfo ? yAxisScaleInfo.min || 0 : 0;
        const scale = yAxisScaleInfo ? yAxisScaleInfo.scale || 1 : 1;
        let y = this.drawArea.y + this.drawArea.height - ((yValue - scaleMin) * scale);
        y = Math.max(this.drawArea.y, Math.min(y, this.drawArea.y + this.drawArea.height));
        return { x, y };
    }
}

// --- Test Cases ---

function testPureLineChart() {
    const chart = new TestPureChart({ type: 'line' });
    const numLabels = 5;
    const points = Array.from({ length: numLabels }, (_, i) => chart._getPointPosition(10, i, null, numLabels, 'line'));

    assertEquals(0, points[0].x, "Test 1: Pure Line Chart - First point X should be at the start of the draw area.");
    assertEquals(100, points[1].x, "Test 1: Pure Line Chart - Second point X should be at 1/4 of the draw area.");
    assertEquals(200, points[2].x, "Test 1: Pure Line Chart - Third point X should be at the middle of the draw area.");
    assertEquals(300, points[3].x, "Test 1: Pure Line Chart - Fourth point X should be at 3/4 of the draw area.");
    assertEquals(400, points[4].x, "Test 1: Pure Line Chart - Fifth point X should be at the end of the draw area.");
}

function testMixedChart() {
    const chart = new TestPureChart({ type: 'bar' });
    const numLabels = 4;
    const points = Array.from({ length: numLabels }, (_, i) => chart._getPointPosition(10, i, null, numLabels, 'bar'));

    assertEquals(50, points[0].x, "Test 2: Mixed Chart - First point should be in the middle of the first slot.");
    assertEquals(150, points[1].x, "Test 2: Mixed Chart - Second point should be in the middle of the second slot.");
    assertEquals(250, points[2].x, "Test 2: Mixed Chart - Third point should be in the middle of the third slot.");
    assertEquals(350, points[3].x, "Test 2: Mixed Chart - Fourth point should be in the middle of the fourth slot.");
}

function testSinglePointLineChart() {
    const chart = new TestPureChart({ type: 'line' });
    const numLabels = 1;
    const point = chart._getPointPosition(10, 0, null, numLabels, 'line');

    assertEquals(200, point.x, "Test 3: Single Point Line Chart - Point should be in the middle of the draw area.");
}

function testTrimmedLineChart() {
    const chart = new TestPureChart({ type: 'line' });
    const numLabels = 3; // Simulating a chart with trimmed labels
    const points = Array.from({ length: numLabels }, (_, i) => chart._getPointPosition(10, i, null, numLabels, 'line'));

    assertEquals(0, points[0].x, "Test 4: Trimmed Line Chart - First point should be at the start.");
    assertEquals(200, points[1].x, "Test 4: Trimmed Line Chart - Second point should be in the middle.");
    assertEquals(400, points[2].x, "Test 4: Trimmed Line Chart - Third point should be at the end.");
}

// Run all tests
testPureLineChart();
testMixedChart();
testSinglePointLineChart();
testTrimmedLineChart();

// Print summary
printTestSummary();
