// server/tts.js
const textToSpeech = require('@google-cloud/text-to-speech');
const path = require('path');
require('dotenv').config();

const client = new textToSpeech.TextToSpeechClient({
  keyFilename: path.join(__dirname, 'striped-device-456606-s4-d08d63972d53.json')
});

async function synthesizeSpeech(text) {
  const request = {
    input: { text },
    voice: { languageCode: 'en-US', ssmlGender: 'FEMALE' },
    audioConfig: { audioEncoding: 'MP3' }
  };

  const [response] = await client.synthesizeSpeech(request);

  return response.audioContent; // Return raw MP3 buffer
}

module.exports = synthesizeSpeech;
