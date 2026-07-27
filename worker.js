export default {
  async fetch(request, env) {

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);

    // Home
    if (url.pathname === "/") {
      return new Response(JSON.stringify({
        success: true,
        message: "Rahul Social Hub API Running 🚀"
      }), { headers: cors });
    }

    // Test Database
    if (url.pathname === "/api/test") {

      const result = await env.DB
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all();

      return new Response(JSON.stringify({
        success: true,
        tables: result.results
      }), { headers: cors });
    }    // Register API
    if (url.pathname === "/api/register" && request.method === "POST") {

      try {

        const data = await request.json();

        const check = await env.DB
          .prepare("SELECT id FROM users WHERE email=?")
          .bind(data.email)
          .first();

        if (check) {
          return new Response(JSON.stringify({
            success: false,
            message: "Email already registered"
          }), {
            status: 400,
            headers: cors
          });
        }

        await env.DB.prepare(
          "INSERT INTO users(username,email,password,referral_code) VALUES(?,?,?,?)"
        )
        .bind(
          data.username,
          data.email,
          data.password,
          "RH" + Date.now()
        )
        .run();

        return new Response(JSON.stringify({
          success: true,
          message: "User Registered Successfully ✅"
        }), {
          headers: cors
        });

      } catch (e) {

        return new Response(JSON.stringify({
          success: false,
          error: e.message
        }), {
          status: 500,
          headers: cors
        });

      }

    }    // Login API
    if (url.pathname === "/api/login" && request.method === "POST") {

      try {

        const data = await request.json();

        const user = await env.DB
          .prepare("SELECT * FROM users WHERE email=? AND password=?")
          .bind(data.email, data.password)
          .first();

        if (!user) {
          return new Response(JSON.stringify({
            success: false,
            message: "Invalid Email or Password"
          }), {
            status: 401,
            headers: cors
          });
        }

        return new Response(JSON.stringify({
          success: true,
          message: "Login Successful ✅",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            balance: user.balance,
            referral_code: user.referral_code
          }
        }), {
          headers: cors
        });

      } catch (e) {

        return new Response(JSON.stringify({
          success: false,
          error: e.message
        }), {
          status: 500,
          headers: cors
        });

      }

    }    // API Not Found
    return new Response(
      JSON.stringify({
        success: false,
        message: "API Not Found"
      }),
      {
        status: 404,
        headers: cors
      }
    );

  }
};