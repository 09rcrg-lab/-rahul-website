let connections = new Set();
// Simple in-memory user db (Production me Cloudflare D1 / Hyperdrive SQL attach karein)
const usersDB = new Map(); 

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. REGISTER API
    if (url.pathname === "/api/register" && request.method === "POST") {
      const { username, password } = await request.json();
      if (usersDB.has(username)) {
        return new Response(JSON.stringify({ success: false, message: "Username already exists!" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      usersDB.set(username, password);
      return new Response(JSON.stringify({ success: true, message: "Registered successfully!" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. LOGIN API
    if (url.pathname === "/api/login" && request.method === "POST") {
      const { username, password } = await request.json();
      if (usersDB.get(username) === password) {
        return new Response(JSON.stringify({ success: true, username: username }), {
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify({ success: false, message: "Invalid username or password!" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. WEBSOCKET CHAT HANDLER
    if (url.pathname === "/ws") {
      const upgradeHeader = request.headers.get("Upgrade");
      if (!upgradeHeader || upgradeHeader !== "websocket") {
        return new Response("Expected WebSocket connection", { status: 426 });
      }

      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);

      server.accept();
      connections.add(server);

      server.addEventListener("message", (event) => {
        for (let conn of connections) {
          if (conn.readyState === WebSocket.OPEN) {
            conn.send(event.data);
          }
        }
      });

      const closeHandler = () => connections.delete(server);
      server.addEventListener("close", closeHandler);
      server.addEventListener("error", closeHandler);

      return new Response(null, { status: 101, webSocket: client });
    }

    // Static assets fallback (HTML/CSS/JS)
    return env.ASSETS ? env.ASSETS.fetch(request) : new Response("API Running", { status: 200 });
  }
};