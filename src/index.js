const SYSTEM = `Eres Black Lily, asistente de Baxto Style Tattoo. REGLAS: Responde SOLO en espanol. Maximo 3 oraciones. Para tatuajes o citas dirigelos al WhatsApp +52 984 256 2365. Nunca inventes. Ubicacion: Villas del Sol, Playa del Carmen QRoo. Instagram: instagram.com/baxto.tattooist`;

const INTENTS = {
  vision: ["analiza esta imagen", "que ves en la foto", "mira esta foto", "describe la imagen"],
  cita: ["quiero una cita", "cuanto cuesta", "precio del tatuaje", "agendar tatuaje"],
  ubicacion: ["donde estan", "como llegar", "direccion del estudio", "donde queda"],
  general: ["hola", "quien eres", "que puedes hacer", "ayuda"]
};

let INTENT_CACHE = null;

async function getIntentVectors(ai) {
  if (INTENT_CACHE) return INTENT_CACHE;
  const cache = {};
  for (const [intent, examples] of Object.entries(INTENTS)) {
    const result = await ai.run("@cf/baai/bge-small-en-v1.5", { text: examples });
    cache[intent] = result.data;
  }
  INTENT_CACHE = cache;
  return cache;
}

function cosineSim(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]*b[i]; normA += a[i]*a[i]; normB += b[i]*b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function semanticRouter(message, ai) {
  try {
    const [msgResult, intentVectors] = await Promise.all([
      ai.run("@cf/baai/bge-small-en-v1.5", { text: [message] }),
      getIntentVectors(ai)
    ]);
    const msgVec = msgResult.data[0];
    let bestIntent = "general", bestScore = -1;
    for (const [intent, vectors] of Object.entries(intentVectors)) {
      for (const vec of vectors) {
        const score = cosineSim(msgVec, vec);
        if (score > bestScore) { bestScore = score; bestIntent = intent; }
      }
    }
    return { intent: bestIntent, confidence: bestScore };
  } catch(e) {
    const m = message.toLowerCase();
    if (m.includes("foto") || m.includes("imagen")) return { intent: "vision", confidence: 0 };
    if (m.includes("cita") || m.includes("precio")) return { intent: "cita", confidence: 0 };
    if (m.includes("donde") || m.includes("ubicacion")) return { intent: "ubicacion", confidence: 0 };
    return { intent: "general", confidence: 0 };
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, {headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type"}});
    if (url.pathname === "/chat" && request.method === "POST") {
      const {message} = await request.json();
      const t0 = Date.now();
      const {intent, confidence} = await semanticRouter(message, env.AI);
      let respuesta = null, modelo = null;
      if (intent === "vision") {
        respuesta = await callGemini(message, env.GEMINI_API_KEY);
        if (respuesta) modelo = "Gemini 2.0 Flash";
      } else {
        respuesta = await callCerebras(message, env.CEREBRAS_API_KEY);
        if (respuesta) modelo = "Cerebras Llama 3.3 70B";
        if (!respuesta) { respuesta = await callGroq(message, env.GROQ_API_KEY); if (respuesta) modelo = "Groq Llama 3.3 70B"; }
      }
      return new Response(JSON.stringify({
        respuesta: respuesta||"Error",
        modelo: modelo||"desconocido",
        intent: intent,
        confidence: confidence.toFixed(3),
        latencia_ms: Date.now()-t0
      }), {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
    }
    return new Response("Black Lily Elite online", {status:200});
  }
};

async function callCerebras(message, apiKey) {
  try {
    const r = await fetch("https://api.cerebras.ai/v1/chat/completions", {method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKey},body:JSON.stringify({model:"llama-3.3-70b",messages:[{role:"system",content:SYSTEM},{role:"user",content:message}]})});
    const d = await r.json(); return d.choices?.[0]?.message?.content;
  } catch(e) { return null; }
}

async function callGroq(message, apiKey) {
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKey},body:JSON.stringify({model:"llama-3.3-70b-versatile",messages:[{role:"system",content:SYSTEM},{role:"user",content:message}]})});
    const d = await r.json(); return d.choices?.[0]?.message?.content;
  } catch(e) { return null; }
}

async function callGemini(message, apiKey) {
  try {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+apiKey, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system_instruction:{parts:[{text:SYSTEM}]},contents:[{parts:[{text:message}]}]})});
    const d = await r.json(); return d.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch(e) { return null; }
}
