'use client';

import React from 'react';
import type { Bus, Line } from '@/lib/api';

interface GridVisualizationProps {
  buses: Bus[];
  lines: Line[];
}

export function GridVisualization({
  buses,
  lines,
}: GridVisualizationProps) {
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
  // STATUS COLORS
  // --------------------------------------------------------
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'critical':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return '#10b981';
    }
  };

  const getLineColor = (status?: string) => {
    switch (status) {
      case 'critical':
        return '#dc2626';
      case 'warning':
        return '#d97706';
      default:
        return '#64748b';
    }
  };

  // --------------------------------------------------------
  // SAFETY CHECK
  // --------------------------------------------------------
  if (!buses || buses.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-400">
        No grid data available
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg border border-slate-700 p-4 flex flex-col">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">
        IEEE 14-Bus Grid Topology
      </h3>

      <svg
        viewBox="0 0 800 450"
        className="flex-1 w-full h-full"
        style={{
          background:
            'linear-gradient(135deg, rgba(15,23,42,0.5) 0%, rgba(2,6,23,0.5) 100%)',
        }}
      >
        {/* --------------------------------------------------------
            GRID BACKGROUND
        -------------------------------------------------------- */}
        <defs>
          <pattern
            id="grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="rgba(71, 85, 99, 0.1)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>

        <rect width="800" height="450" fill="url(#grid)" opacity="0.3" />

        {/* --------------------------------------------------------
            TRANSMISSION LINES
        -------------------------------------------------------- */}
        <g>
          {lines.map((line, idx) => {
            // Support both backend structures:
            // line.source/target OR line.from_bus/to_bus
            const fromBusId =
              line.source ?? line.from_bus ?? null;
            const toBusId =
              line.target ?? line.to_bus ?? null;

            if (!fromBusId || !toBusId) {
              console.warn(
                `[SmartGrid] Invalid line structure:`,
                line
              );
              return null;
            }

            const fromPos = busPositions[fromBusId];
            const toPos = busPositions[toBusId];

            if (!fromPos || !toPos) {
              console.warn(
                `[SmartGrid] Missing bus coordinates for line ${line.id}`,
                line
              );
              return null;
            }

            const lineStatus =
              line.status ||
              (line.affected ? 'critical' : 'normal');

            const lineColor = getLineColor(lineStatus);

            const flowP =
              line.flow_p ??
              (line.affected ? 120 : 60);

            const strokeWidth =
              2 + (flowP / 150) * 2;

            return (
              <g key={`line-${idx}`}>
                <defs>
                  <linearGradient
                    id={`gradient-${idx}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      stopColor={lineColor}
                      stopOpacity="0.6"
                    />
                    <stop
                      offset="100%"
                      stopColor={lineColor}
                      stopOpacity="0.9"
                    />
                  </linearGradient>

                  <marker
                    id={`arrow-${idx}`}
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <path
                      d="M0,0 L0,6 L9,3 z"
                      fill={lineColor}
                      opacity="0.8"
                    />
                  </marker>
                </defs>

                {/* Main line */}
                <line
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke={`url(#gradient-${idx})`}
                  strokeWidth={strokeWidth}
                  opacity="0.75"
                />

                {/* Flow direction */}
                <line
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke={lineColor}
                  strokeWidth="1.5"
                  markerEnd={`url(#arrow-${idx})`}
                  opacity="0.5"
                />

                {/* Animated attack pulse */}
                {line.affected && (
                  <circle r="4" fill="#ef4444">
                    <animateMotion
                      dur="2s"
                      repeatCount="indefinite"
                      path={`M ${fromPos.x} ${fromPos.y} L ${toPos.x} ${toPos.y}`}
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </g>

        {/* --------------------------------------------------------
            BUS NODES
        -------------------------------------------------------- */}
        <g>
          {buses.map((bus) => {
            const pos = busPositions[bus.id];

            if (!pos) {
              console.warn(
                `[SmartGrid] Missing position for bus ${bus.id}`
              );
              return null;
            }

            const busStatus =
              bus.status ||
              (bus.root_candidate
                ? 'critical'
                : bus.compromised
                ? 'warning'
                : 'normal');

            const color = getStatusColor(busStatus);

            const radius =
              bus.type === 'slack'
                ? 20
                : bus.root_candidate
                ? 22
                : bus.compromised
                ? 18
                : 16;

            return (
              <g key={`bus-${bus.id}`}>
                {/* Outer glow */}
                {(bus.compromised ||
                  bus.root_candidate ||
                  busStatus === 'critical') && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius + 8}
                    fill="none"
                    stroke={color}
                    strokeWidth="1"
                    opacity="0.3"
                  >
                    <animate
                      attributeName="r"
                      values={`${radius + 4};${radius + 10};${radius + 4}`}
                      dur="1.8s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.5;0.1;0.5"
                      dur="1.8s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Main node */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius}
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.95"
                />

                {/* Bus label */}
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dy="0.35em"
                  className="text-xs font-bold fill-white pointer-events-none"
                >
                  {bus.id}
                </text>

                {/* Score */}
                {bus.suspicion_score !== undefined && (
                  <text
                    x={pos.x}
                    y={pos.y + radius + 15}
                    textAnchor="middle"
                    className="text-[9px] fill-slate-300"
                  >
                    {bus.suspicion_score.toFixed(1)}
                  </text>
                )}

                {/* Tooltip */}
                <title>
                  {bus.name || `Bus ${bus.id}`}
                  {'\n'}
                  Voltage:{' '}
                  {bus.voltage
                    ? bus.voltage.toFixed(3)
                    : 'N/A'}{' '}
                  pu
                  {'\n'}
                  Status: {busStatus}
                  {'\n'}
                  Anomaly Score:{' '}
                  {bus.anomaly_score
                    ? (bus.anomaly_score * 100).toFixed(1)
                    : bus.suspicion_score?.toFixed(1) || '0'}
                </title>
              </g>
            );
          })}
        </g>
      </svg>

      {/* --------------------------------------------------------
          LEGEND
      -------------------------------------------------------- */}
      <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: '#10b981' }}
          />
          <span>Normal</span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: '#f59e0b' }}
          />
          <span>Compromised</span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: '#ef4444' }}
          />
          <span>Root Attack</span>
        </div>
      </div>
    </div>
  );
}