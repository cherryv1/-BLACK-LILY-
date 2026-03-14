export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    if (url.pathname === '/chat' && request.method === 'POST') {
      const { message } = await request.json();
      const intent = detectIntent(message);
      let respuesta = null;

      if (intent === 'vision') {
        respuesta = await callGemini(message, env.GEMINI_API_KEY);
      } else if (intent === 'code') {
        respuesta = await callGroq(message, env.GROQ_API_KEY);
        if (!respuesta) respuesta = await callCerebras(message, env.CEREBRAS_API_KEY);
      } else {
        respuesta = await callCerebras(message, env.CEREBRAS_API_KEY);
        if (!respuesta) respuesta = await callGroq(message, env.GROQ_API_KEY);
      }

      return new Response(JSON.stringify({ respuesta: respuesta || 'Error en todos los modelos' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response('Black Lily Elite online 🖤', { status: 200 });
  }
};

function detectIntent(message) {
  const msg = message.toLowerCase();
  if (msg.includes('imagen') || msg.includes('foto') || msg.includes('ver')) return 'vision';
  if (msg.includes('código') || msg.includes('code') || msg.includes('programa')) return 'code';
  return 'chat';
}

async function callCerebras(message, apiKey) {
  try {
    const r = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'llama-3.3-70b', messages: [{ role: 'system', content: 'Eres Black Lily, asistente elegante y misteriosa de última generación 2026.' }, { role: 'user', content: message }] })
    });
    const d = await r.json();
    return d.choices?.[0]?.message?.content;
  } catch(e) { return null; }
}

async function callGroq(message, apiKey) {
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: 'Eres Black Lily, asistente elegante y misteriosa de última generación 2026.' }, { role: 'user', content: message }] })
    });
    const d = await r.json();
    return d.choices?.[0]?.message?.content;
  } catch(e) { return null; }
}

async function callGemini(message, apiKey) {
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] })
    });
    const d = await r.json();
    return d.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch(e) { return null; }
}
