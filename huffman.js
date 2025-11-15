class HuffmanNode {
    constructor(char, freq, left = null, right = null) {
        this.char = char;
        this.freq = freq;
        this.left = left;
        this.right = right;
        this.id = Math.random().toString(36).substr(2, 9);
    }

    isLeaf() {
        return !this.left && !this.right;
    }
}

class HuffmanCoding {
    constructor() {
        this.codes = new Map();
        this.steps = [];
        this.currentStep = 0;
        this.animationSpeed = 500;
        this.isPlaying = false;
        this.animationTimeout = null;
    }

    // Build frequency map from text
    buildFrequencyMap(text) {
        const freqMap = new Map();
        for (const char of text) {
            freqMap.set(char, (freqMap.get(char) || 0) + 1);
        }
        return freqMap;
    }

    // Build Huffman Tree
    buildTree(freqMap) {
        this.steps = [];
        this.currentStep = 0;
        
        // Create leaf nodes
        const nodes = [];
        for (const [char, freq] of freqMap.entries()) {
            nodes.push(new HuffmanNode(char, freq));
        }

        // Sort nodes by frequency
        nodes.sort((a, b) => a.freq - b.freq);

        // Add initial step
        this.addStep("Starting with the following nodes:", [...nodes]);

        // Build tree
        while (nodes.length > 1) {
            // Sort nodes by frequency (in case it's not sorted)
            nodes.sort((a, b) => a.freq - b.freq);

            // Get two nodes with minimum frequency
            const left = nodes.shift();
            const right = nodes.shift();

            // Add step showing which nodes are being combined
            this.addStep(`Combining nodes '${left.char || 'internal'}' (${left.freq}) and '${right.char || 'internal'}' (${right.freq})`, 
                         [new HuffmanNode(null, left.freq + right.freq, left, right), ...nodes],
                         [left.id, right.id]);

            // Create new internal node
            const internalNode = new HuffmanNode(null, left.freq + right.freq, left, right);
            nodes.unshift(internalNode);
        }

        // Add final step
        this.addStep("Huffman tree construction complete!");
        
        return nodes[0];
    }

    // Generate Huffman codes
    generateCodes(node, path = '') {
        if (node.isLeaf()) {
            this.codes.set(node.char, path);
            return;
        }
        this.generateCodes(node.left, path + '0');
        this.generateCodes(node.right, path + '1');
    }

    // Add a step to the visualization
    addStep(description, nodes = null, highlightNodes = []) {
        this.steps.push({
            description,
            nodes: nodes ? nodes.map(n => this.cloneNode(n)) : null,
            highlightNodes: highlightNodes || []
        });
    }

    // Helper to clone a node for the steps
    cloneNode(node) {
        if (!node) return null;
        const clone = new HuffmanNode(node.char, node.freq);
        clone.id = node.id;
        clone.left = this.cloneNode(node.left);
        clone.right = this.cloneNode(node.right);
        return clone;
    }

    // Get the current step
    getCurrentStep() {
        return this.steps[this.currentStep];
    }

    // Go to next step
    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            return true;
        }
        return false;
    }

    // Go to previous step
    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            return true;
        }
        return false;
    }

    // Reset to initial state
    reset() {
        this.currentStep = 0;
        this.codes.clear();
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
            this.animationTimeout = null;
        }
        this.isPlaying = false;
    }

    // Play animation
    play(callback) {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        const playStep = () => {
            if (!this.nextStep() || !this.isPlaying) {
                this.isPlaying = false;
                if (callback) callback();
                return;
            }
            
            if (callback) callback();
            
            this.animationTimeout = setTimeout(() => {
                playStep();
            }, this.animationSpeed);
        };
        
        playStep();
    }

    // Pause animation
    pause() {
        this.isPlaying = false;
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
            this.animationTimeout = null;
        }
    }

    // Set animation speed (lower is faster, higher is slower)
    setAnimationSpeed(speed) {
        // Speed range: 100-2000
        // Slow down: multiply by 2 for slower animations
        // 100 = 200ms (fast), 2000 = 4000ms (very slow)
        this.animationSpeed = speed * 2;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HuffmanNode, HuffmanCoding };
}
