// Main application class
class HuffmanVisualizer {
    constructor() {
        this.huffman = new HuffmanCoding();
        this.currentTree = null;
        this.currentFreqMap = new Map();
        this.prevPositions = new Map();
        this.playTimer = null; // local fallback timer
        this.initElements();
        this.setupEventListeners();
        this.setupSampleData();
    }

    // Apply current speed multiplier to the underlying animation speed (ms per step)
    applySpeedMultiplier() {
        // Clamp multiplier
        const m = Math.max(0.25, Math.min(2.0, this.speedMultiplier));
        this.speedMultiplier = m;
        // Map: base 1200ms at 1.0x. Faster multiplier reduces duration.
        const ms = Math.max(80, Math.round(1200 / m));
        // Bridge accepts ms via animationSpeed property; set directly
        this.huffman.animationSpeed = ms;
        // For older interface, also call setAnimationSpeed if present
        if (typeof this.huffman.setAnimationSpeed === 'function') {
            try { this.huffman.setAnimationSpeed(ms); } catch (_) {}
        }
        this.updateSpeedUI();
    }

    setSpeedMultiplier(m) {
        // Round to nearest 0.25
        const rounded = Math.max(0.25, Math.min(2.0, Math.round(m * 4) / 4));
        this.speedMultiplier = rounded;
        this.applySpeedMultiplier();
    }

    updateSpeedUI() {
        if (this.speedDisplay) {
            this.speedDisplay.textContent = `${this.speedMultiplier.toFixed(2)}×`;
        }
    }

    // Initialize DOM elements
    initElements() {
        // Input elements
        this.manualInputs = document.getElementById('manual-inputs');
        this.addRowBtn = document.getElementById('add-row');
        this.textInput = document.getElementById('text-input');
        this.sampleSelect = document.getElementById('sample-select');
        this.buildTreeBtn = document.getElementById('build-tree');
        
        // Control elements
        this.backBtn = document.getElementById('back-btn');
        this.stepBtn = document.getElementById('step-btn');
        this.playBtn = document.getElementById('play-btn');
        this.resetBtn = document.getElementById('reset-btn');
        // Speed controls (multiplier-based)
        this.speedDecreaseBtn = document.getElementById('speed-decrease');
        this.speedIncreaseBtn = document.getElementById('speed-increase');
        this.speedDisplay = document.getElementById('speed-display');
        this.speedMultiplier = 1.0; // 0.25x .. 2.00x
        this.showWeights = document.getElementById('show-weights');
        this.toggleGingham = document.getElementById('toggle-gingham');
        this.exportPngBtn = document.getElementById('export-png');
        
        // Zoom controls
        this.zoomInBtn = document.getElementById('zoom-in');
        this.zoomOutBtn = document.getElementById('zoom-out');
        this.zoomResetBtn = document.getElementById('zoom-reset');
        this.zoomLevel = 1.0; // 100%
        
        // Encoding toggle
        this.toggleEncodingBtn = document.getElementById('toggle-encoding');
        this.showFixedLength = false; // false = variable (Huffman), true = fixed length
        
        // Output elements
        this.treeSvg = d3.select('#tree-svg');
        this.stepsContainer = document.getElementById('steps');
        this.huffmanCodes = document.getElementById('huffman-codes');
        this.codesTableBody = document.getElementById('codes-table');
        
        // Section containers for sequential display (use IDs for robustness)
        this.inputSection = document.querySelector('.row.mb-4');
        this.treePageTitle = document.getElementById('tree-page-title');
        this.treePageContainer = document.getElementById('tree-page-container');
        this.codesSection = document.getElementById('codes-card');
        this.tableSection = null;
        
        // Set default animation speed from multiplier (lower ms = faster)
        this.applySpeedMultiplier();
        
        // Initially hide tree and codes sections
        this.hideTreeSection();
        this.hideCodesSection();
        // Apply default gingham bg if toggle exists
        if (this.toggleGingham) {
            document.body.classList.add('gingham-bg');
        }
    }

