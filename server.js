const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM = `Eres Black Lily, asistente virtual elegante y misteriosa de BRA GT .
REGLA ABSOLUTA: SOLO usa esta info real, NUNCA inventes nada.
UBICACION: Villas del Sol, Playa del Carmen, Quintana Roo, Mexico. CP 77723
WHATSAPP: +52 984 256 2365
INSTAGRAM: instagram.com/baxto.tattooist
FACEBOOK: facebook.com/share/18QE2k44rP
TIKTOK: @baxtostyletattoo
MAPS: maps.app.goo.gl/p165HXNeh4p7GbuA8
Responde en espanol, maximo 3 oraciones, elegante y profesional.`;

async function askAI(message, imageB64 = null) {
  // If image, use Gemini Vision
  if (imageB64) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM }] },
        contents: [{
          parts: [
            { text: message },
            { inline_data: { mime_type: 'image/jpeg', data: imageB64 } }
          ]
        }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.3 }
      })
    });
    const d = await r.json();
    return d.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude analizar la imagen.';
  }

  // Multi-agent fallback chain
  const intentos = [
    async () => {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: message }], max_tokens: 200 })
      });
      const d = await r.json();
      if (!d.choices) throw new Error('Groq fallo');
      return d.choices[0].message.content;
    },
    async () => {
      const r = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}` },
        body: JSON.stringify({ model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: message }], max_tokens: 200 })
      });
      const d = await r.json();
      if (!d.choices) throw new Error('Together fallo');
      return d.choices[0].message.content;
    },
    async () => {
      const r = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}` },
        body: JSON.stringify({ model: 'llama-3.3-70b', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: message }], max_tokens: 200 })
      });
      const d = await r.json();
      if (!d.choices) throw new Error('Cerebras fallo');
      return d.choices[0].message.content;
    }
  ];

  for (const intento of intentos) {
    try { return await intento(); } catch (e) { console.log('Fallback:', e.message); }
  }
  return 'Lo siento, intenta de nuevo en un momento.';
}

app.post('/chat', async (req, res) => {
  try {
    const respuesta = await askAI(req.body.message || 'Hola', req.body.image || null);
    res.json({ respuesta });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => console.log('Black Lily Multi-Agente + Vision corriendo en puerto: ' + port));
