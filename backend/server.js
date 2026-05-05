const express = require('express');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const http = require('http');
const axios = require('axios'); // Added axios for Python ML service communication

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3001;

// ------------------------------------------------------------
// CREATE HTTP SERVER
// ------------------------------------------------------------
const server = http.createServer(app);

// ------------------------------------------------------------
// WEBSOCKET SERVER
// ------------------------------------------------------------
const wss = new WebSocketServer({
    server,
    path: '/ws', // Frontend connects here: ws://localhost:3001/ws
});

let latestGridData = {};
let latestPrediction = { attack: 0, label: 1, score: 0 }; // Stores the latest ML inference result

// ------------------------------------------------------------
// START SERVER
// ------------------------------------------------------------
server.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
    console.log(`WebSocket running at ws://localhost:${PORT}/ws`);
});

// ------------------------------------------------------------
// WEBSOCKET CONNECTION HANDLING
// ------------------------------------------------------------
wss.on('connection', (ws) => {
    console.log('Frontend WebSocket client connected');

    // Send latest data immediately if available
    if (Object.keys(latestGridData).length > 0) {
        ws.send(
            JSON.stringify({
                type: 'grid_update',
                payload: latestGridData,
            })
        );
    }

    ws.on('message', (message) => {
        try {
            const parsed = JSON.parse(message);
            console.log('Received frontend message:', parsed);
        } catch {
            console.log('Received raw message:', message.toString());
        }
    });

    ws.on('close', () => {
        console.log('Frontend WebSocket client disconnected');
    });

    ws.on('error', (error) => {
        console.error('WebSocket client error:', error);
    });
});

// ------------------------------------------------------------
// MATLAB API ENDPOINT (STATE RECEIVER & ML TRIGGER)
// MATLAB sends raw state here to get checked by ML model
// ------------------------------------------------------------
app.post('/api/get-state', async (req, res) => {
    try {
        const payload = req.body;
        
        // Strict Feature Extraction Order: Pd, Qd, Vm, Va (1 to 14 each)
        const features = [];
        for (let i = 1; i <= 14; i++) features.push(payload[`Pd_bus${i}`] || 0);
        for (let i = 1; i <= 14; i++) features.push(payload[`Qd_bus${i}`] || 0);
        for (let i = 1; i <= 14; i++) features.push(payload[`Vm_bus${i}`] || 0);
        for (let i = 1; i <= 14; i++) features.push(payload[`Va_bus${i}`] || 0);

        // Send to Python ML Service synchronously
        console.log('Sending state to ML Service (56 features)...');
        const mlResponse = await axios.post('http://127.0.0.1:5000/predict', { features });
        
        // Update the prediction state
        latestPrediction = mlResponse.data;
        console.log('ML Prediction received:', latestPrediction);

        // Acknowledge receipt to MATLAB
        res.status(200).json({ status: 'State received and evaluated.' });
    } catch (error) {
        console.error('Error in ML pipeline:', error.message);
        // Default to normal if ML fails to prevent false positives/crashes
        latestPrediction = { attack: 0, label: 1, score: 0, error: error.message };
        res.status(500).json({ error: 'ML inference failed' });
    }
});

// ------------------------------------------------------------
// MATLAB API ENDPOINT (MODEL RESULT)
// MATLAB polls this to know if it should run forensic
// ------------------------------------------------------------
app.get('/api/model-result', (req, res) => {
    res.json(latestPrediction);
});

// ------------------------------------------------------------
// MATLAB API ENDPOINT (FORENSIC RESULT)
// MATLAB sends forensic CSV-derived JSON here
// ------------------------------------------------------------
app.post('/api/update-grid', (req, res) => {
    try {
        latestGridData = req.body;

        console.log('================================================');
        console.log('Received data from MATLAB:');
        console.log(latestGridData);
        console.log('================================================');

        // Broadcast to all active frontend clients
        wss.clients.forEach((client) => {
            if (client.readyState === 1) {
                client.send(
                    JSON.stringify({
                        type: 'grid_update',
                        payload: latestGridData,
                    })
                );
            }
        });

        res.status(200).json({
            status: 'Success',
            message: 'Grid data received and broadcasted successfully',
        });
    } catch (error) {
        console.error('Error processing MATLAB data:', error);

        res.status(500).json({
            status: 'Error',
            message: 'Failed to process incoming data',
        });
    }
});

// ------------------------------------------------------------
// DASHBOARD POLLING ENDPOINT
// Used if WebSocket fails
// ------------------------------------------------------------
app.get('/api/dashboard', (req, res) => {
    res.json({
        current_state: latestGridData,
    });
});

// ------------------------------------------------------------
// HEALTH CHECK
// ------------------------------------------------------------
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        websocket_clients: wss.clients.size,
        last_update: latestGridData.timestamp || null,
    });
});