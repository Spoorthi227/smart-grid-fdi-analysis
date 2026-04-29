'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Play, Pause, RotateCcw } from 'lucide-react';
import type { AttackEvent } from '@/lib/api';

interface AttackPropagationProps {
  attacks: AttackEvent[];
}

interface Node {
  id: string;
  type: 'bus';
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface Link {
  source: string;
  target: string;
}

export function AttackPropagation({ attacks }: AttackPropagationProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(100);

  useEffect(() => {
    if (!svgRef.current || attacks.length === 0) return;

    // Calculate timeline duration
    const minTime = Math.min(...attacks.map(a => a.timestamp));
    const maxTime = Math.max(...attacks.map(a => a.timestamp));
    const newDuration = maxTime - minTime || 100;
    setDuration(newDuration);

    // Get unique buses involved in attacks
    const busSet = new Set<number>();
    attacks.forEach(attack => {
      busSet.add(attack.source_bus);
      busSet.add(attack.target_bus);
    });

    // Create nodes with string IDs
    const nodes: Node[] = Array.from(busSet)
      .sort()
      .map(id => ({
        id: String(id),
        type: 'bus',
      }));

    // All possible links
    const allLinks: Link[] = attacks.map(attack => ({
      source: String(attack.source_bus),
      target: String(attack.target_bus),
    }));

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Create SVG structure
    const svg = d3.select(svgRef.current);
    const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);

    // Create simulation with all nodes
    const simulation = d3
      .forceSimulation(nodes)
      .force('link', d3.forceLink<Node, Link>(allLinks).id((d: Node) => d.id).distance(120).strength(0.3))
      .force('charge', d3.forceManyBody<Node>().strength(-300).distanceMax(500))
      .force('center', d3.forceCenter<Node>(0, 0).strength(0.05))
      .stop();

    simulationRef.current = simulation;

    // Run simulation steps to initialize positions
    for (let i = 0; i < 300; ++i) simulation.tick();

    // Arrow markers
    svg
      .append('defs')
      .selectAll('marker')
      .data(['active', 'inactive'])
      .enter()
      .append('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('markerWidth', 20)
      .attr('markerHeight', 20)
      .attr('refX', 35)
      .attr('refY', 3)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L0,6 L9,3 z')
      .attr('fill', d => (d === 'active' ? '#ef4444' : '#64748b'));

    // Add container for links and nodes
    const linkLayer = g.append('g').attr('class', 'links');
    const nodeLayer = g.append('g').attr('class', 'nodes');
    const labelLayer = g.append('g').attr('class', 'labels');

    // Draw all links
    const linkElements = linkLayer
      .selectAll<SVGLineElement, Link>('line')
      .data(allLinks)
      .enter()
      .append('line')
      .attr('stroke', '#64748b')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow-inactive)')
      .attr('opacity', 0.3)
      .attr('x1', (d: Link) => {
        const source = nodes.find(n => n.id === d.source);
        return source?.x || 0;
      })
      .attr('y1', (d: Link) => {
        const source = nodes.find(n => n.id === d.source);
        return source?.y || 0;
      })
      .attr('x2', (d: Link) => {
        const target = nodes.find(n => n.id === d.target);
        return target?.x || 0;
      })
      .attr('y2', (d: Link) => {
        const target = nodes.find(n => n.id === d.target);
        return target?.y || 0;
      });

    // Draw nodes
    const nodeElements = nodeLayer
      .selectAll<SVGCircleElement, Node>('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', 25)
      .attr('fill', '#1e293b')
      .attr('stroke', '#64748b')
      .attr('stroke-width', 2)
      .attr('cx', (d: Node) => d.x || 0)
      .attr('cy', (d: Node) => d.y || 0);

    // Draw labels
    const labelElements = labelLayer
      .selectAll<SVGTextElement, Node>('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .attr('font-size', '12px')
      .text((d: Node) => d.id)
      .attr('x', (d: Node) => d.x || 0)
      .attr('y', (d: Node) => d.y || 0);

    // Update visualization based on timeline
    const updateVisualization = (progress: number) => {
      const threshold = minTime + (newDuration * progress) / 100;

      // Update link visibility and styling
      linkElements.attr('stroke', (d: Link) => {
        const attack = attacks.find(a => String(a.source_bus) === d.source && String(a.target_bus) === d.target);
        if (!attack) return '#64748b';
        return attack.timestamp <= threshold ? '#ef4444' : '#64748b';
      });

      linkElements.attr('opacity', (d: Link) => {
        const attack = attacks.find(a => String(a.source_bus) === d.source && String(a.target_bus) === d.target);
        if (!attack) return 0.3;
        return attack.timestamp <= threshold ? 0.8 : 0.3;
      });

      linkElements.attr('marker-end', (d: Link) => {
        const attack = attacks.find(a => String(a.source_bus) === d.source && String(a.target_bus) === d.target);
        if (!attack) return 'url(#arrow-inactive)';
        return attack.timestamp <= threshold ? 'url(#arrow-active)' : 'url(#arrow-inactive)';
      });

      // Update node colors based on if they've been targeted
      const attackedBuses = new Set<string>();
      attacks.forEach(attack => {
        if (attack.timestamp <= threshold) {
          attackedBuses.add(String(attack.target_bus));
        }
      });

      nodeElements.attr('fill', (d: Node) => (attackedBuses.has(d.id) ? '#ef4444' : '#1e293b'));
      nodeElements.attr('stroke', (d: Node) => (attackedBuses.has(d.id) ? '#fca5a5' : '#64748b'));
    };

    // Initial update
    updateVisualization(currentTime);

    // Update on timeline change
    const updateHandler = () => {
      updateVisualization(currentTime);
    };

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [attacks]);

  // Handle timeline updates
  useEffect(() => {
    if (!svgRef.current || attacks.length === 0) return;

    const minTime = Math.min(...attacks.map(a => a.timestamp));
    const maxTime = Math.max(...attacks.map(a => a.timestamp));
    const newDuration = maxTime - minTime || 100;

    const threshold = minTime + (newDuration * currentTime) / 100;
    const attackedBuses = new Set<string>();

    attacks.forEach(attack => {
      if (attack.timestamp <= threshold) {
        attackedBuses.add(String(attack.target_bus));
      }
    });

    d3.select(svgRef.current)
      .selectAll<SVGCircleElement, Node>('circle')
      .attr('fill', (d: Node) => (attackedBuses.has(d.id) ? '#ef4444' : '#1e293b'))
      .attr('stroke', (d: Node) => (attackedBuses.has(d.id) ? '#fca5a5' : '#64748b'));

    d3.select(svgRef.current)
      .selectAll<SVGLineElement, Link>('line')
      .attr('stroke', (d: Link) => {
        const attack = attacks.find(a => String(a.source_bus) === d.source && String(a.target_bus) === d.target);
        if (!attack) return '#64748b';
        return attack.timestamp <= threshold ? '#ef4444' : '#64748b';
      })
      .attr('opacity', (d: Link) => {
        const attack = attacks.find(a => String(a.source_bus) === d.source && String(a.target_bus) === d.target);
        if (!attack) return 0.3;
        return attack.timestamp <= threshold ? 0.8 : 0.3;
      })
      .attr('marker-end', (d: Link) => {
        const attack = attacks.find(a => String(a.source_bus) === d.source && String(a.target_bus) === d.target);
        if (!attack) return 'url(#arrow-inactive)';
        return attack.timestamp <= threshold ? 'url(#arrow-active)' : 'url(#arrow-inactive)';
      });
  }, [currentTime, attacks]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= 100) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg border border-slate-700 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300">Attack Propagation Graph</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-600 text-slate-300 transition"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            onClick={() => {
              setCurrentTime(0);
              setIsPlaying(false);
            }}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-600 text-slate-300 transition"
            title="Reset"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <svg
        ref={svgRef}
        className="flex-1 w-full bg-slate-950 rounded border border-slate-700 mb-3"
        style={{ minHeight: '300px' }}
      />

      {/* Timeline slider */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 w-8">{currentTime}%</span>
        <input
          type="range"
          min="0"
          max="100"
          value={currentTime}
          onChange={e => {
            setCurrentTime(Number(e.target.value));
            setIsPlaying(false);
          }}
          className="flex-1 h-1.5 bg-slate-700 rounded appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${currentTime}%, #475569 ${currentTime}%, #475569 100%)`,
          }}
        />
        <span className="text-xs text-slate-400 w-8">100%</span>
      </div>
    </div>
  );
}
