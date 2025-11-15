// React + Framer Motion tree renderer for the Huffman visualizer
// Exposes a global function: window.renderTreeWithMotion(props)
// Requires React 18 UMD, ReactDOM UMD, and framer-motion UMD to be loaded.

(function() {
  const React = window.React;
  const ReactDOM = window.ReactDOM;
  const FM = (window.framerMotion || window['framer-motion'] || window.framerMotionUmd || window.FramerMotion || {});
  const motion = FM && FM.motion;
  const AnimatePresence = (FM && FM.AnimatePresence) || null;
  const hasFM = !!(motion && AnimatePresence);
  if (!React || !ReactDOM) {
    console.error('React/ReactDOM not found.');
    return;
  }

  function LinkPath({ id, d, highlighted, depth = 0, speedMultiplier, edgeVersion = 0 }) {
    if (hasFM) {
      const delayUnit = Math.max(0, 0.06 / (speedMultiplier || 1));
      return (
        React.createElement(motion.path, {
          key: `${id}-${edgeVersion}`,
          d,
          className: 'link',
          initial: { pathLength: 0, opacity: 0.3, translateY: 10 },
          animate: { pathLength: 1, opacity: 1, translateY: 0 },
          transition: { duration: Math.max(0.12, 0.6 / (speedMultiplier || 1)), ease: 'easeInOut', delay: depth * delayUnit },
          style: highlighted ? { strokeWidth: 3 } : undefined
        })
      );
    }
    return React.createElement('path', { key: id, d, className: 'link', style: highlighted ? { strokeWidth: 3 } : undefined });
  }

  function EdgeLabel({ id, x, y, text, depth = 0, speedMultiplier }) {
    if (hasFM) {
      const delayUnit = Math.max(0, 0.06 / (speedMultiplier || 1));
      return (
        React.createElement(motion.text, {
          key: id,
          className: 'edge-label',
          x, y,
          initial: { opacity: 0, y: y - 8 },
          animate: { opacity: 1, y },
          transition: { duration: Math.max(0.12, 0.35 / (speedMultiplier || 1)), ease: 'easeInOut', delay: depth * delayUnit }
        }, text)
      );
    }
    return React.createElement('text', { key: id, className: 'edge-label', x, y }, text);
  }

  function NodeGroup({ node, isHighlighted, isMerging, speedMultiplier }) {
    const { id, x, y, isLeaf, name, value, showWeights, code, colorFill } = node;
    const label = isLeaf ? (showWeights ? `${name}(${value})` : name) : `${value}`;

    if (hasFM) {
      const delayUnit = Math.max(0, 0.06 / (speedMultiplier || 1));
      const depth = node.depth || 0;
      return (
        React.createElement(motion.g, {
          key: id,
          className: `node ${isLeaf ? 'leaf' : 'internal'} ${isHighlighted ? 'highlight' : ''} ${isMerging ? 'merging' : ''}`,
          initial: { opacity: 0, scale: 0.92, x, y },
          animate: { opacity: 1, scale: isMerging ? 1.06 : 1, x, y },
          exit: { opacity: 0, scale: 0.9 },
          transition: { duration: Math.max(0.18, 0.55 / (speedMultiplier || 1)), ease: 'easeInOut', delay: depth * delayUnit }
        },
          React.createElement('circle', {
            r: 7,
            style: (colorFill ? { fill: colorFill } : undefined)
          }),
          React.createElement('text', { textAnchor: 'middle', dy: '0.35em' }, label),
          (isLeaf && code) ? React.createElement('text', { className: 'code-label', textAnchor: 'middle', dy: '2.2em' }, code) : null
        )
      );
    }
    return (
      React.createElement('g', {
        key: id,
        className: `node ${isLeaf ? 'leaf' : 'internal'} ${isHighlighted ? 'highlight' : ''} ${isMerging ? 'merging' : ''}`,
        transform: `translate(${x},${y})`
      },
        React.createElement('circle', { r: 7, style: colorFill ? { fill: colorFill } : undefined }),
        React.createElement('text', { textAnchor: 'middle', dy: '0.35em' }, label),
        (isLeaf && code) ? React.createElement('text', { className: 'code-label', textAnchor: 'middle', dy: '2.2em' }, code) : null
      )
    );
  }

  function TreeSVG({ width, height, margin, nodes, links, highlightIds, mergingIds, speedMultiplier, edgeVersion = 0 }) {
    const gTransform = `translate(${margin.left}, ${margin.top})`;

    return (
      React.createElement('svg', { width, height, style: { display: 'block' } },
        React.createElement('g', { className: 'canvas', transform: gTransform },
          // Links
          (hasFM ? React.createElement(AnimatePresence, null,
            links.map(link => LinkPath({ id: link.id, d: link.d, highlighted: false, depth: link.depth, speedMultiplier, edgeVersion }))
          ) : links.map(link => LinkPath({ id: link.id, d: link.d, highlighted: false }))),
          // Edge labels
          links.filter(l => !!l.label).map(l => EdgeLabel({ id: `${l.id}-lbl`, x: l.lx, y: l.ly, text: l.label, depth: l.depth, speedMultiplier })),
          // Nodes
          (hasFM ? React.createElement(AnimatePresence, null,
            nodes.map(n => NodeGroup({ node: n, isHighlighted: highlightIds.includes(n.id), isMerging: mergingIds.includes(n.id), speedMultiplier }))
          ) : nodes.map(n => NodeGroup({ node: n, isHighlighted: highlightIds.includes(n.id), isMerging: mergingIds.includes(n.id) })))
        )
      )
    );
  }

  let root = null;

  window.renderTreeWithMotion = function renderTreeWithMotion(props) {
    const container = document.getElementById('tree-react-root');
    if (!container) return;

    const { width, height } = props;

    // Mount root once (React 18) or fallback to legacy render
    if (ReactDOM.createRoot) {
      if (!root) {
        root = ReactDOM.createRoot(container);
      }
      root.render(React.createElement(TreeSVG, props));
    } else {
      // Legacy React 17 fallback
      ReactDOM.render(React.createElement(TreeSVG, props), container);
    }
  };

  // --- DOM element references for codes section ---
  function initElements() {
    this.codesTableBody = document.getElementById('codes-table');
    // Sections for codes display — ensure references point to actual DOM elements
    this.codesSection = document.getElementById('codes-card');
    this.tableSection = document.querySelector('#codes-card .table-responsive');
  }

  // Hide the codes section (left card and table container)
  function hideCodesSection() {
      const codesEl = this.codesSection || document.getElementById('codes-card');
      const tableEl = this.tableSection || document.querySelector('#codes-card .table-responsive');
      if (codesEl) codesEl.classList.add('section-hidden');
      if (tableEl) tableEl.classList.add('section-hidden');
  }

  // Show the codes section (left card and table container)
  function showCodesSection() {
      const codesEl = this.codesSection || document.getElementById('codes-card');
      const tableEl = this.tableSection || document.querySelector('#codes-card .table-responsive');
      if (codesEl) codesEl.classList.remove('section-hidden');
      if (tableEl) tableEl.classList.remove('section-hidden');
  }
})();
