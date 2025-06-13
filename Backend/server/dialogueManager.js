const { GoogleGenerativeAI } = require('@google/generative-ai');
const { addMessage, getHistory } = require('./memory');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function getDynamicResponse(intent, entities, userInput) {
  try {
    // Prepare chat history
    const messages = getHistory().map(entry => ({
      role: entry.role,
      parts: [{ text: entry.content }]
    }));

    // Add current user input to conversation
    messages.push({
      role: 'user',
      parts: [{ text: `Intent: ${intent}, Entities: ${JSON.stringify(entities)}\nUser: ${userInput}` }]
    });

    const result = await model.generateContent({
      contents: messages
    });

    const response = await result.response;
    const reply = response.text().trim();

    // Save both user and assistant responses to memory
    addMessage('user', userInput);
    addMessage('model', reply);

    return reply;
  } catch (error) {
    console.error("❌ DialogueManager error:", error);
    return "Sorry, I couldn't generate a reply.";
  }
}

module.exports = getDynamicResponse;
