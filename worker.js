export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders()
      });
    }
    try {
      // Test API
      if (url.pathname === "/api/test" && request.method === "GET") {
        const result = await env.DB
          .prepare("SELECT name FROM sqlite_master WHERE type='table'")
          .all();
        return json({
          success: true,
          tables: result.results
        });
      }
      // REGISTER
      if (url.pathname === "/api/register" && request.method === "POST") {
        const body = await request.json();
        const username = String(body.username || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        const referral = String(body.referral || "").trim();
        if (!username || !email || !password) {
          return json(
            { success: false, message: "सभी जानकारी भरें।" },
            400
          );
        }
        if (password.length < 6) {
          return json(
            { success: false, message: "Password कम से कम 6 characters का होना चाहिए।" },
            400
          );
        }
        const existing = await env.DB
          .prepare(
            "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1"
          )
          .bind(username, email)
          .first();
        if (existing) {
          return json(
            { success: false, message: "Username या Email पहले से मौजूद है।" },
            409
          );
        }
        const passwordHash = await hashPassword(password);
        await env.DB
          .prepare(`
            INSERT INTO users
            (username, email, password_hash, referral_code, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
          `)
          .bind(
            username,
            email,
            passwordHash,
            referral,
          )
          .run();
        return json({
          success: true,
          message: "Account successfully created."
        });
      }
      // LOGIN
      if (url.pathname === "/api/login" && request.method === "POST") {
        const body = await request.json();
        const username = String(body.username || "").trim();
        const password = String(body.password || "");
        if (!username || !password) {
          return json(
            { success: false, message: "Username और Password डालें।" },
            400
          );
        }
        const user = await env.DB
          .prepare(`
            SELECT
              id,
              username,
              email,
              password_hash,
              referral_code
            FROM users
            WHERE username = ?
            LIMIT 1
          `)
          .bind(username)
          .first();
        if (!user) {
          return json(
            { success: false, message: "Username या Password गलत है।" },
            401
          );
        }
        const valid = await verifyPassword(
          password,
          user.password_hash
        );
        if (!valid) {
          return json(
            { success: false, message: "Username या Password गलत है।" },
            401
          );
        }
        return json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            referral: user.referral_code
          }
        });
      }
      // CREATE ORDER
      if (url.pathname === "/api/orders" && request.method === "POST") {
        const body = await request.json();
        const username = String(body.username || "").trim();
        const service = String(body.service || "").trim();
        const instagram = String(body.instagram || "").trim();
        const price = Number(body.price);
        if (!username || !service || !instagram || !Number.isFinite(price)) {
          return json(
            { success: false, message: "Order की जानकारी पूरी नहीं है।" },
            400
          );
        }
        const orderId =
          "RSH-" +
          Date.now().toString().slice(-10);
        await env.DB
          .prepare(`
            INSERT INTO orders
            (order_id, username, service, instagram_username, amount, payment_status, order_status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `)
          .bind(
            orderId,
            username,
            service,
            instagram,
            price,
            "Pending",
            "New",
          )
          .run();
        return json({
          success: true,
          order: {
            orderId,
            username,
            service,
            instagram,
            amount: price,
            paymentStatus: "Pending",
            orderStatus: "New"
          }
        });
      }
      // USER ORDERS
      if (url.pathname === "/api/orders" && request.method === "GET") {
        const username = url.searchParams.get("username");
        if (!username) {
          return json(
            { success: false, message: "Username required." },
            400
          );
        }
        const result = await env.DB
          .prepare(`
            SELECT
              order_id,
              service,
              instagram_username,
              amount,
              payment_status,
              order_status,
              created_at
            FROM orders
            WHERE username = ?
            ORDER BY id DESC
          `)
          .bind(username)
          .all();
        return json({
          success: true,
          orders: result.results
        });
      }
      return json(
        {
          success: false,
          message: "API endpoint not found."
        },
        404
      );
    } catch (error) {
      return json(
        {
          success: false,
          message: "Server error.",
          error: error.message
        },
        500
      );
    }
  }
};
// ===============================
// PASSWORD HASH
// ===============================
async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest(
    "SHA-256",
    data
  );
  return [...new Uint8Array(hash)]
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}
// ===============================
// PASSWORD VERIFY
// ===============================
async function verifyPassword(password, storedHash) {
  const hash = await hashPassword(password);
  return hash === storedHash;
}
// ===============================
// JSON RESPONSE
// ===============================
function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders()
      }
    }
  );
}
// ===============================
// CORS
// ===============================
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}