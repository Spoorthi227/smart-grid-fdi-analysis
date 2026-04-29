'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import type { Bus, GridSnapshot } from '@/lib/api';

interface MetricsPanelProps {
  buses: Bus[];
  gridData: GridSnapshot | null;
  riskScore: number;
  detectionRate: number;
}

export function MetricsPanel({
  buses,
  gridData,
  riskScore,
  detectionRate,
}: MetricsPanelProps) {
  // --------------------------------------------------------
  // SAFE DEFAULT METRICS (prevents undefined crashes)
  // --------------------------------------------------------
  const metrics = gridData?.metrics || {
    avg_voltage:
      buses.length > 0
        ? buses.reduce((sum, bus) => sum + (bus.voltage || 1), 0) /
          buses.length
        : 1,
    max_deviation:
      buses.length > 0
        ? Math.max(
            ...buses.map((bus) => Math.abs((bus.voltage || 1) - 1))
          )
        : 0,
    compromised_buses: buses.filter((bus) => bus.compromised).length,
    total_load: buses.reduce(
      (sum, bus) => sum + (bus.load || 0),
      0
    ),
  };

  // --------------------------------------------------------
  // STATUS FILTERS
  // --------------------------------------------------------
  const criticalBuses = buses.filter(
    (bus) =>
      bus.compromised ||
      (bus.anomaly_score || bus.suspicion_score || 0) > 0.7
  );

  const warningBuses = buses.filter(
    (bus) =>
      !bus.compromised &&
      (bus.anomaly_score || bus.suspicion_score || 0) > 0.3
  );

  // --------------------------------------------------------
  // COLOR HELPERS
  // --------------------------------------------------------
  const getAnomalyScore = (bus: Bus) =>
    bus.anomaly_score ||
    (bus.suspicion_score ? bus.suspicion_score / 20 : 0);

  const getAnomalyColor = (score: number) => {
    if (score > 0.6) return 'from-red-600 to-red-700';
    if (score > 0.3) return 'from-yellow-600 to-yellow-700';
    return 'from-green-600 to-green-700';
  };

  const getRiskBadgeColor = (score: number) => {
    if (score > 70)
      return 'bg-red-900/40 text-red-200 border-red-700';
    if (score > 40)
      return 'bg-yellow-900/40 text-yellow-200 border-yellow-700';
    return 'bg-green-900/40 text-green-200 border-green-700';
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 overflow-y-auto">
      {/* KPI SUMMARY */}
      <div className="grid grid-cols-2 gap-3">
        {/* Risk Score */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">
              Risk Score
            </span>
            <TrendingUp
              size={16}
              className="text-red-500"
            />
          </div>
          <div className="text-2xl font-bold text-white">
            {riskScore.toFixed(1)}
          </div>
          <div
            className={`text-xs mt-2 px-2 py-1 rounded border ${getRiskBadgeColor(
              riskScore
            )}`}
          >
            {riskScore > 70
              ? 'Critical'
              : riskScore > 40
              ? 'High'
              : 'Moderate'}
          </div>
        </div>

        {/* Detection Rate */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">
              Detection Rate
            </span>
            <CheckCircle
              size={16}
              className="text-green-500"
            />
          </div>
          <div className="text-2xl font-bold text-white">
            {detectionRate.toFixed(1)}%
          </div>
          <div className="text-xs mt-2 px-2 py-1 rounded border bg-green-900/40 text-green-200 border-green-700">
            {detectionRate > 90 ? 'Excellent' : 'Good'}
          </div>
        </div>

        {/* Avg Voltage */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">
              Avg Voltage
            </span>
            <TrendingUp
              size={16}
              className="text-blue-500"
            />
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics.avg_voltage.toFixed(3)} pu
          </div>
          <div className="text-xs mt-2 text-slate-400">
            Dev: {(metrics.max_deviation * 100).toFixed(2)}%
          </div>
        </div>

        {/* Compromised */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">
              Compromised
            </span>
            <AlertTriangle
              size={16}
              className="text-yellow-500"
            />
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics.compromised_buses}
          </div>
          <div className="text-xs mt-2 text-slate-400">
            of {buses.length} buses
          </div>
        </div>
      </div>

      {/* CRITICAL / WARNING BUSES */}
      {(criticalBuses.length > 0 || warningBuses.length > 0) && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">
            Critical Status
          </h3>

          <div className="space-y-2">
            {criticalBuses.map((bus) => (
              <div
                key={bus.id}
                className="flex items-center justify-between bg-red-950/30 rounded p-2 border border-red-800/40"
              >
                <div>
                  <div className="text-xs font-medium text-red-200">
                    {bus.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    Score:{' '}
                    {(getAnomalyScore(bus) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}

            {warningBuses.map((bus) => (
              <div
                key={bus.id}
                className="flex items-center justify-between bg-yellow-950/30 rounded p-2 border border-yellow-800/40"
              >
                <div>
                  <div className="text-xs font-medium text-yellow-200">
                    {bus.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    Score:{' '}
                    {(getAnomalyScore(bus) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BUS ANOMALY SCORES */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">
          Bus Anomaly Scores
        </h3>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {buses.map((bus) => {
            const score = getAnomalyScore(bus);

            return (
              <div key={bus.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    {bus.name}
                  </span>
                  <span className="text-slate-400">
                    {(score * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 bg-gradient-to-r ${getAnomalyColor(
                      score
                    )}`}
                    style={{
                      width: `${Math.min(score * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GRID STATISTICS */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">
          Grid Statistics
        </h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Total Load</span>
            <span className="text-slate-200 font-semibold">
              {metrics.total_load.toFixed(1)} MW
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">
              Avg Frequency
            </span>
            <span className="text-slate-200 font-semibold">
              60.02 Hz
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">
              System Efficiency
            </span>
            <span className="text-slate-200 font-semibold">
              94.3%
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">
              Last Update
            </span>
            <span className="text-slate-200 font-semibold">
              {gridData?.timestamp
                ? new Date(
                    gridData.timestamp
                  ).toLocaleTimeString()
                : '--'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}