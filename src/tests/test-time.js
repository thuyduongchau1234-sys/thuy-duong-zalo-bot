import axios from 'axios';
import config from '../config.js';

const apiKey = config.ai.geminiApiKey;

async function testModel(modelName) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  console.log(`Testing latency for: ${modelName}...`);
  const startTime = Date.now();
  try {
    const res = await axios.post(url, {
      contents: [{ role: 'user', parts: [{ text: 'Hi' }] }]
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    const duration = (Date.now() - startTime) / 1000;
    console.log(`✅ [${modelName}] Success! Time taken: ${duration}s`);
  } catch (err) {
    const duration = (Date.now() - startTime) / 1000;
    console.error(`❌ [${modelName}] Failed! Time taken: ${duration}s, Status: ${err.response?.status}, Error: ${err.message}`);
  }
}

async function runAll() {
  await testModel('gemini-flash-lite-latest');
  await testModel('gemini-2.0-flash-lite');
}

runAll();
