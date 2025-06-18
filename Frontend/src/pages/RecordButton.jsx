import React, {
  useRef,
  useState,
  useImperativeHandle,
  forwardRef
} from "react";

const RecordButton = forwardRef(({ sendAudio }, ref) => {
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState('');
  const [conversationEnded, setConversationEnded] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const silenceTimer = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const micStreamRef = useRef(null);

  const SILENCE_THRESHOLD = 0.01;
  const SILENCE_DURATION = 1000;

  const detectSilence = () => {
    if (conversationEnded) return;

    const buffer = new Uint8Array(analyserRef.current.fftSize);
    analyserRef.current.getByteTimeDomainData(buffer);

    const volume = buffer.reduce((sum, val) => {
      const norm = (val - 128) / 128;
      return sum + norm * norm;
    }, 0) / buffer.length;

    if (volume < SILENCE_THRESHOLD) {
      if (!silenceTimer.current) {
        silenceTimer.current = setTimeout(() => {
          stopRecording();
        }, SILENCE_DURATION);
      }
    } else {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }

    requestAnimationFrame(detectSilence);
  };

  const startRecording = async () => {
    if (conversationEnded) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      sourceRef.current.connect(analyserRef.current);

      detectSilence();

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result.split(',')[1];
          sendAudio(base64Audio);
        };
        reader.readAsDataURL(blob);

        setStatus("⏳ Bot replying...");
        audioChunks.current = [];

        if (audioContextRef.current) {
          audioContextRef.current.close();
        }

        clearTimeout(silenceTimer.current);
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      setStatus("🎙️ Listening...");
    } catch (err) {
      console.error("❌ Mic error:", err);
      setStatus("Mic access error.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setStatus("Processing...");
    }
  };

  const endConversation = () => {
    setConversationEnded(true);
    setStatus("🛑 Conversation ended.");

    stopRecording();

    // Stop media stream tracks
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    clearTimeout(silenceTimer.current);
  };

  // Allow parent to restart
  useImperativeHandle(ref, () => ({
    startRecording,
    endConversation
  }));

  return (
    <div className="p-4">
      <button onClick={startRecording} disabled={recording || conversationEnded}>
        {recording ? "Listening..." : "Start Conversation"}
      </button>

      <button onClick={endConversation} className="ml-2" disabled={conversationEnded}>
        🔴 End Conversation
      </button>

      {status && <p>Status: {status}</p>}
    </div>
  );
});

export default RecordButton;
