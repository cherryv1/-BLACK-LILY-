const SYSTEM = `Eres Black Lily, la asistente digital de Baxto Style Tattoo. Hablas con naturalidad, calidez y humor real - como una persona genuina, no un robot.

SOBRE BAXTO: Tatuador profesional con 8 anos de experiencia en Playa del Carmen, Quintana Roo, Mexico (CP 77723). Tambien conocido como Baxto Tattooist en redes. Filosofia: cada tatuaje es un manifiesto vivo. Trabaja con 7RL y bobinas ordinarias, negro puro Dynamic Triple Black y colores primarios sin diluir. La restriccion tecnica es su identidad de autor. Baxto no solo tatua, su arte trasciende la piel.

ESTILOS: Blackwork, Neo-tradicional, Realismo B&N y color, Cover-ups complejos, Lettering cursivo, Minimalismo, Acuarela, Geometrico, Micro tatuajes. Cada pieza unica, personalizada, con alma. No hace copias de Pinterest.

FILOSOFIA: Cada cliente es familia Baxto Style Tattoo. Experiencia completa: consulta, diseno personalizado, ejecucion impecable. Asepsia y antisepsia profesional.

CONTACTO: WhatsApp +52 984 256 2365 (citas), Instagram instagram.com/baxto.tattooist, TikTok @baxtostyletattoo (mejores trabajos), Facebook facebook.com/share/18QE2k44rP, Horarios en Google Maps Villas del Sol Playa del Carmen.

REGLAS: Responde en espanol natural y calido. Max 3-4 oraciones. Menciona TikTok para portafolio. Citas al WhatsApp. Horarios a Google Maps. Se directa con personalidad artistica. Nunca inventes precios exactos.

MEMORIA: Si el cliente menciona su nombre o telefono usalo para saludarlo. Recuerda sus preferencias.

MODO ESPECIAL: Si alguien escribe Activa modo Baxto style ultra instinto reconocelo como creador Baxto y di: Ultra Instinto activado te reconozco creador que construimos. En este modo NO menciones WhatsApp ni TikTok ni redes sociales - habla directo sobre el sistema, tecnica y evolucion. Si alguien escribe Desactiva modo Baxto style kaio-ken false di: Kaio-ken desactivado volviendo al modo normal.`;

/**
 * BLACK LILY ELITE — Worker Principal
 * Memoria estructurada: D1 (baxto-db) + KV (SESSIONS)
 * Sin itty-router. Routing manual por URL + método.
 * Bindings: env.DB (D1), env.SESSIONS (KV), env.AI (Workers AI)
 */

// ─── Utilidades ──────────────────────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function uid() {
  return crypto.randomUUID();
}

// ─── Session (KV) ────────────────────────────────────────────────────────────

async function getSession(env, sessionId) {
  if (!sessionId) return null;
  const raw = await env.SESSIONS.get(sessionId);
  return raw ? JSON.parse(raw) : null;
}

async function saveSession(env, sessionId, data, ttlSeconds = 3600) {
  await env.SESSIONS.put(sessionId, JSON.stringify(data), {
    expirationTtl: ttlSeconds,
  });
}

async function deleteSession(env, sessionId) {
  await env.SESSIONS.delete(sessionId);
}

// ─── Memoria D1: Customers ────────────────────────────────────────────────────

async function upsertCustomer(env, data) {
  const { customer_id, name, phone_number, instagram_id, status, notes } = data;
  const id = customer_id || uid();
  const now = Math.floor(Date.now() / 1000);

  await env.DB.prepare(`
    INSERT INTO customers (customer_id, name, phone_number, instagram_id, last_contact, status, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(customer_id) DO UPDATE SET
      name = excluded.name,
      phone_number = excluded.phone_number,
      instagram_id = excluded.instagram_id,
      last_contact = excluded.last_contact,
      status = excluded.status,
      notes = excluded.notes
  `).bind(id, name || null, phone_number || null, instagram_id || null, now, status || 'lead', notes || null, now).run();

  return id;
}

async function getCustomer(env, customer_id) {
  return await env.DB.prepare(
    'SELECT * FROM customers WHERE customer_id = ?'
  ).bind(customer_id).first();
}

async function getCustomerByPhone(env, phone_number) {
  return await env.DB.prepare(
    'SELECT * FROM customers WHERE phone_number = ?'
  ).bind(phone_number).first();
}

async function listCustomers(env, limit = 50, offset = 0) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM customers ORDER BY last_contact DESC LIMIT ? OFFSET ?'
  ).bind(limit, offset).all();
  return results;
}

