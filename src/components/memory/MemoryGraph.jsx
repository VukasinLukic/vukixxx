import React, { useState, useEffect, useCallback, useRef } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';

// Apple-inspired muted color palette
const CATEGORY_COLORS = {
    root: '#1d1d1f',      // Near black - Master/Root
    core: '#6e6e73',      // Gray - Core context
    design: '#bf5af2',    // Purple - Design prompts
    backend: '#30d158',   // Green - Backend
    marketing: '#ff453a', // Red - Marketing
    other: '#98989d',     // Light gray - Other
    phantom: '#d1d1d6'    // Very light gray - Phantom nodes
};

// Minimal node sizes
const NODE_SIZES = {
    root: 6,
    core: 4,
    prompt: 3,
    phantom: 2
};

// Data processing helper
const processPrompts = (modules) => {
    const nodes = [];
    const links = [];
    const nodeIds = new Set();
    const nodeMap = new Map();

    const addNode = (id, name, type, category, content = null) => {
        if (!nodeIds.has(id)) {
            const node = {
                id,
                name,
                type,
                category: category || 'other',
                val: NODE_SIZES[type] || NODE_SIZES.prompt,
                color: CATEGORY_COLORS[category] || CATEGORY_COLORS[type] || CATEGORY_COLORS.other,
                content
            };
            nodes.push(node);
            nodeIds.add(id);
            nodeMap.set(id, node);
        }
    };

    for (const path in modules) {
        const content = modules[path];
        const idMatch = content.match(/id:\s*(.*)/);
        const labelMatch = content.match(/label:\s*(.*)/);
        const parentMatch = content.match(/parent:\s*(.*)/);
        const categoryMatch = content.match(/category:\s*(.*)/);
        const typeMatch = content.match(/type:\s*(.*)/);

        const id = idMatch ? idMatch[1].trim() : path;
        const label = labelMatch ? labelMatch[1].trim() : path.split('/').pop().replace('.md', '');
        const parent = parentMatch ? parentMatch[1].trim() : null;
        const category = categoryMatch ? categoryMatch[1].trim() : 'other';
        const type = typeMatch ? typeMatch[1].trim() : (parent ? 'prompt' : 'root');

        addNode(id, label, type, category, content);

        if (parent) {
            links.push({ source: parent, target: id });
        }
    }

    links.forEach(link => {
        if (!nodeIds.has(link.source)) {
            addNode(link.source, link.source, 'phantom', 'phantom');
        }
    });

    return { nodes, links };
};