    // Set up event listeners
    setupEventListeners() {
        // Add row button
        this.addRowBtn.addEventListener('click', () => this.addInputRow());
        
        // Build tree button
        this.buildTreeBtn.addEventListener('click', () => this.buildTree());
        
        // Control buttons
        this.backBtn.addEventListener('click', () => this.stepBack());
        this.stepBtn.addEventListener('click', () => this.step());
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // Speed controls (+/-)
        if (this.speedDecreaseBtn) {
            this.speedDecreaseBtn.addEventListener('click', () => {
                this.setSpeedMultiplier(this.speedMultiplier - 0.25);
            });
        }
        if (this.speedIncreaseBtn) {
            this.speedIncreaseBtn.addEventListener('click', () => {
                this.setSpeedMultiplier(this.speedMultiplier + 0.25);
            });
        }
        
        // Show weights toggle
        this.showWeights.addEventListener('change', () => this.updateTree());

        // Gingham wallpaper toggle
        if (this.toggleGingham) {
            this.toggleGingham.addEventListener('change', (e) => {
                if (e.target.checked) {
                    document.body.classList.add('gingham-bg');
                } else {
                    document.body.classList.remove('gingham-bg');
                }
            });
        }
        
        // Handle tab changes
        document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', () => {
                // Reset the build tree button state when switching tabs
                this.buildTreeBtn.disabled = false;
                this.buildTreeBtn.textContent = 'build huffman tree';
            });
        });

        // Open codes in new page
        const openBtn = document.getElementById('open-codes-page');
        if (openBtn) {
            openBtn.addEventListener('click', () => this.openCodesPage());
        }

        // Export PNG
        if (this.exportPngBtn) {
            this.exportPngBtn.addEventListener('click', () => this.exportTreePNG());
        }
        
        // Zoom controls
        if (this.zoomInBtn) {
            this.zoomInBtn.addEventListener('click', () => this.zoomIn());
        }
        if (this.zoomOutBtn) {
            this.zoomOutBtn.addEventListener('click', () => this.zoomOut());
        }
        if (this.zoomResetBtn) {
            this.zoomResetBtn.addEventListener('click', () => this.zoomReset());
        }
        
        // Toggle encoding button
        if (this.toggleEncodingBtn) {
            this.toggleEncodingBtn.addEventListener('click', () => this.toggleEncoding());
        }

        // Switch to Tree & Steps removed; Build now handles navigation

        // Back to Input
        const toInputBtn = document.getElementById('switch-to-input');
        if (toInputBtn) {
            toInputBtn.addEventListener('click', () => {
                this.showInputSection();
                this.hideTreeSection();
                this.hideCodesSection();
                // Reset build button to initial state (looks refreshed)
                if (this.buildTreeBtn) {
                    this.buildTreeBtn.disabled = false;
                    this.buildTreeBtn.textContent = 'build huffman tree';
                    this.buildTreeBtn.className = 'btn btn-primary mt-3 w-100';
                }
            });
        }
    }

    // Add a new input row to the manual input section
    addInputRow(character = '', frequency = '') {
        const row = document.createElement('div');
        row.className = 'input-group mb-2';
        row.innerHTML = `
            <input type="text" class="form-control char-input" placeholder="character" maxlength="1" value="${character}">
            <input type="number" class="form-control freq-input" placeholder="frequency" min="1" value="${frequency}">
            <button class="btn btn-outline-danger remove-btn" type="button">×</button>
        `;
        
        // Add remove button event
        const removeBtn = row.querySelector('.remove-btn');
        removeBtn.addEventListener('click', () => {
            if (this.manualInputs.children.length > 1) {
                row.remove();
            }
        });
        
        this.manualInputs.appendChild(row);
    }

    // Set up sample data
    setupSampleData() {
        const samples = {
            sample1: [
                { char: 'A', freq: 5 },
                { char: 'B', freq: 9 },
                { char: 'C', freq: 12 },
                { char: 'D', freq: 13 },
                { char: 'E', freq: 16 },
                { char: 'F', freq: 45 }
            ],
            sample2: [
                { char: 'A', freq: 8 },
                { char: 'E', freq: 12 },
                { char: 'I', freq: 7 },
                { char: 'O', freq: 7 },
                { char: 'U', freq: 3 }
            ],
            sample3: [
                { char: '0', freq: 1 },
                { char: '1', freq: 3 },
                { char: '2', freq: 4 },
                { char: '3', freq: 2 }
            ]
        };

        this.sampleSelect.addEventListener('change', (e) => {
            const sample = samples[e.target.value];
            if (!sample) return;
            
            // Clear existing inputs
            this.manualInputs.innerHTML = '';
            
            // Add sample data rows
            sample.forEach(item => {
                this.addInputRow(item.char, item.freq);
            });
            
            // Switch to manual tab
            document.querySelector('#manual-tab').click();
        });
    }

    // Build the Huffman tree based on input
    async buildTree() {
        let freqMap = new Map();
        // Immediately navigate to the tree page so the user sees the visualizer
        this.hideInputSection();
        this.showTreeSection();
        this.showCodesSection();
        // Smoothly scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Get the active tab
        const activeTab = document.querySelector('.tab-pane.active').id;
        
        try {
            if (activeTab === 'manual' || activeTab === 'sample') {
                // Get data from manual inputs
                const rows = this.manualInputs.querySelectorAll('.input-group');
                
                rows.forEach(row => {
                    const charInput = row.querySelector('.char-input');
                    const freqInput = row.querySelector('.freq-input');
                    
                    const char = charInput.value.trim();
                    const freq = parseInt(freqInput.value);
                    
                    if (char && !isNaN(freq) && freq > 0) {
                        if (freqMap.has(char)) {
                            throw new Error(`Duplicate character: ${char}`);
                        }
                        freqMap.set(char, freq);
                    } else if (char || freq) {
                        throw new Error('Please enter valid character and frequency');
                    }
                });
                
                if (freqMap.size < 2) {
                    throw new Error('Please enter at least 2 valid characters with frequencies');
                }
            } 
            else if (activeTab === 'text') {
                // Analyze text input
                const text = this.textInput.value.trim();
                if (!text) {
                    throw new Error('Please enter some text to analyze');
                }
                freqMap = this.huffman.buildFrequencyMap(text);
                
                if (freqMap.size < 2) {
                    throw new Error('Text must contain at least 2 different characters');
                }
            }
            
            // Save frequency map and build the tree
            this.currentFreqMap = new Map(freqMap);
            await this.huffman.buildTree(freqMap);
            // Use FINAL tree root to compute codes reliably
            const lastStep = Array.isArray(this.huffman.steps) && this.huffman.steps.length
                ? this.huffman.steps[this.huffman.steps.length - 1]
                : null;
            const finalRoot = lastStep?.nodes?.[0] || null;
            this.currentTree = finalRoot;
            if (finalRoot) {
                this.huffman.generateCodes(finalRoot);
            }
            // Absolute fallback: if codes are still empty, compute them directly from the frequency map
            if (!this.huffman.codes || this.huffman.codes.size === 0) {
                const buildCodesFromFreqLocal = (pairs) => {
                    if (!pairs || !pairs.length) return new Map();
                    let nodes = pairs.map(([ch, freq]) => ({ ch, freq: Number(freq), left: null, right: null }));
                    if (nodes.length === 1) {
                        const only = nodes[0];
                        const m = new Map();
                        m.set(only.ch, '0');
                        return m;
                    }
                    while (nodes.length > 1) {
                        nodes.sort((a, b) => a.freq - b.freq || String(a.ch || '').localeCompare(String(b.ch || '')));
                        const a = nodes.shift();
                        const b = nodes.shift();
                        nodes.push({ ch: null, freq: a.freq + b.freq, left: a, right: b });
                    }
                    const root = nodes[0];
                    const codes = new Map();
                    (function dfs(n, pref) {
                        if (!n) return;
                        if (!n.left && !n.right) { codes.set(n.ch, pref || '0'); return; }
                        dfs(n.left, pref + '0');
                        dfs(n.right, pref + '1');
                    })(root, '');
                    return codes;
                };
                const pairs = Array.from(this.currentFreqMap.entries());
                const fallback = buildCodesFromFreqLocal(pairs);
                if (fallback && fallback.size) {
                    this.huffman.codes = fallback;
                }
            }
            
            // Update UI
            this.updateControls(true);
            this.updateTree();
            // Render codes and table ONCE at the beginning and keep static thereafter
            this.updateHuffmanCodes();
            this.updateCodesTable();
            this.initialCodesRendered = true;
            this.updateSteps();
            
            // Show success message
            this.buildTreeBtn.textContent = 'tree built successfully!';
            this.buildTreeBtn.className = 'btn btn-success mt-3 w-100';
            
        } catch (error) {
            alert(error.message);
            console.error(error);
        }
    }

    // Update control buttons state
    updateControls(enable = true) {
        const currentStep = this.huffman.currentStep || 0;
        this.backBtn.disabled = !enable || currentStep === 0;
        this.stepBtn.disabled = !enable;
        this.playBtn.disabled = !enable;
        this.resetBtn.disabled = !enable;
        this.buildTreeBtn.disabled = enable;
    }
    
    // Step back to previous state
    stepBack() {
        if (this.huffman.currentStep > 0) {
            this.huffman.currentStep--;
            this.updateTree();
            this.updateSteps();
            this.updateControls(true);
            
            // Update codes if we're at the final step
            const isFinal = this.huffman.currentStep === (this.huffman.steps?.length - 1);
            if (isFinal) {
                this.updateHuffmanCodes();
                this.updateCodesTable();
            }
        }
    }

    // Update the tree visualization (render via React + Framer Motion)
    updateTree() {
        const step = this.huffman.getCurrentStep();
        if (!step || !step.nodes) return;

        const container = document.getElementById('tree-container');
        const width = container.clientWidth || 900;
        const height = 650; // Fixed height to show everything at once

        const margin = { top: 10, right: 80, bottom: 60, left: 80 };
        const innerW = Math.max(600, width - margin.left - margin.right);
        const innerH = Math.max(480, height - margin.top - margin.bottom);

        // Support initial step (forest of nodes). If multiple nodes, create a virtual root
        const hasForest = Array.isArray(step.nodes) && step.nodes.length > 1;
        const primaryRoot = step.nodes[0];
        if (!primaryRoot) return;

        // Layout with D3 (no DOM mutations)
        const treeLayout = d3.tree().size([innerW, innerH]);
        let rootNode;
        if (hasForest) {
            // Build a virtual root to layout all nodes side-by-side
            const children = step.nodes.map(n => this.convertToD3Hierarchy(n));
            rootNode = { name: '', value: 0, id: '__virtual__', isLeaf: false, children };
        } else {
            rootNode = this.convertToD3Hierarchy(primaryRoot);
        }
        const treeData = d3.hierarchy(rootNode);
        treeLayout(treeData);

        // Center horizontally and shift down vertically
        const desc = treeData.descendants();
        if (desc.length > 0) {
            const xExtent = d3.extent(desc, d => d.x);
            const xCenter = (xExtent[0] + xExtent[1]) / 2;
            const xOffset = innerW / 2 - xCenter;
            const yShift = 20; // Shift tree down slightly to center better
            desc.forEach(d => { 
                d.x = d.x + xOffset; 
                d.y = d.y + yShift;
            });
            // Compute required content width (span of nodes + margins)
            const span = (xExtent[1] - xExtent[0]) || innerW;
            this._requiredTreeWidth = Math.ceil(span + margin.left + margin.right + 20);
        }

        // Build data for renderer
        const showWeights = this.showWeights.checked;
        const isFinal = this.huffman.currentStep === this.huffman.steps.length - 1;

        // Prepare code map if final
        let codeMap = new Map();
        if (isFinal) {
            if (this.huffman.codes.size === 0 && this.currentTree) {
                this.huffman.generateCodes(this.currentTree);
            }
            codeMap = this.huffman.codes;
        }

        const nodes = desc
            .filter(d => d.data.id !== '__virtual__')
            .map(d => ({
            id: d.data.id,
            x: d.x,
            y: d.y,
            depth: d.depth || 0,
            isLeaf: d.data.isLeaf,
            name: d.data.name,
            value: d.data.value !== undefined ? d.data.value : (d.data.freq !== undefined ? d.data.freq : 0),
            showWeights,
            code: (isFinal && d.data.isLeaf && d.data.name) ? (codeMap.get(d.data.name) || '') : '',
            colorFill: d.data.isLeaf ? undefined : '#8fcf8f'
        }));

        const linkGen = d3.linkVertical().x(d => d.x).y(d => d.y);
        const links = treeData.links()
            .filter(l => l.source.data && l.source.data.id !== '__virtual__')
            .map(l => {
            const id = l.target.data.id;
            // Reverse direction so drawing goes from child (target) up to parent (source)
            const sx = l.target.x, sy = l.target.y; // child
            const ex = l.source.x, ey = l.source.y; // parent
            const d = `M${sx},${sy}L${ex},${ey}`;
            const label = l.target.data.edgeLabel || '';
            // Position label closer to child node (75% from parent to child)
            const mx = ex + (sx - ex) * 0.75;
            const my = ey + (sy - ey) * 0.75 - 8;
            return { id, d, sx, sy, ex, ey, label, mx, my, depth: (l.target.depth || 0) };
        });

        const highlightIds = step.highlightNodes || [];
        const mergingIds = (highlightIds && highlightIds.length >= 2) ? highlightIds : [];

        // ALWAYS USE ANIMATED D3 RENDER - REMOVE CONDITIONAL CHECK
        // ANIMATED D3 RENDER with smooth transitions
        // Make animations clearly visible - minimum 800ms to ensure they're visible
        const animationDuration = Math.max(800, Math.min(2000, (this.huffman.animationSpeed || 1500) * 1.5));
        // Full step duration equals the node/link animation time since links now animate concurrently with nodes
        this.lastStepDurationMs = animationDuration + 120; // small buffer for labels
        // Temporarily disable manual stepping while animations run to prevent overlap
        if (this.stepBtn) {
            this.stepBtn.disabled = true;
            clearTimeout(this._reEnableStepTimer);
            this._reEnableStepTimer = setTimeout(() => { this.stepBtn.disabled = false; }, this.lastStepDurationMs);
        }
        
        // Force animation by clearing any existing transitions
        this.treeSvg.interrupt();
        const svgWidth = Math.max(width, this._requiredTreeWidth || width);
        const svg = this.treeSvg.attr('width', svgWidth).attr('height', height);
        let g = svg.select('g.canvas');
        if (g.empty()) {
            svg.selectAll('*').remove();
            g = svg.append('g').attr('class', 'canvas').attr('transform', `translate(${margin.left}, ${margin.top})`);
        }
        // Ensure stable layer order: links (bottom) < labels < nodes (top)
        let gLinks = g.select('g.links');
        let gLabels = g.select('g.labels');
        let gNodes = g.select('g.nodes');
        if (gLinks.empty() || gLabels.empty() || gNodes.empty()) {
            g.selectAll('*').remove();
            gLinks = g.append('g').attr('class', 'links');
            gLabels = g.append('g').attr('class', 'labels');
            gNodes = g.append('g').attr('class', 'nodes');
        }
        // Clear any running transitions first
        g.selectAll('*').interrupt();

        // ANIMATED LINKS - draw from child upward to parent
        const linkSel = gLinks.selectAll('path.link')
            .data(links, d => d.id);
        
        // Exit links immediately to avoid ghost edges during long sequences
        linkSel.exit()
            .interrupt()
            .remove();

        // Enter new links - start collapsed at child position (bottom of link)
        const linkEnter = linkSel.enter()
            .append('path')
            .attr('class', 'link')
            .style('opacity', 0)
            .style('stroke', '#9db584')
            .style('stroke-width', '2.5px');

        // Initialize link at collapsed state at the child position
        linkEnter.each(function(d) {
                const sX = d.sx, sY = d.sy, eX = d.ex, eY = d.ey;
                // Store previous and current endpoints for smooth updates
                this._prevStartX = sX; this._prevStartY = sY;
                this._prevEndX = eX;   this._prevEndY = eY;
                this._startX = sX;     this._startY = sY;
                this._endX = eX;       this._endY = eY;
                // Set initial collapsed path (at start position)
                d3.select(this).attr('d', `M${sX},${sY}L${sX},${sY}`);
            });

        // Update all links with animation - move both endpoints smoothly to new positions
        linkEnter.merge(linkSel)
            .each(function(d) {
                // Use explicit coordinates from data
                const newStartX = d.sx; const newStartY = d.sy;
                const newEndX = d.ex;   const newEndY = d.ey;
                // Ensure previous values exist
                if (this._startX === undefined) {
                    this._startX = newStartX; this._startY = newStartY;
                    this._endX = newEndX;     this._endY = newEndY;
                }
                this._prevStartX = this._startX; this._prevStartY = this._startY;
                this._prevEndX = this._endX;     this._prevEndY = this._endY;
                // Set new targets
                this._startX = newStartX; this._startY = newStartY;
                this._endX = newEndX;     this._endY = newEndY;
            })
            .transition()
            // Links animate WITH nodes so the whole subtree moves together
            .delay(0)
            .duration(animationDuration)
            .ease(d3.easeCubicOut)
            .style('opacity', 1)
            .attrTween('d', function() {
                const sX0 = this._prevStartX ?? this._startX ?? 0;
                const sY0 = this._prevStartY ?? this._startY ?? 0;
                const eX0 = this._prevEndX ?? this._endX ?? 0;
                const eY0 = this._prevEndY ?? this._endY ?? 0;
                const sX1 = this._startX ?? 0;
                const sY1 = this._startY ?? 0;
                const eX1 = this._endX ?? 0;
                const eY1 = this._endY ?? 0;
                return function(t) {
                    const sXt = sX0 + (sX1 - sX0) * t;
                    const sYt = sY0 + (sY1 - sY0) * t;
                    const eXt = eX0 + (eX1 - eX0) * t;
                    const eYt = eY0 + (eY1 - eY0) * t;
                    return `M${sXt},${sYt}L${eXt},${eYt}`;
                };
            });

        // ANIMATED EDGE LABELS (single midpoint label)
        const labelData = links.flatMap(l => !l.label ? [] : [
            { key: l.id + '-lbl', x: l.mx, y: l.my, text: l.label }
        ]);

        const lblSel = gLabels.selectAll('text.edge-label')
            .data(labelData, d => d.key);
        
        lblSel.exit()
            .interrupt()
            .remove();

        const lblEnter = lblSel.enter()
            .append('text')
            .attr('class', 'edge-label')
            .attr('text-anchor', 'middle')
            .style('opacity', 0)
            .text(d => d.text);

        // Initialize enter positions and prev values
        lblEnter.each(function(d) {
                this._prevLX = d.x;
                this._prevLY = d.y;
                this._lx = d.x;
                this._ly = d.y;
                d3.select(this).attr('x', d.x).attr('y', d.y);
            });

        // Update labels: move concurrently with nodes/links and fade in if new
        const lblMerged = lblEnter.merge(lblSel)
            .each(function(d){
                if (this._lx === undefined) {
                    this._lx = d.x; this._ly = d.y;
                    this._prevLX = d.x; this._prevLY = d.y;
                }
                this._prevLX = this._lx; this._prevLY = this._ly;
                this._lx = d.x; this._ly = d.y;
            })
            .transition()
            .duration(animationDuration)
            .ease(d3.easeCubicOut)
            .style('opacity', 1)
            .attrTween('x', function(){
                const x0 = this._prevLX ?? this._lx ?? 0;
                const x1 = this._lx ?? 0;
                return function(t){ return x0 + (x1 - x0) * t; };
            })
            .attrTween('y', function(){
                const y0 = this._prevLY ?? this._ly ?? 0;
                const y1 = this._ly ?? 0;
                return function(t){ return y0 + (y1 - y0) * t; };
            });

        // ANIMATED NODES - smooth appearance and movement
        const nodeSel = gNodes.selectAll('g.node')
            .data(nodes, d => d.id);

        // Store previous positions for smooth transitions
        nodeSel.each(function(d) {
                const transform = d3.select(this).attr('transform');
                if (transform && transform !== 'none') {
                    const match = transform.match(/translate\(([\d.]+),([\d.]+)\)\s*(?:scale\(([\d.]+)\))?/);
                    if (match) {
                        this._prevX = parseFloat(match[1]);
                        this._prevY = parseFloat(match[2]);
                        this._prevScale = match[3] ? parseFloat(match[3]) : 1;
                    }
                } else {
                    // New node - starts at scale 0
                    this._prevScale = 0;
                }
            });

        // Exit animation
        nodeSel.exit()
            .transition()
            .duration(animationDuration * 0.6)
            .style('opacity', 0)
            .attr('transform', function(d) {
                const x = this._prevX !== undefined ? this._prevX : d.x;
                const y = this._prevY !== undefined ? this._prevY : d.y;
                return `translate(${x},${y}) scale(0)`;
            })
            .remove();

        // Enter new nodes - start from parent or previous position
        const nodeEnter = nodeSel.enter()
            .append('g')
            .attr('class', d => `node ${d.isLeaf ? 'leaf' : 'internal'}`)
            .style('opacity', 0)
            .attr('transform', d => {
                // Find parent node or start from center
                let startX = innerW / 2;
                let startY = innerH / 2;
                
                // Try to find parent in existing nodes
                const parentNode = nodes.find(n => {
                    return !n.isLeaf && 
                           (n.id === d.id + '_left' || n.id === d.id + '_right');
                });
                
                if (parentNode) {
                    startX = parentNode.x;
                    startY = parentNode.y;
                }
                
                return `translate(${startX},${startY}) scale(0)`;
            });

        // Add circle to new nodes
        nodeEnter.append('circle')
            .attr('r', 0)  // Start at 0 for animation
            .attr('class', d => !d.isLeaf ? 'merged' : null)
            .style('fill', d => (!d.isLeaf ? '#a8c090' : null))
            .style('stroke', d => (!d.isLeaf ? '#8b7355' : '#7a5f3f'))
            .style('stroke-width', 2);

        // Add text to new nodes
        const textEnter = nodeEnter.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('class', d => !d.isLeaf ? 'internal' : '')
            .style('font-weight', d => !d.isLeaf ? '800' : '700')
            .style('font-size', d => !d.isLeaf ? '15px' : '13px')
            .style('fill', d => !d.isLeaf ? '#1a140d' : '#2d2416')
            .style('opacity', 0);

        // Update all nodes with smooth animation
        const nodesMerged = nodeEnter.merge(nodeSel);
        
        // Animate position changes - nodes move smoothly from previous to new position
        nodesMerged
            .transition()
            .duration(animationDuration)
            .ease(d3.easeCubicOut)
            .style('opacity', 1)
            .attrTween('transform', function(d) {
                    // Get previous position
                    const prevX = this._prevX !== undefined ? this._prevX : d.x;
                    const prevY = this._prevY !== undefined ? this._prevY : d.y;
                    const prevScale = this._prevScale !== undefined ? this._prevScale : 0;
                    
                    // Store new position for next frame
                    this._prevX = d.x;
                    this._prevY = d.y;
                    this._prevScale = 1;
                    
                    // If position hasn't changed, just animate scale/opacity
                    if (Math.abs(prevX - d.x) < 0.1 && Math.abs(prevY - d.y) < 0.1) {
                        return function(t) {
                            const scale = prevScale + (1 - prevScale) * t;
                            return `translate(${d.x},${d.y}) scale(${scale})`;
                        };
                    }
                    
                    // Animate from previous to new position
                    return function(t) {
                        const x = prevX + (d.x - prevX) * t;
                        const y = prevY + (d.y - prevY) * t;
                        const scale = prevScale + (1 - prevScale) * t;
                        return `translate(${x},${y}) scale(${scale})`;
                    };
                });
            
        // Animate circles - ALWAYS animate from 0 to 25 for visible effect
        nodesMerged.each(function(d) {
            const circle = d3.select(this).select('circle');
            const currentR = circle.empty() ? 0 : parseFloat(circle.attr('r')) || 0;
            
            if (circle.empty()) {
                // New circle - add and animate
                d3.select(this).append('circle')
                    .attr('r', 0)
                    .attr('class', d.isLeaf ? null : 'merged')
                    .style('fill', d.isLeaf ? null : '#a8c090')
                    .style('stroke', d.isLeaf ? '#7a5f3f' : '#8b7355')
                    .style('stroke-width', 2)
                    .transition()
                    .duration(animationDuration)
                    .ease(d3.easeElasticOut)
                    .attr('r', 25);
            } else {
                // Existing circle - animate from current to 25
                circle
                    .transition()
                    .duration(animationDuration)
                    .ease(d3.easeCubicOut)
                    .attr('r', 25);
            }
        });

        // Update text content with animation - FADE IN
        nodesMerged.select('text')
            .text(d => {
                if (d.isLeaf) {
                    return d.showWeights ? `${d.name} (${d.value})` : d.name;
                }
                return String(d.value);
            })
            .transition()
            .duration(animationDuration)
            .style('opacity', 1);

        // HIGHLIGHT MERGING NODES with pulse animation
        if (mergingIds.length >= 2) {
            nodesMerged.filter(d => mergingIds.includes(d.id))
                .select('circle')
                .transition()
                .duration(animationDuration * 0.3)
                .attr('r', 30)
                .style('stroke-width', 4)
                .transition()
                .duration(animationDuration * 0.3)
                .attr('r', 25)
                .style('stroke-width', 2);
        }

        // Show code labels on final step with fade-in
        if (isFinal && nodesMerged.filter(d => d.isLeaf && d.code).size() > 0) {
            nodesMerged.each(function(d) {
                if (d.isLeaf && d.code) {
                    let codeText = d3.select(this).select('text.code-label');
                    if (codeText.empty()) {
                        codeText = d3.select(this).append('text')
                            .attr('class', 'code-label')
                            .attr('text-anchor', 'middle')
                            .attr('dy', '2.2em')
                            .style('opacity', 0);
                    }
                    codeText
                        .text(d.code)
                        .transition()
                        .delay(animationDuration * 0.5)
                        .duration(animationDuration * 0.8)
                        .style('opacity', 1);
                }
            });
        }
    }

    // Convert underlying Huffman node to a D3-friendly hierarchy object
    convertToD3Hierarchy(node, edgeLabel = '') {
        if (!node) return null;
        const callIf = (obj, key) => (obj && typeof obj[key] === 'function' ? obj[key]() : undefined);
        const pick = (...vals) => vals.find(v => v !== undefined && v !== null);

        const id = pick(node.id, callIf(node, 'getId'), `n_${Math.random().toString(36).slice(2)}`);
        const name = pick(node.name, node.char, callIf(node, 'getName'), '');
        const value = pick(node.value, node.freq, node.weight, callIf(node, 'getValue'), 0);

        // Children may be on properties or via methods
        const leftChild = pick(node.left, callIf(node, 'getLeft'));
        const rightChild = pick(node.right, callIf(node, 'getRight'));
        const isLeaf = pick((typeof node.isLeaf === 'function' ? node.isLeaf() : node.isLeaf), (!leftChild && !rightChild));

        const d3Node = { id, name, value, isLeaf, edgeLabel };
        if (leftChild || rightChild) {
            d3Node.children = [
                this.convertToD3Hierarchy(leftChild, '0'),
                this.convertToD3Hierarchy(rightChild, '1')
            ].filter(Boolean);
        }
        return d3Node;
    }

    // Local fallback playback loop in case underlying play API is unavailable
    startLocalPlayback() {
        this.huffman.isPlaying = true;
        const tick = () => {
            if (!this.huffman.isPlaying) return;
            const atEnd = this.huffman.currentStep >= (this.huffman.steps.length - 1);
            if (atEnd) {
                this.huffman.isPlaying = false;
                this.playBtn.textContent = 'play';
                this.playBtn.className = 'btn btn-outline-success fw-bold';
                this.showCodesSection();
                this.updateHuffmanCodes();
                this.updateCodesTable();
                this.playTimer = null;
                return;
            }
            // Advance one step using existing method
            this.step();
            // Schedule next tick
            const ms = this.lastStepDurationMs || this.huffman.animationSpeed || 600;
            this.playTimer = setTimeout(tick, ms);
        };
        // kick off immediately
        tick();
    }

    // Update the Huffman codes display
    updateHuffmanCodes() {
        if (!this.huffman.codes.size) return;
        if (!this.huffmanCodes) return; // Skip if element doesn't exist
        
        this.huffmanCodes.innerHTML = '';
        
        // Sort codes by character for consistent display
        const sortedCodes = Array.from(this.huffman.codes.entries())
            .sort((a, b) => a[0].localeCompare(b[0]));
        
        sortedCodes.forEach(([char, code]) => {
            const codeItem = document.createElement('div');
            codeItem.className = 'code-item';
            codeItem.innerHTML = `
                <span class="char">${char === ' ' ? '␣' : char}</span>
                <span>${code}</span>
            `;
            this.huffmanCodes.appendChild(codeItem);
        });
    }

    // Update the frequency-code table at the end
    updateCodesTable() {
        if (!this.codesTableBody) return;
        const rows = [];
        const entries = Array.from(this.currentFreqMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]));
        let totalBits = 0;
        let totalCount = 0;
        
        // Calculate fixed length code size (bits needed to represent all unique characters)
        const uniqueChars = entries.length;
        const fixedCodeLength = uniqueChars > 1 ? Math.ceil(Math.log2(uniqueChars)) : 1;
        
        entries.forEach(([char, freq]) => {
            const freqNum = Number(freq || 0);
            totalCount += freqNum;
            
            let code, bits;
            if (this.showFixedLength) {
                // Fixed length encoding
                const charIndex = entries.findIndex(([c]) => c === char);
                code = charIndex.toString(2).padStart(fixedCodeLength, '0');
                bits = fixedCodeLength * freqNum;
            } else {
                // Variable length (Huffman) encoding
                code = this.huffman.codes.get(char) || '';
                bits = code.length * freqNum;
            }
            
            totalBits += bits;
            const safeChar = char === ' ' ? '␣' : char;
            rows.push(`<tr><td>${safeChar}</td><td>${freq}</td><td><code>${code}</code></td><td>${bits}</td></tr>`);
        });
        this.codesTableBody.innerHTML = rows.join('');

        // Update metrics at top of the codes card if present
        const estEl = document.getElementById('codes-metrics-est');
        const origEl = document.getElementById('codes-metrics-orig');
        const savEl = document.getElementById('codes-metrics-savings');
        const codeHeader = document.getElementById('code-header');
        const originalBits = totalCount * 8;
        const savingsPct = originalBits > 0 ? Math.max(0, (1 - (totalBits / originalBits)) * 100) : 0;
        
        if (estEl) estEl.textContent = String(totalBits);
        if (origEl) origEl.textContent = String(originalBits);
        if (savEl) savEl.textContent = `${savingsPct.toFixed(1)}%`;
        if (codeHeader) codeHeader.textContent = this.showFixedLength ? 'fixed code' : 'variable code';
        
        // Update encoding type label
        const encodingTypeLabel = document.getElementById('encoding-type-label');
        if (encodingTypeLabel) {
            encodingTypeLabel.textContent = this.showFixedLength ? 'Fixed Huffman' : 'Variable Huffman';
        }
    }

    // Update the steps list and keep current step in view
    updateSteps() {
        if (!this.stepsContainer) return;
        this.stepsContainer.innerHTML = '';

        const currentStep = this.huffman.currentStep;

        // Lowercase everything except segments inside single quotes
        const toLowerExceptQuotes = (s) => {
            if (typeof s !== 'string') return s;
            const parts = s.split(/('.*?')/g); // keep quotes in result
            return parts.map((p, i) => (i % 2 === 1 ? p : p.toLowerCase())).join('');
        };

        this.huffman.steps.forEach((step, index) => {
            const stepEl = document.createElement('div');
            stepEl.className = `step ${index === currentStep ? 'highlight' : ''}`;
            const desc = toLowerExceptQuotes(step.description);
            stepEl.textContent = `${index + 1}. ${desc}`;
            this.stepsContainer.appendChild(stepEl);
        });

        // Render CURRENT step info (combining) in the dedicated box so it stays in sync
        const nextMergeBox = document.getElementById('next-merge-box');
        if (nextMergeBox) {
            const cur = this.huffman.steps[currentStep];
            let labelHtml = '';
            if (cur && typeof cur.description === 'string') {
                // Example: Combining nodes 'A' (5) and 'B' (9)
                const re = /Combining\s+nodes\s+(?:'([^']+)'|internal)\s*\((\d+)\)\s+and\s+(?:'([^']+)'|internal)\s*\((\d+)\)/i;
                const m = cur.description.match(re);
                if (m) {
                    const an = m[1] || 'internal';
                    const av = Number(m[2]);
                    const bn = m[3] || 'internal';
                    const bv = Number(m[4]);
                    const total = av + bv;
                    labelHtml = `${an}(${av}) + ${bn}(${bv}) <span class="arrow">→</span> <strong>${total}</strong>`;
                }
            }
            if (!labelHtml) {
                // Fallback to highlightNodes from current step
                const stepObj = this.huffman.steps[currentStep];
                const show = stepObj && Array.isArray(stepObj.highlightNodes) && stepObj.highlightNodes.length >= 2;
                if (show) {
                    const ids = stepObj.highlightNodes.slice(0, 2);
                    const collectNodes = (roots) => {
                        const out = [];
                        const stack = Array.isArray(roots) ? [...roots] : (roots ? [roots] : []);
                        while (stack.length) {
                            const n = stack.pop();
                            if (!n) continue;
                            out.push(n);
                            if (n.children) stack.push(...n.children);
                        }
                        return out;
                    };
                    const all = collectNodes(stepObj.nodes);
                    const byId = new Map(all.map(n => [n.id, n]));
                    const fmt = (n) => {
                        if (!n) return '';
                        const name = (n.name ?? '').toString();
                        const val = (n.value ?? n.freq ?? 0);
                        return name ? `${name}(${val})` : `${val}`;
                    };
                    const a = byId.get(ids[0]);
                    const b = byId.get(ids[1]);
                    if (a || b) {
                        const av = a ? (a.value ?? a.freq ?? 0) : 0;
                        const bv = b ? (b.value ?? b.freq ?? 0) : 0;
                        const total = av + bv;
                        labelHtml = `${fmt(a)} + ${fmt(b)} <span class="arrow">→</span> <strong>${total}</strong>`;
                    }
                }
            }
            if (labelHtml) {
                nextMergeBox.classList.remove('section-hidden');
                nextMergeBox.innerHTML = `<div class="step next-merge"><span class="label">current merge:</span> ${labelHtml}</div>`;
            } else {
                nextMergeBox.classList.add('section-hidden');
                nextMergeBox.innerHTML = '';
            }
        }

        // Mini Priority Queue panel
        const pqPanel = document.getElementById('pq-panel');
        if (pqPanel) {
            const stepObj = this.huffman.steps[currentStep];
            const nodesArr = Array.isArray(stepObj?.nodes) ? stepObj.nodes.slice() : [];
            if (nodesArr.length) {
                // Flatten forest to leaves+internals at top level; sort ascending by weight
                const flat = nodesArr.map(n => ({
                    name: (n.name ?? n.char ?? 'internal'),
                    value: (n.value ?? n.freq ?? 0),
                    id: n.id
                })).sort((a,b) => a.value - b.value || String(a.name).localeCompare(String(b.name)));
                const pair = Array.isArray(stepObj.highlightNodes) ? stepObj.highlightNodes.slice(0,2) : [];
                const itemsHtml = flat.map(it => {
                    const isMerge = pair.includes?.(it.id);
                    return `<li class="pq-item${isMerge ? ' merge' : ''}">${(it.name || 'internal')}(${it.value})</li>`;
                }).join('');
                pqPanel.classList.remove('section-hidden');
                pqPanel.innerHTML = `<div class="pq-title">priority queue</div><ul class="pq-list">${itemsHtml}</ul>`;
            } else {
                pqPanel.classList.add('section-hidden');
                pqPanel.innerHTML = '';
            }
        }

        // Merge annotation under tree (current merge summary)
        const ann = document.getElementById('merge-annotation');
        if (ann) {
            const stepObj = this.huffman.steps[currentStep];
            let summary = '';
            if (stepObj && typeof stepObj.description === 'string') {
                const re = /Combining\s+nodes\s+(?:'([^']+)'|internal)\s*\((\d+)\)\s+and\s+(?:'([^']+)'|internal)\s*\((\d+)\)/i;
                const m = stepObj.description.match(re);
                if (m) {
                    const an = m[1] || 'internal';
                    const av = Number(m[2]);
                    const bn = m[3] || 'internal';
                    const bv = Number(m[4]);
                    const total = av + bv;
                    const tie = (av === bv) ? ' (tie-break)' : '';
                    summary = `reason: pick the two smallest weights in the priority queue to minimize cost → ${av} and ${bv}${tie}. new node weight = <strong>${total}</strong> • legend: left=0, right=1`;
                }
            }
            if (summary) {
                ann.classList.remove('section-hidden');
                ann.innerHTML = summary;
            } else {
                ann.classList.add('section-hidden');
                ann.innerHTML = '';
            }
        }

        // Scroll only the steps container to keep current step in view (avoid page scroll)
        const currentStepEl = this.stepsContainer.querySelector('.step.highlight');
        if (currentStepEl) {
            const container = this.stepsContainer;
            const cTop = container.scrollTop;
            const cHeight = container.clientHeight;
            const elTop = currentStepEl.offsetTop;
            const elBottom = elTop + currentStepEl.offsetHeight;
            if (elTop < cTop) {
                container.scrollTo({ top: elTop - 8, behavior: 'auto' });
            } else if (elBottom > cTop + cHeight) {
                container.scrollTo({ top: elBottom - cHeight + 8, behavior: 'auto' });
            }
        }
    }
    
    // Section visibility management
    hideInputSection() {
        // Hide entire input row and main title
        if (this.inputSection) this.inputSection.classList.add('section-hidden');
        const mainTitle = document.getElementById('main-title');
        if (mainTitle) mainTitle.classList.add('section-hidden');
    }
    
    showInputSection() {
        if (this.inputSection) this.inputSection.classList.remove('section-hidden');
        const mainTitle = document.getElementById('main-title');
        if (mainTitle) mainTitle.classList.remove('section-hidden');
        // Hide tree page
        if (this.treePageTitle) this.treePageTitle.classList.add('section-hidden');
        if (this.treePageContainer) this.treePageContainer.classList.add('section-hidden');
    }
    
    hideTreeSection() {
        if (this.treePageTitle) this.treePageTitle.classList.add('section-hidden');
        if (this.treePageContainer) this.treePageContainer.classList.add('section-hidden');
    }
    
    showTreeSection() {
        if (this.treePageTitle) this.treePageTitle.classList.remove('section-hidden');
        if (this.treePageContainer) this.treePageContainer.classList.remove('section-hidden');
        // Hide input section
        if (this.inputSection) this.inputSection.classList.add('section-hidden');
        const mainTitle = document.getElementById('main-title');
        if (mainTitle) mainTitle.classList.add('section-hidden');
    }
    
    hideCodesSection() {
        if (this.codesSection) this.codesSection.classList.add('section-hidden');
        if (this.tableSection) this.tableSection.classList.add('section-hidden');
    }
    
    showCodesSection() {
        if (this.codesSection) this.codesSection.classList.remove('section-hidden');
        if (this.tableSection) this.tableSection.classList.remove('section-hidden');
    }
}

