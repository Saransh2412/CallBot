const fs = require('fs');
const path = require('path');
const speech = require('@google-cloud/speech');
const extractIntentEntities = require('./nlu');
const getDynamicResponse = require('./dialogueManager');
const synthesizeSpeech = require('./tts');
require('dotenv').config();

const speechClient = new speech.SpeechClient({
  keyFilename: path.join(__dirname, 'striped-device-456606-s4-d08d63972d53.json')
});

const uploadsDir = path.join(__dirname, 'uploads');
const convoLogPath = path.join(uploadsDir, 'conversations.log');

// 📄 Helper: Append to conversations.log
function appendToConversationLog({ transcription, nlu, reply }) {
  const convoCount = (fs.existsSync(convoLogPath) && fs.readFileSync(convoLogPath, 'utf8').match(/Convo \d+/g)?.length) || 0;
  const nextConvo = `Convo ${convoCount + 1}`;
  const block = `
${nextConvo}
==================
Date: ${new Date().toLocaleString()}

User said:
----------
${transcription || 'No transcription available.'}

NLU Output:
-----------
${JSON.stringify(nlu, null, 2)}

Bot Reply:
----------
${reply || 'No reply generated.'}

-----------------------------------------------\n`;

  fs.appendFileSync(convoLogPath, block, 'utf8');
}

// 🔊 Main STT handler
const handleAudioUpload = async (req, res) => {
  try {
    const finalFilename = req.file.filename;
    const finalPath = path.join(uploadsDir, finalFilename);
    console.log('🎙️ Audio file saved at:', finalPath);

    const audioBytes = fs.readFileSync(finalPath).toString('base64');
    const request = {
      audio: { content: audioBytes },
      config: {
        encoding: 'WEBM_OPUS',
        languageCode: 'en-US',
        model: 'latest_long'
      }
    };

    const [response] = await speechClient.recognize(request);
    const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n');

    const textFilename = finalFilename + '_transcription.txt';
    const textFilePath = path.join(uploadsDir, textFilename);
    fs.writeFileSync(textFilePath, transcription || 'No speech detected', 'utf8');
    console.log('📝 Transcription saved at:', textFilePath);

    // 🧠 Run NLU
    let nluResult = {};
    try {
      nluResult = await extractIntentEntities(transcription);
      console.log('🤖 NLU Result:', nluResult);
    } catch (nluError) {
      console.error('❌ Error in NLU:', nluError.message);
      nluResult = { error: 'Failed to extract intent/entities' };
    }

    // 💬 Generate Bot Reply
    let botReply = '';
    try {
      botReply = await getDynamicResponse(nluResult.intent, nluResult.entities, transcription);
      console.log('💬 Bot Reply:', botReply);
    } catch (err) {
      console.error('❌ Dialogue error:', err.message);
      botReply = 'Sorry, I had trouble generating a response.';
    }

    // 🔊 Convert to speech (no file save)
    let audioBase64 = '';
    try {
      const audioBuffer = await synthesizeSpeech(botReply);
      audioBase64 = audioBuffer.toString('base64');
    } catch (ttsError) {
      console.error('❌ TTS Error:', ttsError.message);
    }

    // 🗂️ Append to log file
    appendToConversationLog({ transcription, nlu: nluResult, reply: botReply });

    // ✅ Send final response
    res.json({
      success: true,
      transcription,
      nlu: nluResult,
      reply: botReply,
      audioBase64, // base64 MP3 audio
      textFileUrl: `http://localhost:5000/uploads/${textFilename}`,
      logFileUrl: `http://localhost:5000/uploads/conversations.log`
    });

  } catch (error) {
    console.error('❌ Error processing audio:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing audio file',
      error: error.message
    });
  }
};

// 📄 List transcription files
const getTranscriptions = (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const textFiles = files
      .filter(file => file.endsWith('_transcription.txt'))
      .map(file => ({
        filename: file,
        url: `http://localhost:5000/uploads/${file}`,
        created: fs.statSync(path.join(uploadsDir, file)).birthtime
      }))
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    res.json({ success: true, files: textFiles });
  } catch (err) {
    console.error('❌ Error listing transcriptions:', err);
    res.status(500).json({ success: false, message: 'Unable to fetch files' });
  }
};

// 🔁 WebSocket-compatible STT + NLU + reply handler
const transcribeAudioBase64 = async (audioBase64) => {
  try {
    const request = {
      audio: { content: audioBase64 },
      config: {
        encoding: 'WEBM_OPUS',
        languageCode: 'en-US',
        model: 'latest_long'
      }
    };

    const [response] = await speechClient.recognize(request);
    const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n');

    // 🧠 Run NLU
    let nluResult = {};
    try {
      nluResult = await extractIntentEntities(transcription);
      console.log('🤖 NLU Result:', nluResult);
    } catch (nluError) {
      console.error('❌ Error in NLU:', nluError.message);
      nluResult = { error: 'Failed to extract intent/entities' };
    }

    // 💬 Generate Bot Reply
    let botReply = '';
    try {
      botReply = await getDynamicResponse(nluResult.intent, nluResult.entities, transcription);
      console.log('💬 Bot Reply:', botReply);
    } catch (err) {
      console.error('❌ Dialogue error:', err.message);
      botReply = 'Sorry, I had trouble generating a response.';
    }

    // 🔊 Convert to speech
    let audioBase64Reply = '';
    try {
      const audioBuffer = await synthesizeSpeech(botReply);
      audioBase64Reply = audioBuffer.toString('base64');
    } catch (ttsError) {
      console.error('❌ TTS Error:', ttsError.message);
    }

    // 🗂️ Optional: log the conversation
    appendToConversationLog({ transcription, nlu: nluResult, reply: botReply });

    return {
      success: true,
      transcription,
      intent: nluResult.intent,
      entities: nluResult.entities,
      reply: botReply,
      audioBase64: audioBase64Reply
    };

  } catch (err) {
    console.error('❌ WebSocket audio processing error:', err.message);
    return {
      success: false,
      message: 'Error processing audio via WebSocket',
      error: err.message
    };
  }
};

module.exports = {
  handleAudioUpload,
  getTranscriptions,
  transcribeAudioBase64
};
