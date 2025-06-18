const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const app = require('./server/app');
const { transcribeAudioBase64 } = require('./server/sttlogic');
const { getLog } = require('./server/memory');

const PORT = process.env.PORT || 5000;

// Ensure /uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on('connection', (ws) => {
  const sessionId = uuidv4();
  console.log(`🔗 WebSocket connected [${sessionId}]`);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
if (data.type === 'audio') {
  console.log(`📥 Received audio message [${sessionId}]`);
} else {
  console.log(`📥 Received message [${sessionId}]:`, data);
}

      if (data.type === 'audio') {
        const result = await transcribeAudioBase64(data.audioData, sessionId);
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

  ws.on('close', () => {
    console.log(`❌ WebSocket disconnected [${sessionId}]`);

    try {
      const fullLog = getLog(sessionId);

      const logEntries = fullLog.filter(entry =>
        entry.role === 'log' &&
        entry.content &&
        typeof entry.content === 'object'
      );

      if (!logEntries.length) return; // nothing to log

      const convoLogPath = path.join(uploadsDir, `conversation_${sessionId}.log`);

      const blocks = logEntries.map((entry, i) => {
        const date = new Date().toLocaleString();
        const user = entry.content.transcription || 'No transcription available.';
        const nlu = JSON.stringify({
          intent: entry.content.intent || 'unknown',
          entities: entry.content.entities || {}
        }, null, 2);
        const reply = entry.content.reply || 'No reply generated.';

        return `
Convo ${i + 1}
==================
Date: ${date}

User said:
----------
${user}

NLU Output:
-----------
${nlu}

Bot Reply:
----------
${reply}

-----------------------------------------------\n`;
      });

      fs.writeFileSync(convoLogPath, blocks.join('\n'), 'utf8');
      console.log(`📁 Log saved at: ${convoLogPath}`);
    } catch (logErr) {
      console.error(`❌ Failed to save conversation log [${sessionId}]:`, logErr.message);
    }
  });
});

if (!module.parent) {
  server.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket ready at ws://localhost:${PORT}`);
  });
}