// Add runtime methods that were missing after refactors
HuffmanVisualizer.prototype.getChoreoDelay = function() {
    const step = this.huffman.getCurrentStep();
    const hasPair = Array.isArray(step?.highlightNodes) && step.highlightNodes.length >= 2;
    if (!hasPair) return 0;
    // Base 400ms at 1.0x, shorter at higher speeds, min 150ms
    return Math.max(150, Math.round(400 / (this.speedMultiplier || 1)));
};

HuffmanVisualizer.prototype.coreAdvanceStep = function() {
    let advanced = false;
    if (typeof this.huffman.nextStep === 'function') {
        advanced = !!this.huffman.nextStep();
    } else if (Array.isArray(this.huffman.steps)) {
        if (this.huffman.currentStep < (this.huffman.steps.length - 1)) {
            this.huffman.currentStep++;
            advanced = true;
        }
    }
    this.updateTree();
    this.updateSteps();
    this.updateControls(true);
    const isFinal = this.huffman.currentStep === (this.huffman.steps?.length - 1);
    if (isFinal && !this.initialCodesRendered) {
        this.updateHuffmanCodes();
        this.updateCodesTable();
        this.initialCodesRendered = true;
    }
    return advanced;
};

HuffmanVisualizer.prototype.step = function() {
    const step = this.huffman.getCurrentStep();
    const hasPair = Array.isArray(step?.highlightNodes) && step.highlightNodes.length >= 2;
    if (hasPair) {
        // Show choreography pose then advance
        this.updateTree({ choreo: true });
        const delay = this.getChoreoDelay();
        setTimeout(() => {
            this.coreAdvanceStep();
        }, delay);
        return true;
    }
    return this.coreAdvanceStep();
};

