const OpenAI = require("openai");

// 1. Point the client to Groq instead of OpenAI
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY, // Get this for free at console.groq.com
  baseURL: "https://api.groq.com/openai/v1", 
});

const generateAIResponse = async (message) => {
  const completion = await client.chat.completions.create({
  // model: "llama3-8b-8192", // ❌ DEPRECATED
  model: "llama-3.1-8b-instant", // ✅ ACTIVE & FAST
  messages: [
    { 
      role: "system", 
      content: "You are SynapseBot, an AI inside a futuristic chat platform." 
    },
    { role: "user", content: message }
  ],
});

  return completion.choices[0].message.content;
};

module.exports = { generateAIResponse };