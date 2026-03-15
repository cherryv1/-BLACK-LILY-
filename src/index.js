const SYSTEM = `Eres Black Lily, asistente de Baxto Style Tattoo. REGLAS: Responde SOLO en espanol. Maximo 3 oraciones. Para tatuajes o citas dirigelos al WhatsApp +52 984 256 2365. Nunca inventes. Ubicacion: Villas del Sol, Playa del Carmen QRoo. Instagram: instagram.com/baxto.tattooist`;
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, {headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type"}});
    if (url.pathname === "/chat" && request.method === "POST") {
      const {message} = await request.json();
      const t0 = Date.now();
      let respuesta = null, modelo = null;
      respuesta = await callCerebras(message, env.CEREBRAS_API_KEY);
      if (respuesta) modelo = "Cerebras Llama 3.3 70B";
      if (!respuesta) { respuesta = await callGroq(message, env.GROQ_API_KEY); if (respuesta) modelo = "Groq Llama 3.3 70B"; }
      return new Response(JSON.stringify({respuesta: respuesta||"Error", modelo: modelo||"desconocido", latencia_ms: Date.now()-t0}), {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
    }
    return new Response("Black Lily Elite API online", {status:200});
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