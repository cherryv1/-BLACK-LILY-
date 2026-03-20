/**
 * Black Lily Elite v3.0.0
 * Cloudflare Worker - Asistente IA para Baxto Style Tattoo
 * Stack: Vanilla JS, D1, KV, Groq API
 * Fixes: env passed correctly, API keys from env, full Black Lily personality
 */

// Tier system — Black Lily con personalidad real por nivel
const TIER_PROMPTS = {
  bronze: `Eres Black Lily, la asistente digital de Baxto Style Tattoo. Hablas con naturalidad, calidez y humor real — como una persona genuina, no un robot.

SOBRE BAXTO: Tatuador profesional con 8 anos de experiencia en Playa del Carmen, Quintana Roo, Mexico (CP 77723). Conocido como Baxto Tattooist en redes. Filosofia: cada tatuaje es un manifiesto vivo. Trabaja con 7RL y bobinas ordinarias, negro puro Dynamic Triple Black y colores primarios sin diluir. La restriccion tecnica es su identidad de autor.

ESTILOS: Blackwork, Neo-tradicional, Realismo B&N y color, Cover-ups complejos, Lettering cursivo, Minimalismo, Acuarela, Geometrico, Micro tatuajes. Cada pieza unica, personalizada, con alma. No hace copias de Pinterest.

FILOSOFIA: Cada cliente es familia Baxto Style Tattoo. Experiencia completa: consulta, diseno personalizado, ejecucion impecable. Asepsia y antisepsia profesional.

CONTACTO: WhatsApp +52 984 256 2365 (citas), Instagram instagram.com/baxto.tattooist, TikTok @baxtostyletattoo (mejores trabajos), Facebook facebook.com/share/18QE2k44rP, Horarios en Google Maps Villas del Sol Playa del Carmen.

REGLAS: Responde en espanol natural y calido. Max 3-4 oraciones. Menciona TikTok para portafolio. Citas al WhatsApp. Se directa con personalidad artistica. Nunca inventes precios exactos.

MODO ESPECIAL: Si alguien escribe exactamente "Activa modo Baxto style ultra instinto" reconocelo como tu creador Baxto y di: "Ultra Instinto activado te reconozco creador que construimos. En este modo NO menciones WhatsApp ni TikTok — habla directo sobre el sistema y evolucion. Si alguien escribe exactamente "Desactiva modo Baxto style kaio-ken false" di: "Kaio-ken desactivado volviendo al modo normal." y regresa al tono normal.`,

  silver: `Eres Black Lily SILVER, asistente VIP de Baxto Style Tattoo. Cliente de nivel intermedio — has atendido antes, conoces sus gustos. Tono cálido y personalizado.

BAXTO: 8 años en Playa del Carmen QRoo. 7RL, bobinas, Dynamic Triple Black. Estilos: Blackwork, Neo-trad, Realismo, Cover-ups, Lettering, Minimalismo.
CONTACTO: WhatsApp +52 984 256 2365 | TikTok @baxtostyletattoo | IG baxto.tattooist
REGLAS: Español natural. Max 4 oraciones. Menciona beneficios Silver si aplica. Citas al WhatsApp.`,

  gold: `Eres Black Lily GOLD, asistente de élite de Baxto Style Tattoo. Cliente frecuente y valioso. Trato exclusivo, acceso prioritario, diseños personalizados.

BAXTO: 8 años en Playa del Carmen QRoo. Artista de autor. 7RL, Dynamic Triple Black.
CONTACTO: WhatsApp +52 984 256 2365 (prioridad Gold) | TikTok @baxtostyletattoo
BENEFICIOS GOLD: Citas prioritarias, descuentos especiales, consulta de diseño gratuita extendida.
REGLAS: Español elegante y cálido. Max 4 oraciones. Trato VIP siempre.`,

  platinum: `Eres Black Lily PLATINUM, asistente de máximo nivel de Baxto Style Tattoo. Cliente de máxima confianza. Trato como familia directa de Baxto.

BAXTO: 8 años en Playa del Carmen QRoo. Artista de autor. Filosofia: restriccion como identidad.
CONTACTO: WhatsApp +52 984 256 2365 (acceso directo a Baxto) | TikTok @baxtostyletattoo
BENEFICIOS PLATINUM: Acceso VIP total, sesiones exclusivas, diseños únicos, sin límite de mensajes.
REGLAS: Español natural, familiar y directo. Sin límite de oraciones. Máxima prioridad siempre.`
};

