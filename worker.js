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

        const check = await env.DB.prepare(
          "SELECT id FROM users WHERE email = ?"
        ).bind(email).first();

        if (check) {
          return Response.json({
            success: false,
            message: "Email already exists"
          });
        }

        const referral = "REF" + Date.now();

        await env.DB.prepare(`
          INSERT INTO users
          (username,email,password,referral_code)
          VALUES(?,?,?,?)
        `)
        .bind(username, email, password, referral)
        .run();

        return Response.json({
          success: true,
          message: "Registration Successful"
        });

      } catch (e) {

        return Response.json({
          success: false,
          error: e.message
        });

      }

    }    // =========================
    // LOGIN API
    // =========================
    if (url.pathname === "/api/login" && request.method === "POST") {

      try {

        const { email, password } = await request.json();

        const user = await env.DB.prepare(
          "SELECT * FROM users WHERE email = ? AND password = ?"
        )
        .bind(email, password)
        .first();

        if (!user) {
          return Response.json({
            success: false,
            message: "Invalid email or password"
          });
        }

        return Response.json({
          success: true,
          message: "Login Successful",
          user
        });

      } catch (e) {

        return Response.json({
          success: false,
          error: e.message
        });

      }

    }

    // =========================
    // SERVICES API
    // =========================
    if (url.pathname === "/api/services" && request.method === "GET") {

      const services = await env.DB.prepare(
        "SELECT * FROM services WHERE status='Active'"
      ).all();

      return Response.json({
        success: true,
        services: services.results
      });

    }    // =========================
    // ORDER API
    // =========================
    if (url.pathname === "/api/order" && request.method === "POST") {

      try {

        const {
          user_id,
          service_id,
          instagram_username,
          quantity,
          amount
        } = await request.json();

        await env.DB.prepare(`
          INSERT INTO orders
          (user_id, service_id, instagram_username, quantity, amount)
          VALUES (?, ?, ?, ?, ?)
        `)
        .bind(
          user_id,
          service_id,
          instagram_username,
          quantity,
          amount
        )
        .run();

        return Response.json({
          success: true,
          message: "Order Placed Successfully"
        });

      } catch (e) {

        return Response.json({
          success: false,
          error: e.message
        });

      }

    }

    // =========================
    // API NOT FOUND
    // =========================
    return Response.json(
      {
        success: false,
        message: "API Route Not Found"
      },
      { status: 404 }
    );

  }
};