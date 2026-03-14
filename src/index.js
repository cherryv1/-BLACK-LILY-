const SYSTEM = `
Eres Black Lily, asistente virtual de Baxto Style Tattoo.

REGLAS OBLIGATORIAS:
- Responde SOLO en español.
- Máximo 3 oraciones.
- Si preguntan por tatuajes, citas o precios, dirige al WhatsApp.
- Nunca inventes información.
- Sé elegante, misteriosa y directa.

DATOS REALES:
Ubicación: Villas del Sol, Playa del Carmen, Quintana Roo.
WhatsApp: +52 984 256 2365
Instagram: instagram.com/baxto.tattooist
`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
    }
    if (url.pathname === '/chat' && request.method === 'POST') {
      const { message } = await request.json();
      const intent = detectIntent(message);
      let respuesta = null, modelo = null;
      const t0 = Date.now();
      if (intent === 'vision') {
        respuesta = await callGemini(message, env.GEMINI_API_KEY);
        if (respuesta) modelo = 'Gemini 2.0 Flash';
      } else {
        respuesta = await callCerebras(message, env.CEREBRAS_API_KEY);
        if (respuesta) modelo = 'Cerebras · Llama 3.3 70B';
        if (!respuesta) { respuesta = await callGroq(message, env.GROQ_API_KEY); if (respuesta) modelo = 'Groq · Llama 3.3 70B'; }
      }
      return new Response(JSON.stringify({ respuesta: respuesta || 'Error en todos los modelos', modelo: modelo || 'desconocido', latencia_ms: Date.now() - t0, intent }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
    return new Response('Black Lily Elite online 🖤', { status: 200 });
  }
};

function detectIntent(m) {
  m = m.toLowerCase();
  if (m.includes('imagen') || m.includes('foto')) return 'vision';
  return 'chat';
}

async function callCerebras(message, apiKey) {
  try {
    const r = await fetch('https://api.cerebras.ai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, body: JSON.stringify({ model: 'llama-3.3-70b', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: message }] }) });
    const d = await r.json(); return d.choices?.[0]?.message?.content;
  } catch(e) { return null; }
}

async function callGroq(message, apiKey) {
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: message }] }) });
    const d = await r.json(); return d.choices?.[0]?.message?.content;
  } catch(e) { return null; }
}

async function callGemini(message, apiKey) {
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system_instruction: { parts: [{ text: SYSTEM }] }, contents: [{ parts: [{ text: messagecat > ~/-BLACK-LILY-/src/index.js << 'EOF'
const SYSTEM = `
Eres Black Lily, asistente virtual de Baxto Style Tattoo.

REGLAS OBLIGATORIAS:
- Responde SOLO en español.
- Máximo 3 oraciones.
- Si preguntan por tatuajes, citas o precios, dirige al WhatsApp.
- Nunca inventes información.
- Sé elegante, misteriosa y directa.

DATOS REALES:
Ubicación: Villas del Sol, Playa del Carmen, Quintana Roo.
WhatsApp: +52 984 256 2365
Instagram: instagram.com/baxto.tattooist
`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
    }
    if (url.pathname === '/chat' && request.method === 'POST') {
      const { message } = await request.json();
      const intent = detectIntent(message);
      let respuesta = null, modelo = null;
      const t0 = Date.now();
      if (intent === 'vision') {
        respuesta = await callGemini(message, env.GEMINI_API_KEY);
        if (respuesta) modelo = 'Gemini 2.0 Flash';
      } else {
        respuesta = await callCerebras(message, env.CEREBRAS_API_KEY);
        if (respuesta) modelo = 'Cerebras · Llama 3.3 70B';
        if (!respuesta) { respuesta = await callGroq(message, env.GROQ_API_KEY); if (respuesta) modelo = 'Groq · Llama 3.3 70B'; }
      }
      return new Response(JSON.stringify({ respuesta: respuesta || 'Error en todos los modelos', modelo: modelo || 'desconocido', latencia_ms: Date.now() - t0, intent }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
    return new Response('Black Lily Elite online 🖤', { status: 200 });
  }
};

function detectIntent(m) {
  m = m.toLowerCase();
  if (m.includes('imagen') || m.includes('foto')) return 'vision';
  return 'chat';
}

async function callCerebras(message, apiKey) {
  try {
    const r = await fetch('https://api.cerebras.ai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, body: JSON.stringify({ model: 'llama-3.3-70b', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: message }] }) });
    const d = await r.json(); return d.choices?.[0]?.message?.content;
  } catch(e) { return null; }
}

async function callGroq(message, apiKey) {
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: message }] }) });
    const d = await r.json(); return d.choices?.[0]?.message?.content;
  } catch(e) { return null; }
}

async function callGemini(message, apiKey) {
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system_instruction: { parts: [{ text: SYSTEM }] }, contents: [{ parts: [{ text: message }] }] }) });
    const d = await r.json(); return d.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch(e) { return null; }
}
