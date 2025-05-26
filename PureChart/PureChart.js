/**
 * @file PureChart.js
 * @description Light and fast chart without any other libs
 * @author Nicolas HANTEVILLE
 * @version 0.13
 *
 * Copyright 2025 Nicolas HANTEVILLE
 * @link https://github.com/omnia-projetcs/web_libs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const PC_LIGHT_THEME_PALETTE = {
    name: "light",
    backgroundColor: '#FFFFFF', 
    axisColor: '#666666',
    gridColor: '#E0E0E0',
    labelColor: '#333333', 
    titleColor: '#333333',
    legendColor: '#333333',
    tooltipBgColor: 'rgba(0,0,0,0.85)',
    tooltipColor: '#FFFFFF',
    defaultDatasetColors: [
        '#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6f42c1', 
        '#e83e8c', '#fd7e14', '#20c997', '#6610f2'
    ],
    bar: { borderColorDarkenPercent: 20, },
    line: {},
    annotations: {}
};

const PC_DARK_THEME_PALETTE = {
    name: "dark",
    backgroundColor: '#22272E', 
    axisColor: '#ADBAC7',      
    gridColor: '#444C56',      
    labelColor: '#F0F6FC',     
    titleColor: '#F0F6FC',
    legendColor: '#F0F6FC',
    tooltipBgColor: 'rgba(20,20,25,0.85)', 
    tooltipColor: '#F0F6FC',
    defaultDatasetColors: [ 
        '#58A6FF', '#52D57B', '#F87171', '#FDB863', '#6CBBEB', '#B197FC',
        '#F781BE', '#FFA94D', '#48D2A0', '#A371F7'
    ],
    bar: { borderColorDarkenPercent: 0, borderColorLightenPercent: 20 },
    line: {},
    annotations: {}
};
 
class PureChart {
    constructor(elementId, userOptions) {
        const canvas = document.getElementById(elementId);
        if (!canvas || canvas.tagName !== 'CANVAS') {
            console.error(`PureChart Error: Element with id "${elementId}" not found or is not a canvas.`);
            this.isValid = false; return;
        }
        this.isValid = true;
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.interactiveElements = [];
        this.interactiveLegendItems = []; // For legend interactivity
        this.activeTooltipData = null;

        const defaults = {
            width: this.canvas.width || 300,
            height: this.canvas.height || 150,
            type: 'bar',
            theme: 'light',
            data: {},
            options: {
                padding: { top: 20, right: 20, bottom: 40, left: 20 },
                yAxes: [{ 
                    id: 'left', // Default ID for the first axis
                    position: 'left', // Default position
                    display: true, 
                    beginAtZero: true, 
                    title: '', 
                    displayTitle: true, 
                    maxTicks: 5, 
                    gridLines: true, 
                    labelFont: '10px Arial', 
                    titleFont: '12px Arial bold', 
                    color: '#666', // This will be themed later
                    sampleLabelForWidthEstimation: "-9,999.9" 
                }],
                xAxis: { display: true, title: '', displayTitle: true, gridLines: false, labelFont: '10px Arial', titleFont: '12px Arial bold', color: '#666' },
                title: { display: true, text: '', font: '18px Arial bold', color: '#333', padding: 15 },
                legend: { display: true, position: 'top', font: '12px Arial', color: '#333', padding: 10, markerSize: 12, markerStyle: 'square' },
                bar: { 
                    itemSpacingFactor: 0.1, 
                    groupSpacingFactor: 0.2,
                    defaultBorderWidth: 1,
                    borderDarkenPercent: 20,
                    averageLine: {
                        display: false,
                        color: '#888',
                        lineWidth: 1,
                        dashPattern: [3, 3],
                        label: {
                            display: true,
                            font: '10px Arial',
                            color: '#555',
                            position: 'above-right',
                            padding: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                            formatter: (value) => `Avg: ${value !== null && value !== undefined ? value.toFixed(2) : 'N/A'}`
                        }
                    }
                },
                line: { 
                    pointRadius: 3, 
                    lineWidth: 2, 
                    tension: 0, 
                    pointStyle: 'circle',
                    averageLine: {
                        display: false,
                        color: '#888',
                        lineWidth: 1,
                        dashPattern: [3, 3],
                        label: {
                            display: true,
                            font: '10px Arial',
                            color: '#555',
                            position: 'above-right',
                            padding: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                            formatter: (value) => `Avg: ${value !== null && value !== undefined ? value.toFixed(2) : 'N/A'}`
                        }
                    }
                },
                percentageDistribution: {
                    barHeight: 20, barSpacing: 3, barBorderRadius: 4, labelFont: '12px Arial',
                    labelColor: '#333', valueFont: '12px Arial bold', valueColor: '#333',
                    showValueText: true, labelPosition: 'left', valuePosition: 'right',
                    colors: null, 
                    maxLabelWidth: 100, valueTextMargin: 8, sort: 'none', // 'none', 'ascending', 'descending'
                    borderWidth: 1, 
                    borderColor: undefined, 
                    borderDarkenPercent: 20,
                    fillLightenPercent: undefined // If > 0, activates the new "gauge" style
                },
                font: '12px Arial', // Global default font
                gridColor: '#e0e0e0',
                tooltip: { 
                    enabled: true, 
                    backgroundColor: 'rgba(0,0,0,0.85)', 
                    color: 'white', 
                    font: '12px Arial', 
                    padding: '10px', 
                    borderRadius: '5px', 
                    offset: 10, 
                    formatter: (params) => { // Default tooltip formatter
                        if (!params) return ''; 
                        if (params.type === 'percentageDistribution' && params.item) { 
                            return `<div style="text-align:left;"><strong>${params.item.label}</strong><br/>Value: ${params.item.value.toLocaleString()}<br/>Percentage: ${params.item.percentage.toFixed(1)}%</div>`; // Translated
                        } 
                        let html = `<div style="font-weight:bold;margin-bottom:5px;text-align:left;">${params.xLabel || ''}</div>`; 
                        (params.datasets || []).forEach((item, index) => { 
                            if (item && item.dataset) {
                                let markerColor = item.dataset.borderColor || (Array.isArray(item.dataset.backgroundColor) ? item.dataset.backgroundColor[0] : item.dataset.backgroundColor);
                                if (!markerColor) { // Fallback to theme's default dataset color
                                    const palette = params.themePalette || PC_LIGHT_THEME_PALETTE; // Default to light if somehow not passed
                                    markerColor = palette.defaultDatasetColors[index % palette.defaultDatasetColors.length];
                                }
                                html += `<div style="text-align:left;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:${markerColor};margin-right:5px;"></span>${item.dataset.label||'Dataset'}: ${item.value !== undefined ? item.value.toLocaleString() : 'N/A'}</div>`; // Translated "Dataset"
                            } 
                        }); 
                        return html; 
                    } 
                }
            }
        };

        this.config = PureChart._mergeDeep(defaults, userOptions);
        
        // Part 1: Robust Axis Configuration Merging
        const defaultSingleYAxisConfig = defaults.options.yAxes[0];

        if (this.config.options.yAxis && (!userOptions.options?.yAxes || userOptions.options.yAxes === undefined) ) { // Check if user provided singular yAxis AND NOT plural yAxes
            const userSingularYAxisConfig = this.config.options.yAxis;
            let base = PureChart._mergeDeep({}, defaultSingleYAxisConfig);
            this.config.options.yAxes = [ PureChart._mergeDeep(base, userSingularYAxisConfig) ];
            delete this.config.options.yAxis;
        } else if (this.config.options.yAxes && Array.isArray(this.config.options.yAxes)) { // User provided plural yAxes or it came from global defaults
            this.config.options.yAxes = this.config.options.yAxes.map(eachUserAxisConfig => {
                let base = PureChart._mergeDeep({}, defaultSingleYAxisConfig);
                return PureChart._mergeDeep(base, eachUserAxisConfig);
            });
        } else { // Neither yAxis (singular) nor yAxes (plural array) was in userOptions. Ensure yAxes is defaulted.
            this.config.options.yAxes = [ PureChart._mergeDeep({}, defaultSingleYAxisConfig) ];
        }

        // Then, the existing loop to ensure id and position:
        if (this.config.options.yAxes && Array.isArray(this.config.options.yAxes)) {
            this.config.options.yAxes.forEach((axis, index) => {
                if (!axis.id) { axis.id = index === 0 ? 'left' : `yAxis-${index}`; }
                if (!axis.position) { axis.position = index === 0 ? 'left' : (index === 1 ? 'right' : 'left'); }
            });
        }

        // Initialize activePalette based on the theme
        if (this.config.theme === 'dark') {
            this.activePalette = PC_DARK_THEME_PALETTE;
        } else {
            this.activePalette = PC_LIGHT_THEME_PALETTE; // Default to light
        }
        // If a custom theme object is provided in options, merge it over the selected palette
        if (typeof this.config.theme === 'object' && this.config.theme !== null) {
            const basePalette = (this.config.theme.extends === 'dark' && PC_DARK_THEME_PALETTE) ? PC_DARK_THEME_PALETTE : PC_LIGHT_THEME_PALETTE;
            this.activePalette = PureChart._mergeDeep(basePalette, this.config.theme);
        }

        // Default yAxisID for Datasets
        if (this.config.data && this.config.data.datasets && this.config.options.yAxes && this.config.options.yAxes.length > 0) {
            const defaultYAxisID = this.config.options.yAxes[0].id;
            this.config.data.datasets.forEach(dataset => {
                if (dataset.yAxisID === undefined) {
                    dataset.yAxisID = defaultYAxisID;
                }
            });
        }

        this._validateConfig();
        if (!this.isValid) return;

        // Set canvas dimensions after merging, as userOptions might override defaults
        this.canvas.width = this.config.width;
        this.canvas.height = this.config.height;

        if (this.isValid && this.config.options.tooltip.enabled) {
            this._createTooltipElement();
            this.canvas.addEventListener('mousemove', this._onMouseMove.bind(this));
            this.canvas.addEventListener('mouseout', this._onMouseOut.bind(this));
            this.canvas.addEventListener('mouseleave', this._onMouseOut.bind(this)); // Also hide on mouseleave
        }

        // Initialize dataset visibility
        if (this.config.data && this.config.data.datasets) {
            this.config.data.datasets.forEach(dataset => {
                dataset._hidden = false;
            });
        }
        
        this.canvas.addEventListener('click', this._onCanvasClick.bind(this));

        this._draw();
    }

    static _calculateSMA(dataValues, period) {
        if (!dataValues || period <= 0 || dataValues.length === 0) { // Allow dataValues.length < period, will result in more padding
            return []; 
        }
        if (dataValues.length < period) { // Not enough data for even one SMA value
            return new Array(dataValues.length).fill(null); // Pad all if not enough data
        }

        const smaValues = [];
        for (let i = 0; i <= dataValues.length - period; i++) {
            let sum = 0;
            let numbersInPeriod = 0;
            for (let j = 0; j < period; j++) {
                if (typeof dataValues[i + j] === 'number' && !isNaN(dataValues[i+j])) {
                    sum += dataValues[i + j];
                    numbersInPeriod++;
                }
            }
            // Only calculate SMA if there were numbers in the period, otherwise push null
            smaValues.push(numbersInPeriod > 0 ? sum / numbersInPeriod : null);
        }
        const padding = new Array(period - 1).fill(null);
        return padding.concat(smaValues);
    }

    static _calculateDatasetAverage(values) {
        if (!Array.isArray(values)) {
            return null;
        }
        const numericValues = values.filter(v => typeof v === 'number' && !isNaN(v));
        if (numericValues.length === 0) {
            return null;
        }
        const sum = numericValues.reduce((acc, val) => acc + val, 0);
        return sum / numericValues.length;
    }

    static _mergeDeep(target, source) {
        const isObject = (obj) => obj && typeof obj === 'object' && !Array.isArray(obj);
        let output = { ...target };
        if (isObject(target) && isObject(source)) {
            Object.keys(source).forEach(key => {
                if (isObject(source[key])) {
                    if (!(key in target) || !isObject(target[key])) {
                        output[key] = { ...source[key] }; // Assign if target doesn't have key or target[key] is not an object
                    } else {
                        output[key] = PureChart._mergeDeep(target[key], source[key]);
                    }
                } else {
                    output[key] = source[key]; // Assign primitive values
                }
            });
        }
        return output;
    }

    static async fromJSON(elementId, jsonUrl, overrideOptions = {}, csrfToken = null) {
        try {
            const fetchOptions = {};
            if (csrfToken) {
                fetchOptions.headers = {
                    'X-CSRFToken': csrfToken
                };
            }
            const response = await fetch(jsonUrl, fetchOptions);
            if (!response.ok) {
                console.error(`PureChart Fetch Error: Status ${response.status} for URL ${jsonUrl}`);
                throw new Error(`PureChart Error: Failed to fetch JSON from ${jsonUrl}. Status: ${response.status}`);
            }
            const jsonConfigFromApi = await response.json();
            
            // Check if data is nested under a specific key like "chart_datas"
            let chartSpecificConfig = jsonConfigFromApi;
            // Example: if API returns { "status": "success", "chart_datas": { ... actual config ... } }
            // This part might need adjustment based on the actual API response structure.
            if (jsonConfigFromApi && typeof jsonConfigFromApi.chart_datas === 'object' && jsonConfigFromApi.chart_datas !== null) {
                chartSpecificConfig = jsonConfigFromApi.chart_datas;
            }

            // Merge fetched config with any override options
            let finalConfig = {};
            finalConfig = PureChart._mergeDeep(chartSpecificConfig, overrideOptions);
            
            // Ensure canvas dimensions from attributes are used if not in config
            const canvasForCheck = document.getElementById(elementId);
            if (canvasForCheck) { // Check if canvas exists before accessing attributes
                if (!finalConfig.width && canvasForCheck.width) finalConfig.width = canvasForCheck.width;
                if (!finalConfig.height && canvasForCheck.height) finalConfig.height = canvasForCheck.height;
            }
            return new PureChart(elementId, finalConfig);
        } catch (error) {
            console.error("PureChart Error (fromJSON catch block):", error);
            const canvas = document.getElementById(elementId);
            if (canvas && canvas.getContext) { // Display error on canvas
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.font = '12px Arial'; ctx.fillStyle = 'red'; ctx.textAlign = 'center';
                const message = `Error loading chart from JSON: ${String(error.message).substring(0,100)}`; // Translated
                String(message).split('\n').forEach((line, index) => {
                    ctx.fillText(line, canvas.width / 2, canvas.height / 2 - (String(message).split('\n').length-1)*7 + index * 14);
                });
            }
            return null; // Indicate failure
        }
    }

    _validateConfig() {
        if (this.config.type === 'percentageDistribution') {
            if (!this.config.data || !Array.isArray(this.config.data.items) || this.config.data.items.length === 0) {
                console.error("PureChart Error (percentageDistribution): data.items array is required and non-empty.");
                this.isValid = false; return;
            }
            if (this.isValid) { // Only proceed if still valid
                this.config.data.items.forEach((item, index) => {
                    if (item === null || typeof item !== 'object' || typeof item.label !== 'string' || typeof item.value !== 'number' || item.value < 0 || isNaN(item.value)) {
                        console.error(`PureChart Error (percentageDistribution): Item ${index} is invalid. Must be {label: string, value: non-negative number}. Item:`, item);
                        this.isValid = false; // Invalidate on first bad item
                    }
                });
            }
            if (!this.isValid) return;
            // For percentageDistribution, axes and legend are typically off by default
            this.config.options.xAxis.display = this.config.options.xAxis.display ?? false;
            if (this.config.options.yAxes && this.config.options.yAxes.length > 0) { // Ensure yAxes exists
                this.config.options.yAxes[0].display = this.config.options.yAxes[0].display ?? false;
            }
            this.config.options.legend.display = this.config.options.legend.display ?? false;
        } else { // bar, line
            if (!this.config.data || !this.config.data.labels || !this.config.data.datasets) {
                console.error("PureChart Error (bar/line): data.labels and data.datasets are required.");
                this.isValid = false; return;
            }
            if (this.isValid) { // Only proceed if still valid
                this.config.data.datasets.forEach((ds, index) => {
                    const datasetEffectiveType = ds.type || this.config.type;

                    // Validate 'values' array presence only if not an SMA type (which generates its own values)
                    // and not a 'percentageDistribution' chart (which uses 'items')
                    // Note: this.config.type !== 'percentageDistribution' is already handled by the outer if/else block structure.
                    if (datasetEffectiveType !== 'sma') {
                        if (!ds.values || !Array.isArray(ds.values)) {
                            console.error(`PureChart Error (bar/line): Dataset ${index} ('${ds.label || 'Untitled'}') missing 'values' array.`);
                            this.isValid = false;
                        }
                    }
                    
                    // Default 'fill' for line charts and SMA (as they are drawn as lines) if not specified
                    if ((datasetEffectiveType === 'line' || datasetEffectiveType === 'sma') && ds.fill === undefined) {
                        ds.fill = false; 
                    }
                });
            }
            if (!this.isValid) return;
        }
    }

    _resolveColor(colorOption, elementRect) { // elementRect for gradient context
        if (typeof colorOption === 'function') return colorOption(this.ctx, elementRect);
        if (Array.isArray(colorOption) && colorOption.length >= 2) { // Gradient
            const gradient = this.ctx.createLinearGradient(elementRect.x, elementRect.y, elementRect.x, elementRect.y + elementRect.h);
            gradient.addColorStop(0, colorOption[0]);
            gradient.addColorStop(1, colorOption[1]);
            return gradient;
        }
        return colorOption || '#007bff'; // Default color if undefined
    }

    _darkenColor(colorStr, percent) {
        if (typeof colorStr !== 'string') return '#333333'; // Default dark color
        let r, g, b, a = 1; const factor = 1 - (percent / 100);
        // Parse RGBA
        if (colorStr.startsWith('rgba')) { const parts = colorStr.match(/[\d.]+/g); if (parts && parts.length >= 3) { r = parseInt(parts[0]); g = parseInt(parts[1]); b = parseInt(parts[2]); a = parts.length >= 4 ? parseFloat(parts[3]) : 1; } else { return '#333333'; } }
        // Parse RGB
        else if (colorStr.startsWith('rgb')) { const parts = colorStr.match(/\d+/g); if (parts && parts.length >= 3) { r = parseInt(parts[0]); g = parseInt(parts[1]); b = parseInt(parts[2]); } else { return '#333333'; } }
        // Parse HEX
        else if (colorStr.startsWith('#')) { let hex = colorStr.slice(1); if (hex.length === 3) hex = hex.split('').map(char => char + char).join(''); if (hex.length === 6) { const num = parseInt(hex, 16); r = (num >> 16) & 255; g = (num >> 8) & 255; b = num & 255; } else { return '#333333'; } }
        // Unknown format or named color (difficult to handle without a full parser)
        else { return '#333333'; /* Fallback for named colors or complex inputs */ }
        r = Math.max(0, Math.floor(r * factor)); g = Math.max(0, Math.floor(g * factor)); b = Math.max(0, Math.floor(b * factor));
        return `rgba(${r},${g},${b},${a})`;
    }

    _lightenColor(colorStr, percent) {
        if (typeof colorStr !== 'string') return '#EEEEEE'; // Default light color
        let r, g, b, a = 1; const factor = percent / 100;
        if (colorStr.startsWith('rgba')) { const parts = colorStr.match(/[\d.]+/g); if (parts && parts.length >= 3) { r = parseInt(parts[0]); g = parseInt(parts[1]); b = parseInt(parts[2]); a = parts.length >= 4 ? parseFloat(parts[3]) : 1; } else { return '#EEEEEE'; } }
        else if (colorStr.startsWith('rgb')) { const parts = colorStr.match(/\d+/g); if (parts && parts.length >= 3) { r = parseInt(parts[0]); g = parseInt(parts[1]); b = parseInt(parts[2]); } else { return '#EEEEEE'; } }
        else if (colorStr.startsWith('#')) { let hex = colorStr.slice(1); if (hex.length === 3) hex = hex.split('').map(char => char + char).join(''); if (hex.length === 6) { const num = parseInt(hex, 16); r = (num >> 16) & 255; g = (num >> 8) & 255; b = num & 255; } else { return '#EEEEEE'; } }
        else { 
            // Attempt to parse named colors by assigning to canvas fillStyle and reading back
            try { const tempCtx = this.canvas.getContext('2d'); tempCtx.fillStyle = colorStr; const parsedColor = tempCtx.fillStyle; if (parsedColor.startsWith('#') || parsedColor.startsWith('rgb')) return this._lightenColor(parsedColor, percent); } catch(e) {/*ignore*/}
            return '#EEEEEE'; // Fallback
        }
        r = Math.min(255, Math.floor(r + (255 - r) * factor));
        g = Math.min(255, Math.floor(g + (255 - g) * factor));
        b = Math.min(255, Math.floor(b + (255 - b) * factor));
        return `rgba(${r},${g},${b},${a})`;
    }

    _getAutoColor(index, totalItems) { // For percentageDistribution if no colors provided
        const colors = this.config.options.percentageDistribution.colors;
        if (colors && colors[index % colors.length]) return colors[index % colors.length];
        // Generate HSL colors if not provided
        const hue = Math.round((index * (360 / (totalItems > 1 ? totalItems : 2))) % 360); // Distribute hues
        // Prefer HEX/RGB for _lightenColor/_darkenColor, so HSL here might not be ideal with current helpers or convert.
        // For now, if no 'colors' provided, lighten/darken on HSL might not be ideal.
        return `hsl(${hue}, 70%, 55%)`; 
    }

    _getDrawingArea() {
        let { top: paddingTop, right: paddingRight, bottom: paddingBottom, left: paddingLeft } = { ...this.config.options.padding };
        const options = this.config.options;
        let currentTop = paddingTop;
        let currentRight = paddingRight;
        let currentBottom = paddingBottom;
        let currentLeft = paddingLeft;

        // Title height
        if (options.title.display && options.title.text) {
            this.ctx.font = options.title.font;
            currentTop += (this.ctx.measureText('M').width * 1.5) + options.title.padding; // Approximate text height
        }

        // Legend height (if not percentageDistribution)
        if (options.legend.display && this.config.type !== 'percentageDistribution') {
            this.ctx.font = options.legend.font;
            const legendHeight = (this.ctx.measureText('M').width * 1.5) + options.legend.padding;
            if (options.legend.position === 'top') {
                currentTop += legendHeight;
            } else { // bottom
                currentBottom += legendHeight;
            }
        }

        // Axes space (if not percentageDistribution)
        if (this.config.type !== 'percentageDistribution') {
            let dynamicLeftPadding = 0;
            let dynamicRightPadding = 0;

            if (options.yAxes && Array.isArray(options.yAxes)) {
                options.yAxes.forEach(axisConfig => {
                    if (axisConfig.display) {
                        let axisSpace = 0;
                        this.ctx.font = axisConfig.labelFont;
                        axisSpace += this.ctx.measureText(axisConfig.sampleLabelForWidthEstimation || "-9,999.9").width + 10; // Label width + spacing

                        if (axisConfig.displayTitle && axisConfig.title) {
                            const originalFont = this.ctx.font; // Save current font
                            this.ctx.font = axisConfig.titleFont;
                            axisSpace += (this.ctx.measureText('M').width * 1.5) + 5; // Title char height + spacing
                            this.ctx.font = originalFont; // Restore font
                        }

                        if (axisConfig.position === 'right') {
                            dynamicRightPadding += axisSpace;
                        } else { // Default to left
                            dynamicLeftPadding += axisSpace;
                        }
                    }
                });
            }
            currentLeft += dynamicLeftPadding;
            currentRight += dynamicRightPadding;

            if (options.xAxis.display) {
                this.ctx.font = options.xAxis.labelFont;
                currentBottom += (this.ctx.measureText('M').width * 1.5) + 5; // Label height + spacing
                if (options.xAxis.displayTitle && options.xAxis.title) {
                    const originalFont = this.ctx.font;
                    this.ctx.font = options.xAxis.titleFont;
                    currentBottom += (this.ctx.measureText('M').width * 1.5) + 5; // Title char height + spacing
                    this.ctx.font = originalFont;
                }
            }
        } else { // Specific padding for percentageDistribution labels/values
            this.ctx.font = options.percentageDistribution.labelFont;
            if (options.percentageDistribution.labelPosition === 'left') {
                currentLeft = Math.max(currentLeft, (options.percentageDistribution.maxLabelWidth || 0) + 10);
            }
            this.ctx.font = options.percentageDistribution.valueFont;
            if (options.percentageDistribution.showValueText && options.percentageDistribution.valuePosition === 'right') {
                currentRight = Math.max(currentRight, this.ctx.measureText("100.0%").width + (options.percentageDistribution.valueTextMargin || 0) + 5);
            }
        }

        currentTop = Math.max(5, currentTop);
        currentRight = Math.max(5, currentRight);
        currentBottom = Math.max(5, currentBottom);
        currentLeft = Math.max(5, currentLeft);

        const drawWidth = this.canvas.width - currentLeft - currentRight;
        const drawHeight = this.canvas.height - currentTop - currentBottom;

        return { x: currentLeft, y: currentTop, width: drawWidth > 0 ? drawWidth : 0, height: drawHeight > 0 ? drawHeight : 0 };
    }

    _createTooltipElement() {
        if (this.tooltipElement || !this.config.options.tooltip.enabled) return; // Already exists or disabled
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.style.position = 'absolute'; this.tooltipElement.style.visibility = 'hidden';
        this.tooltipElement.style.pointerEvents = 'none'; this.tooltipElement.style.zIndex = '100'; // High z-index
        // Apply styles from config
        const tO = this.config.options.tooltip;
        this.tooltipElement.style.backgroundColor = tO.backgroundColor; this.tooltipElement.style.color = tO.color;
        this.tooltipElement.style.font = tO.font; this.tooltipElement.style.padding = tO.padding;
        this.tooltipElement.style.borderRadius = tO.borderRadius; this.tooltipElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        document.body.appendChild(this.tooltipElement);
    }

    _draw() {
        if (!this.isValid) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.textBaseline = 'middle'; // Consistent baseline
        this.interactiveElements = []; // Reset for new draw
        
        this._preprocessDatasetValues(); // Calculate SMA values etc.

        this.drawArea = this._getDrawingArea();
        if (this.drawArea.width <= 0 || this.drawArea.height <= 0) { // Check for drawable area
            console.warn("PureChart Warning: Drawing area too small.");
            this.ctx.font = '12px Arial'; this.ctx.fillStyle = '#333'; this.ctx.textAlign = 'center';
            this.ctx.fillText("Drawing area too small.", this.canvas.width / 2, this.canvas.height / 2); // Translated
            return;
        }
        if (this.config.type !== 'percentageDistribution') { // Scale needed for bar/line
            this._calculateScale();
            if (!this.isValid) { // If scale calculation fails
                console.error("PureChart: Scale calculation failed.");
                this.ctx.font = '12px Arial'; this.ctx.fillStyle = 'red'; this.ctx.textAlign = 'center';
                this.ctx.fillText("Error: Scale calculation failed.", this.canvas.width / 2, this.canvas.height / 2); // Translated
                return;
            }
        }
        if (this.config.options.title.display && this.config.options.title.text) this._drawTitle();
        if (this.config.type === 'percentageDistribution') this._drawPercentageBarChart();
        else { // Bar, Line, or Mixed
            if (this.config.options.legend.display) this._drawLegend();
            this._drawAxesAndGrid();
            
            // Draw annotations if there are any yAxes and scales available
            if (this.config.options.yAxes && this.config.options.yAxes.length > 0 && this.yAxisScales && Object.keys(this.yAxisScales).length > 0) {
                this._drawAnnotations();
            }
            
            // Call both drawing functions. They will internally filter by type.
            this._drawBarChart(); 
            this._drawLineChart();
            this._drawAverageLines();
        }
    }

    _drawAverageLines() {
        // Check if essential configurations are present.
        // Note: this.config.options.yAxis.display is no longer directly relevant for multi-axis.
        // We'll check for valid yAxisScales later per dataset.
        if (!this.config.data || !this.config.data.datasets || this.config.type === 'percentageDistribution' || !this.yAxisScales) {
            return;
        }
        
        this.ctx.save();

        this.config.data.datasets.forEach(dataset => {
            const datasetType = dataset.type || this.config.type;
            if (dataset._hidden || datasetType === 'percentageDistribution' || datasetType === 'sma') {
                return;
            }

            const yAxisID = dataset.yAxisID || (this.config.options.yAxes && this.config.options.yAxes.length > 0 ? this.config.options.yAxes[0].id : null);
            if (!yAxisID) {
                // console.warn(`PureChart _drawAverageLines: Dataset '${dataset.label}' has no yAxisID.`);
                return;
            }

            const yAxisScaleInfo = this.yAxisScales[yAxisID];
            if (!yAxisScaleInfo || !yAxisScaleInfo.scale || yAxisScaleInfo.scale <= 0 || !isFinite(yAxisScaleInfo.scale) || !yAxisScaleInfo.axisConfig.display) {
                // console.warn(`PureChart _drawAverageLines: Invalid or non-displayed Y-axis scale for dataset '${dataset.label}' on yAxisID '${yAxisID}'.`);
                return;
            }

            const defaultAvgLineConfig = (this.config.options[datasetType] && this.config.options[datasetType].averageLine)
                                       ? this.config.options[datasetType].averageLine
                                       : {};
            const datasetAvgLineConfig = dataset.averageLine || {};
            const avgLineCfg = PureChart._mergeDeep(defaultAvgLineConfig, datasetAvgLineConfig);

            if (!avgLineCfg.display) {
                return;
            }

            const averageValue = PureChart._calculateDatasetAverage(dataset.values);

            if (averageValue === null) {
                return;
            }

            let y = this.drawArea.y + this.drawArea.height - ((averageValue - (yAxisScaleInfo.min || 0)) * (yAxisScaleInfo.scale || 1));
            y = Math.max(this.drawArea.y, Math.min(y, this.drawArea.y + this.drawArea.height)); // Clamp

            // Draw the line
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.moveTo(this.drawArea.x, y);
            this.ctx.lineTo(this.drawArea.x + this.drawArea.width, y);
            
            this.ctx.strokeStyle = avgLineCfg.color;
            this.ctx.lineWidth = avgLineCfg.lineWidth;

            if (Array.isArray(avgLineCfg.dashPattern) && avgLineCfg.dashPattern.length > 0) {
                this.ctx.setLineDash(avgLineCfg.dashPattern);
            }
            
            this.ctx.stroke();
            
            if (Array.isArray(avgLineCfg.dashPattern) && avgLineCfg.dashPattern.length > 0) {
                this.ctx.setLineDash([]); // Reset
            }
            this.ctx.restore();

            // Draw the label
            if (avgLineCfg.label && avgLineCfg.label.display && avgLineCfg.label.formatter) {
                this.ctx.save();
                const labelCfg = avgLineCfg.label;
                const labelText = typeof labelCfg.formatter === 'function' ? labelCfg.formatter(averageValue) : String(averageValue);

                this.ctx.font = labelCfg.font;
                this.ctx.fillStyle = labelCfg.color;
                
                let labelX, labelY;
                const padding = labelCfg.padding || 0;
                const textMetrics = this.ctx.measureText(labelText);
                // Approximate height based on font size
                const fontHeight = parseInt(this.ctx.font.match(/(\d+)px/)?.[1] || '10'); 

                // Default to 'above-right'
                let textAlign = 'right';
                let textBaseline = 'bottom';
                labelX = this.drawArea.x + this.drawArea.width - padding;
                labelY = y - padding;

                if (labelCfg.position === 'above-left') {
                    textAlign = 'left';
                    labelX = this.drawArea.x + padding;
                } else if (labelCfg.position === 'below-left') {
                    textAlign = 'left';
                    textBaseline = 'top';
                    labelX = this.drawArea.x + padding;
                    labelY = y + padding;
                } else if (labelCfg.position === 'below-right') {
                    textAlign = 'right';
                    textBaseline = 'top';
                    labelX = this.drawArea.x + this.drawArea.width - padding;
                    labelY = y + padding;
                }
                // Add more positions as needed: 'center-left', 'center-right', 'above-center', 'below-center'
                
                this.ctx.textAlign = textAlign;
                this.ctx.textBaseline = textBaseline;

                if (labelCfg.backgroundColor) {
                    const bgWidth = textMetrics.width + (padding * 2);
                    const bgHeight = fontHeight + (padding * 2);
                    let bgX = labelX;
                    let bgY = labelY;

                    if (textAlign === 'right') bgX = labelX - textMetrics.width - padding;
                    else if (textAlign === 'center') bgX = labelX - textMetrics.width / 2 - padding;
                    else bgX = labelX - padding; // left

                    if (textBaseline === 'bottom') bgY = labelY - fontHeight - padding;
                    else if (textBaseline === 'middle') bgY = labelY - fontHeight / 2 - padding;
                    else bgY = labelY - padding; // top
                    
                    this.ctx.fillStyle = labelCfg.backgroundColor;
                    this.ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
                    this.ctx.fillStyle = labelCfg.color; // Reset for text
                }
                this.ctx.fillText(labelText, labelX, labelY);
                this.ctx.restore();
            }
        });
        this.ctx.restore();
    }

    _drawTitle() {
        const { text, font, color, padding } = this.config.options.title; this.ctx.save();
        this.ctx.font = font; this.ctx.fillStyle = color; this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'top';
        this.ctx.fillText(text, this.canvas.width / 2, padding); this.ctx.restore();
    }

    _drawLegend() {
        const { data, options } = this.config; const { legend } = options; if (!data.datasets || data.datasets.length === 0) return; this.ctx.save();
        this.interactiveLegendItems = []; // Clear for redraw
        this.ctx.font = legend.font; this.ctx.fillStyle = legend.color; this.ctx.textAlign = 'left'; this.ctx.textBaseline = 'middle';
        const markerSize = legend.markerSize; const itemHeight = Math.max(markerSize, this.ctx.measureText('M').width*1.2); const itemSpacing = 5;
        let currentX, currentY; let titleActualHeight = options.padding.top;
        // Adjust Y start based on title presence for 'top' legend
        if (options.title.display && options.title.text) { const tempFont=this.ctx.font; this.ctx.font=options.title.font; titleActualHeight=(this.ctx.measureText('M').width*1.5)+options.title.padding+options.padding.top; this.ctx.font=tempFont; }
        if(legend.position==='top') currentY=titleActualHeight+legend.padding+(itemHeight/2); else currentY=this.canvas.height-options.padding.bottom-legend.padding-(itemHeight/2); // 'bottom' position
        
        const legendItemsData = data.datasets.map((ds,index)=>({
            label: ds.label || `Dataset ${index+1}`, // Translated "Dataset"
            color: ds.borderColor || (Array.isArray(ds.backgroundColor) ? ds.backgroundColor[0] : ds.backgroundColor) || '#ccc',
            textWidth: this.ctx.measureText(ds.label || `Dataset ${index+1}`).width, // Translated "Dataset"
            dataset: ds,
            datasetIndex: index
        }));

        const totalLegendItemWidth = legendItemsData.reduce((sum,item) => sum + markerSize + 5 + item.textWidth + 15, 0) - 15; // Calculate total width for centering
        currentX = Math.max(this.drawArea.x, this.drawArea.x + (this.drawArea.width - totalLegendItemWidth) / 2); // Center legend items
        const maxLegendX = this.drawArea.x + this.drawArea.width; // Right boundary for legend items

        legendItemsData.forEach(item => {
            const itemSegmentStartX = currentX;
            const itemSegmentWidth = markerSize + 5 + item.textWidth + 15;
            if (currentX + itemSegmentWidth > maxLegendX && currentX > Math.max(this.drawArea.x, this.drawArea.x + (this.drawArea.width - totalLegendItemWidth) / 2)) {
                currentY += itemHeight + itemSpacing;
                currentX = Math.max(this.drawArea.x, this.drawArea.x + (this.drawArea.width - totalLegendItemWidth) / 2);
            }
            if (currentX < this.drawArea.x) currentX = this.drawArea.x;

            const markerX = currentX;
            const textX = markerX + markerSize + 5;
            
            // Store bounds
            const legendItemRect = {
                x: markerX,
                y: currentY - itemHeight / 2,
                w: itemSegmentWidth,
                h: itemHeight
            };
            this.interactiveLegendItems.push({ rect: legendItemRect, dataset: item.dataset, datasetIndex: item.datasetIndex });

            this.ctx.fillStyle = item.color;
            if (legend.markerStyle === 'circle') {
                this.ctx.beginPath();
                this.ctx.arc(markerX + markerSize / 2, currentY, markerSize / 2, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.fillRect(markerX, currentY - markerSize / 2, markerSize, markerSize);
            }
            
            const originalFillStyle = this.ctx.fillStyle; // Save original fill style (it's legend.color)
            if (item.dataset._hidden) {
                this.ctx.fillStyle = '#aaa'; // Faded color for hidden items
            } else {
                this.ctx.fillStyle = legend.color; // Default text color (already set, but good for clarity)
            }
            this.ctx.fillText(item.label, textX, currentY);

            if (item.dataset._hidden) {
                const textWidth = item.textWidth; // Already calculated
                this.ctx.beginPath();
                this.ctx.moveTo(textX, currentY);
                this.ctx.lineTo(textX + textWidth, currentY);
                this.ctx.strokeStyle = '#aaa'; // Line-through color
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
            this.ctx.fillStyle = originalFillStyle; // Restore for next item or other drawing parts

            currentX += itemSegmentWidth;
        });
        this.ctx.restore();
    }

    _onCanvasClick(event) {
        if (!this.interactiveLegendItems || this.interactiveLegendItems.length === 0) return;

        const mousePos = this._getMousePos(event);
        let legendItemClicked = false;

        for (const item of this.interactiveLegendItems) {
            if (mousePos.x >= item.rect.x && mousePos.x <= item.rect.x + item.rect.w &&
                mousePos.y >= item.rect.y && mousePos.y <= item.rect.y + item.rect.h) {
                
                // Toggle visibility of the dataset
                item.dataset._hidden = !item.dataset._hidden;
                legendItemClicked = true;
                break; // Handle only the first clicked item
            }
        }

        if (legendItemClicked) {
            this._draw(); // Redraw the chart to reflect changes
            // event.stopPropagation(); // Optional: consider if other global click handlers exist
        }
    }

    _calculateScale() {
        const { data, options } = this.config;
        this.yAxisScales = {}; // Initialize a store for scales of each Y-axis

        if (!options.yAxes || !Array.isArray(options.yAxes) || options.yAxes.length === 0) {
            console.warn("PureChart _calculateScale: No yAxes configured. Chart may not render correctly.");
            // Provide a default single scale to prevent critical errors downstream before other functions are updated.
            this.minValue = 0;
            this.maxValue = 1;
            this.yScale = this.drawArea.height > 0 ? this.drawArea.height : 1; // Basic fallback
            this.yAxisScales['default'] = { min: 0, max: 1, scale: this.yScale, axisConfig: { id: 'default', display: true, beginAtZero: true, position: 'left'} };
            this.isValid = false; // Potentially invalidate the chart if no axes are defined
            return;
        }

        options.yAxes.forEach(axisConfig => {
            const currentAxisID = axisConfig.id;
            let allValuesForCurrentAxis = [];

            if (data.datasets && data.datasets.length > 0) {
                data.datasets.forEach(dataset => {
                    if (dataset.yAxisID === currentAxisID && !dataset._hidden) {
                        if (dataset.values && Array.isArray(dataset.values) && dataset.values.length > 0) {
                            allValuesForCurrentAxis = allValuesForCurrentAxis.concat(dataset.values.filter(v => typeof v === 'number' && !isNaN(v)));
                        }
                    }
                });
            }

            let minValue, maxValue;

            if (allValuesForCurrentAxis.length === 0) {
                // console.warn(`PureChart _calculateScale: No valid data for yAxis ID '${currentAxisID}'. Using default scale [0,1].`);
                minValue = 0;
                maxValue = 1;
            } else {
                minValue = axisConfig.beginAtZero ? 0 : Math.min(...allValuesForCurrentAxis);
                maxValue = Math.max(...allValuesForCurrentAxis);

                if (axisConfig.beginAtZero) {
                    minValue = Math.min(0, minValue);
                    maxValue = Math.max(0, maxValue);
                }
            }

            if (minValue === maxValue) {
                if (minValue === 0) {
                    maxValue = 1;
                } else {
                    const buffer = Math.abs(maxValue * 0.1) || 1; // Ensure buffer is at least 1
                    maxValue += buffer;
                    if (!axisConfig.beginAtZero) {
                        minValue -= buffer;
                    } else {
                        minValue = Math.min(0, minValue - buffer); // Ensure beginAtZero is still respected
                    }
                }
            }
             // Final safety check if still equal (e.g. if buffer was 0 or values were very small)
            if (minValue === maxValue) {
                maxValue += 1;
            }


            let yScale;
            if (this.drawArea.height === 0 || (maxValue - minValue === 0)) {
                yScale = 1; // Avoid division by zero or scale based on zero height
            } else {
                yScale = this.drawArea.height / (maxValue - minValue);
            }

            if (!isFinite(yScale) || yScale <= 0) {
                console.error(`PureChart _calculateScale: Invalid yScale (${yScale}) calculated for yAxis ID '${currentAxisID}'. Defaulting to 1.`);
                yScale = 1;
                // Consider if this specific axis failure should invalidate the entire chart:
                // this.isValid = false; 
            }
            
            this.yAxisScales[currentAxisID] = {
                min: minValue,
                max: maxValue,
                scale: yScale,
                axisConfig: axisConfig // Store the axis config for reference
            };
        });

        // Temporary backward compatibility: Set global scale properties from the first Y-axis
        // This is for other functions that haven't been updated yet.
        if (options.yAxes.length > 0) {
            const firstAxisID = options.yAxes[0].id;
            const firstAxisScales = this.yAxisScales[firstAxisID];
            if (firstAxisScales) {
                this.minValue = firstAxisScales.min;
                this.maxValue = firstAxisScales.max;
                this.yScale = firstAxisScales.scale;
            } else {
                // Fallback if the first axis scale wasn't successfully calculated (should not happen with current logic)
                console.error("PureChart _calculateScale: Failed to get scale for the first Y-axis for backward compatibility.");
                this.minValue = 0;
                this.maxValue = 1;
                this.yScale = 1;
            }
        } else {
             // This case is handled at the start, but as a defensive measure for temporary properties:
            this.minValue = 0;
            this.maxValue = 1;
            this.yScale = 1;
        }
    }

    _drawAxesAndGrid() {
        const { options, data } = this.config;
        this.ctx.save();
        this.ctx.lineWidth = 1;
        this.ctx.font = options.font; // Global font for context (might be overridden by axis specific)

        // Determine which Y-axis is responsible for drawing the main horizontal grid lines
        let primaryGridAxisId = null;
        if (options.yAxes && Array.isArray(options.yAxes)) {
            for (const axisCfg of options.yAxes) {
                if (axisCfg.display && axisCfg.gridLines) {
                    primaryGridAxisId = axisCfg.id;
                    break; // Found the first one
                }
            }
        }
        
        // Draw Y-Axes
        if (this.yAxisScales && typeof this.yAxisScales === 'object') {
            Object.values(this.yAxisScales).forEach(yAxisData => {
                const { axisConfig, min: minValue, max: maxValue, scale: yScale } = yAxisData;

                if (!axisConfig.display || this.drawArea.height <= 0 || !isFinite(yScale) || yScale <= 0) {
                    return; // Skip this axis
                }

                const isRightPositioned = axisConfig.position === 'right';
                const axisLineX = isRightPositioned ? this.drawArea.x + this.drawArea.width : this.drawArea.x;
                const tickLabelPadding = 8;

                this.ctx.strokeStyle = axisConfig.color || this.activePalette.axisColor;
                this.ctx.fillStyle = axisConfig.color || this.activePalette.axisColor;
                this.ctx.font = axisConfig.labelFont; // Set for labels and potentially title estimation

                // Draw Y-Axis Line
                this.ctx.beginPath();
                this.ctx.moveTo(axisLineX, this.drawArea.y);
                this.ctx.lineTo(axisLineX, this.drawArea.y + this.drawArea.height);
                this.ctx.stroke();

                // Draw Y-Axis Labels and Grid Lines
                this.ctx.textAlign = isRightPositioned ? 'left' : 'right';
                this.ctx.textBaseline = 'middle';
                const numTicks = Math.max(2, axisConfig.maxTicks || 5);

                if (maxValue !== undefined && minValue !== undefined && (maxValue - minValue !== 0)) {
                    for (let i = 0; i <= numTicks; i++) {
                        const value = maxValue - (i * (maxValue - minValue) / numTicks);
                        const yPos = this.drawArea.y + (i * this.drawArea.height / numTicks);

                        if (yPos >= this.drawArea.y - 1 && yPos <= this.drawArea.y + this.drawArea.height + 1) { // Clamp to drawable area
                            const labelTextX = isRightPositioned ? axisLineX + tickLabelPadding : axisLineX - tickLabelPadding;
                            this.ctx.fillText(value.toLocaleString(), labelTextX, yPos);
                        }

                        // Draw Grid Lines only for the primary grid axis
                        if (axisConfig.id === primaryGridAxisId && i > 0 && i < numTicks) {
                            if (yPos > this.drawArea.y && yPos < this.drawArea.y + this.drawArea.height) { // Ensure grid line is within bounds
                                this.ctx.save();
                                this.ctx.strokeStyle = options.gridColor || this.activePalette.gridColor;
                                this.ctx.lineWidth = 0.5;
                                this.ctx.beginPath();
                                this.ctx.moveTo(this.drawArea.x + 1, yPos); // From left of draw area
                                this.ctx.lineTo(this.drawArea.x + this.drawArea.width, yPos); // To right of draw area
                                this.ctx.stroke();
                                this.ctx.restore();
                            }
                        }
                    }
                } else if (maxValue !== undefined) { // Fallback if scale is weird (e.g. min=max=0)
                    const labelTextX = isRightPositioned ? axisLineX + tickLabelPadding : axisLineX - tickLabelPadding;
                    this.ctx.fillText(maxValue.toLocaleString(), labelTextX, this.drawArea.y + this.drawArea.height / 2);
                }

                // Draw Y-Axis Title
                if (axisConfig.displayTitle && axisConfig.title) {
                    this.ctx.save();
                    this.ctx.font = axisConfig.titleFont; // Ensure title font is set
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle'; // Consistent baseline for rotation
                    
                    // Estimate label width for title offset calculation
                    const tempLabelFont = this.ctx.font; // Save current (title) font
                    this.ctx.font = axisConfig.labelFont; // Temporarily set to label font for estimation
                    const sampleYLabelText = axisConfig.sampleLabelForWidthEstimation || (maxValue !== undefined ? maxValue.toLocaleString() : "-9,999.9");
                    const yLabelWidthEstimate = this.ctx.measureText(sampleYLabelText).width;
                    this.ctx.font = tempLabelFont; // Restore title font

                    const titleCharHeightApproximation = (this.ctx.measureText('M').width * 1.5); // Approximate height of a char for title offset
                    
                    let yTitleX;
                    if (isRightPositioned) {
                        yTitleX = axisLineX + yLabelWidthEstimate + tickLabelPadding + (titleCharHeightApproximation / 2) + 5; // Add some more padding
                        this.ctx.translate(yTitleX, this.drawArea.y + this.drawArea.height / 2);
                        this.ctx.rotate(Math.PI / 2);
                    } else { // Left positioned
                        yTitleX = axisLineX - yLabelWidthEstimate - tickLabelPadding - (titleCharHeightApproximation / 2) - 5; // Add some more padding
                        this.ctx.translate(yTitleX, this.drawArea.y + this.drawArea.height / 2);
                        this.ctx.rotate(-Math.PI / 2);
                    }
                    this.ctx.fillText(axisConfig.title, 0, 0);
                    this.ctx.restore();
                }
            });
        }

        // X-Axis (largely unchanged, but ensure it uses themed colors if oX.color not present)
        const oX = options.xAxis;
        if (oX.display && this.drawArea.width > 0) {
            this.ctx.strokeStyle = oX.color || this.activePalette.axisColor;
            this.ctx.fillStyle = oX.color || this.activePalette.axisColor;
            this.ctx.font = oX.labelFont;

            // Draw X-Axis Line
            this.ctx.beginPath();
            this.ctx.moveTo(this.drawArea.x, this.drawArea.y + this.drawArea.height);
            this.ctx.lineTo(this.drawArea.x + this.drawArea.width, this.drawArea.y + this.drawArea.height);
            this.ctx.stroke();

            // Draw X-Axis Labels and Vertical Grid Lines
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            if (data.labels && data.labels.length > 0) {
                const xLabelWidth = this.drawArea.width / data.labels.length;
                data.labels.forEach((label, i) => {
                    const xPos = this.drawArea.x + (i * xLabelWidth) + (xLabelWidth / 2);
                    this.ctx.fillText(String(label), xPos, this.drawArea.y + this.drawArea.height + 8);

                    // Vertical Grid Lines for X-Axis
                    if (oX.gridLines && i > 0) { // Don't draw for the first label (it's the Y-axis line)
                        const xPosGrid = this.drawArea.x + (i * xLabelWidth);
                        if (xPosGrid > this.drawArea.x && xPosGrid < this.drawArea.x + this.drawArea.width) {
                            this.ctx.save();
                            this.ctx.strokeStyle = options.gridColor || this.activePalette.gridColor;
                            this.ctx.lineWidth = 0.5;
                            this.ctx.beginPath();
                            this.ctx.moveTo(xPosGrid, this.drawArea.y);
                            this.ctx.lineTo(xPosGrid, this.drawArea.y + this.drawArea.height -1); // -1 to avoid overdraw on x-axis line
                            this.ctx.stroke();
                            this.ctx.restore();
                        }
                    }
                });
            }

            // Draw X-Axis Title
            if (oX.displayTitle && oX.title) {
                this.ctx.font = oX.titleFont;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'bottom'; // Place it below the labels
                 // Ensure title is placed at the very bottom of the canvas padding area
                const titleY = this.canvas.height - (options.padding.bottom || 5) + ((this.ctx.measureText('M').width * 1.5)/2); // Adjust if paddingBottom is small
                this.ctx.fillText(oX.title, this.drawArea.x + this.drawArea.width / 2, this.canvas.height - (options.padding.bottom / 2) ); // Centered at bottom padding
            }
        }
        this.ctx.restore();
    }

    _fillRoundRect(ctx, x, y, width, height, radius) {
        if (width <= 0 || height <= 0) return; // No need to draw if no size
        let tl = 0, tr = 0, br = 0, bl = 0;
        if (typeof radius === 'number') { tl = tr = br = bl = Math.max(0, radius); }
        else if (typeof radius === 'object' && radius !== null) { tl = Math.max(0, radius.tl || 0); tr = Math.max(0, radius.tr || 0); br = Math.max(0, radius.br || 0); bl = Math.max(0, radius.bl || 0); }
        // Clamp radii to half width/height
        const maxRadiusHor = width / 2; const maxRadiusVer = height / 2;
        tl = Math.min(tl, maxRadiusHor, maxRadiusVer); tr = Math.min(tr, maxRadiusHor, maxRadiusVer);
        br = Math.min(br, maxRadiusHor, maxRadiusVer); bl = Math.min(bl, maxRadiusHor, maxRadiusVer);
        if (tl <=0 && tr <= 0 && br <= 0 && bl <= 0) { ctx.fillRect(x, y, width, height); return; } // No radius, use fillRect
        ctx.beginPath(); ctx.moveTo(x + tl, y); ctx.lineTo(x + width - tr, y); if (tr > 0) ctx.arcTo(x + width, y, x + width, y + tr, tr);
        ctx.lineTo(x + width, y + height - br); if (br > 0) ctx.arcTo(x + width, y + height, x + width - br, y + height, br);
        ctx.lineTo(x + bl, y + height); if (bl > 0) ctx.arcTo(x, y + height, x, y + height - bl, bl);
        ctx.lineTo(x, y + tl); if (tl > 0) ctx.arcTo(x, y, x + tl, y, tl);
        ctx.closePath(); ctx.fill();
    }

    _strokeRoundRect(ctx, x, y, width, height, radius, lineWidth = 1) {
        if (width <= 0 || height <= 0 || lineWidth <= 0) return;
        let tl = 0, tr = 0, br = 0, bl = 0;
        if (typeof radius === 'number') { tl = tr = br = bl = Math.max(0, radius); }
        else if (typeof radius === 'object' && radius !== null) { tl = Math.max(0, radius.tl||0); tr = Math.max(0, radius.tr||0); br = Math.max(0, radius.br||0); bl = Math.max(0, radius.bl||0); }
        const maxRadiusHor = width / 2; const maxRadiusVer = height / 2;
        tl = Math.min(tl, maxRadiusHor, maxRadiusVer); tr = Math.min(tr, maxRadiusHor, maxRadiusVer);
        br = Math.min(br, maxRadiusHor, maxRadiusVer); bl = Math.min(bl, maxRadiusHor, maxRadiusVer);
        if (tl <=0 && tr <= 0 && br <= 0 && bl <= 0) { ctx.strokeRect(x, y, width, height); return; }
        ctx.beginPath(); ctx.moveTo(x + tl, y); ctx.lineTo(x + width - tr, y); if (tr > 0) ctx.arcTo(x + width, y, x + width, y + tr, tr);
        ctx.lineTo(x + width, y + height - br); if (br > 0) ctx.arcTo(x + width, y + height, x + width - br, y + height, br);
        ctx.lineTo(x + bl, y + height); if (bl > 0) ctx.arcTo(x, y + height, x, y + height - bl, bl);
        ctx.lineTo(x, y + tl); if (tl > 0) ctx.arcTo(x, y, x + tl, y, tl);
        ctx.closePath(); ctx.stroke();
    }

    _drawPercentageBarChart() { // MODIFIED METHOD FOR NEW STYLE
        if (!this.config.data || !Array.isArray(this.config.data.items)) {
            console.error("PureChart Error (_drawPercentageBarChart): data.items is missing or not an array.");
            this.ctx.font = '12px Arial'; this.ctx.fillStyle = 'red'; this.ctx.textAlign = 'center';
            this.ctx.fillText("Error: Invalid data for percentage chart.", this.canvas.width / 2, this.canvas.height / 2); // Translated
            return;
        }

        const { items: originalItems } = this.config.data;
        const options = this.config.options.percentageDistribution;
        const drawArea = this.drawArea;

        let itemsToDraw = [...originalItems]; // Clone for sorting
        const totalValue = itemsToDraw.reduce((sum, item) => sum + ((typeof item.value === 'number' && !isNaN(item.value)) ? item.value : 0), 0);
        
        itemsToDraw.forEach(item => { // Calculate percentage for each item
            const value = (typeof item.value === 'number' && !isNaN(item.value)) ? item.value : 0;
            item.percentage = (totalValue === 0) ? 0 : (value / totalValue) * 100;
        });

        if (options.sort === 'ascending') itemsToDraw.sort((a, b) => a.value - b.value);
        else if (options.sort === 'descending') itemsToDraw.sort((a, b) => b.value - a.value);

        const plotAreaX = drawArea.x;
        const plotAreaWidth = drawArea.width;

        if (plotAreaWidth <= 0) { // Check if there's space to draw
            console.warn(`PureChart Warning: Not enough width for percentage bar drawing area. PlotAreaWidth: ${plotAreaWidth}`);
            this.ctx.font = '12px Arial'; this.ctx.fillStyle = 'orange'; this.ctx.textAlign = 'center';
            this.ctx.fillText("Not enough space for bars.", this.canvas.width / 2, this.canvas.height / 2); // Translated
            return;
        }
        
        let currentY = drawArea.y + (options.barSpacing / 2); // Start Y position

        itemsToDraw.forEach((item, index) => {
            if (currentY + options.barHeight > drawArea.y + drawArea.height + options.barSpacing) return; // Stop if not enough vertical space

            const baseColorStr = this._getAutoColor(index, itemsToDraw.length);
            const filledBarLength = Math.max(0, (item.percentage / 100) * plotAreaWidth); // Ensure non-negative
            const barTextY = currentY + options.barHeight / 2; // Y for text centering

            const fillLightenPercent = options.fillLightenPercent;
            const effectiveBorderWidth = options.borderWidth !== undefined ? options.borderWidth : 1;

            if (fillLightenPercent !== undefined && fillLightenPercent > 0 && typeof fillLightenPercent === 'number') {
                // NEW STYLE: Base color for border, lightened fill, over the percentage length
                const borderColorStr = baseColorStr;
                const fillColorStr = this._lightenColor(baseColorStr, fillLightenPercent);

                if (filledBarLength > 0) {
                    // 1. Draw the lightened fill
                    this.ctx.fillStyle = this._resolveColor(fillColorStr, { x: plotAreaX, y: currentY, w: filledBarLength, h: options.barHeight });
                    this._fillRoundRect(this.ctx, plotAreaX, currentY, filledBarLength, options.barHeight, options.barBorderRadius);
                    
                    // 2. Draw the border (with base color) AROUND the filled part
                    if (effectiveBorderWidth > 0) {
                        this.ctx.strokeStyle = this._resolveColor(borderColorStr, { x: plotAreaX, y: currentY, w: filledBarLength, h: options.barHeight });
                        this.ctx.lineWidth = effectiveBorderWidth;
                        this._strokeRoundRect(this.ctx, plotAreaX, currentY, filledBarLength, options.barHeight, options.barBorderRadius, effectiveBorderWidth);
                    }
                }
            } else {
                // ORIGINAL BEHAVIOR (v0.9.2): Fill with base color, optional darkened border
                const fillColorStr = baseColorStr;
                this.ctx.fillStyle = this._resolveColor(fillColorStr, { x: plotAreaX, y: currentY, w: filledBarLength, h: options.barHeight });
                this._fillRoundRect(this.ctx, plotAreaX, currentY, filledBarLength, options.barHeight, options.barBorderRadius);

                if (effectiveBorderWidth > 0) {
                    let effectiveBorderColor = options.borderColor;
                    if (effectiveBorderColor === undefined) { // Auto-darken if no specific border color
                        const resolvedFillColor = this._resolveColor(fillColorStr, { x: plotAreaX, y: currentY, w: filledBarLength, h: options.barHeight });
                        if (typeof resolvedFillColor === 'string') { // Can only darken if it's a solid color string
                            effectiveBorderColor = this._darkenColor(resolvedFillColor, options.borderDarkenPercent !== undefined ? options.borderDarkenPercent : 20);
                        } else {
                            effectiveBorderColor = '#333333'; // Fallback for gradients/functions
                        }
                    }
                    if (effectiveBorderColor && effectiveBorderColor !== 'transparent') { // Draw border if color is valid
                        this.ctx.strokeStyle = effectiveBorderColor;
                        this.ctx.lineWidth = effectiveBorderWidth;
                        this._strokeRoundRect(this.ctx, plotAreaX, currentY, filledBarLength, options.barHeight, options.barBorderRadius, effectiveBorderWidth);
                    }
                }
            }
            
            // Draw labels and values
            if (options.labelPosition === 'left') {
                this.ctx.font = options.labelFont; this.ctx.fillStyle = options.labelColor;
                this.ctx.textAlign = 'right'; this.ctx.textBaseline = 'middle';
                this.ctx.fillText(item.label, plotAreaX - 10, barTextY, options.maxLabelWidth || undefined);
            }
            if (options.labelPosition === 'insideStart') {
                this.ctx.font = options.labelFont; this.ctx.fillStyle = options.labelColor;
                this.ctx.textAlign = 'left'; this.ctx.textBaseline = 'middle';
                if (this.ctx.measureText(item.label).width + 10 < filledBarLength) { // Check if text fits
                    this.ctx.fillText(item.label, plotAreaX + 5 + (options.barBorderRadius / 2 || 0), barTextY);
                }
            }
            if (options.showValueText) {
                this.ctx.font = options.valueFont; this.ctx.fillStyle = options.valueColor;
                this.ctx.textBaseline = 'middle';
                const percentageText = `${item.percentage.toFixed(1)}%`;
                if (options.valuePosition === 'right') {
                    this.ctx.textAlign = 'left';
                    this.ctx.fillText(percentageText, plotAreaX + filledBarLength + (options.valueTextMargin || 0), barTextY);
                } else if (options.valuePosition === 'insideEnd') {
                    this.ctx.textAlign = 'right';
                    if (this.ctx.measureText(percentageText).width + 10 < filledBarLength) { // Check if text fits
                        this.ctx.fillText(percentageText, plotAreaX + filledBarLength - 5 - (options.barBorderRadius / 2 || 0), barTextY);
                    }
                }
            }
            const barRectForTooltip = { x: plotAreaX, y: currentY, w: filledBarLength, h: options.barHeight };
            this.interactiveElements.push({ type: 'percentageDistribution', rect: barRectForTooltip, item: { ...item }, index: index });
            currentY += options.barHeight + options.barSpacing;
        });
    }

    _getBarRect(value, barIndex, groupIndex, numInGroup, groupDrawableWidth, yAxisScaleInfo) {
        const options = this.config.options.bar;
        const totalItemSpacingFactor = options.itemSpacingFactor * (numInGroup > 1 ? numInGroup - 1 : 0);
        const barActualWidth = (groupDrawableWidth * (1 - totalItemSpacingFactor)) / numInGroup;
        const xInGroup = barIndex * (barActualWidth + barActualWidth * options.itemSpacingFactor); // Position within the group
        const val = parseFloat(value) || 0; // Ensure numeric value

        // Calculate Y position and height based on the specific Y-axis scale
        const scaleMin = yAxisScaleInfo.min || 0;
        const scale = yAxisScaleInfo.scale || 1;

        const zeroLevelY = this.drawArea.y + this.drawArea.height - ((0 - scaleMin) * scale);
        let barHeight = Math.abs(val * scale);
        let y;

        if (val >= 0) {
            y = zeroLevelY - barHeight;
        } else {
            y = zeroLevelY;
        }

        // Clamp to drawing area
        if (y < this.drawArea.y) {
            barHeight -= (this.drawArea.y - y);
            y = this.drawArea.y;
        }
        if (y + barHeight > this.drawArea.y + this.drawArea.height) {
            barHeight = (this.drawArea.y + this.drawArea.height) - y;
        }
        if (barHeight < 0) barHeight = 0; // Ensure non-negative height

        return { x: xInGroup, y, w: barActualWidth > 0 ? barActualWidth : 0, h: barHeight };
    }

    _drawBarChart() {
        const { data, options: chartOptions, type: globalType } = this.config;
        if (!data.labels || data.labels.length === 0 || !data.datasets || data.datasets.length === 0) {
            // console.warn("PureChart _drawBarChart: Missing labels or datasets."); // This can be noisy if only line charts are present
            return;
        }

        const barDatasets = data.datasets.filter(ds => {
            const datasetType = ds.type || globalType;
            return !ds._hidden && datasetType === 'bar';
        });

        if (barDatasets.length === 0) {
            return; // No visible bar datasets to draw
        }

        const numLabels = data.labels.length;
        const numBarDatasets = barDatasets.length;
        
        const groupTotalWidth = this.drawArea.width / numLabels; // Width per label group
        const actualGroupSpacing = groupTotalWidth * chartOptions.bar.groupSpacingFactor; // Space between groups
        const groupDrawableWidth = groupTotalWidth - actualGroupSpacing; // Actual width for bars in a group
        
        if (groupDrawableWidth <= 0 && numBarDatasets > 0) {
             console.warn("PureChart: Not enough width for bar groups."); return; 
        }

        data.labels.forEach((labelX, i) => { // For each label on X-axis
            const groupCanvasXStart = this.drawArea.x + (i * groupTotalWidth) + (actualGroupSpacing / 2); // Start X for this group
            barDatasets.forEach((dataset, j) => { // For each VISIBLE BAR dataset
                const yAxisID = dataset.yAxisID || (chartOptions.yAxes && chartOptions.yAxes.length > 0 ? chartOptions.yAxes[0].id : null);
                if (!yAxisID) {
                    console.warn(`PureChart _drawBarChart: Dataset '${dataset.label}' has no yAxisID.`);
                    return; // Skip this dataset
                }

                const yAxisScaleInfo = this.yAxisScales[yAxisID];
                // Part 2: Decouple Data Series Drawing from Axis Visual display Property
                if (!yAxisScaleInfo || !yAxisScaleInfo.scale || yAxisScaleInfo.scale <= 0 || !isFinite(yAxisScaleInfo.scale)) {
                    console.warn(`PureChart _drawBarChart: Invalid Y-axis scale for dataset '${dataset.label}' on yAxisID '${yAxisID}'. Skipping bar.`);
                    return; // Skip drawing this bar if its Y-axis scale is invalid
                }

                // 'j' is the index within barDatasets, used for positioning bars within the group.
                const originalDatasetIndex = data.datasets.indexOf(dataset); // Get original index for tooltips etc.

                const value = (dataset.values && dataset.values.length > i && typeof dataset.values[i] === 'number' && !isNaN(dataset.values[i])) ? dataset.values[i] : 0;
                const rectInGroup = this._getBarRect(value, j, i, numBarDatasets, groupDrawableWidth, yAxisScaleInfo);
                if (rectInGroup.w <= 0) return; // Skip if bar has no width
                const finalBarX = groupCanvasXStart + rectInGroup.x;
                const barRect = { x: finalBarX, y: rectInGroup.y, w: rectInGroup.w, h: rectInGroup.h };
                
                // Use themed default dataset color if dataset.backgroundColor is not provided
                const defaultBgColor = this.activePalette.defaultDatasetColors[originalDatasetIndex % this.activePalette.defaultDatasetColors.length];
                const backgroundColorOption = dataset.backgroundColor || defaultBgColor;
                const backgroundColor = this._resolveColor(backgroundColorOption, barRect);
                this.ctx.fillStyle = backgroundColor;

                let borderWidth = dataset.borderWidth;
                if (borderWidth === undefined) borderWidth = chartOptions.bar.defaultBorderWidth !== undefined ? chartOptions.bar.defaultBorderWidth : 1;
                
                let borderColor = dataset.borderColor;
                if (!borderColor && borderWidth > 0) { 
                    if (typeof backgroundColor === 'string') { // Can only darken if it's a solid color string
                        borderColor = this._darkenColor(backgroundColor, chartOptions.bar.borderDarkenPercent !== undefined ? chartOptions.bar.borderDarkenPercent : 20);
                    } else { // Fallback for gradients or complex fill functions
                        borderColor = this.activePalette.axisColor; // Use a theme color as fallback for gradient borders
                    }
                }
                this.ctx.strokeStyle = borderColor || 'transparent'; 
                this.ctx.lineWidth = borderWidth;

                if (barRect.h > 0) { // Only draw if height is positive
                    this.ctx.fillRect(barRect.x, barRect.y, barRect.w, barRect.h);
                    if (borderWidth > 0 && this.ctx.strokeStyle !== 'transparent') this.ctx.strokeRect(barRect.x, barRect.y, barRect.w, barRect.h);
                }
                this.interactiveElements.push({ type: 'bar', rect: barRect, xLabel: labelX, dataset: dataset, value: value, datasetIndex: originalDatasetIndex, pointIndex: i });
            });
        });
    }

    _getControlPointsForSegment(p0, p1, p2, p3, tensionFactor) {
        tensionFactor = (typeof tensionFactor === 'number' && isFinite(tensionFactor)) ? tensionFactor : 0;
        // Catmull-Rom to Bezier control points calculation (simplified)
        const t1x = (p2.x - p0.x) * tensionFactor; const t1y = (p2.y - p0.y) * tensionFactor;
        const t2x = (p3.x - p1.x) * tensionFactor; const t2y = (p3.y - p1.y) * tensionFactor;
        return { cp1: { x: p1.x + t1x, y: p1.y + t1y }, cp2: { x: p2.x - t2x, y: p2.y - t2y } };
    }

    _drawLineChart() {
        const { data: d, options: o, type: globalType } = this.config; const lO = o.line;
        if (!d.datasets || d.datasets.length === 0) {
            // console.warn("PureChart _drawLineChart: Missing datasets."); // Can be noisy if only bar charts
            return;
        }

        d.datasets.forEach((ds, originalDsIndex) => { // For each dataset, get original index
            const datasetType = ds.type || globalType;
            // Draw if it's a line OR an SMA (SMAs are drawn as lines)
            if (ds._hidden || (datasetType !== 'line' && datasetType !== 'sma')) {
                return; // Skip hidden datasets or non-line/non-SMA datasets
            }
            
            if (!ds.values || !Array.isArray(ds.values) || ds.values.length < 1) return; // Skip if no values
            this.ctx.save();
            const yAxisID = ds.yAxisID || (o.yAxes && o.yAxes.length > 0 ? o.yAxes[0].id : null);
            if (!yAxisID) {
                console.warn(`PureChart _drawLineChart: Dataset '${ds.label}' has no yAxisID.`);
                this.ctx.restore(); return;
            }

            const yAxisScaleInfo = this.yAxisScales[yAxisID];
            // Part 2: Decouple Data Series Drawing from Axis Visual display Property
            if (!yAxisScaleInfo || !yAxisScaleInfo.scale || yAxisScaleInfo.scale <= 0 || !isFinite(yAxisScaleInfo.scale)) {
                console.warn(`PureChart _drawLineChart: Invalid Y-axis scale for dataset '${ds.label}' on yAxisID '${yAxisID}'. Skipping line.`);
                this.ctx.restore(); return;
            }
            
            // Map values to X/Y points
            const pts = ds.values.map((v, i) => {
                const p = this._getPointPosition(v, i, yAxisScaleInfo);
                // Add point to interactive elements for tooltip, using originalDsIndex
                this.interactiveElements.push({ type: 'point', pos: p, radius: ds.pointRadius !== undefined ? ds.pointRadius : (lO.pointRadius !== undefined ? lO.pointRadius : 3), xLabel: d.labels ? (d.labels[i] !== undefined ? String(d.labels[i]) : `Index ${i}`) : `Index ${i}`, dataset: ds, value: v, datasetIndex: originalDsIndex, pointIndex: i }); // Translated "Index"
                return p;
            });

            if (pts.length === 0) { this.ctx.restore(); return; } // No points to draw
            const userTension = ds.tension !== undefined ? ds.tension : lO.tension; // Line tension
            const effectiveLineWidth = ds.lineWidth !== undefined ? ds.lineWidth : lO.lineWidth;
            const bezierTensionFactor = 0.2; // Factor for Catmull-Rom to Bezier conversion
            
            // Draw filled area under line if enabled
            if (ds.fill && pts.length > 1) {
                this.ctx.beginPath();
                const baselineY = this.drawArea.y + this.drawArea.height - ((0 - (yAxisScaleInfo.min || 0)) * (yAxisScaleInfo.scale || 1));
                const clampedBaselineY = Math.max(this.drawArea.y, Math.min(this.drawArea.y + this.drawArea.height, baselineY)); // Clamp to draw area
                this.ctx.moveTo(pts[0].x, clampedBaselineY); this.ctx.lineTo(pts[0].x, pts[0].y);
                if (userTension > 0) { for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i === 0 ? 0 : i - 1]; const p1 = pts[i]; const p2 = pts[i + 1]; const p3 = pts[(i + 2 < pts.length) ? i + 2 : i + 1]; const { cp1, cp2 } = this._getControlPointsForSegment(p0, p1, p2, p3, bezierTensionFactor * userTension); this.ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y); } }
                else { for (let i = 1; i < pts.length; i++) { this.ctx.lineTo(pts[i].x, pts[i].y); } } // Straight lines
                this.ctx.lineTo(pts[pts.length - 1].x, clampedBaselineY); this.ctx.closePath();
                const fillRectPtsY = pts.map(p => p.y).concat([clampedBaselineY]);
                const fillRect = { x: this.drawArea.x, y: Math.min(...fillRectPtsY), w: this.drawArea.width, h: Math.abs(Math.max(...fillRectPtsY) - Math.min(...fillRectPtsY)) };
                // Use themed default dataset color if ds.backgroundColor is not provided for fill
                const defaultFillColor = this.activePalette.defaultDatasetColors[originalDsIndex % this.activePalette.defaultDatasetColors.length];
                const fillBgColorOption = ds.backgroundColor || defaultFillColor;
                this.ctx.fillStyle = this._resolveColor(fillBgColorOption, fillRect); 
                this.ctx.fill();
            }
            // Draw the line itself
            if (effectiveLineWidth > 0 && pts.length > 0) {
                this.ctx.beginPath(); this.ctx.moveTo(pts[0].x, pts[0].y);
                if (userTension > 0 && pts.length > 1) { for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i === 0 ? 0 : i - 1]; const p1 = pts[i]; const p2 = pts[i + 1]; const p3 = pts[(i + 2 < pts.length) ? i + 2 : i + 1]; const { cp1, cp2 } = this._getControlPointsForSegment(p0, p1, p2, p3, bezierTensionFactor * userTension); this.ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y); } }
                else if (pts.length > 1) { for (let i = 1; i < pts.length; i++) { this.ctx.lineTo(pts[i].x, pts[i].y); } } // Straight lines
                
                // Use themed default dataset color if ds.borderColor is not provided
                const defaultBorderColor = this.activePalette.defaultDatasetColors[originalDsIndex % this.activePalette.defaultDatasetColors.length];
                const borderColorOption = ds.borderColor || defaultBorderColor;
                this.ctx.strokeStyle = this._resolveColor(borderColorOption, this.drawArea); 
                this.ctx.lineWidth = effectiveLineWidth;

                let lineDashSet = false;
                if (ds.borderDash && Array.isArray(ds.borderDash) && ds.borderDash.length > 0) {
                    this.ctx.setLineDash(ds.borderDash);
                    lineDashSet = true;
                }
                
                this.ctx.stroke();

                if (lineDashSet) {
                    this.ctx.setLineDash([]); // Reset to solid line
                }
            }
            // Draw points on the line
            const pointRadiusToDraw = ds.pointRadius !== undefined ? ds.pointRadius : (lO.pointRadius !== undefined ? lO.pointRadius : 3);
            if (pointRadiusToDraw > 0 && pts.length > 0) {
                pts.forEach((p) => {
                    const pointRect = { x: p.x - pointRadiusToDraw, y: p.y - pointRadiusToDraw, w: pointRadiusToDraw * 2, h: pointRadiusToDraw * 2 };
                    
                    // Determine point fill color, using theme default if necessary
                    let pointFillColorOption = ds.pointColor;
                    if (pointFillColorOption === undefined) {
                        if (ds.fill && ds.backgroundColor) { // If area is filled, point usually matches border
                            pointFillColorOption = ds.borderColor || this.activePalette.defaultDatasetColors[originalDsIndex % this.activePalette.defaultDatasetColors.length];
                        } else { // Otherwise, point matches line/dataset color
                            pointFillColorOption = ds.backgroundColor || ds.borderColor || this.activePalette.defaultDatasetColors[originalDsIndex % this.activePalette.defaultDatasetColors.length];
                        }
                    }
                    this.ctx.fillStyle = this._resolveColor(pointFillColorOption, pointRect); 
                    
                    this.ctx.beginPath();
                    const currentPointStyle = ds.pointStyle || lO.pointStyle || 'circle';
                    if (currentPointStyle === 'square') { this.ctx.rect(pointRect.x, pointRect.y, pointRect.w, pointRect.h); }
                    else { this.ctx.arc(p.x, p.y, pointRadiusToDraw, 0, Math.PI * 2); } // Default to circle
                    this.ctx.fill();

                    const pointBorderWidthToDraw = ds.pointBorderWidth !== undefined ? ds.pointBorderWidth : 1; 
                    if (ds.pointBorderColor && pointBorderWidthToDraw > 0) { 
                        this.ctx.strokeStyle = this._resolveColor(ds.pointBorderColor, pointRect); 
                        this.ctx.lineWidth = pointBorderWidthToDraw; 
                        this.ctx.stroke(); 
                    }
                });
            }
            this.ctx.restore();
        });
    }

    _getPointPosition(value, index, yAxisScaleInfo) {
        const numLabels = this.config.data.labels ? this.config.data.labels.length : 0;
        if (numLabels === 0 || this.drawArea.width === 0) { 
            return { x: this.drawArea.x + this.drawArea.width / 2, y: this.drawArea.y + this.drawArea.height / 2 }; // Fallback
        }
        const xSpacing = (numLabels > 1) ? this.drawArea.width / (numLabels - 1) : this.drawArea.width / 2; // Avoid div by zero for single label
        const x = this.drawArea.x + (index * xSpacing);
        const yValue = parseFloat(value);

        if (isNaN(yValue)) {
            return { x: x, y: this.drawArea.y + this.drawArea.height / 2 }; // Center Y if value is not number
        }

        const scaleMin = yAxisScaleInfo.min || 0;
        const scale = yAxisScaleInfo.scale || 1;
        let y = this.drawArea.y + this.drawArea.height - ((yValue - scaleMin) * scale);

        if (!isFinite(y)) {
            y = this.drawArea.y + this.drawArea.height / 2; // Fallback for non-finite Y
        }
        // Clamp Y to drawing area
        y = Math.max(this.drawArea.y, Math.min(y, this.drawArea.y + this.drawArea.height));
        return { x, y };
    }

    _getMousePos(event) {
        const rect = this.canvas.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    _onMouseMove(event) {
        if (!this.tooltipElement || !this.config.options.tooltip.enabled || !this.interactiveElements) return;
        const mousePos = this._getMousePos(event); const canvasRect = this.canvas.getBoundingClientRect(); 
        let bestMatch = null; let minDistanceSq = Infinity; 
        // Find the closest interactive element
        for (let i = this.interactiveElements.length - 1; i >= 0; i--) { // Iterate backwards for potentially overlapping elements
            const el = this.interactiveElements[i]; let isHovered = false;
            if (el.type === 'point' && el.pos) { // For line chart points
                const radius = el.radius !== undefined ? el.radius : (this.config.options.line.pointRadius !== undefined ? this.config.options.line.pointRadius : 3);
                const hoverRadius = radius + 3; // Larger hover area
                const dx = mousePos.x - el.pos.x; const dy = mousePos.y - el.pos.y; const distanceSq = dx * dx + dy * dy;
                if (distanceSq <= hoverRadius * hoverRadius) { if (distanceSq < minDistanceSq) { minDistanceSq = distanceSq; bestMatch = el; } isHovered = true; }
            } else if ((el.type === 'bar' || el.type === 'percentageDistribution') && el.rect) { // For bars
                if (mousePos.x >= el.rect.x && mousePos.x <= el.rect.x + el.rect.w && mousePos.y >= el.rect.y && mousePos.y <= el.rect.y + el.rect.h) { bestMatch = el; break; } // Bar hit, no need to check further for this event
            }
        }
        if (bestMatch) {
            let tooltipContentParams; 
            let anchorX, anchorY; // Anchor for tooltip position
            let yAxisScaleInfo = null; // Initialize for potential use

            // For points and bars, try to get their Y-axis scale information
            if (bestMatch.dataset && bestMatch.dataset.yAxisID && this.yAxisScales) {
                yAxisScaleInfo = this.yAxisScales[bestMatch.dataset.yAxisID] || null;
            }

            if (bestMatch.type === 'point') { 
                anchorX = bestMatch.pos.x + canvasRect.left; 
                anchorY = bestMatch.pos.y + canvasRect.top; 
                tooltipContentParams = { 
                    type: 'point', 
                    xLabel: bestMatch.xLabel, 
                    datasets: [{ dataset: bestMatch.dataset, value: bestMatch.value }], 
                    yAxisScaleInfo: yAxisScaleInfo,
                    themePalette: this.activePalette 
                }; 
            } else if (bestMatch.type === 'bar') { 
                anchorX = bestMatch.rect.x + bestMatch.rect.w / 2 + canvasRect.left; 
                anchorY = bestMatch.rect.y + canvasRect.top; 
                // For grouped bars, find all datasets at this xLabel
                const groupedDatasets = this.interactiveElements
                    .filter(elem => elem.type === 'bar' && elem.xLabel === bestMatch.xLabel && elem.pointIndex === bestMatch.pointIndex)
                    .map(elem => ({ dataset: elem.dataset, value: elem.value }))
                    .sort((a,b) => (this.config.data.datasets.indexOf(a.dataset) - this.config.data.datasets.indexOf(b.dataset))); // Ensure original dataset order
                
                tooltipContentParams = { 
                    type: 'bar', 
                    xLabel: bestMatch.xLabel, 
                    datasets: groupedDatasets.length > 0 ? groupedDatasets : [{ dataset: bestMatch.dataset, value: bestMatch.value }],
                    yAxisScaleInfo: yAxisScaleInfo, // yAxisScaleInfo of the primarily hovered bar
                    themePalette: this.activePalette
                };
            } else if (bestMatch.type === 'percentageDistribution') { 
                anchorX = bestMatch.rect.x + bestMatch.rect.w / 2 + canvasRect.left; 
                anchorY = bestMatch.rect.y + bestMatch.rect.h / 2 + canvasRect.top; 
                tooltipContentParams = { 
                    type: 'percentageDistribution', 
                    item: bestMatch.item,
                    themePalette: this.activePalette // Provide palette to formatter
                }; 
            }
            
            if (tooltipContentParams) { 
                tooltipContentParams.anchorX = anchorX; tooltipContentParams.anchorY = anchorY; // Pass anchor to formatter if needed
                const currentHoverSignature = JSON.stringify(tooltipContentParams); // To check if hover target changed
                if (!this.activeTooltipData || this.activeTooltipData.signature !== currentHoverSignature) { 
                    this.activeTooltipData = { signature: currentHoverSignature, data: tooltipContentParams }; 
                    this._showTooltip(tooltipContentParams); 
                }
                else { this._positionTooltip(anchorX, anchorY); } // Just reposition if same target
                this.canvas.style.cursor = 'pointer';
            } else { this._onMouseOut(); }
        } else { this._onMouseOut(); }
    }

    _showTooltip(tooltipData) {
        if (!this.tooltipElement || !this.config.options.tooltip.enabled) return;
        
        // Ensure the activePalette is available to the formatter if it needs it
        // One way is to pass it as part of tooltipData if the formatter is designed to use it.
        // Or, the formatter could be a class method and access this.activePalette directly.
        // For now, assume formatter is self-contained or gets palette via tooltipData.
        this.tooltipElement.innerHTML = this.config.options.tooltip.formatter(tooltipData);
        this.tooltipElement.style.visibility = 'visible';
        this._positionTooltip(tooltipData.anchorX, tooltipData.anchorY); 
    }

    _positionTooltip(anchorPageX, anchorPageY) { // anchorPageX/Y are viewport-relative
        if (!this.tooltipElement || this.tooltipElement.style.visibility === 'hidden') return;
        
        // Apply themed tooltip styles (already done in _createTooltipElement)
        this.tooltipElement.style.backgroundColor = this.activePalette.tooltipBgColor;
        this.tooltipElement.style.color = this.activePalette.tooltipColor;

        const tooltipRect = this.tooltipElement.getBoundingClientRect(); 
        const tooltipWidth = tooltipRect.width; 
        const tooltipHeight = tooltipRect.height; 
        const offset = this.config.options.tooltip.offset || 10;
        
        const winScrollX = window.scrollX || window.pageXOffset;
        const winScrollY = window.scrollY || window.pageYOffset;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Initial calculation for document-relative position:
        // Start with viewport-relative anchor, add scroll offset, then adjust for tooltip size.
        let docLeft = anchorPageX + winScrollX - (tooltipWidth / 2);
        let docTop = anchorPageY + winScrollY - tooltipHeight - offset; // Default: above anchor

        // Check and adjust vertical position to stay within viewport
        // Is the top of the tooltip going off the top of the viewport?
        if ((docTop - winScrollY) < 5) { 
            // Yes, try positioning below the anchor instead
            docTop = anchorPageY + winScrollY + offset;
        }
        // Is the bottom of the tooltip going off the bottom of the viewport?
        if ((docTop - winScrollY + tooltipHeight) > (viewportHeight - 5) ) {
            // Yes, try to reposition above if it was initially below, or clamp
            let tempTopAbove = anchorPageY + winScrollY - tooltipHeight - offset;
            if ((tempTopAbove - winScrollY) >= 5) { // If placing above fits
                docTop = tempTopAbove;
            } else { // If placing above also doesn't fit, clamp to viewport bottom
                docTop = winScrollY + viewportHeight - tooltipHeight - 5;
                 // Final clamp to prevent going off top if viewport is too small for tooltip
                if (docTop - winScrollY < 5) docTop = winScrollY + 5;
            }
        }
        
        // Check and adjust horizontal position to stay within viewport
        // Is the left of the tooltip going off the left of the viewport?
        if ((docLeft - winScrollX) < 5) {
            docLeft = winScrollX + 5;
        }
        // Is the right of the tooltip going off the right of the viewport?
        if ((docLeft - winScrollX + tooltipWidth) > (viewportWidth - 5)) {
            docLeft = winScrollX + viewportWidth - tooltipWidth - 5;
        }
        // Final clamp for very wide tooltips
        if ((docLeft - winScrollX) < 5) docLeft = winScrollX + 5;


        this.tooltipElement.style.left = `${docLeft}px`;
        this.tooltipElement.style.top = `${docTop}px`;
    }

    _onMouseOut() {
        if (this.tooltipElement && this.config.options.tooltip.enabled) { this.tooltipElement.style.visibility = 'hidden'; }
        this.activeTooltipData = null; // Clear active tooltip data
        if (this.canvas) { this.canvas.style.cursor = 'default'; } // Reset cursor
    }

    _drawAnnotations() {
        const allAnnotations = this.config.options.annotations;

        if (!allAnnotations || !Array.isArray(allAnnotations) || allAnnotations.length === 0 ||
            !this.config.options.yAxes || this.config.options.yAxes.length === 0 || 
            !this.yAxisScales || Object.keys(this.yAxisScales).length === 0) {
            return;
        }

        const defaultYAxisId = this.config.options.yAxes[0].id;
        this.ctx.save(); // Save context for all annotations

        allAnnotations.forEach(annotation => {
            if (annotation.type !== 'line' || annotation.mode !== 'horizontal') {
                return; // Skip non-horizontal line annotations
            }

            const targetYAxisId = annotation.yAxisID || defaultYAxisId;
            const currentAxisScale = this.yAxisScales[targetYAxisId];

            if (!currentAxisScale || !currentAxisScale.scale || currentAxisScale.scale <= 0 || !isFinite(currentAxisScale.scale) ||
                !currentAxisScale.axisConfig || !currentAxisScale.axisConfig.display) {
                // console.warn(`PureChart Annotation: Skipping annotation for Y-axis ID '${targetYAxisId}' due to invalid/hidden target Y-axis or scale.`, annotation);
                return; // Skip this annotation
            }
            
            const { min: axisMin, max: axisMax, scale: axisScale } = currentAxisScale;

            let y = null;
            if (annotation.value !== undefined) {
                y = this.drawArea.y + this.drawArea.height - ((annotation.value - axisMin) * axisScale);
            } else if (annotation.percentage !== undefined && typeof annotation.percentage === 'number') {
                const yRange = axisMax - axisMin;
                let yValueForPercentage;
                if (yRange === 0) { // Handle case where axis min and max are the same
                    yValueForPercentage = axisMin; // Plot at the single value of the axis
                } else {
                    yValueForPercentage = axisMin + (annotation.percentage / 100) * yRange;
                }
                y = this.drawArea.y + this.drawArea.height - ((yValueForPercentage - axisMin) * axisScale);
            }

            if (y === null || isNaN(y) || !isFinite(y)) {
                console.warn(`PureChart Annotation: Could not determine Y position for annotation on Y-axis ID '${targetYAxisId}'.`, annotation);
                return;
            }

            y = Math.max(this.drawArea.y, Math.min(y, this.drawArea.y + this.drawArea.height)); // Clamp to draw area

            // Draw the line
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.moveTo(this.drawArea.x, y);
            this.ctx.lineTo(this.drawArea.x + this.drawArea.width, y);
            // Use themed gridColor as a fallback if annotation.borderColor is not provided
            this.ctx.strokeStyle = annotation.borderColor || this.activePalette.gridColor;
            this.ctx.lineWidth = annotation.borderWidth || 1;

            let lineDashSet = false;
            if (annotation.borderDash && Array.isArray(annotation.borderDash) && annotation.borderDash.length > 0) {
                this.ctx.setLineDash(annotation.borderDash);
                lineDashSet = true;
            }
            this.ctx.stroke();
            if (lineDashSet) {
                this.ctx.setLineDash([]);
            }
            this.ctx.restore();

            // Draw the label
            if (annotation.label && annotation.label.text) {
                this.ctx.save();
                const labelOptions = annotation.label;
                const defaultFont = this.config.options.font || '10px Arial';
                this.ctx.font = labelOptions.font || defaultFont;
                
                // Themed label color: specific annotation color -> axis color -> palette axis color
                const labelColor = labelOptions.color || currentAxisScale.axisConfig.color || this.activePalette.axisColor;
                this.ctx.fillStyle = labelColor;

                let labelX, labelY;
                let textAlign = 'right';
                let textBaseline = 'bottom';
                
                const rawPadding = labelOptions.padding === undefined ? 2 : labelOptions.padding;
                const padding = {
                    x: typeof rawPadding === 'object' ? (rawPadding.x || 0) : rawPadding,
                    y: typeof rawPadding === 'object' ? (rawPadding.y || 0) : rawPadding
                };

                const position = labelOptions.position || 'right';

                switch (position) {
                    case 'left':
                        textAlign = 'left';
                        textBaseline = 'bottom';
                        labelX = this.drawArea.x + padding.x;
                        labelY = y - padding.y;
                        break;
                    case 'top-left':
                        textAlign = 'left';
                        textBaseline = 'bottom'; // Text drawn above the line, baseline at bottom of text
                        labelX = this.drawArea.x + padding.x;
                        labelY = y - padding.y; 
                        break;
                    case 'bottom-left':
                        textAlign = 'left';
                        textBaseline = 'top'; // Text drawn below the line, baseline at top of text
                        labelX = this.drawArea.x + padding.x;
                        labelY = y + padding.y;
                        break;
                    case 'top-right':
                        textAlign = 'right';
                        textBaseline = 'bottom'; // Text drawn above the line
                        labelX = this.drawArea.x + this.drawArea.width - padding.x;
                        labelY = y - padding.y;
                        break;
                    case 'bottom-right':
                        textAlign = 'right';
                        textBaseline = 'top'; // Text drawn below the line
                        labelX = this.drawArea.x + this.drawArea.width - padding.x;
                        labelY = y + padding.y;
                        break;
                    case 'center': // Center of the line, text above
                        textAlign = 'center';
                        textBaseline = 'bottom';
                        labelX = this.drawArea.x + this.drawArea.width / 2;
                        labelY = y - padding.y;
                        break;
                    case 'right': // Default
                    default:
                        textAlign = 'right';
                        textBaseline = 'bottom';
                        labelX = this.drawArea.x + this.drawArea.width - padding.x;
                        labelY = y - padding.y;
                        break;
                }
                this.ctx.textAlign = textAlign;
                this.ctx.textBaseline = textBaseline;

                if (labelOptions.backgroundColor) {
                    const textMetrics = this.ctx.measureText(labelOptions.text);
                    // Approximate height based on font size, as actualBoundingBoxAscent/Descent can be unreliable
                    const fontHeight = parseInt(this.ctx.font.match(/(\d+)px/)?.[1] || '10'); 
                    
                    const bgWidth = textMetrics.width + 2 * padding.x;
                    const bgHeight = fontHeight + 2 * padding.y;
                    
                    let bgX = labelX;
                    if (textAlign === 'right') bgX = labelX - textMetrics.width - padding.x;
                    else if (textAlign === 'center') bgX = labelX - textMetrics.width/2 - padding.x;
                    else bgX = labelX - padding.x; // left

                    let bgY = labelY;
                    if (textBaseline === 'bottom') bgY = labelY - fontHeight - padding.y;
                    else if (textBaseline === 'middle') bgY = labelY - fontHeight/2 - padding.y;
                    else bgY = labelY - padding.y; // top

                    this.ctx.fillStyle = labelOptions.backgroundColor;
                    this.ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
                    // Reset for text
                    this.ctx.fillStyle = labelColor;
                }
                this.ctx.fillText(labelOptions.text, labelX, labelY);
                this.ctx.restore();
            }
        });
        this.ctx.restore(); // Restore context for all annotations
    }

    _preprocessDatasetValues() {
        if (!this.config.data || !this.config.data.datasets) return;
        const datasets = this.config.data.datasets;
        const numLabels = this.config.data.labels ? this.config.data.labels.length : 0;

        datasets.forEach((ds, index) => {
            if (ds.type === 'sma') {
                let validSma = true;
                let sourceDs = null;

                if (typeof ds.sourceDatasetIndex !== 'number' || ds.sourceDatasetIndex < 0 || ds.sourceDatasetIndex >= datasets.length) {
                    console.warn(`PureChart SMA Error: Dataset ${index} ('${ds.label}') has invalid sourceDatasetIndex ${ds.sourceDatasetIndex}.`);
                    validSma = false;
                } else {
                    sourceDs = datasets[ds.sourceDatasetIndex];
                    if (sourceDs.type === 'sma') {
                        console.warn(`PureChart SMA Error: Dataset ${index} ('${ds.label}') sourceDatasetIndex ${ds.sourceDatasetIndex} ('${sourceDs.label}') is another SMA. Chaining SMAs is not supported.`);
                        validSma = false;
                        sourceDs = null; // Prevent trying to use it
                    }
                    if (ds.sourceDatasetIndex === index) {
                        console.warn(`PureChart SMA Error: Dataset ${index} ('${ds.label}') sourceDatasetIndex cannot be itself.`);
                        validSma = false;
                        sourceDs = null;
                    }
                }

                if (typeof ds.period !== 'number' || ds.period <= 0) {
                    console.warn(`PureChart SMA Error: Dataset ${index} ('${ds.label}') has invalid period ${ds.period}.`);
                    validSma = false;
                }
                
                if (validSma && sourceDs) {
                    if (sourceDs._hidden) { // If source dataset is hidden, SMA becomes an empty line
                        ds.values = numLabels > 0 ? new Array(numLabels).fill(null) : [];
                        // console.log(`PureChart SMA Info: Source dataset for '${ds.label}' is hidden. SMA will be empty.`);
                    } else if (!sourceDs.values || sourceDs.values.length === 0) {
                        console.warn(`PureChart SMA Error: Source dataset ${ds.sourceDatasetIndex} ('${sourceDs.label}') for SMA dataset ${index} ('${ds.label}') has no values.`);
                        ds.values = numLabels > 0 ? new Array(numLabels).fill(null) : [];
                    } else {
                        ds.values = PureChart._calculateSMA(sourceDs.values, ds.period);
                        if (ds.values.length === 0 && sourceDs.values.length > 0) { // Check if SMA calculation itself returned empty due to period > data length
                             console.warn(`PureChart SMA Warning: Dataset ${index} ('${ds.label}') period ${ds.period} is greater than source data length ${sourceDs.values.length}. Resulting in empty SMA.`);
                             // _calculateSMA already handles padding correctly if sourceDs.values.length < period
                        }
                    }
                } else { // Validation failed or no sourceDs
                    ds.values = numLabels > 0 ? new Array(numLabels).fill(null) : []; // Set to empty/null array to prevent drawing issues
                }
            }
        });
    }
}
