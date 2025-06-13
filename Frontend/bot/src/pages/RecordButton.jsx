// // RecordButton.jsx
// import React, { useRef, useState } from "react";

// const RecordButton = () => {
//   const [recording, setRecording] = useState(false);
//   const [status, setStatus] = useState('');
//   const mediaRecorderRef = useRef(null);
//   const audioChunks = useRef([]);

//   const startRecording = async () => {
//     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//     mediaRecorderRef.current = new MediaRecorder(stream);

//     mediaRecorderRef.current.ondataavailable = (e) => {
//       audioChunks.current.push(e.data);
//     };

//     mediaRecorderRef.current.onstop = async () => {
//       const blob = new Blob(audioChunks.current, { type: "audio/wav" });
//       const formData = new FormData();
//       formData.append("audio", blob);      try {
//         setStatus('Uploading audio...');
//         // Send to backend
//         const response = await fetch("http://localhost:5000/api/audio", {
//           method: "POST",
//           body: formData,
//         });

//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log('Audio processed:', data);
//         setStatus('Audio processed successfully!');
//       } catch (error) {
//         console.error('Error uploading audio:', error);
//         setStatus('Error processing audio. Please try again.');
//       } finally {
//         audioChunks.current = [];
//       }
//     };

//     mediaRecorderRef.current.start();
//     setRecording(true);
//   };

//   const stopRecording = () => {
//     mediaRecorderRef.current.stop();
//     setRecording(false);
//   };
//   return (
//     <div>
//       <button onClick={recording ? stopRecording : startRecording}>
//         {recording ? "Stop Recording" : "Start Recording"}
//       </button>
//       {status && <p>{status}</p>}
//     </div>
//   );
// };

// export default RecordButton;
import React, { useRef, useState } from "react";

const RecordButton = () => {
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState('');
  const [transcript, setTranscript] = useState('');
  const [botReply, setBotReply] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);

    audioChunks.current = [];

    mediaRecorderRef.current.ondataavailable = (e) => {
      audioChunks.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(audioChunks.current, { type: "audio/webm" }); // Use webm for consistency
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      try {
        setStatus('Uploading audio...');
        const response = await fetch("http://localhost:5000/api/audio", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        console.log("✅ Server Response:", data);

        setTranscript(data.transcription);
        setBotReply(data.reply);
        setStatus('Audio processed! Playing reply...');

        if (data.audioBase64) {
          const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
          audio.play();
        } else {
          setStatus('Bot reply ready, but no audio found.');
        }
      } catch (error) {
        console.error('❌ Error uploading audio:', error);
        setStatus('Error processing audio. Please try again.');
      } finally {
        audioChunks.current = [];
      }
    };

    mediaRecorderRef.current.start();
    setRecording(true);
    setStatus('Recording...');
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
    setStatus('Processing...');
  };

  return (
    <div className="p-4">
      <button onClick={recording ? stopRecording : startRecording}>
        {recording ? "Stop Recording" : "Start Recording"}
      </button>

      {status && <p>Status: {status}</p>}
      {transcript && (
        <div className="mt-2">
          <p><strong>User said:</strong> {transcript}</p>
          <p><strong>Bot reply:</strong> {botReply}</p>
        </div>
      )}
    </div>
  );
};

export default RecordButton;
