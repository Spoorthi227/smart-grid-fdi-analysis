'use client';

import React from 'react';
import type { Bus, Line } from '@/lib/api';

interface GridVisualizationProps {
  buses: Bus[];
  lines: Line[];
  gridData?: any; // IMPORTANT for propagation
}

export function GridVisualization({ buses, lines, gridData }: GridVisualizationProps) {

  // --------------------------------------------------------
  // IEEE 14-BUS STATIC LAYOUT
  // --------------------------------------------------------
  const busPositions: Record<number, { x: number; y: number }> = {
    1: { x: 150, y: 200 },
    2: { x: 250, y: 150 },
    3: { x: 350, y: 100 },
    4: { x: 350, y: 200 },
    5: { x: 280, y: 250 },
    6: { x: 350, y: 350 },
    7: { x: 450, y: 350 },
    8: { x: 550, y: 350 },
    9: { x: 550, y: 200 },
    10: { x: 550, y: 150 },
    11: { x: 550, y: 100 },
    12: { x: 600, y: 300 },
    13: { x: 650, y: 250 },
    14: { x: 700, y: 200 },
  };

  // --------------------------------------------------------
  // BUILD PROPAGATION MAP
  // --------------------------------------------------------
  const propagationIndexMap: Record<number, number> = {};

  (gridData?.propagation_order || []).forEach((busId: number, index: number) => {
    propagationIndexMap[busId] = index;
  });

  // --------------------------------------------------------
  // COLORS
  // --------------------------------------------------------
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#10b981';
    }
  };

  const getLineColor = (status?: string) => {
    switch (status) {
      case 'critical': return '#dc2626';
      case 'warning': return '#d97706';
      default: return '#64748b';
    }
  };

  // --------------------------------------------------------
  // SAFETY
  // --------------------------------------------------------
  if (!buses || buses.length === 0) {
    return (
      <div className="w-full flex items-center justify-center text-slate-400">
        No grid data available
      </div>
    );
  }

  return (
    <div className="w-full max-h-[450px] bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg border border-slate-700 p-4 flex flex-col">

      {/* TITLE */}
      <h3 className="text-sm font-semibold text-slate-300 mb-5 text-center">
        IEEE 14-Bus Grid Topology
      </h3>

      {/* CENTERED SVG */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 800 450"
          style={{
            width: '80%',
            height: 'auto',
            maxHeight: '300px',
            background:
              'linear-gradient(135deg, rgba(15,23,42,0.5) 0%, rgba(2,6,23,0.5) 100%)',
          }}
        >

          {/* GRID BACKGROUND */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(71, 85, 99, 0.1)" strokeWidth="0.5" />
            </pattern>
          </defs>

          <rect width="800" height="450" fill="url(#grid)" opacity="0.3" />

          {/* --------------------------------------------------------
              LINES WITH FLOW ANIMATION
          -------------------------------------------------------- */}
          {lines.map((line, idx) => {
            const from = line.source ?? line.from_bus;
            const to = line.target ?? line.to_bus;

            if (!from || !to) return null;

            const p1 = busPositions[from];
            const p2 = busPositions[to];
            if (!p1 || !p2) return null;

            const fromStage = propagationIndexMap[from] ?? -1;
            const toStage = propagationIndexMap[to] ?? -1;

            const isActive = fromStage >= 0 && toStage > fromStage;

            const status = line.status || (line.affected ? 'critical' : 'normal');
            const color = getLineColor(status);

            return (
              <g key={idx}>
                {/* Base line */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={color}
                  strokeWidth="2.5"
                  opacity="0.5"
                />

                {/* 🔥 FLOW DOT */}
                {isActive && (
                  <circle r="4" fill="#ef4444">
                    <animateMotion
                      dur="1.5s"
                      begin={`${fromStage * 0.4}s`}
                      repeatCount="indefinite"
                      path={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
                    />
                  </circle>
                )}
              </g>
            );
          })}

          {/* --------------------------------------------------------
              BUSES WITH PROPAGATION
          -------------------------------------------------------- */}
          {buses.map((bus) => {
            const pos = busPositions[bus.id];
            if (!pos) return null;

            const stage = propagationIndexMap[bus.id] ?? -1;
            const delay = stage >= 0 ? stage * 0.4 : 0;

            const isRoot = bus.root_candidate;

            const status =
              bus.status ||
              (isRoot
                ? 'critical'
                : bus.compromised
                ? 'warning'
                : 'normal');

            const color = getStatusColor(status);

            return (
              <g key={bus.id}>

                {/* 🔥 PROPAGATION WAVE */}
                {stage >= 0 && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="10"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    opacity="0.6"
                  >
                    <animate
                      attributeName="r"
                      values="10;30;10"
                      dur="1.5s"
                      begin={`${delay}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.6;0;0.6"
                      dur="1.5s"
                      begin={`${delay}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* 🔥 ROOT PULSE */}
                {isRoot && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="25"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                  >
                    <animate
                      attributeName="r"
                      values="20;35;20"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* NODE */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="16"
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                />

                {/* LABEL */}
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dy="0.35em"
                  className="text-xs fill-white font-bold"
                >
                  {bus.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* LEGEND */}
      <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Normal</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Compromised</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Attack Flow</span>
        </div>
      </div>

    </div>
  );
}