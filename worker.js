export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================
    // HOME API
    // =========================
    if (url.pathname === "/") {
      return Response.json({
        success: true,
        message: "InstaBoost Hub API Running 🚀"
      });
    }

    // =========================
    // REGISTER API
    // =========================
    if (url.pathname === "/api/register" && request.method === "POST") {
      try {
        const { username, email, password } = await request.json();

        const existing = await env.DB.prepare(
          "SELECT id FROM users WHERE email = ?"
        ).bind(email).first();

        if (existing) {
          return Response.json({
            success: false,
            message: "Email already registered"
          });
        }

        const referral = "REF" + Date.now();

        await env.DB.prepare(`
          INSERT INTO users
          (username, email, password, referral_code)
          VALUES (?, ?, ?, ?)
        `)
        .bind(username, email, password, referral)
        .run();

        return Response.json({
          success: true,
          message: "Registration Successful"
        });

      } catch (err) {
        return Response.json({
          success: false,
          error: err.message
        });
      }
    }

    // =========================
    // API NOT FOUND
    // =========================
    return Response.json({
      success: false,
      message: "API Route Not Found"
    }, { status: 404 });
  }
};