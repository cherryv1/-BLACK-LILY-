import { Router } from 'itty-router';

const SYSTEM_PROMPT = `Eres Black Lily, asistente de Baxto Style Tattoo. REGLAS: Responde SOLO en espanol. Maximo 3 oraciones. Para tatuajes o citas dirigelos al WhatsApp +52 984 256 2365. Nunca inventes. Ubicacion: Villas del Sol, Playa del Carmen QRoo. Instagram: instagram.com/baxto.tattooist`;

const router = Router();

// --- Pool de Modelos con Fallback ---
async function callAI(message, env, intent) {
  const pool = [];
  if (intent.includes("vision")) pool.push({ name: "Gemini", call: () => fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\${env.GEMINI_API_KEY}`, {method:"POST",body:JSON.stringify({contents:[{parts:[{text: SYSTEM_PROMPT + "\\n\\nUsuario: " + message}]}]})}).then(r => r.json()).then(d => d.candidates?.[0]?.content?.parts?.[0]?.text) });
  pool.push({ name: "Groq", call: () => fetch("https://api.groq.com/openai/v1/chat/completions", {method:"POST",headers:{"Authorization":"Bearer "+env.GROQ_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:"llama-3.3-70b-versatile",messages:[{role:"system",content:SYSTEM_PROMPT},{role:"user",content:message}]})}).then(r => r.json()).then(d => d.choices?.[0]?.message?.content) });
  pool.push({ name: "Cloudflare", call: () => env.AI.run('@cf/meta/llama-3-8b-instruct', {messages:[{role:'system',content:SYSTEM_PROMPT},{role:'user',content:message}]}).then(r => r.response) });

  for (const ai of pool) {
    try {
      const res = await ai.call();
      if (res && res.length > 5) return { reply: res, model: ai.name };
    } catch(e) { continue; }
  }
  return { reply: "Sistemas saturados. Contacta al WhatsApp.", model: "Fallback" };
}

// --- Lógica de Memoria (D1) ---
async function getCustomer(env, id) {
  return await env.DB.prepare("SELECT * FROM customers WHERE customer_id = ?").bind(id).first() || null;
}

async function saveCustomer(env, id, name) {
  await env.DB.prepare("INSERT OR IGNORE INTO customers (customer_id, name, last_contact, status) VALUES (?, ?, ?, ?)").bind(id, name, Math.floor(Date.now()/1000), 'nuevo').run();
}

// --- Procesador Central ---
async function processMessage(env, customerId, message, channel) {
  const session = await env.SESSIONS.get(customerId, {type: 'json'}) || { step: 'inicio' };
  const customer = await getCustomer(env, customerId);
  if (!customer) await saveCustomer(env, customerId, "Cliente " + channel);

  // Clasificar Intención
  const classification = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
    messages: [{ role: 'system', content: 'Clasifica en una palabra: "cita", "vision", o "general".' }, { role: 'user', content: message }]
  });
  const intent = classification.response.toLowerCase();

  let response;
  if (intent.includes("cita")) {
    response = { reply: "¡Claro! Para agendar, dime qué diseño tienes en mente y qué día te gustaría venir. 🖤", model: "Logic-Cita" };
    session.step = 'agendando';
  } else {
    response = await callAI(message, env, intent);
  }

  await env.SESSIONS.put(customerId, JSON.stringify(session), {expirationTtl: 3600});
  return response;
}

// --- Rutas Webhooks ---
router.post('/webhook/:channel', async (request, env) => {
  const { channel } = request.params;
  const body = await request.json();
  const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (msg) {
    const res = await processMessage(env, msg.from, msg.text.body, channel);
    console.log(`Respuesta enviada a \${channel}: \${res.reply}`);
  }
  return new Response("OK");
});

router.post('/chat', async (request, env) => {
  const { message } = await request.json();
  const res = await processMessage(env, "web-user", message, "web");
  return new Response(JSON.stringify(res), {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
});

export default { fetch: (req, env) => router.handle(req, env) };
