const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const app = require('./server/app');
const { transcribeAudioBase64 } = require('./server/sttlogic'); // we'll define this next

const PORT = process.env.PORT || 5000;

// Create HTTP server and attach app
const server = http.createServer(app);

// Set up WebSocket server
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on('connection', (ws) => {
  console.log('🔗 WebSocket connected');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'audio') {
        const result = await transcribeAudioBase64(data.audioData); // get result: transcript + nlu + reply
        ws.send(JSON.stringify({
          type: 'bot_response',
          ...result
        }));
      }
    } catch (err) {
      console.error('❌ WebSocket error:', err.message);
      ws.send(JSON.stringify({ type: 'error', message: err.message }));
    }
  });

  ws.on('close', () => console.log('❌ WebSocket disconnected'));
});

// Start server
if (!module.parent) {
  server.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket ready at ws://localhost:${PORT}`);
  });
}
