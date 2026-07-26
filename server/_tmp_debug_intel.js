require('dotenv').config();
const openai = require('./utils/openaiService');

(async () => {
  const system = `You are YANSY's consultant. Reply naturally, then on a new line write exactly: |||JSON|||
then a JSON object: {"leadScore":<0-100>,"industry":"<string>","projectType":"<string>"}`;
  const res = await openai.complete({
    system,
    messages: [{ role: 'user', content: "I run a small real estate agency in Cairo, we need a listings site with a lead CRM, budget around 15k, want to launch in 2 months." }],
    maxTokens: 400,
    temperature: 0.75,
  });
  console.log('=== FULL RAW ===');
  console.log(res.text);
})();
