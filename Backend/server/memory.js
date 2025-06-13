// server/memory.js
const conversationHistory = [];

function addMessage(role, content) {
  conversationHistory.push({ role, content });

  // Limit history to last 10 messages
  if (conversationHistory.length > 10) {
    conversationHistory.shift();
  }
}

function getHistory() {
  return conversationHistory;
}

function resetHistory() {
  conversationHistory.length = 0;
}

module.exports = { addMessage, getHistory, resetHistory };
