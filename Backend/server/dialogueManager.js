const { GoogleGenerativeAI } = require('@google/generative-ai');
const { addMessage, getHistory } = require('./memory');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function getDynamicResponse(sessionId, intent, entities, userInput) {
  try {
    const messages = getHistory(sessionId)
  .filter(entry => entry.role === 'user' || entry.role === 'model') // ✅ Only allowed roles
  .map(entry => ({
    role: entry.role,
    parts: [{
      text: typeof entry.content === 'string'
        ? entry.content
        : JSON.stringify(entry.content)
    }]
  }));


    // ❌ DO NOT add a system prompt here for gemini-1.5-flash

    messages.push({
      role: 'user',
      parts: [{
text: `The user said: "${userInput}". Their intent is "${intent}" and relevant entities are: ${JSON.stringify(entities)}. 
Respond naturally like a voice assistant. Don't mention intent or entities. Just reply helpfully like you’re speaking aloud.`
      }]
    });

    const result = await model.generateContent({ contents: messages });
    const response = await result.response;
    const reply = response.text().trim();

    addMessage(sessionId, 'user', userInput);
    addMessage(sessionId, 'model', reply);

    return reply;
  } catch (error) {
    console.error("❌ DialogueManager error:", error);
    return "Sorry, I couldn't generate a reply.";
  }
}

module.exports = getDynamicResponse;
