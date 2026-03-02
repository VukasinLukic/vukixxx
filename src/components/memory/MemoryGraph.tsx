import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { usePromptStore } from '@/stores/promptStore';
import { GRAPH_COLORS, NODE_SIZES } from '@/types/categories';
import type { Prompt, GraphNode, GraphLink, GraphData } from '@/types';

// Build graph data from prompts (extracted from component for reuse)
function buildGraphData(prompts: Prompt[]): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeIds = new Set<string>();

  const addNode = (id: string, name: string, type: GraphNode['type'], category: string, content?: string) => {
    if (nodeIds.has(id)) return;
    nodes.push({
      id,
      name,
      type,
      category: category as GraphNode['category'],
      val: NODE_SIZES[type] || NODE_SIZES.prompt,
      color: GRAPH_COLORS[category] || GRAPH_COLORS[type] || GRAPH_COLORS.other,
      content,
    });
    nodeIds.add(id);
  };

  for (const prompt of prompts) {
    const type = prompt.type === 'root' ? 'root' : 'prompt';
    addNode(prompt.id, prompt.label, type, prompt.category, prompt.bodyContent);

    if (prompt.parent) {
      links.push({ source: prompt.parent, target: prompt.id });
    }
  }

  // Create phantom nodes for missing parents
  for (const link of links) {
    if (!nodeIds.has(link.source as string)) {
      addNode(link.source as string, link.source as string, 'phantom', 'phantom');
    }
  }

  return { nodes, links };
}

interface MemoryGraphProps {
  onNodeSelect?: (node: GraphNode) => void;
  onAddPrompt?: () => void;
}

export const MemoryGraph: React.FC<MemoryGraphProps> = ({ onNodeSelect, onAddPrompt }) => {
  // Consume from store instead of duplicate import.meta.glob
  const prompts = usePromptStore(state => state.prompts);

  const graphData = useMemo(() => {
    return buildGraphData(Array.from(prompts.values()));
  }, [prompts]);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const fgRef = useRef<any>();

  // Texture cache to prevent memory leaks
  const textureCache = useRef(new Map<string, THREE.CanvasTexture>());
  const materialCache = useRef(new Map<string, THREE.MeshBasicMaterial>());

  // Cleanup on unmount - dispose all cached GPU resources
  useEffect(() => {
    return () => {
      textureCache.current.forEach(tex => tex.dispose());
      textureCache.current.clear();
      materialCache.current.forEach(mat => mat.dispose());
      materialCache.current.clear();
    };
  }, []);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    onNodeSelect?.(node);

    if (fgRef.current) {
      const distance = 120;
      const distRatio = 1 + distance / Math.hypot(node.x || 0, node.y || 0, node.z || 0);
      fgRef.current.cameraPosition(
        { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio },
        node,
        800,
      );
    }
  }, [onNodeSelect]);

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);
    document.body.style.cursor = node ? 'pointer' : 'default';
  }, []);

  // Optimized node rendering with texture caching
  const nodeThreeObject = useCallback((node: GraphNode) => {
    const group = new THREE.Group();
    const isHighlighted = hoveredNode?.id === node.id || selectedNode?.id === node.id;

    // Circle geometry (shared via Three.js internal cache)
    const geometry = new THREE.CircleGeometry(node.val, 32);
    const material = new THREE.MeshBasicMaterial({
      color: node.color,
      transparent: true,
      opacity: isHighlighted ? 1 : 0.85,
      side: THREE.DoubleSide,
    });
    const circle = new THREE.Mesh(geometry, material);
    group.add(circle);

    // Highlight ring
    if (isHighlighted) {
      const ringGeometry = new THREE.RingGeometry(node.val + 1, node.val + 2, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: '#1d1d1f',
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      group.add(ring);
    }

    // Text label with texture caching
    const cacheKey = `${node.id}-${isHighlighted}`;
    let texture = textureCache.current.get(cacheKey);

    if (!texture) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 512;
      canvas.height = 128;

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#1d1d1f';
      context.font = `${isHighlighted ? '600' : '500'} 36px -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(node.name, 256, 64);

      texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      textureCache.current.set(cacheKey, texture);
    }

    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: isHighlighted ? 1 : 0.8,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(40, 10, 1);
    sprite.position.y = node.val + 10;
    group.add(sprite);

    return group;
  }, [hoveredNode, selectedNode]);

  const linkColor = useCallback(() => 'rgba(29, 29, 31, 0.15)', []);

  const resetCamera = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.cameraPosition({ x: 0, y: 50, z: 250 }, { x: 0, y: 0, z: 0 }, 800);
    }
    setSelectedNode(null);
  }, []);

  // Build legend from actual categories in graph
  const legendCategories = useMemo(() => {
    const cats = new Set<string>();
    for (const node of graphData.nodes) {
      if (node.category !== 'phantom') {
        cats.add(node.category);
      }
    }
    return Array.from(cats).map(cat => ({
      key: cat,
      color: GRAPH_COLORS[cat] || GRAPH_COLORS.other,
    }));
  }, [graphData]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#f5f5f7' }}>
      {/* Top toolbar */}
      <div style={{
        position: 'absolute', top: 20, left: 20, right: 20, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
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
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
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
              gap: 6,
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            Add Prompt
          </button>
        )}
      </div>

      {/* Legend - dynamic from actual data */}
      <div style={{
        position: 'absolute', bottom: 100, left: 20, zIndex: 100,
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '12px 16px',
        borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.06)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#86868b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Categories
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {legendCategories.map(({ key, color }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 12, color: '#1d1d1f', textTransform: 'capitalize' }}>{key}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected node info */}
      {selectedNode && (
        <div style={{
          position: 'absolute', top: 80, right: 20, zIndex: 100,
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: 20, borderRadius: 12,
          border: '1px solid rgba(0,0,0,0.06)',
          minWidth: 220,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: selectedNode.color }} />
            <span style={{ fontWeight: 600, fontSize: 15, color: '#1d1d1f' }}>{selectedNode.name}</span>
          </div>
          <div style={{ fontSize: 12, color: '#86868b', lineHeight: 1.8 }}>
            <div><span style={{ color: '#1d1d1f' }}>ID:</span> {selectedNode.id}</div>
            <div><span style={{ color: '#1d1d1f' }}>Type:</span> {selectedNode.type}</div>
            <div><span style={{ color: '#1d1d1f' }}>Category:</span> {selectedNode.category}</div>
          </div>
          <button
            onClick={() => onNodeSelect?.(selectedNode)}
            style={{
              marginTop: 16, width: '100%', padding: '10px 16px',
              background: '#1d1d1f', border: 'none', borderRadius: 8,
              cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#fff',
            }}
          >
            Open Prompt
          </button>
        </div>
      )}

      {/* 3D Graph */}
      {graphData.nodes.length > 0 && (
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          backgroundColor="rgba(0,0,0,0)"
          showNavInfo={false}
          dagMode="td"
          dagLevelDistance={60}
          nodeThreeObject={nodeThreeObject}
          nodeThreeObjectExtend={false}
          linkColor={linkColor}
          linkWidth={0.5}
          linkOpacity={0.4}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onBackgroundClick={() => setSelectedNode(null)}
          controlType="orbit"
          enableNodeDrag={false}
          warmupTicks={100}
          cooldownTicks={0}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />
      )}
    </div>
  );
};
