const express = require('express');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const http = require('http');

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
// MATLAB API ENDPOINT
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