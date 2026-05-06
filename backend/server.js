const express = require('express');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const http = require('http');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

const server = http.createServer(app);

const wss = new WebSocketServer({
    server,
    path: '/ws',
});

// ---------------- GLOBAL STATE ----------------
let latestGridData = {};
let latestPrediction = { attack: 0, label: 1, score: 0 };
let latestSystemSummary = null;
let latestSystemState = null;

// ============================================================
server.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
    console.log(`WebSocket: ws://localhost:${PORT}/ws`);
});

// ============================================================
// BROADCAST
// ============================================================
function broadcast(type, payload) {
    const msg = JSON.stringify({ type, payload });

    wss.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(msg);
        }
    });
}

// ============================================================
// SAFE ARRAY HELPER (🔥 IMPORTANT FIX)
// ============================================================
function safeArray(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    return [v];
}

// ============================================================
// WEBSOCKET
// ============================================================
wss.on('connection', (ws) => {
    console.log('Client connected');

    if (latestGridData) {
        ws.send(JSON.stringify({
            type: 'grid_update',
            payload: latestGridData,
        }));
    }

    if (latestSystemSummary) {
        ws.send(JSON.stringify({
            type: 'system_summary',
            payload: latestSystemSummary,
        }));
    }

    if (latestSystemState) {
        ws.send(JSON.stringify({
            type: 'system_state',
            payload: latestSystemState,
        }));
    }
});

// ============================================================
// MATLAB → STATE → ML
// ============================================================
app.post('/api/get-state', async (req, res) => {
    const payload = req.body;

    const features = [];

    for (let i = 1; i <= 14; i++) features.push(payload[`Pd_bus${i}`] || 0);
    for (let i = 1; i <= 14; i++) features.push(payload[`Qd_bus${i}`] || 0);
    for (let i = 1; i <= 14; i++) features.push(payload[`Vm_bus${i}`] || 0);
    for (let i = 1; i <= 14; i++) features.push(payload[`Va_bus${i}`] || 0);

    axios.post('http://127.0.0.1:5000/predict', { features })
        .then(r => {
            latestPrediction = r.data;
        })
        .catch(() => {
            latestPrediction = { attack: 0, label: 1, score: 0 };
        });

    res.json({ status: 'ok' });
});

// ============================================================
// MODEL RESULT
// ============================================================
app.get('/api/model-result', (req, res) => {
    res.json(latestPrediction);
});

// ============================================================
// GRID UPDATE (🔥 FIXED)
// ============================================================
app.post('/api/update-grid', (req, res) => {
    const data = req.body;

    const compromised = safeArray(data.primary_compromised_buses);
    const affectedLines = safeArray(data.affected_lines);

    latestGridData = {
        ...data,

        // ALWAYS SAFE ARRAYS
        primary_compromised_buses: compromised,
        affected_lines: affectedLines,

        // derived
        is_attack: data.is_attack ?? (data.true_label !== 0),

        critical_bus_count: compromised.length,
        warning_bus_count: (data.bus_scores || []).filter(x => x > 0 && x < 10).length,

        system_status:
            data.is_attack || data.true_label !== 0
                ? "CRITICAL"
                : "NORMAL",
    };

    console.log("GRID UPDATE");
    console.log("Attack:", latestGridData.is_attack);
    console.log("Critical buses:", latestGridData.critical_bus_count);

    broadcast('grid_update', latestGridData);

    res.json({ status: 'ok' });
});

// ============================================================
// SYSTEM SUMMARY
// ============================================================
app.post('/api/system-summary', (req, res) => {
    latestSystemSummary = req.body;

    broadcast('system_summary', latestSystemSummary);

    res.json({ status: 'ok' });
});

// ============================================================
// SYSTEM STATE (IMPORTANT FOR FRONTEND LOGIC)
// ============================================================
app.post('/api/system-state', (req, res) => {
    latestSystemState = req.body;

    broadcast('system_state', latestSystemState);

    res.json({ status: 'ok' });
});

// ============================================================
app.get('/api/dashboard', (req, res) => {
    res.json({
        current_state: latestGridData,
        system_state: latestSystemState,
    });
});

// ============================================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        clients: wss.clients.size,
        attack: latestGridData?.is_attack,
    });
});