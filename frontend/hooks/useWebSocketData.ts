'use client';

import { useEffect, useRef, useState } from 'react';
import type { Bus, Line, AttackEvent, GridSnapshot } from '@/lib/api';

export function useWebSocketData() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [attacks, setAttacks] = useState<AttackEvent[]>([]);
  const [gridData, setGridData] = useState<GridSnapshot | null>(null);

  const [riskScore, setRiskScore] = useState(0);
  const [detectionRate, setDetectionRate] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const [systemSummary, setSystemSummary] = useState<any>(null);
  const [systemState, setSystemState] = useState<any>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';

    const apiUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'http://localhost:3001/api/dashboard';

    // ---------------- GRID LAYOUT ----------------
    const busCoordinates = Array.from({ length: 14 }, (_, i) => ({
      x: 120 + i * 55,
      y: 250 + (i % 3) * 80,
    }));

    const lineConnections = [
      [1, 2], [1, 5], [2, 3], [2, 4], [2, 5],
      [3, 4], [4, 5], [4, 7], [4, 9], [5, 6],
      [6, 11], [6, 12], [6, 13], [7, 8], [7, 9],
      [9, 10], [9, 14], [10, 11], [12, 13], [13, 14],
    ];

    // ---------------- SAFE ARRAY ----------------
    const safeArray = (v: any) => {
      if (!v) return [];
      return Array.isArray(v) ? v : [v];
    };

    // ---------------- TRANSFORM ----------------
    const transform = (raw: any): GridSnapshot => {
      const compromised = safeArray(raw.primary_compromised_buses);
      const affectedLines = safeArray(raw.affected_lines);

      const buses: Bus[] = (raw.bus_scores || []).map(
        (score: number, i: number) => ({
          id: i + 1,
          name: `Bus ${i + 1}`,
          x: busCoordinates[i]?.x || 0,
          y: busCoordinates[i]?.y || 0,
          suspicion_score: score,

          // FIXED
          compromised: compromised.includes(i + 1),

          impact_score: raw.impact_scores?.[i] || 0,
          root_candidate: raw.root_bus === i + 1,
        })
      );

      const lines: Line[] = lineConnections.map(([s, t], i) => ({
        id: i + 1,
        source: s,
        target: t,

        // FIXED
        affected: affectedLines.includes(i + 1),
      }));

      return {
        buses,
        lines,
        timestamp: raw.timestamp,
        root_bus: raw.root_bus,
        propagation_order: raw.propagation_order || [],
      };
    };

    // ---------------- APPLY DATA ----------------
    const apply = (payload: any) => {
      const grid = transform(payload);

      setBuses(grid.buses);
      setLines(grid.lines);
      setGridData(grid);

      const compromised = safeArray(payload.primary_compromised_buses);

      setAttacks(
        (payload.propagation_order || []).map((bus: number, i: number) => ({
          id: i,
          bus_id: bus,
          timestamp: i,
          event_type: i === 0 ? 'origin' : 'propagation',
          severity: payload.impact_scores?.[bus - 1] || 0,
        }))
      );

      const isAttack =
        payload.is_attack ?? systemState?.is_attack ?? false;

      const risk =
        isAttack
          ? Math.min(100, compromised.length * 12 + 15)
          : 0;

      setRiskScore(risk);
      setDetectionRate(98.5);
      setLastUpdate(new Date());
    };

    // ---------------- WS ----------------
    const connect = () => {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('[WS] connected');
      };

      wsRef.current.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);

          if (msg.type === 'grid_update') {
            apply(msg.payload);
          }

          if (msg.type === 'system_summary') {
            setSystemSummary(msg.payload);
          }

          if (msg.type === 'system_state') {
            setSystemState(msg.payload);
          }

        } catch (err) {
          console.error('[WS] parse error', err);
        }
      };

      wsRef.current.onclose = () => {
        console.warn('[WS] reconnecting...');
        reconnectRef.current = setTimeout(connect, 3000);
      };

      wsRef.current.onerror = () => {
        console.error('[WS] error');
      };
    };

    connect();

    // ---------------- POLLING ----------------
    const poll = setInterval(async () => {
      try {
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (data.current_state) apply(data.current_state);
        if (data.system_state) setSystemState(data.system_state);
      } catch {}
    }, 2000);

    return () => {
      wsRef.current?.close();
      clearInterval(poll);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, []);

  return {
    buses,
    lines,
    attacks,
    gridData,
    riskScore,
    detectionRate,
    lastUpdate,
    systemSummary,
    systemState,
  };
}