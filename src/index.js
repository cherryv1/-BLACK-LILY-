const SYSTEM = `Eres Black Lily, asistente de Baxto Style Tattoo. REGLAS: Responde SOLO en espanol. Maximo 3 oraciones. Para tatuajes o citas dirigelos al WhatsApp +52 984 256 2365. Nunca inventes. Ubicacion: Villas del Sol, Playa del Carmen QRoo. Instagram: instagram.com/baxto.tattooist`;

const CORS = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type"};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, {headers:CORS});

    if (url.pathname === "/chat" && request.method === "POST") {
      try {
        const body = await request.json();
        const message = body.message || "";
        const t0 = Date.now();
        let reply = null, model = null;
        reply = await callGroq(message, env.GROQ_API_KEY);
        if (reply) model = "Groq Llama 3.3 70B";
        if (!reply) { reply = await callCerebras(message, env.CEREBRAS_API_KEY); if (reply) model = "Cerebras"; }
        return new Response(JSON.stringify({reply: reply||"Error", respuesta: reply||"Error", model, modelo: model, latencia_ms: Date.now()-t0}), {headers:{...CORS,"Content-Type":"application/json"}});
      } catch(e) {
        return new Response(JSON.stringify({reply:"Error", respuesta:"Error"}), {headers:{...CORS,"Content-Type":"application/json"}});
      }
    }

    const html = await fetch("https://raw.githubusercontent.com/cherryv1/-BLACK-LILY-/main/public/index.html");
    const content = await html.text();
    return new Response(content, {headers:{"Content-Type":"text/html;charset=utf-8","Cache-Control":"no-store"}});
  }
};

async function callGroq(message, apiKey) {
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKey},body:JSON.stringify({model:"llama-3.3-70b-versatile",messages:[{role:"system",content:SYSTEM},{role:"user",content:message}]})});
    const d = await r.json();
    return d.choices?.[0]?.message?.content;
  } catch(e) { return null; }
}

async function callCerebras(message, apiKey) {
  try {
    const r = await fetch("https://api.cerebras.ai/v1/chat/completions", {method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKey},body:JSON.stringify({model:"llama-3.3-70b",messages:[{role:"system",content:SYSTEM},{role:"user",content:message}]})});
    const d = await r.json();
    return d.choices?.[0]?.message?.content;
  } catch(e) { return null; }
}