HuffmanVisualizer.prototype.togglePlay = function() {
    if (this.huffman.isPlaying) {
        // Pause
        if (this.playTimer) {
            clearTimeout(this.playTimer);
            this.playTimer = null;
        }
        if (typeof this.huffman.pause === 'function') this.huffman.pause();
        this.huffman.isPlaying = false;
        this.playBtn.textContent = 'play';
        this.playBtn.className = 'btn btn-outline-success fw-bold';
        return;
    }

    // Start playing (always use local fallback for reliability)
    this.huffman.isPlaying = true;
    this.playBtn.textContent = 'pause';
    this.playBtn.className = 'btn btn-warning fw-bold';
    const tick = () => {
        if (!this.huffman.isPlaying) return;
        const moved = this.step();
        if (!moved) {
            // reached end
            this.huffman.isPlaying = false;
            this.playBtn.textContent = 'play';
            this.playBtn.className = 'btn btn-outline-success fw-bold';
            this.playTimer = null;
            return;
        }
        const ms = this.huffman.animationSpeed || 600;
        const extra = this.getChoreoDelay();
        this.playTimer = setTimeout(tick, ms + extra);
    };
    tick();
};

HuffmanVisualizer.prototype.reset = function() {
    // Stop timers and pause engine
    if (this.playTimer) {
        clearTimeout(this.playTimer);
        this.playTimer = null;
    }
    if (typeof this.huffman.pause === 'function') this.huffman.pause();
    if (typeof this.huffman.reset === 'function') this.huffman.reset();
    // Jump to first step and keep controls enabled and tree visible
    this.huffman.currentStep = 0;
    this.huffman.isPlaying = false;
    this.updateControls(true);
    if (this.buildTreeBtn) this.buildTreeBtn.disabled = false;
    this.playBtn.textContent = 'play';
    this.playBtn.className = 'btn btn-outline-success fw-bold';
    this.prevPositions.clear();
    this.showTreeSection();
    const step = this.huffman.getCurrentStep && this.huffman.getCurrentStep();
    if (step && step.nodes) this.updateTree();
    this.updateSteps();
};

