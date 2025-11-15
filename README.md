# Huffman Coding Visualizer 🐌

An interactive web-based visualization tool for understanding the Huffman coding algorithm. Watch as characters are combined into a binary tree step-by-step, and see how variable-length codes are generated to optimize data compression.

![Huffman Coding Visualizer](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Interactive Tree Building**: Visualize the step-by-step construction of a Huffman tree with smooth animations
- **Multiple Input Methods**:
  - Manual input: Enter characters and their frequencies
  - Text analysis: Automatically analyze text and calculate character frequencies
  - Sample data: Quick start with pre-configured examples
- **Step-by-Step Navigation**: Use prev/next buttons to move through each step of the algorithm
- **Play/Pause Animation**: Automatically play through all steps with adjustable speed
- **Priority Queue Visualization**: See the current state of the priority queue at each step
- **Huffman Codes Display**: View the generated variable-length codes for each character
- **Compression Metrics**: Compare Huffman encoding with ASCII 8-bit encoding to see compression savings
- **Encoding Comparison**: Toggle between variable-length (Huffman) and fixed-length encoding to compare compression efficiency
- **Export Functionality**: Export the tree visualization as a PNG image
- **Zoom Controls**: Zoom in/out on the tree for better visibility
- **Responsive Design**: Works on desktop and mobile devices

## How It Works

Huffman coding is a lossless data compression algorithm that assigns variable-length binary codes to characters based on their frequency. Characters that appear more frequently get shorter codes, resulting in optimal compression.

The algorithm:
1. Creates a leaf node for each unique character with its frequency
2. Repeatedly combines the two nodes with the lowest frequencies
3. Assigns '0' to left edges and '1' to right edges
4. Generates codes by traversing from root to each leaf

### Encoding Types

The visualizer supports two encoding methods:

- **Variable-Length Encoding (Huffman)**: Each character gets a code whose length is inversely proportional to its frequency. More frequent characters get shorter codes, resulting in optimal compression. This is the standard Huffman coding approach.

- **Fixed-Length Encoding**: All characters are encoded using the same number of bits, calculated as `⌈log₂(n)⌉` where `n` is the number of unique characters. This provides a baseline for comparison and demonstrates why variable-length encoding is more efficient for non-uniform character distributions.

## Getting Started

### Prerequisites

No build tools or dependencies are required! This is a static web application that runs entirely in the browser.

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/huffman-visualizer-nandita2024ucd2126.git
cd huffman-visualizer-nandita2024ucd2126
```

2. Open `index.html` in a web browser:
   - Simply double-click the file, or
   - Use a local web server (recommended):
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Node.js (with http-server)
     npx http-server
     
     # Then open http://localhost:8000 in your browser
     ```

### Usage

1. **Choose an input method**:
   - **Manual Input**: Click "add character" to add rows, enter a character and its frequency
   - **Text Analysis**: Paste or type text in the text area
   - **Sample Data**: Select from pre-configured examples

2. **Build the tree**: Click "build huffman tree" to start the visualization

3. **Navigate the steps**:
   - Use **prev/next** buttons to move step-by-step
   - Click **play** to automatically animate through all steps
   - Adjust speed with the **+/-** buttons (0.25× to 2.00×)
   - Click **reset** to return to the first step

4. **Explore the results**:
   - View the generated Huffman codes in the table
   - See compression metrics (savings compared to ASCII)
   - **Toggle encoding type**: Click the "fixed length" button to switch between variable-length (Huffman) and fixed-length encoding
   - Compare compression efficiency between the two encoding methods
   - Export the tree as PNG

## Project Structure

```
huffman-visualizer-nandita2024ucd2126/
├── index.html          # Main HTML file
├── styles.css          # Styling and layout
├── huffman.js          # Huffman algorithm implementation
├── visualizer.js       # Main visualization logic and UI controls
├── tree-renderer.js    # React-based tree rendering (optional)
└── README.md           # This file
```

## Technologies Used

- **HTML5/CSS3**: Structure and styling
- **JavaScript (ES6+)**: Core functionality
- **Bootstrap 5**: UI components and responsive layout
- **D3.js**: Tree layout and SVG rendering
- **React 18** (optional): Alternative tree rendering with Framer Motion

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

Note: Modern browsers with ES6+ support are required.

## Features in Detail

### Input Methods

- **Manual Input**: Perfect for understanding how frequencies affect the tree structure
- **Text Analysis**: Automatically counts character frequencies from any text input
- **Sample Data**: Quick examples including basic characters, vowels, and binary digits

### Visualization Features

- **Animated Transitions**: Smooth animations show nodes moving and merging
- **Highlighting**: Nodes being merged are highlighted with visual effects
- **Edge Labels**: Binary codes (0/1) are shown on tree edges
- **Code Display**: Final Huffman codes appear below leaf nodes
- **Priority Queue**: See the current state of nodes waiting to be merged

### Controls

- **Speed Control**: Adjust animation speed from 0.25× (slow) to 2.00× (fast)
- **Zoom**: Zoom in/out on the tree (50% to 200%)
- **Show Weights**: Toggle frequency display on nodes
- **Gingham Background**: Toggle decorative background pattern

## Algorithm Explanation

The visualization shows:

1. **Initial State**: All characters as separate leaf nodes with their frequencies
2. **Merging Steps**: Two nodes with minimum frequencies are combined
3. **Tree Growth**: Internal nodes are created with combined frequencies
4. **Final Tree**: Complete binary tree with all characters as leaves
5. **Code Generation**: Binary codes assigned by traversing from root to leaves

## Compression Analysis

The tool calculates compression metrics for both encoding types:

### Variable-Length (Huffman) Encoding
- **Huffman Size**: Sum of (code length × frequency) for all characters
- **Original Size**: Total characters × 8 bits (ASCII encoding)
- **Savings**: Percentage reduction in bits compared to ASCII

### Fixed-Length Encoding
- **Fixed-Length Size**: Total characters × ⌈log₂(unique characters)⌉ bits
- **Original Size**: Total characters × 8 bits (ASCII encoding)
- **Comparison**: See how fixed-length encoding compares to both ASCII and Huffman encoding

The visualizer allows you to toggle between encoding types in real-time to see the difference in compression efficiency. Variable-length Huffman encoding typically achieves better compression when character frequencies are unevenly distributed.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Built for educational purposes to help visualize the Huffman coding algorithm
- Inspired by the need for better algorithm visualization tools

## Author

Created by nandita2024ucd2126

---

**Enjoy exploring Huffman coding!** 🎉

