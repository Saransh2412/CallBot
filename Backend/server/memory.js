// server/memory.js

// Short-term memory for context (max 10 entries)
const memoryMap = {};

// Full structured conversation log per session
const logMap = {};

function addMessage(sessionId, role, content) {
  // Initialize if not present
  if (!memoryMap[sessionId]) memoryMap[sessionId] = [];
  if (!logMap[sessionId]) logMap[sessionId] = [];

  const message = { role, content };

  // Add to Gemini memory
  memoryMap[sessionId].push(message);
  if (memoryMap[sessionId].length > 10) {
    memoryMap[sessionId].shift();
  }

  // Always add to full log
  logMap[sessionId].push(message);
}

function getHistory(sessionId) {
  return memoryMap[sessionId] || [];
}

function getLog(sessionId) {
  return logMap[sessionId] || [];
}

function resetHistory(sessionId) {
  delete memoryMap[sessionId];
  delete logMap[sessionId];
}

module.exports = {
  addMessage,
  getHistory,
  getLog,
  resetHistory
};
