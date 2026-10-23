require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const GHL_CLIENT_ID = process.env.GHL_CLIENT_ID;
const GHL_CLIENT_SECRET = process.env.GHL_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

// Almacenamiento en memoria — solo para este spike, nunca usar así en producción.
const tokensByLocation = new Map();
let sseClients = [];

// Canal en tiempo real que escucha el panel embebido en Custom Menus.
app.get('/events/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();
  res.write('retry: 2000\n\n');
  sseClients.push(res);
  req.on('close', () => {
    sseClients = sseClients.filter((c) => c !== res);
  });
});

function broadcastAlert(alert) {
  const payload = `data: ${JSON.stringify(alert)}\n\n`;
  sseClients.forEach((client) => client.write(payload));
}

// Receptor real de webhooks de GHL (Fase B).
app.post('/webhooks/ghl', (req, res) => {
  const event = req.body;
  console.log('[webhook recibido]', JSON.stringify(event).slice(0, 500));

  const alert = {
    id: crypto.randomUUID(),
    type: event.type || 'unknown',
    locationId: event.locationId || event.location_id || 'desconocido',
    summary: summarize(event),
    receivedAt: new Date().toISOString(),
  };

  broadcastAlert(alert);
  res.sendStatus(200);
});

function summarize(event) {
  // Ajustar según los campos reales que envíe cada tipo de webhook al inspeccionarlos en consola.
  return event.type ? `Evento: ${event.type}` : 'Evento sin tipo identificado';
}

// Dispara una alerta simulada, sin depender de GHL (Fase A).
app.post('/simulate', (req, res) => {
  const alert = {
    id: crypto.randomUUID(),
    type: req.body.type || 'MensajeNuevo',
    locationId: req.body.locationId || 'test-location',
    summary: req.body.summary || 'Alerta simulada de prueba',
    receivedAt: new Date().toISOString(),
  };
  broadcastAlert(alert);
  res.json({ ok: true, alert });
});

// OAuth paso 1: redirige a GHL para elegir subcuenta y autorizar.
app.get('/install', (req, res) => {
  if (!GHL_CLIENT_ID || !REDIRECT_URI) {
    return res.status(500).send('Falta GHL_CLIENT_ID o REDIRECT_URI en .env');
  }

  const scopes = [
    'conversations.readonly',
    'conversations/message.readonly',
    'calendars.readonly',
    'contacts.readonly',
    'opportunities.readonly',
  ].join(' ');

  const url = new URL('https://marketplace.gohighlevel.com/oauth/chooselocation');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', GHL_CLIENT_ID);
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('scope', scopes);

  res.redirect(url.toString());
});

// OAuth paso 2: intercambia el code por access_token / refresh_token.
app.get('/oauth/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Falta el parámetro code en la URL');

  try {
    const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GHL_CLIENT_ID,
        client_secret: GHL_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[oauth] error al intercambiar code', data);
      return res.status(500).send('Error de OAuth, revisa la consola del servidor');
    }

    tokensByLocation.set(data.locationId, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    });

    console.log('[oauth] tokens guardados para location', data.locationId);
    res.send('App instalada correctamente. Ya puedes cerrar esta pestaña y volver a GHL.');
  } catch (err) {
    console.error('[oauth] excepción', err);
    res.status(500).send('Error inesperado durante el intercambio OAuth');
  }
});

app.listen(PORT, () => {
  console.log(`Spike backend escuchando en http://localhost:${PORT}`);
  console.log(`Panel de prueba: http://localhost:${PORT}/panel.html`);
});
