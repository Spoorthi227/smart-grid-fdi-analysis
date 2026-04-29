# Smart Grid FDIA Forensic Dashboard - API Integration Guide

## Overview

The Smart Grid FDIA Forensic Dashboard is designed to connect to a REST API that provides:
- Real-time grid state data (buses and transmission lines)
- Attack timeline events
- KPI metrics

## API Configuration

The dashboard fetches data from a REST API endpoint specified by the `NEXT_PUBLIC_API_BASE_URL` environment variable.

### Setting Up the API Endpoint

1. **Create a `.env.local` file** in the project root:

```bash
NEXT_PUBLIC_API_BASE_URL=http://your-api-server:port/api
```

2. **Or set it in your deployment environment** (Vercel, etc.)

### Default Behavior

If the API is not available or returns an error, the dashboard will automatically fall back to mock data for development and testing.

## API Endpoints

The dashboard expects the following endpoints:

### 1. **GET `/api/dashboard`**
Complete dashboard data in a single request.

**Response:**
```json
{
  "current_state": {
    "timestamp": 1704067200000,
    "buses": [
      {
        "id": 1,
        "name": "Bus 1 (Slack)",
        "type": "slack",
        "voltage": 1.06,
        "angle": 0,
        "load_p": 0,
        "load_q": 0,
        "status": "normal",
        "anomaly_score": 0.05
      }
    ],
    "lines": [
      {
        "from_bus": 1,
        "to_bus": 2,
        "resistance": 0.01938,
        "reactance": 0.05917,
        "flow_p": 97.5,
        "flow_q": 30.2,
        "rating": 150,
        "status": "normal"
      }
    ],
    "metrics": {
      "total_load": 259.8,
      "avg_voltage": 1.058,
      "max_deviation": 0.78,
      "compromised_buses": 1
    }
  },
  "attack_timeline": [
    {
      "id": "attack_1",
      "timestamp": 1704067200000,
      "source_bus": 3,
      "target_bus": 9,
      "attack_type": "false_data_injection",
      "severity": "medium",
      "detected": true,
      "description": "FDI attack detected on voltage measurement"
    }
  ],
  "kpis": {
    "risk_score": 72.5,
    "detection_rate": 94.2,
    "avg_response_time": 245,
    "total_attacks": 23
  }
}
```

### 2. **GET `/api/grid`** (Optional)
Provides current grid state only.

**Response:**
```json
{
  "timestamp": 1704067200000,
  "buses": [...],
  "lines": [...],
  "metrics": {...}
}
```

### 3. **GET `/api/attacks`** (Optional)
Provides attack timeline only.

**Response:**
```json
[
  {
    "id": "attack_1",
    "timestamp": 1704067200000,
    "source_bus": 3,
    "target_bus": 9,
    "attack_type": "false_data_injection",
    "severity": "medium",
    "detected": true,
    "description": "FDI attack detected on voltage measurement"
  }
]
```

## Data Types

### Bus Status
- `normal` - Green indicator
- `warning` - Yellow indicator
- `critical` - Red indicator

### Attack Types
- `false_data_injection` - FDI attack on measurements
- `command_injection` - Injection into control commands
- `state_manipulation` - Direct state modification

### Attack Severity
- `low` - Low impact attack
- `medium` - Moderate impact
- `high` - Critical impact

### Bus Types
- `slack` - Slack bus (voltage reference)
- `pv` - PV bus (voltage-controlled generator)
- `pq` - PQ bus (load or passive element)

## Testing with Mock Data

The dashboard includes built-in mock data generators. To test without an API:

1. Simply don't set `NEXT_PUBLIC_API_BASE_URL`
2. Or set it to an invalid URL
3. The dashboard will automatically use simulated data

Mock data is generated for the IEEE 14-bus test system with:
- 14 buses with varying status levels
- 10 transmission lines with flow data
- 3 recent attack events
- KPI metrics for demonstration

## Data Refresh

The dashboard polls for new data every 5 seconds by default. To change this interval, modify the polling period in `app/page.tsx`:

```typescript
// Change from 5000ms to your preferred interval
const interval = setInterval(loadData, 5000);
```

## Error Handling

- API timeouts automatically fall back to mock data
- Network errors are logged to console but don't break the dashboard
- Stale data is displayed until fresh data is available

## Performance Tips

1. **Optimize API Response Time**: Aim for sub-500ms responses
2. **Use Pagination**: For large attack timelines, consider pagination
3. **Cache When Possible**: Implement caching on your API server
4. **Real-time Updates**: Consider WebSocket support for live updates (future enhancement)

## Future Enhancements

The dashboard architecture supports:
- WebSocket connections for real-time data
- Historical data playback
- Advanced filtering and search
- Export functionality
- Multi-system monitoring
