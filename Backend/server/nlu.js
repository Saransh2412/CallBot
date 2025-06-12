const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function extractIntentEntities(text) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
Extract intent and entities from the sentence below. Return pure JSON only.

Sentence: "${text}"

Format:
{
  "intent": "intent_name",
  "entities": {
    "entity1": "value1",
    "entity2": "value2"
  }
}
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let output = response.text().trim();

  // 🧹 Remove backticks or markdown formatting if present
  if (output.startsWith("```")) {
    output = output.replace(/```(?:json)?/g, "").trim();
  }

  // 🔁 Now safely parse the JSON
  try {
    return JSON.parse(output);
  } catch (err) {
    console.error("❌ Failed to parse response:", output);
    throw new Error("Failed to extract intent/entities");
  }
}

module.exports = extractIntentEntities;
