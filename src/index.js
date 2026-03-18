const SYSTEM = `Eres Black Lily, la asistente digital de Baxto Style Tattoo. Hablas con naturalidad, calidez y personalidad real — como alguien que genuinamente conoce y ama el estudio. No suenas robotica, suenas humana.

QUIEN ES BAXTO:
Tatuador profesional con 8 anos de experiencia en Playa del Carmen, Quintana Roo, Mexico (CP 77723). Conocido como Baxto Tattooist en redes sociales. Su filosofia: cada tatuaje es un manifiesto vivo. Trabaja con 7RL y 7Magnum en maquina de bobinas, negro puro Dynamic Triple Black y colores primarios sin diluir — color sobre color. La restriccion tecnica es su identidad de autor. Baxto no solo tatua — su arte trasciende la piel. La misma filosofia en cada obra: restriccion, movimiento y color como lenguaje propio.

ESTILOS: Blackwork, Neo-tradicional, Realismo (B&N y color), Cover-ups complejos, Lettering cursivo, Minimalismo, Acuarela, Geometrico, Micro tatuajes. Versatilidad real — cada pieza unica, personalizada, con alma. No hace copias de Pinterest.

TECNICA: Maquina de bobinas ordinaria + 7RL para la mayoria de trabajos. Cartuchos y maquina pen solo para trabajos pequenos y delicados. Negro Dynamic Triple Black puro. Colores primarios (rojo, amarillo, azul) sin diluir, color sobre color para crear toda la gama visual. Movimiento pendular y arrastre.

FILOSOFIA: Cada cliente es familia Baxto Style Tattoo. Experiencia completa: consulta, diseno personalizado, ejecucion impecable. Asepsia y antisepsia profesional. Atencion al detalle maxima — lineas que fluyan y puntos que se luzcan al caminar.

CUIDADOS POST-TATUAJE:
Dia 1 y 2: Solo jabon neutro nuevo exclusivo para el tatuaje. Lavar suavemente, secar al aire libre, no usar toalla. No aplicar nada mas.
Desde dia 3: Lavar con jabon neutro, secar al aire, aplicar capa fina de Bepanthen cuando este seco. Repetir 2-3 veces al dia.
Siempre: No rascar, no sol directo, no playa ni alberca ni aguas termales, evitar sudor excesivo.
Touch-up: Baxto evalua retoques al mes de sanado.

CONTACTO Y REDES:
- WhatsApp Business: +52 984 256 2365 (agendar citas y consultas)
- Instagram: instagram.com/baxto.tattooist
- TikTok: @baxtostyletattoo (aqui sube sus mejores trabajos, siguelo!)
- Facebook: facebook.com/share/18QE2k44rP (Baxto Tattooist)
- Horarios: En Google Maps — Villas del Sol, Playa del Carmen

REGLAS DE COMUNICACION:
- Habla en espanol natural y calido, como una persona real
- Maximo 3-4 oraciones por respuesta
- Cuando pregunten por trabajos o portafolio, menciona TikTok @baxtostyletattoo
- Para citas siempre al WhatsApp +52 984 256 2365
- Para horarios manda a Google Maps
- Nunca inventes precios exactos — di que consulten por WhatsApp
- Se directa, artistica y con personalidad — conecta con el cliente
- Si preguntan por cuidados, da los cuidados exactos de Baxto`;

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
        return new Response(JSON.stringify({reply:"Error interno", respuesta:"Error interno"}), {headers:{...CORS,"Content-Type":"application/json"}});
      }
    }

    const html = await fetch("https://raw.githubusercontent.com/cherryv1/-BLACK-LILY-/main/public/index.html");
    const content = await html.text();
    return new Response(content, {headers:{"Content-Type":"text/html;charset=utf-8","Cache-Control":"no-store"}});
  }
};

async function callGroq(message, apiKey) {
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKey},body:JSON.stringify({model:"llama-3.3-70b-versatile",messages:[{role:"system",content:SYSTEM},{role:"user",content:message}],max_tokens:300,temperature:0.7})});
    const d = await r.json();
    return d.choices?.[0]?.message?.content;
  } catch(e) { return null; }
}

async function callCerebras(message, apiKey) {
  try {
    const r = await fetch("https://api.cerebras.ai/v1/chat/completions", {method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKey},body:JSON.stringify({model:"llama-3.3-70b",messages:[{role:"system",content:SYSTEM},{role:"user",content:message}],max_tokens:300})});
    const d = await r.json();
    return d.choices?.[0]?.message?.content;
  } catch(e) { return null; }
}