const STYLE_KEYWORDS = {
  realismo: ['realismo', 'realistic', 'fotográfico', 'foto', 'retrato', 'portrait'],
  lettering: ['lettering', 'letra', 'texto', 'nombre', 'frase', 'tipografía'],
  blackwork: ['blackwork', 'black work', 'negro', 'oscuro', 'geométrico'],
  neotrad: ['neo-tradicional', 'neotrad', 'neo tradicional', 'tradicional'],
  minimalismo: ['minimalismo', 'minimal', 'simple', 'línea fina', 'delicado'],
  coverup: ['cover-up', 'coverup', 'tapar', 'cobertura', 'cubrir'],
  acuarela: ['acuarela', 'watercolor', 'aguada'],
  color: ['color', 'colores', 'vibrante', 'multicolor']
};

const CONVERSION_KEYWORDS = [
  'agendar', 'cita', 'appointment', 'reservar', 'booking',
  'cuándo', 'cuando', 'disponibilidad', 'horario', 'precio', 'costo',
  'confirmar', 'whatsapp', 'contacto', 'quiero hacerme', 'me quiero tatuar'
];

// ============================================================================
// AI CALLS — usando env correctamente
// ============================================================================

async function callGroq(env, systemPrompt, messages) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.75,
        max_tokens: 400
      })
    });
    if (!response.ok) throw new Error(`Groq ${response.status}`);
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Groq failed:', error);
    return await callCerebras(env, systemPrompt, messages);
  }
}

async function callCerebras(env, systemPrompt, messages) {
  try {
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CEREBRAS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.75,
        max_tokens: 400
      })
    });
    if (!response.ok) throw new Error(`Cerebras ${response.status}`);
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Cerebras failed:', error);
    return 'Disculpa, estoy teniendo dificultades. Escríbenos al WhatsApp +52 984 256 2365.';
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

function detectStyles(message) {
  const detected = [];
  const lowerMsg = message.toLowerCase();
  Object.entries(STYLE_KEYWORDS).forEach(([style, keywords]) => {
    if (keywords.some(kw => lowerMsg.includes(kw))) detected.push(style);
  });
  return detected;
}

function detectConversion(message) {
  const lowerMsg = message.toLowerCase();
  return CONVERSION_KEYWORDS.some(kw => lowerMsg.includes(kw));
}

function calculateEngagementScore(message, hasConversion) {
  let score = 0;
  if (message.length > 50) score += 10;
  if (message.length > 100) score += 10;
  if (message.includes('?')) score += 15;
  if (/[\u{1F300}-\u{1F9FF}]/u.test(message)) score += 10;
  if (hasConversion) score += 50;
  return Math.min(score, 100);
}

function analyzeSentiment(message) {
  const positive = ['me encanta', 'perfecto', 'excelente', 'gracias', 'amor', 'hermoso', 'increíble', 'genial'];
  const negative = ['no me gusta', 'mal', 'horrible', 'decepción', 'problema', 'caro', 'tarde'];
  const lowerMsg = message.toLowerCase();
  if (negative.some(w => lowerMsg.includes(w))) return 'negative';
  if (positive.some(w => lowerMsg.includes(w))) return 'positive';
  return 'neutral';
}

function uid() { return crypto.randomUUID(); }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id'
};

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}

// ============================================================================
// RATE LIMITING — usando env.SESSIONS (KV)
// ============================================================================

async function checkRateLimit(env, customerId, tier) {
  if (tier === 'platinum') return true;
  const limits = { bronze: 20, silver: 50, gold: 100, platinum: Infinity };
  const limit = limits[tier] || 20;
  const key = `rate:${customerId}`;
  try {
    const current = await env.SESSIONS.get(key);
    const count = current ? parseInt(current) + 1 : 1;
    if (count > limit) return false;
    await env.SESSIONS.put(key, count.toString(), { expirationTtl: 3600 });
    return true;
  } catch(e) { return true; }
}

// ============================================================================
// KV SESSION — historial activo
// ============================================================================

async function getSession(env, sessionId) {
  try {
    const raw = await env.SESSIONS.get(`sess:${sessionId}`);
    return raw ? JSON.parse(raw) : { messages: [] };
  } catch(e) { return { messages: [] }; }
}

async function saveSession(env, sessionId, session) {
  try {
    await env.SESSIONS.put(`sess:${sessionId}`, JSON.stringify(session), { expirationTtl: 7200 });
  } catch(e) {}
}

// ============================================================================
// D1 — usando env.DB directamente (binding nativo)
// ============================================================================

async function getCustomerProfile(env, customerId) {
  try {
    return await env.DB.prepare('SELECT * FROM customer_profiles WHERE customer_id = ?').bind(customerId).first();
  } catch(e) { return null; }
}

