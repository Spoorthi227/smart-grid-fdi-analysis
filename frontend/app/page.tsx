  'use client';

  import React from 'react';
  import { Activity, Shield } from 'lucide-react';
  import { GridVisualization } from '@/components/GridVisualization';
  import { AttackPropagation } from '@/components/AttackPropagation';
  import { MetricsPanel } from '@/components/MetricsPanel';
  import { useWebSocketData } from '@/hooks/useWebSocketData';
  import { InfoTooltip } from '@/components/InfoToolTip';

  export default function Dashboard() {
    const {
      buses,
      lines,
      attacks,
      gridData,
      riskScore,
      detectionRate,
      lastUpdate,
      systemSummary,
    } = useWebSocketData();

    if (!gridData || buses.length === 0) {
      return null;
    }
  const criticalBusCount =
    systemSummary?.critical_bus_count ?? 0;
    const warningBusCount =  systemSummary?.warning_bus_count ?? 0;
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
                  <h1 className="text-2xl font-bold text-white">
                    Smart Grid FDIA Forensic Dashboard
                  </h1>
                  <p className="text-sm text-slate-400">
                    Real-time False Data Injection Attack Detection & Analysis
                  </p>
                </div>
              </div>

              <div className="text-right text-sm text-slate-400">
                <div>Last Updated: {lastUpdate.toLocaleTimeString()}</div>
                <div>IEEE 14-Bus Test System</div>
              </div>
            </div>

            {/* Status Bar */}
            <div className="grid grid-cols-4 gap-3">

              {/* System Status */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded border border-slate-700 p-3">
               <div className="text-xs text-slate-400 mb-1 flex items-center">
  System Status
  <InfoTooltip text="Overall condition of the grid based on detected anomalies. CRITICAL indicates active FDIA attack, WARNING indicates suspicious deviations, NORMAL means stable operation." />
</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  <span className="text-sm font-semibold text-yellow-200">
                    {criticalBusCount > 0
                      ? 'CRITICAL'
                      : warningBusCount > 0
                      ? 'WARNING'
                      : 'NORMAL'}
                  </span>
                </div>
              </div>

              {/* Critical */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded border border-slate-700 p-3">
               <div className="text-xs text-slate-400 mb-1 flex items-center">
  Critical Buses
  <InfoTooltip text="Number of buses identified as compromised based on anomaly scoring. These are likely points of FDIA injection or propagation origin." />
</div>
                <div className="text-2xl font-bold text-red-400">
                  {criticalBusCount}
                </div>
              </div>

              {/* Warning */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded border border-slate-700 p-3">
               <div className="text-xs text-slate-400 mb-1 flex items-center">
  Warnings
  <InfoTooltip text="Buses showing mild deviations from normal behavior. These may not be directly attacked but could be influenced by nearby compromised nodes." />
</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {warningBusCount}
                </div>
              </div>

              {/* Risk */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded border border-slate-700 p-3">
               <div className="text-xs text-slate-400 mb-1 flex items-center">
  Risk Assessment
  <InfoTooltip text="Composite score indicating severity of attack. Based on number of compromised buses and propagation impact. Higher score means higher threat to grid stability." />
</div>
                <div
                  className={`text-2xl font-bold ${
                    riskScore > 70
                      ? 'text-red-400'
                      : riskScore > 40
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  }`}
                >
                  {riskScore.toFixed(0)}
                </div>
              </div>
            </div>

            {/* ===================== OPTION A: SYSTEM SUMMARY ===================== */}
            {systemSummary && (
              <div className="mt-4 grid grid-cols-4 gap-3">

                <div className="bg-slate-800/60 p-3 rounded border border-slate-700">
                  <div className="text-xs text-slate-400">Buses</div>
                  <div className="text-lg font-semibold text-white">
                    {systemSummary.buses}
                  </div>
                </div>

                <div className="bg-slate-800/60 p-3 rounded border border-slate-700">
                  <div className="text-xs text-slate-400">Generation (MW)
                     <InfoTooltip text="Total electrical power produced by all generators.

Significance:
Represents supply capacity of the grid.

In FDIA attacks:
Abnormal generation values may indicate
manipulated generator control signals." />
                  </div>
                  <div className="text-lg font-semibold text-green-400">
                    {systemSummary.total_generation_mw}
                  </div>
                </div>

                <div className="bg-slate-800/60 p-3 rounded border border-slate-700">
                  <div className="text-xs text-slate-400">Load (MW)
                    <InfoTooltip text="Total power demand from all buses.

Significance:
Represents system consumption.

In FDIA attacks:
Fake load injections are common,
causing imbalance and instability."/>
                  </div>
                  <div className="text-lg font-semibold text-yellow-400">
                    {systemSummary.total_load_mw}
                  </div>
                </div>

                <div className="bg-slate-800/60 p-3 rounded border border-slate-700">
                  <div className="text-xs text-slate-400">Losses (MW)
                    <InfoTooltip text="Power lost during transmission across lines.

Significance:
Normally low and stable.

In FDIA attacks:
High losses indicate abnormal power flow,
possible rerouting or instability in the grid." />"
                  </div>
                  <div className="text-lg font-semibold text-red-400">
                    {systemSummary.losses_mw}
                  </div>
                </div>

              </div>
            )}
            {/* =============================================================== */}

          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden p-6">
          <div className="grid grid-cols-12 gap-4 h-full">

            <div className="col-span-9 h-full">
              <GridVisualization buses={buses} lines={lines} />
            </div>


            <div className="col-span-3 h-full">
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg border border-slate-700 h-full p-4 overflow-y-auto">
                <MetricsPanel
                  buses={buses}
                  gridData={gridData}
                  riskScore={riskScore}
                  detectionRate={detectionRate}
                />
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