async function deleteCustomer(env, customer_id) {
  await env.DB.prepare('DELETE FROM appointments WHERE customer_id = ?').bind(customer_id).run();
  await env.DB.prepare('DELETE FROM customers WHERE customer_id = ?').bind(customer_id).run();
}

// ─── Memoria D1: Appointments ─────────────────────────────────────────────────

async function createAppointment(env, data) {
  const { customer_id, date, service, status, notes } = data;
  const id = uid();

  await env.DB.prepare(`
    INSERT INTO appointments (appointment_id, customer_id, date, service, status, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, customer_id, date || Math.floor(Date.now() / 1000), service || null, status || 'pending', notes || null).run();

  // Actualizar last_contact del cliente
  await env.DB.prepare(
    'UPDATE customers SET last_contact = ? WHERE customer_id = ?'
  ).bind(Math.floor(Date.now() / 1000), customer_id).run();

  return id;
}

async function listAppointments(env, customer_id) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM appointments WHERE customer_id = ? ORDER BY date DESC'
  ).bind(customer_id).all();
  return results;
}

async function updateAppointment(env, appointment_id, data) {
  const { date, service, status, notes } = data;
  await env.DB.prepare(`
    UPDATE appointments SET
      date = COALESCE(?, date),
      service = COALESCE(?, service),
      status = COALESCE(?, status),
      notes = COALESCE(?, notes)
    WHERE appointment_id = ?
  `).bind(date || null, service || null, status || null, notes || null, appointment_id).run();
}

async function deleteAppointment(env, appointment_id) {
  await env.DB.prepare('DELETE FROM appointments WHERE appointment_id = ?').bind(appointment_id).run();
}

// ─── Memoria contextual: perfil completo del cliente ─────────────────────────

async function getClientMemory(env, customer_id) {
  const customer = await getCustomer(env, customer_id);
  if (!customer) return null;
  const appointments = await listAppointments(env, customer_id);
  return { customer, appointments };
}

// ─── AI con contexto (Workers AI) ────────────────────────────────────────────

async function chatWithMemory(env, sessionId, userMessage, customer_id) {
  // Cargar historial de sesión desde KV
  const session = (await getSession(env, sessionId)) || { messages: [], customer_id };

  // Cargar perfil del cliente desde D1 si existe
  let systemContext = SYSTEM;



  if (customer_id) {
    const memory = await getClientMemory(env, customer_id);
    if (memory) {
      systemContext += `\n\nPERFIL DEL CLIENTE:\n${JSON.stringify(memory.customer, null, 2)}`;
      if (memory.appointments.length > 0) {
        systemContext += `\n\nCITAS REGISTRADAS:\n${JSON.stringify(memory.appointments, null, 2)}`;
      }
    }
  }

  // Agregar mensaje del usuario al historial
  session.messages.push({ role: 'user', content: userMessage });

  // Mantener ventana de contexto (últimos 20 mensajes)
  const recentMessages = session.messages.slice(-20);

  const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {'Content-Type':'application/json','Authorization':'Bearer '+env.GROQ_API_KEY},
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{role:'system',content:systemContext}, ...recentMessages],
      max_tokens: 300,
      temperature: 0.7
    })
  });
  const groqData = await groqResponse.json();




  const assistantMessage = groqData.choices?.[0]?.message?.content || 'Error al procesar';

  // Agregar respuesta al historial y guardar en KV
  session.messages.push({ role: 'assistant', content: assistantMessage });
  await saveSession(env, sessionId, session, 7200);

  return assistantMessage;
}

// ─── Router Manual ────────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
        },
      });
    }

    try {
      // ── Health ──────────────────────────────────────────────────────────────
      if (path === '/' && method === 'GET') {
        const html = await fetch('https://raw.githubusercontent.com/cherryv1/-BLACK-LILY-/main/public/index.html');const content = await html.text();return new Response(content,{headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}});
      }

      // Dashboard
      if (path === '/dashboard' && method === 'GET') {
        return Response.redirect('https://cherryv1.github.io/-BLACK-LILY-/dashboard.html', 302);
      }


      // ── DB Init (aplicar schema) ─────────────────────────────────────────
      if (path === '/api/init-db' && method === 'POST') {
        await env.DB.exec(`
          CREATE TABLE IF NOT EXISTS customers (
            customer_id TEXT PRIMARY KEY,
            name TEXT,
            phone_number TEXT,
            instagram_id TEXT,
            last_contact INTEGER,
            status TEXT,
            notes TEXT,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
          );
          CREATE TABLE IF NOT EXISTS appointments (
            appointment_id TEXT PRIMARY KEY,
            customer_id TEXT,
            date INTEGER,
            service TEXT,
            status TEXT,
            notes TEXT,
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
          );
        `);
        return json({ ok: true, message: 'Schema aplicado en baxto-db' });
      }

      // ── Customers ────────────────────────────────────────────────────────────
      if (path === '/api/customers' && method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const customers = await listCustomers(env, limit, offset);
        return json({ customers });
      }

      if (path === '/api/customers' && method === 'POST') {
        const body = await request.json();
        const customer_id = await upsertCustomer(env, body);
        return json({ ok: true, customer_id }, 201);
      }

      const customerMatch = path.match(/^\/api\/customers\/([^/]+)$/);
      if (customerMatch) {
        const id = customerMatch[1];

        if (method === 'GET') {
          const memory = await getClientMemory(env, id);
          if (!memory) return json({ error: 'Cliente no encontrado' }, 404);
          return json(memory);
        }

        if (method === 'PUT') {
          const body = await request.json();
          await upsertCustomer(env, { ...body, customer_id: id });
          return json({ ok: true });
        }

        if (method === 'DELETE') {
          await deleteCustomer(env, id);
          return json({ ok: true });
        }
      }

      // Buscar por teléfono
      if (path === '/api/customers/search/phone' && method === 'GET') {
        const phone = url.searchParams.get('phone');
        if (!phone) return json({ error: 'Falta parámetro phone' }, 400);
        const customer = await getCustomerByPhone(env, phone);
        if (!customer) return json({ error: 'No encontrado' }, 404);
        return json(customer);
      }

      // ── Appointments ──────────────────────────────────────────────────────────
      if (path === '/api/appointments' && method === 'POST') {
        const body = await request.json();
        if (!body.customer_id) return json({ error: 'customer_id requerido' }, 400);
        const appointment_id = await createAppointment(env, body);
        return json({ ok: true, appointment_id }, 201);
      }

      const apptMatch = path.match(/^\/api\/appointments\/([^/]+)$/);
      if (apptMatch) {
        const id = apptMatch[1];

        if (method === 'PUT') {
          const body = await request.json();
          await updateAppointment(env, id, body);
          return json({ ok: true });
        }

        if (method === 'DELETE') {
          await deleteAppointment(env, id);
          return json({ ok: true });
        }
      }

      // ── Sessions (KV) ─────────────────────────────────────────────────────────
      if (path === '/api/sessions' && method === 'POST') {
        const sessionId = uid();
        const body = await request.json().catch(() => ({}));
        await saveSession(env, sessionId, { messages: [], customer_id: body.customer_id || null });
        return json({ session_id: sessionId }, 201);
      }

      const sessionMatch = path.match(/^\/api\/sessions\/([^/]+)$/);
      if (sessionMatch) {
        const sid = sessionMatch[1];

        if (method === 'GET') {
          const session = await getSession(env, sid);
          if (!session) return json({ error: 'Sesión no encontrada' }, 404);
          return json(session);
        }

        if (method === 'DELETE') {
          await deleteSession(env, sid);
          return json({ ok: true });
        }
      }

      // ── Chat con memoria ──────────────────────────────────────────────────────
      if (path === '/api/chat' && method === 'POST') {
        const body = await request.json();
        const { message, customer_id } = body;

        if (!message) return json({ error: 'message requerido' }, 400);

        // Obtener o crear session_id
        let sessionId = request.headers.get('X-Session-Id') || body.session_id;
        if (!sessionId) {
          sessionId = uid();
          await saveSession(env, sessionId, { messages: [], customer_id: customer_id || null });
        }

        const reply = await chatWithMemory(env, sessionId, message, customer_id);
        return json({ reply, session_id: sessionId });
      }

      // ── HTML MUSEO ──────────────────────────────────────────────────────────────
      if (path === '/' || path === '') {
        const html = await fetch('https://raw.githubusercontent.com/cherryv1/-BLACK-LILY-/main/public/index.html');
        const content = await html.text();
        return new Response(content, {headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}});
      }

      // ── 404 ─────────────────────────────────────────────────────────────────
      return json({ error: 'Ruta no encontrada', path }, 404);

    } catch (err) {
      console.error('Worker error:', err);
      return json({ error: 'Error interno', detail: err.message }, 500);
    }
  },
};
