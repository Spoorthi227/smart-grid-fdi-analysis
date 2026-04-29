'use client';

import { useEffect, useRef, useState } from 'react';
import type { Bus, Line, AttackEvent, GridSnapshot } from '@/lib/api';
import {
  generateMockGridData,
  generateMockAttacks,
  generateMockKPIs,
} from '@/lib/api';

export function useWebSocketData() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [attacks, setAttacks] = useState<AttackEvent[]>([]);
  const [gridData, setGridData] = useState<GridSnapshot | null>(null);
  const [riskScore, setRiskScore] = useState(0);
  const [detectionRate, setDetectionRate] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';

    const apiUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'http://localhost:3001/api/dashboard';

    // --------------------------------------------------------
    // IEEE 14 BUS STATIC LAYOUT
    // --------------------------------------------------------
    const busCoordinates = [
      { x: 100, y: 300 },
      { x: 200, y: 200 },
      { x: 300, y: 150 },
      { x: 400, y: 200 },
      { x: 500, y: 250 },
      { x: 600, y: 350 },
      { x: 300, y: 350 },
      { x: 400, y: 400 },
      { x: 500, y: 450 },
      { x: 650, y: 450 },
      { x: 700, y: 350 },
      { x: 750, y: 250 },
      { x: 850, y: 200 },
      { x: 950, y: 300 },
    ];

    // --------------------------------------------------------
    // IEEE 14 BUS BRANCH CONNECTIONS
    // --------------------------------------------------------
    const lineConnections = [
      [1, 2],
      [1, 5],
      [2, 3],
      [2, 4],
      [2, 5],
      [3, 4],
      [4, 5],
      [4, 7],
      [4, 9],
      [5, 6],
      [6, 11],
      [6, 12],
      [6, 13],
      [7, 8],
      [7, 9],
      [9, 10],
      [9, 14],
      [10, 11],
      [12, 13],
      [13, 14],
    ];

    // --------------------------------------------------------
    // INITIAL MOCK DATA
    // --------------------------------------------------------
    const mockGridData = generateMockGridData();
    const mockAttacks = generateMockAttacks();
    const mockKPIs = generateMockKPIs();

    setBuses(mockGridData.buses);
    setLines(mockGridData.lines);
    setAttacks(mockAttacks);
    setGridData(mockGridData);
    setRiskScore(mockKPIs.risk_score);
    setDetectionRate(mockKPIs.detection_rate);
    setLastUpdate(new Date());

    // --------------------------------------------------------
    // TRANSFORM MATLAB DATA
    // --------------------------------------------------------
    const transformMatlabData = (rawData: any): GridSnapshot => {
      const buses: Bus[] = (rawData.bus_scores || []).map(
        (score: number, index: number) => ({
          id: index + 1,
          name: `Bus ${index + 1}`,
          x: busCoordinates[index].x,
          y: busCoordinates[index].y,
          suspicion_score: score,
          compromised:
            rawData.primary_compromised_buses?.includes(index + 1) || false,
          impact_score: rawData.impact_scores?.[index] || 0,
          root_candidate: rawData.root_bus === index + 1,
        })
      );

      const lines: Line[] = lineConnections.map(
        ([source, target], index) => ({
          id: index + 1,
          source,
          target,
          affected:
            rawData.affected_lines?.includes(index + 1) || false,
        })
      );

      return {
        buses,
        lines,
        timestamp: rawData.timestamp || new Date().toISOString(),
        root_bus: rawData.root_bus,
        propagation_order: rawData.propagation_order || [],
      };
    };

    // --------------------------------------------------------
    // TRANSFORM ATTACK TIMELINE
    // --------------------------------------------------------
    const transformTimeline = (rawData: any): AttackEvent[] => {
      return (rawData.timeline || []).map((bus: number, idx: number) => ({
        id: idx,
        timestamp: idx,
        bus_id: bus,
        event_type: idx === 0 ? 'origin' : 'propagation',
        severity: rawData.impact_scores?.[bus - 1] || 0,
      }));
    };

    // --------------------------------------------------------
    // APPLY LIVE DATA
    // --------------------------------------------------------
    const applyLiveData = (payload: any) => {
      const transformedGrid = transformMatlabData(payload);
      const transformedAttacks = transformTimeline(payload);

      setBuses(transformedGrid.buses);
      setLines(transformedGrid.lines);
      setGridData(transformedGrid);
      setAttacks(transformedAttacks);

      const compromisedCount =
        payload.primary_compromised_buses?.length || 0;

      const totalBuses = payload.bus_scores?.length || 14;

      setRiskScore(
        Math.min(
          100,
          (compromisedCount / totalBuses) * 100 +
            (payload.root_bus ? 20 : 0)
        )
      );

      setDetectionRate(98.5);
      setLastUpdate(new Date());

      console.log('[SmartGrid] Live backend data updated');
    };

    // --------------------------------------------------------
    // POLLING FALLBACK
    // --------------------------------------------------------
    let pollCleanup: (() => void) | undefined;

    const setupPolling = () => {
      console.log('[SmartGrid] Switching to polling mode...');

      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(apiUrl);

          if (!response.ok) return;

          const data = await response.json();

          if (data.current_state?.bus_scores) {
            applyLiveData(data.current_state);
            console.log('[SmartGrid] Polling successful');
          }
        } catch (error) {
          console.error('[SmartGrid] Polling error:', error);
        }
      }, 2000);

      pollCleanup = () => clearInterval(pollInterval);
    };

    // --------------------------------------------------------
    // WEBSOCKET CONNECTION
    // --------------------------------------------------------
    const connectWebSocket = () => {
      try {
        console.log('[SmartGrid] Connecting to:', wsUrl);

        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('[SmartGrid] WebSocket connected successfully');
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'grid_update') {
              applyLiveData(data.payload);
            }
          } catch (error) {
            console.error(
              '[SmartGrid] Failed to parse WebSocket message:',
              error
            );
          }
        };

        wsRef.current.onerror = (event) => {
          console.error('[SmartGrid] WebSocket connection failed');
          console.error('WebSocket URL:', wsUrl);
          console.error('ReadyState:', wsRef.current?.readyState);
          console.error('Error Event:', event);
        };

        wsRef.current.onclose = () => {
          console.warn(
            '[SmartGrid] WebSocket disconnected. Reconnecting in 3s...'
          );

          if (!pollCleanup) {
            setupPolling();
          }

          reconnectTimeoutRef.current = setTimeout(
            connectWebSocket,
            3000
          );
        };
      } catch (error) {
        console.error(
          '[SmartGrid] WebSocket initialization failed:',
          error
        );
        setupPolling();
      }
    };

    // --------------------------------------------------------
    // START
    // --------------------------------------------------------
    connectWebSocket();

    // --------------------------------------------------------
    // CLEANUP
    // --------------------------------------------------------
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (pollCleanup) {
        pollCleanup();
      }
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
  };
}