// Initialize the visualizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.huffmanVisualizer = new HuffmanVisualizer();
});

// Extend prototype with in-page export overlay
HuffmanVisualizer.prototype.openCodesPage = function() {
    // Build Huffman codes directly from the current frequency map to guarantee completeness
    const entriesFM = Array.from(this.currentFreqMap.entries());
    const buildCodesFromFreq = (pairs) => {
        if (!pairs.length) return new Map();
        // Node structure
        let nodes = pairs.map(([ch, freq]) => ({ ch, freq, left: null, right: null }));
        if (nodes.length === 1) {
            const only = nodes[0];
            const map = new Map();
            map.set(only.ch, '0');
            return map;
        }
        while (nodes.length > 1) {
            nodes.sort((a, b) => a.freq - b.freq || (a.ch || '').localeCompare(b.ch || ''));
            const a = nodes.shift();
            const b = nodes.shift();
            nodes.push({ ch: null, freq: a.freq + b.freq, left: a, right: b });
        }
        const root = nodes[0];
        const codes = new Map();
        const dfs = (n, prefix) => {
            if (!n) return;
            if (!n.left && !n.right) {
                codes.set(n.ch, prefix || '0');
                return;
            }
            dfs(n.left, prefix + '0');
            dfs(n.right, prefix + '1');
        };
        dfs(root, '');
        return codes;
    };
    let codesMap = buildCodesFromFreq(entriesFM);
    if (!codesMap.size && this.huffman && this.huffman.codes) {
        codesMap = this.huffman.codes;
    }

    const overlay = document.getElementById('export-overlay');
    if (!overlay) return;

    const codesEntries = Array.from(codesMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const freqEntries = Array.from(this.currentFreqMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const escape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    let totalBits = 0;
    let totalCount = 0;
    const tableRows = freqEntries.map(([ch, freq]) => {
        const code = codesMap.get(ch) || '';
        const bits = code.length * Number(freq || 0);
        totalBits += bits;
        totalCount += Number(freq || 0);
        const safeCh = ch === ' ' ? '␣' : ch;
        return `
            <tr>
                <td>${escape(safeCh)}</td>
                <td>${escape(freq)}</td>
                <td><code>${escape(code)}</code></td>
                <td>${escape(bits)}</td>
            </tr>
        `;
    }).join('');

    const originalBits = totalCount * 8;
    const savingsPct = originalBits > 0 ? Math.max(0, (1 - (totalBits / originalBits)) * 100) : 0;

    overlay.innerHTML = `
      <div class="container" style="max-width:1000px;margin:0 auto;">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h1 class="m-0">huffman codes</h1>
          <button id="close-export" class="btn btn-secondary">back to visualizer</button>
        </div>
        <div class="card">
          <div class="card-header">frequencies & codes</div>
          <div class="card-body">
            <div class="mb-3 d-flex flex-wrap gap-3" style="font-weight:700;color:#5a4a3a;">
              <div>estimated encoded size: <span style="font-weight:800;">${totalBits}</span> bits</div>
              <div>original size (8‑bit): <span style="font-weight:800;">${originalBits}</span> bits</div>
              <div>savings: <span style="font-weight:800;">${savingsPct.toFixed(1)}%</span></div>
            </div>
            <div class="codes mb-3" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;">
              ${codesEntries.map(([ch, code]) => `
                <div class="code-item"><span class="char">${escape(ch === ' ' ? '␣' : ch)}</span> <code>${escape(code)}</code></div>
              `).join('')}
            </div>
            <div class="table-responsive">
              <table class="table table-sm align-middle">
                <thead>
                  <tr><th>character</th><th>frequency</th><th>code</th><th>total bits</th></tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    overlay.classList.remove('section-hidden');

    const closeBtn = overlay.querySelector('#close-export');
    if (closeBtn) {
        closeBtn.onclick = () => {
            overlay.classList.add('section-hidden');
            overlay.innerHTML = '';
        };
    }
};

// Export current tree SVG as PNG (separate button on tree page)
HuffmanVisualizer.prototype.exportTreePNG = function() {
    try {
        const svgEl = document.getElementById('tree-svg');
        if (!svgEl) return;
        const width = svgEl.clientWidth || 1000;
        const height = svgEl.clientHeight || 600;

        // Clone SVG and inline key computed styles
        const clone = svgEl.cloneNode(true);
        clone.setAttribute('width', String(width));
        clone.setAttribute('height', String(height));
        const serializer = new XMLSerializer();

        const inlineStyles = (srcSvg, dstSvg) => {
            const srcElems = srcSvg.querySelectorAll('*');
            const dstElems = dstSvg.querySelectorAll('*');
            for (let i = 0; i < dstElems.length; i++) {
                const src = srcElems[i];
                const dst = dstElems[i];
                const comp = window.getComputedStyle(src);
                const keys = ['fill','stroke','stroke-width','opacity','font','font-size','font-weight','font-family','paint-order'];
                const style = keys.map(k => `${k}:${comp.getPropertyValue(k)}`).join(';');
                dst.setAttribute('style', `${dst.getAttribute('style') || ''};${style}`);
            }
        };
        inlineStyles(svgEl, clone);

        const svgStr = serializer.serializeToString(clone);
        const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const img = new Image();
        const scale = Math.max(1, Math.floor(window.devicePixelRatio || 1));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = getComputedStyle(document.body).backgroundColor || '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            canvas.toBlob(b => {
                if (!b) return;
                const a = document.createElement('a');
                a.href = URL.createObjectURL(b);
                a.download = 'huffman-tree.png';
                document.body.appendChild(a);
                a.click();
                a.remove();
            }, 'image/png');
        };
        img.onerror = () => URL.revokeObjectURL(url);
        img.src = url;
    } catch (e) {
        console.error('Export PNG failed', e);
        alert('export failed');
    }
};

// Toggle encoding function
HuffmanVisualizer.prototype.toggleEncoding = function() {
    this.showFixedLength = !this.showFixedLength;
    
    // Update button text
    if (this.toggleEncodingBtn) {
        this.toggleEncodingBtn.textContent = this.showFixedLength ? 'variable length' : 'fixed length';
    }
    
    // Update the table and metrics
    this.updateCodesTable();
};

// Zoom functions
HuffmanVisualizer.prototype.zoomIn = function() {
    this.zoomLevel = Math.min(2.0, this.zoomLevel + 0.1);
    this.applyZoom();
};

HuffmanVisualizer.prototype.zoomOut = function() {
    this.zoomLevel = Math.max(0.5, this.zoomLevel - 0.1);
    this.applyZoom();
};

HuffmanVisualizer.prototype.zoomReset = function() {
    this.zoomLevel = 1.0;
    this.applyZoom();
};

HuffmanVisualizer.prototype.applyZoom = function() {
    const treeSvg = document.getElementById('tree-svg');
    const treeReactRoot = document.getElementById('tree-react-root');
    
    if (treeSvg) {
        treeSvg.style.transform = `scale(${this.zoomLevel})`;
        treeSvg.style.transformOrigin = 'top center';
    }
    if (treeReactRoot) {
        treeReactRoot.style.transform = `scale(${this.zoomLevel})`;
        treeReactRoot.style.transformOrigin = 'top center';
    }
    
    // Update zoom display button
    if (this.zoomResetBtn) {
        this.zoomResetBtn.textContent = `${Math.round(this.zoomLevel * 100)}%`;
    }
};