export const MemoryGraph = ({ onNodeSelect, onAddPrompt }) => {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [selectedNode, setSelectedNode] = useState(null);
    const [hoveredNode, setHoveredNode] = useState(null);
    const fgRef = useRef();

    useEffect(() => {
        const modules = import.meta.glob('../../prompts/*.md', { query: '?raw', import: 'default', eager: true });
        const data = processPrompts(modules);
        setGraphData(data);
    }, []);

    const handleNodeClick = useCallback((node) => {
        setSelectedNode(node);
        if (onNodeSelect) {
            onNodeSelect(node);
        }

        if (fgRef.current) {
            const distance = 120;
            const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
            fgRef.current.cameraPosition(
                { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                node,
                800
            );
        }
    }, [onNodeSelect]);

    const handleNodeHover = useCallback((node) => {
        setHoveredNode(node);
        document.body.style.cursor = node ? 'pointer' : 'default';
    }, []);

    // Clean, minimal node rendering - simple dots with text
    const nodeThreeObject = useCallback((node) => {
        const group = new THREE.Group();
        const isHighlighted = hoveredNode?.id === node.id || selectedNode?.id === node.id;

        // Simple circle/dot - using a flat ring for cleaner look
        const geometry = new THREE.CircleGeometry(node.val, 32);
        const material = new THREE.MeshBasicMaterial({
            color: node.color,
            transparent: true,
            opacity: isHighlighted ? 1 : 0.85,
            side: THREE.DoubleSide
        });
        const circle = new THREE.Mesh(geometry, material);
        group.add(circle);

        // Subtle ring outline for selected node
        if (isHighlighted) {
            const ringGeometry = new THREE.RingGeometry(node.val + 1, node.val + 2, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: '#1d1d1f',
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            group.add(ring);
        }

        // Clean black text label - SF Pro style
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;

        // Clear background
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Black text, SF Pro style
        context.fillStyle = '#1d1d1f';
        context.font = `${isHighlighted ? '600' : '500'} 36px -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(node.name, 256, 64);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: isHighlighted ? 1 : 0.8
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(40, 10, 1);
        sprite.position.y = node.val + 10;
        group.add(sprite);

        return group;
    }, [hoveredNode, selectedNode]);

    // Thin, clean links
    const linkColor = useCallback(() => {
        return 'rgba(29, 29, 31, 0.15)';
    }, []);

    const resetCamera = useCallback(() => {
        if (fgRef.current) {
            fgRef.current.cameraPosition({ x: 0, y: 50, z: 250 }, { x: 0, y: 0, z: 0 }, 800);
        }
        setSelectedNode(null);
    }, []);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#f5f5f7' }}>
            {/* Top toolbar - Apple style */}
            <div style={{
                position: 'absolute',
                top: 20,
                left: 20,
                right: 20,
                zIndex: 100,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={resetCamera}
                        style={{
                            padding: '8px 16px',
                            background: 'rgba(255,255,255,0.8)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(0,0,0,0.08)',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#1d1d1f',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
                        }}
                    >
                        Reset View
                    </button>
                </div>

                {onAddPrompt && (
                    <button
                        onClick={onAddPrompt}
                        style={{
                            padding: '8px 20px',
                            background: '#1d1d1f',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#fff',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                        }}
                    >
                        <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
                        Add Prompt
                    </button>
                )}
            </div>

            {/* Legend - minimal Apple style */}
            <div style={{
                position: 'absolute',
                bottom: 100,
                left: 20,
                zIndex: 100,
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid rgba(0,0,0,0.06)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
            }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#86868b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Categories</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {Object.entries(CATEGORY_COLORS).filter(([k]) => !['phantom', 'other'].includes(k)).map(([key, color]) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: color
                            }} />
                            <span style={{ fontSize: 12, color: '#1d1d1f', textTransform: 'capitalize' }}>{key}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Selected node info */}
            {selectedNode && (
                <div style={{
                    position: 'absolute',
                    top: 80,
                    right: 20,
                    zIndex: 100,
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    padding: 20,
                    borderRadius: 12,
                    border: '1px solid rgba(0,0,0,0.06)',
                    minWidth: 220,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 16
                    }}>
                        <div style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: selectedNode.color
                        }} />
                        <span style={{ fontWeight: 600, fontSize: 15, color: '#1d1d1f' }}>{selectedNode.name}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#86868b', lineHeight: 1.8 }}>
                        <div><span style={{ color: '#1d1d1f' }}>ID:</span> {selectedNode.id}</div>
                        <div><span style={{ color: '#1d1d1f' }}>Type:</span> {selectedNode.type}</div>
                        <div><span style={{ color: '#1d1d1f' }}>Category:</span> {selectedNode.category}</div>
                    </div>
                    <button
                        onClick={() => onNodeSelect && onNodeSelect(selectedNode)}
                        style={{
                            marginTop: 16,
                            width: '100%',
                            padding: '10px 16px',
                            background: '#1d1d1f',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#fff'
                        }}
                    >
                        Open Prompt
                    </button>
                </div>
            )}

            {/* 3D Graph - Clean configuration */}
            {graphData.nodes.length > 0 && (
                <ForceGraph3D
                    ref={fgRef}
                    graphData={graphData}
                    backgroundColor="rgba(0,0,0,0)"
                    showNavInfo={false}

                    // Hierarchical tree layout
                    dagMode="td"
                    dagLevelDistance={60}

                    // Node configuration
                    nodeThreeObject={nodeThreeObject}
                    nodeThreeObjectExtend={false}

                    // Clean thin links - no particles
                    linkColor={linkColor}
                    linkWidth={0.5}
                    linkOpacity={0.4}

                    // Interaction
                    onNodeClick={handleNodeClick}
                    onNodeHover={handleNodeHover}
                    onBackgroundClick={() => setSelectedNode(null)}

                    // Camera
                    controlType="orbit"
                    enableNodeDrag={false}

                    // Physics
                    warmupTicks={100}
                    cooldownTicks={0}
                    d3AlphaDecay={0.02}
                    d3VelocityDecay={0.3}
                />
            )}
        </div>
    );
};
