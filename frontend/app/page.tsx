'use client';

import React from 'react';
import { Activity, Shield } from 'lucide-react';
import { GridVisualization } from '@/components/GridVisualization';
import { AttackPropagation } from '@/components/AttackPropagation';
import { MetricsPanel } from '@/components/MetricsPanel';
import { useWebSocketData } from '@/hooks/useWebSocketData';

export default function Dashboard() {
  const { buses, lines, attacks, gridData, riskScore, detectionRate, lastUpdate } = useWebSocketData();

  if (!gridData || buses.length === 0) {
    return null; // Render nothing while initial data loads
  }

  const criticalBusCount = buses.filter(b => b.status === 'critical').length;
  const warningBusCount = buses.filter(b => b.status === 'warning').length;

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 backdrop-blur-sm">
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-700">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Smart Grid FDIA Forensic Dashboard</h1>
                <p className="text-sm text-slate-400">Real-time False Data Injection Attack Detection & Analysis</p>
              </div>
            </div>
            <div className="text-right text-sm text-slate-400">
              <div>Last Updated: {lastUpdate.toLocaleTimeString()}</div>
              <div>IEEE 14-Bus Test System</div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded border border-slate-700 p-3">
              <div className="text-xs text-slate-400 mb-1">System Status</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-yellow-200">
                  {criticalBusCount > 0 ? 'CRITICAL' : warningBusCount > 0 ? 'WARNING' : 'NORMAL'}
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded border border-slate-700 p-3">
              <div className="text-xs text-slate-400 mb-1">Critical Buses</div>
              <div className="text-2xl font-bold text-red-400">{criticalBusCount}</div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded border border-slate-700 p-3">
              <div className="text-xs text-slate-400 mb-1">Warnings</div>
              <div className="text-2xl font-bold text-yellow-400">{warningBusCount}</div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded border border-slate-700 p-3">
              <div className="text-xs text-slate-400 mb-1">Risk Assessment</div>
              <div className={`text-2xl font-bold ${riskScore > 70 ? 'text-red-400' : riskScore > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                {riskScore.toFixed(0)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Panel Layout */}
      <main className="flex-1 overflow-hidden p-6">
        <div className="grid grid-cols-12 gap-4 h-full">
          {/* Left Panel - Grid Visualization */}
          <div className="col-span-4 h-full">
            <GridVisualization buses={buses} lines={lines} />
          </div>

          {/* Center Panel - Attack Propagation */}
          <div className="col-span-5 h-full">
            <AttackPropagation attacks={attacks} />
          </div>

          {/* Right Panel - Metrics */}
          <div className="col-span-3 h-full">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg border border-slate-700 h-full p-4 overflow-y-auto">
              <MetricsPanel buses={buses} gridData={gridData} riskScore={riskScore} detectionRate={detectionRate} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 px-6 py-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-green-500" />
            <span>System Online • All Sensors Active</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Connected Devices: {buses.length + lines.length}</span>
            <span>Data Integrity: {detectionRate.toFixed(1)}%</span>
            <span>Version 1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
