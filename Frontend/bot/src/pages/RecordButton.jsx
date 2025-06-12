// RecordButton.jsx
import React, { useRef, useState } from "react";

const RecordButton = () => {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);

    mediaRecorderRef.current.ondataavailable = (e) => {
      audioChunks.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(audioChunks.current, { type: "audio/wav" });
      const formData = new FormData();
      formData.append("audio", blob);

      // Send to backend
      await fetch("http://localhost:5000/api/audio", {
        method: "POST",
        body: formData,
      });

      audioChunks.current = [];
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  return (
    <button onClick={recording ? stopRecording : startRecording}>
      {recording ? "Stop Recording" : "Start Recording"}
    </button>
  );
};

export default RecordButton;
