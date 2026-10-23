# Spike técnico: entrega en tiempo real dentro de Custom Menus

## Pregunta a validar
¿Puede un iframe embebido en GHL vía Custom Menus recibir actualizaciones en tiempo real (sin recargar), y cuál es el mecanismo más simple que funciona de forma confiable: WebSocket, Server-Sent Events (SSE), o polling corto?

Esta es la pregunta abierta marcada como bloqueante en el PRD ("Consideraciones técnicas" y "Riesgos"): [PRD: Módulo de Alertas Visuales para GoHighLevel](https://claude.ai/artifact/MC9CWYbXemgwE835z71xQc).

## Hipótesis de partida
SSE debería funcionar dentro de un iframe normal, porque es solo una conexión HTTP de larga duración desde el navegador hacia el backend — no depende de que GHL "soporte" algo especial, solo de que el iframe pueda hacer solicitudes salientes normales. El riesgo real no es si SSE funciona en un iframe cualquiera (eso ya está bien establecido), sino si GHL restringe las políticas de red o CSP dentro de Custom Menus específicamente. Eso es justo lo que este spike confirma.

## Qué construye este spike
- `server.js` — backend Express con:
  - `POST /webhooks/ghl` — receptor de webhooks reales de GHL.
  - `POST /simulate` — dispara una alerta falsa sin depender de GHL, para probar el mecanismo de entrega de forma aislada.
  - `GET /events/stream` — canal SSE que empuja alertas a quien esté escuchando.
  - `GET /install` + `GET /oauth/callback` — flujo OAuth 2.0 mínimo para instalar la app en una subcuenta de prueba.
- `public/panel.html` — la página que se embebería en Custom Menus; se conecta al SSE y muestra las alertas como tarjetas en tiempo real.

## Fase A — Validar el mecanismo de tiempo real (sin GHL, sin ngrok)
1. `cd "spike-custom-menus-realtime"` y `npm install`.
2. `npm start`.
3. Abre `http://localhost:3000/panel.html` en el navegador.
4. En otra terminal, dispara una alerta simulada:
   ```
   curl -X POST http://localhost:3000/simulate -H "Content-Type: application/json" -d "{\"type\":\"MensajeNuevo\",\"summary\":\"Juan Perez: Hola, tengo una duda\"}"
   ```
5. Resultado esperado: la tarjeta aparece en `/panel.html` al instante, sin recargar la página.

Esto confirma que el mecanismo de entrega en sí (SSE) funciona de forma aislada. Lo que falta validar es si funciona igual DENTRO de un iframe de Custom Menus real — eso es la Fase B, la parte que realmente importa.

## Fase B — Validar dentro de GHL real (requiere tu app en draft + ngrok)
1. Instala ngrok si no lo tienes, y corre `ngrok http 3000`. Copia la URL https que te da (ej. `https://abcd1234.ngrok-free.app`).
2. En el portal de desarrolladores de GHL, dentro de tu app (draft):
   - En **Custom Menus**, agrega un menú nuevo apuntando a `https://TU-URL-NGROK.ngrok-free.app/panel.html`.
   - En **Webhooks**, suscribe al menos un evento de prueba (ej. el de mensaje nuevo en Conversations) apuntando a `https://TU-URL-NGROK.ngrok-free.app/webhooks/ghl`.
3. Copia `.env.example` a `.env` y completa `GHL_CLIENT_ID`, `GHL_CLIENT_SECRET`, y `REDIRECT_URI=https://TU-URL-NGROK.ngrok-free.app/oauth/callback` — registra esa misma redirect URI en la configuración OAuth de tu app en GHL.
4. Reinicia el servidor (`npm start`).
5. Ve a `http://localhost:3000/install`, elige tu subcuenta de prueba, autoriza la app.
6. Dentro de esa subcuenta en GHL, abre el nuevo ítem de Custom Menus en el menú lateral — deberías ver el panel cargado dentro de GHL.
7. Genera un evento real en esa subcuenta (ej. envía un mensaje de prueba en Conversations) y observa si la alerta aparece en el panel embebido sin recargar.

## Resultado (completar después de correr el spike)
- [x] Fase A (SSE fuera de GHL): **funciona** — verificado 2026-10-23: conexión SSE establecida, `/simulate` entregó la alerta al cliente conectado en menos de 1 segundo, sin recargar.
- [ ] Fase B (Custom Menus dentro de GHL real): funciona / no funciona — notas:
- [ ] Mecanismo recomendado para el MVP: SSE / WebSocket / polling — por qué:
- [ ] Bloqueos encontrados en la documentación o configuración real de Custom Menus:

## Qué decide esto
Si la Fase B funciona con SSE, la arquitectura de la PRD queda confirmada tal cual, sin necesidad de WebSocket. Si SSE falla dentro del iframe de GHL (por CSP u otra restricción propia de Custom Menus), el fallback es polling corto (cada 5-10s), ya anotado como riesgo en el PRD. En cualquier caso, actualizar las secciones "Consideraciones técnicas" y "Riesgos" del PRD con el resultado real de este spike.