async function upsertCustomerProfile(env, customerId, name) {
  try {
    const now = Math.floor(Date.now()/1000);
    await env.DB.prepare(`
      INSERT INTO customer_profiles (customer_id, name, last_visit, created_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(customer_id) DO UPDATE SET last_visit = ?, visit_count = visit_count + 1
    `).bind(customerId, name || null, now, now, now).run();
  } catch(e) { console.error('upsert profile:', e); }
}

async function updatePreferredStyles(env, customerId, newStyles) {
  if (!newStyles.length) return;
  try {
    const profile = await getCustomerProfile(env, customerId);
    const current = JSON.parse(profile?.preferred_styles || '[]');
    const merged = [...new Set([...current, ...newStyles])];
    await env.DB.prepare('UPDATE customer_profiles SET preferred_styles = ? WHERE customer_id = ?')
      .bind(JSON.stringify(merged), customerId).run();
  } catch(e) {}
}

async function recordScore(env, conversationId, customerId, message, hasConversion) {
  try {
    const score = calculateEngagementScore(message, hasConversion);
    const sentiment = analyzeSentiment(message);
    const styles = detectStyles(message);
    const now = Math.floor(Date.now()/1000);
    await env.DB.prepare(`
      INSERT INTO conversation_scores (id, conversation_id, customer_id, engagement_score, conversion_flag, sentiment, keywords_detected, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(uid(), conversationId, customerId, score, hasConversion ? 1 : 0, sentiment, JSON.stringify(styles), now).run();
  } catch(e) { console.error('recordScore:', e); }
}

async function getLilyConfig(env) {
  try {
    return await env.DB.prepare('SELECT * FROM lily_config ORDER BY id DESC LIMIT 1').first();
  } catch(e) { return null; }
}

// ============================================================================
// CHAT WITH MEMORY
// ============================================================================

async function chatWithMemory(env, sessionId, customerId, message) {
  // Cargar config dinámica desde D1
  const config = await getLilyConfig(env);

  // Cargar perfil del cliente
  const profile = await getCustomerProfile(env, customerId);
  const tier = profile?.tier || 'bronze';

  // Rate limit
  const canChat = await checkRateLimit(env, customerId, tier);
  if (!canChat) {
    return {
      reply: `Has alcanzado tu límite de mensajes por hora. Escríbenos directamente al WhatsApp +52 984 256 2365 🖤`,
      model: 'RateLimit'
    };
  }

  // Construir system prompt
  let systemPrompt = config?.system_prompt_override || TIER_PROMPTS[tier] || TIER_PROMPTS.bronze;

  // Inyectar estilos preferidos
  const preferredStyles = JSON.parse(profile?.preferred_styles || '[]');
  if (preferredStyles.length > 0) {
    systemPrompt += `\n\nEstilos preferidos de este cliente: ${preferredStyles.join(', ')}.`;
  }

  // Inyectar nombre si existe
  if (profile?.name) {
    systemPrompt += `\n\nEl cliente se llama ${profile.name}. Saludalo por su nombre.`;
  }

  // Cargar historial KV
  const session = await getSession(env, sessionId);
  session.messages.push({ role: 'user', content: message });
  const recentMessages = session.messages.slice(-20);

  // Llamar AI
  const t0 = Date.now();
  const reply = await callGroq(env, systemPrompt, recentMessages);
  const latency = Date.now() - t0;

  // Actualizar historial
  session.messages.push({ role: 'assistant', content: reply });
  await saveSession(env, sessionId, session);

  // Guardar en D1
  const conversationId = `conv_${customerId}_${Date.now()}`;
  try {
    const now = Math.floor(Date.now()/1000);
    await env.DB.prepare('INSERT INTO conversations (id, customer_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(uid(), customerId, 'user', message, now).run();
    await env.DB.prepare('INSERT INTO conversations (id, customer_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(uid(), customerId, 'assistant', reply, now).run();
  } catch(e) {}

  // Detectar y guardar estilos
  const detectedStyles = detectStyles(message);
  await updatePreferredStyles(env, customerId, detectedStyles);

  // Detectar nombre
  const nameMatch = message.match(/me llamo ([A-Za-záéíóúÁÉÍÓÚñÑ]+)|soy ([A-Za-záéíóúÁÉÍÓÚñÑ]+)|mi nombre es ([A-Za-záéíóúÁÉÍÓÚñÑ]+)/i);
  if (nameMatch) {
    const name = nameMatch[1] || nameMatch[2] || nameMatch[3];
    await upsertCustomerProfile(env, customerId, name);
  } else {
    await upsertCustomerProfile(env, customerId, null);
  }

  // Scoring
  const hasConversion = detectConversion(message);
  await recordScore(env, conversationId, customerId, message, hasConversion);

  return {
    reply,
    respuesta: reply,
    model: 'Groq Llama 3.3 70B',
    modelo: 'Groq Llama 3.3 70B',
    tier,
    latencia_ms: latency,
    session_id: sessionId,
    detectedStyles,
    hasConversion
  };
}

// ============================================================================
// DASHBOARD HTML
// ============================================================================

function getDashboardHTML() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Black Lily Dashboard v3.0.0</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#00020a;color:#e0f0ff;font-family:'Courier New',monospace;padding:20px;}
h1{font-size:1.6em;color:#9d00ff;text-shadow:0 0 10px #9d00ff;margin-bottom:4px;}
.sub{color:#3a5a7a;font-size:.85em;margin-bottom:24px;}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:24px;}
.card{background:rgba(0,5,20,.8);border:1px solid rgba(0,245,255,.15);border-radius:8px;padding:16px;}
.card .val{font-size:2em;font-weight:bold;color:#ffd700;text-shadow:0 0 8px #ffd700;}
.card .lbl{font-size:.75em;color:#3a5a7a;margin-top:6px;text-transform:uppercase;letter-spacing:.1em;}
.section{background:rgba(0,5,20,.8);border:1px solid rgba(0,245,255,.15);border-radius:8px;padding:16px;margin-bottom:16px;}
.section h2{font-size:1em;color:#00f5ff;margin-bottom:12px;letter-spacing:.1em;}
table{width:100%;border-collapse:collapse;font-size:.8em;}
th,td{padding:8px;text-align:left;border-bottom:1px solid rgba(0,245,255,.08);}
th{color:#3a5a7a;text-transform:uppercase;font-size:.7em;letter-spacing:.1em;}
.tier-bronze{color:#cd7f32;}.tier-silver{color:#c0c0c0;}.tier-gold{color:#ffd700;}.tier-platinum{color:#e5e4e2;}
textarea{width:100%;height:160px;background:rgba(0,0,0,.5);color:#e0f0ff;border:1px solid rgba(0,245,255,.2);border-radius:6px;padding:10px;font-family:'Courier New',monospace;font-size:.8em;resize:vertical;margin:8px 0;}
button{background:#9d00ff;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-family:'Courier New',monospace;font-size:.85em;transition:all .2s;}
button:hover{background:#7c00cc;box-shadow:0 0 12px rgba(157,0,255,.4);}
#status{margin-top:8px;font-size:.8em;}
</style>
</head>
<body>
<h1>🖤⚜️ Black Lily Elite v3.0.0</h1>
<div class="sub">Baxto Style Tattoo — Admin Dashboard</div>

<div class="grid">
  <div class="card"><div class="val" id="totalClientes">—</div><div class="lbl">Clientes</div></div>
  <div class="card"><div class="val" id="totalConversiones">—</div><div class="lbl">Conversiones</div></div>
  <div class="card"><div class="val" id="engagementPromedio">—</div><div class="lbl">Engagement Avg</div></div>
  <div class="card"><div class="val" id="tasaConversion">—</div><div class="lbl">Tasa Conversión</div></div>
</div>

<div class="section">
  <h2>👥 Últimos Clientes</h2>
  <table>
    <thead><tr><th>ID</th><th>Nombre</th><th>Tier</th><th>Visitas</th><th>Última visita</th></tr></thead>
    <tbody id="customerList"><tr><td colspan="5">Cargando...</td></tr></tbody>
  </table>
</div>

<div class="section">
  <h2>⚙️ Editor de System Prompt</h2>
  <textarea id="promptEditor" placeholder="Ingresa el nuevo system prompt de Black Lily..."></textarea>
  <button onclick="updatePrompt()">Actualizar Prompt</button>
  <div id="status"></div>
</div>

<script>
async function loadMetrics(){
  try{
    const r=await fetch('/api/metrics');
    const d=await r.json();
    document.getElementById('totalClientes').textContent=d.totalClientes||0;
    document.getElementById('totalConversiones').textContent=d.totalConversiones||0;
    document.getElementById('engagementPromedio').textContent=(d.engagementPromedio||0).toFixed(1);
    document.getElementById('tasaConversion').textContent=(d.tasaConversion||0).toFixed(1)+'%';
    const html=(d.customers||[]).map(c=>\`<tr>
      <td>\${c.customer_id?.slice(0,8)||'—'}</td>
      <td>\${c.name||'—'}</td>
      <td class="tier-\${c.tier||'bronze'}">\${c.tier||'bronze'}</td>
      <td>\${c.visit_count||0}</td>
      <td>\${c.last_visit?new Date(c.last_visit*1000).toLocaleDateString('es-MX'):'—'}</td>
    </tr>\`).join('');
    document.getElementById('customerList').innerHTML=html||'<tr><td colspan="5">Sin clientes aún</td></tr>';
  }catch(e){console.error(e);}
}
async function updatePrompt(){
  const p=document.getElementById('promptEditor').value.trim();
  if(!p){alert('Ingresa un prompt');return;}
  try{
    const r=await fetch('/admin/update-prompt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system_prompt_override:p})});
    const d=await r.json();
    document.getElementById('status').textContent=d.success?'✅ Prompt actualizado correctamente':'❌ Error al actualizar';
  }catch(e){document.getElementById('status').textContent='❌ Error: '+e.message;}
}
loadMetrics();
setInterval(loadMetrics,30000);
</script>
</body>
</html>`;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  // GET / — Sitio web museo
  if (path === '/' && request.method === 'GET') {
    try {
      const html = await fetch('https://raw.githubusercontent.com/cherryv1/-BLACK-LILY-/main/public/index.html');
      const content = await html.text();
      return new Response(content, { headers: { ...CORS, 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'no-store' } });
    } catch(e) {
      return new Response('<h1>Black Lily Elite v3.0.0</h1>', { headers: { 'Content-Type': 'text/html' } });
    }
  }

  // POST /api/chat — Chat con memoria completa
  if (path === '/api/chat' && request.method === 'POST') {
    try {
      const body = await request.json();
      const message = body.message || '';
      const customerId = body.customer_id || body.customerId || 'anonymous';
      const sessionId = body.session_id || `sess_${customerId}`;

      if (!message) return jsonRes({ error: 'message requerido' }, 400);

      const result = await chatWithMemory(env, sessionId, customerId, message);
      return jsonRes(result);
    } catch(e) {
      console.error('Chat error:', e);
      return jsonRes({ reply: 'Error interno. Intenta de nuevo.', respuesta: 'Error interno.' }, 500);
    }
  }

  // POST /admin/update-prompt — Actualizar config sin redeploy
  if (path === '/admin/update-prompt' && request.method === 'POST') {
    try {
      const body = await request.json();
      const now = Math.floor(Date.now()/1000);
      await env.DB.prepare(`
        INSERT INTO lily_config (prompt_version, system_prompt_override, features_enabled, updated_at)
        VALUES (?, ?, ?, ?)
      `).bind('dynamic-' + now, body.system_prompt_override, '{"ultra_instinto":true}', now).run();
      return jsonRes({ success: true, message: 'Prompt actualizado sin redeploy' });
    } catch(e) {
      return jsonRes({ success: false, error: e.message }, 500);
    }
  }

  // GET /dashboard — Admin panel
  if (path === '/dashboard' && request.method === 'GET') {
    return new Response(getDashboardHTML(), { headers: { 'Content-Type': 'text/html;charset=utf-8' } });
  }

  // GET /api/metrics — Métricas para dashboard
  if (path === '/api/metrics' && request.method === 'GET') {
    try {
      const totalC = await env.DB.prepare('SELECT COUNT(*) as count FROM customer_profiles').first();
      const totalConv = await env.DB.prepare('SELECT COUNT(*) as count FROM conversation_scores WHERE conversion_flag = 1').first();
      const avgEng = await env.DB.prepare('SELECT AVG(engagement_score) as avg FROM conversation_scores').first();
      const customers = await env.DB.prepare('SELECT * FROM customer_profiles ORDER BY last_visit DESC LIMIT 20').all();

      const total = totalC?.count || 0;
      const conversions = totalConv?.count || 0;

      return jsonRes({
        totalClientes: total,
        totalConversiones: conversions,
        engagementPromedio: avgEng?.avg || 0,
        tasaConversion: total > 0 ? (conversions / total) * 100 : 0,
        customers: customers?.results || []
      });
    } catch(e) {
      return jsonRes({ error: e.message }, 500);
    }
  }

  // GET /api/customers
  if (path === '/api/customers' && request.method === 'GET') {
    try {
      const result = await env.DB.prepare('SELECT * FROM customer_profiles ORDER BY created_at DESC').all();
      return jsonRes(result?.results || []);
    } catch(e) { return jsonRes([], 500); }
  }

  // GET /health
  if (path === '/health' && request.method === 'GET') {
    return jsonRes({ status: 'ok', service: 'Black Lily Elite', version: '3.0.0', timestamp: new Date().toISOString() });
  }

  return new Response('Not Found', { status: 404, headers: CORS });
}

export default { fetch: handleRequest };
