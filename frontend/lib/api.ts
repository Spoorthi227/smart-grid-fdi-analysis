// Types for grid and attack data
export interface Bus {
  id: number;
  name: string;
  type: 'slack' | 'pv' | 'pq';
  voltage: number;
  angle: number;
  load_p: number;
  load_q: number;
  status: 'normal' | 'warning' | 'critical';
  anomaly_score: number;
}

export interface Line {
  from_bus: number;
  to_bus: number;
  resistance: number;
  reactance: number;
  flow_p: number;
  flow_q: number;
  rating: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface AttackEvent {
  id: string;
  timestamp: number;
  source_bus: number;
  target_bus: number;
  attack_type: 'false_data_injection' | 'command_injection' | 'state_manipulation';
  severity: 'low' | 'medium' | 'high';
  detected: boolean;
  description: string;
}

export interface GridSnapshot {
  timestamp: number;
  buses: Bus[];
  lines: Line[];
  metrics: {
    total_load: number;
    avg_voltage: number;
    max_deviation: number;
    compromised_buses: number;
  };
}

export interface DashboardData {
  current_state: GridSnapshot;
  attack_timeline: AttackEvent[];
  kpis: {
    risk_score: number;
    detection_rate: number;
    avg_response_time: number;
    total_attacks: number;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

export async function fetchGridData(): Promise<GridSnapshot> {
  try {
    const response = await fetch(`${API_BASE_URL}/grid`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`Grid API error: ${response.statusText}`);
    return response.json();
  } catch (error) {
    console.error('Failed to fetch grid data:', error);
    return generateMockGridData();
  }
}

export async function fetchAttackTimeline(): Promise<AttackEvent[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/attacks`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`Attack API error: ${response.statusText}`);
    return response.json();
  } catch (error) {
    console.error('Failed to fetch attack timeline:', error);
    return generateMockAttacks();
  }
}

export async function fetchDashboardData(): Promise<DashboardData> {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`Dashboard API error: ${response.statusText}`);
    return response.json();
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return {
      current_state: generateMockGridData(),
      attack_timeline: generateMockAttacks(),
      kpis: generateMockKPIs(),
    };
  }
}

// Mock data generators for development
export function generateMockGridData(): GridSnapshot {
  const buses: Bus[] = [
    { id: 1, name: 'Bus 1 (Slack)', type: 'slack', voltage: 1.06, angle: 0, load_p: 0, load_q: 0, status: 'normal', anomaly_score: 0.05 },
    { id: 2, name: 'Bus 2', type: 'pv', voltage: 1.045, angle: -4.98, load_p: 21.7, load_q: 12.7, status: 'normal', anomaly_score: 0.08 },
    { id: 3, name: 'Bus 3', type: 'pq', voltage: 1.01, angle: -12.72, load_p: 94.2, load_q: 19.0, status: 'normal', anomaly_score: 0.12 },
    { id: 4, name: 'Bus 4', type: 'pq', voltage: 1.019, angle: -10.33, load_p: 47.8, load_q: -3.9, status: 'normal', anomaly_score: 0.1 },
    { id: 5, name: 'Bus 5', type: 'pq', voltage: 1.02, angle: -8.78, load_p: 7.6, load_q: 1.6, status: 'normal', anomaly_score: 0.09 },
    { id: 6, name: 'Bus 6', type: 'pq', voltage: 1.07, angle: -14.22, load_p: 11.2, load_q: 7.5, status: 'normal', anomaly_score: 0.15 },
    { id: 7, name: 'Bus 7', type: 'pq', voltage: 1.062, angle: -13.37, load_p: 0, load_q: 0, status: 'normal', anomaly_score: 0.07 },
    { id: 8, name: 'Bus 8', type: 'pv', voltage: 1.09, angle: -13.36, load_p: 0, load_q: 0, status: 'normal', anomaly_score: 0.06 },
    { id: 9, name: 'Bus 9', type: 'pq', voltage: 1.056, angle: -14.94, load_p: 29.5, load_q: 16.6, status: 'warning', anomaly_score: 0.35 },
    { id: 10, name: 'Bus 10', type: 'pq', voltage: 1.051, angle: -15.1, load_p: 9.0, load_q: 5.8, status: 'normal', anomaly_score: 0.11 },
    { id: 11, name: 'Bus 11', type: 'pq', voltage: 1.057, angle: -14.79, load_p: 3.5, load_q: 1.8, status: 'normal', anomaly_score: 0.09 },
    { id: 12, name: 'Bus 12', type: 'pq', voltage: 1.055, angle: -15.07, load_p: 6.1, load_q: 1.6, status: 'normal', anomaly_score: 0.13 },
    { id: 13, name: 'Bus 13', type: 'pq', voltage: 1.05, angle: -15.16, load_p: 13.5, load_q: 5.8, status: 'normal', anomaly_score: 0.14 },
    { id: 14, name: 'Bus 14', type: 'pq', voltage: 1.036, angle: -16.04, load_p: 14.9, load_q: 5.0, status: 'critical', anomaly_score: 0.78 },
  ];

  const lines: Line[] = [
    { from_bus: 1, to_bus: 2, resistance: 0.01938, reactance: 0.05917, flow_p: 97.5, flow_q: 30.2, rating: 150, status: 'normal' },
    { from_bus: 1, to_bus: 5, resistance: 0.05403, reactance: 0.22304, flow_p: 45.2, flow_q: 12.1, rating: 120, status: 'normal' },
    { from_bus: 2, to_bus: 3, resistance: 0.04699, reactance: 0.19797, flow_p: 82.3, flow_q: 19.5, rating: 130, status: 'normal' },
    { from_bus: 2, to_bus: 5, resistance: 0.05811, reactance: 0.17632, flow_p: 34.1, flow_q: 8.9, rating: 110, status: 'normal' },
    { from_bus: 3, to_bus: 4, resistance: 0.06701, reactance: 0.17103, flow_p: 15.8, flow_q: 3.2, rating: 100, status: 'warning' },
    { from_bus: 3, to_bus: 5, resistance: 0.039, reactance: 0.17025, flow_p: 62.4, flow_q: 12.3, rating: 140, status: 'normal' },
    { from_bus: 4, to_bus: 5, resistance: 0.01335, reactance: 0.04211, flow_p: 58.6, flow_q: 8.7, rating: 125, status: 'normal' },
    { from_bus: 6, to_bus: 12, resistance: 0.12291, reactance: 0.25581, flow_p: 22.1, flow_q: 6.3, rating: 90, status: 'normal' },
    { from_bus: 6, to_bus: 13, resistance: 0.06615, reactance: 0.13027, flow_p: 19.5, flow_q: 4.8, rating: 95, status: 'normal' },
    { from_bus: 9, to_bus: 14, resistance: 0.17615, reactance: 0.37454, flow_p: 28.9, flow_q: 11.2, rating: 85, status: 'critical' },
  ];

  return {
    timestamp: Date.now(),
    buses,
    lines,
    metrics: {
      total_load: 259.8,
      avg_voltage: 1.058,
      max_deviation: 0.78,
      compromised_buses: 1,
    },
  };
}

export function generateMockAttacks(): AttackEvent[] {
  const now = Date.now();
  return [
    {
      id: 'attack_1',
      timestamp: now - 300000,
      source_bus: 3,
      target_bus: 9,
      attack_type: 'false_data_injection',
      severity: 'medium',
      detected: true,
      description: 'FDI attack detected on voltage measurement',
    },
    {
      id: 'attack_2',
      timestamp: now - 180000,
      source_bus: 1,
      target_bus: 14,
      attack_type: 'state_manipulation',
      severity: 'high',
      detected: true,
      description: 'State manipulation attempt targeting critical bus',
    },
    {
      id: 'attack_3',
      timestamp: now - 60000,
      source_bus: 6,
      target_bus: 12,
      attack_type: 'false_data_injection',
      severity: 'low',
      detected: true,
      description: 'Minor FDI on reactive power',
    },
  ];
}

export function generateMockKPIs() {
  return {
    risk_score: 72.5,
    detection_rate: 94.2,
    avg_response_time: 245,
    total_attacks: 23,
  };
}
