import { useState, useEffect, useRef } from 'react';
import RecordButton from './pages/RecordButton';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');
  const [botResponse, setBotResponse] = useState(null);
  const ws = useRef(null);
  const recordButtonRef = useRef(null);

  useEffect(() => {
    // ✅ Use /ws to avoid conflict with Express routes
    ws.current = new WebSocket('ws://localhost:5000/ws');

    ws.current.onopen = () => {
      console.log('✅ WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'bot_response') {
        setBotResponse(data);

        if (data.audioBase64) {
          const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
          audio.play();

          // 🔁 Restart recording after bot reply ends
          audio.onended = () => {
            console.log("🎙️ Bot finished speaking, start user recording...");
            recordButtonRef.current?.startRecording?.();
          };
        }
      }
    };

    ws.current.onclose = () => {
      console.log('🔌 WebSocket disconnected');
    };

    return () => {
      ws.current.close();
    };
  }, []);

  const sendAudio = (base64Audio) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'audio',
        audioData: base64Audio
      }));
    } else {
      console.error('WebSocket is not open');
    }
  };

  useEffect(() => {
    fetch('http://localhost:5000/')
      .then(res => res.text())
      .then(data => setMessage(data))
      .catch(err => console.error('Backend fetch error:', err));
  }, []);

  return (
    <div>
      <RecordButton ref={recordButtonRef} sendAudio={sendAudio} />

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>Edit <code>src/App.jsx</code> and save to test HMR</p>
        <p>🔌 Backend Message: <strong>{message || 'Loading...'}</strong></p>
      </div>

      {botResponse && (
        <div className="bot-response mt-4">
          <h3>🤖 Bot Response</h3>
          <p><strong>Transcript:</strong> {botResponse.transcription}</p>
          <p><strong>Intent:</strong> {botResponse.intent}</p>
          <p><strong>Entities:</strong> {JSON.stringify(botResponse.entities)}</p>
          <p><strong>Bot Says:</strong> {botResponse.reply}</p>
        </div>
      )}
    </div>
  );
}

export default App;
