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
        status: "online",
        message: "Rahul Social Hub API Running 🚀"
      }), { headers: cors });
    }

    // Test API
    if (url.pathname === "/api/test") {

      const result = await env.DB
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all();

      return new Response(JSON.stringify({
        success: true,
        message: "D1 Database Connected ✅",
        tables: result.results
      }), { headers: cors });
    }

    // Register API
    if (url.pathname === "/api/register" && request.method === "POST") {

      try {

        const data = await request.json();

        await env.DB.prepare(
          "INSERT INTO users(username,email,password) VALUES(?,?,?)"
        )
        .bind(
          data.username,
          data.email,
          data.password
        )
        .run();

        return new Response(JSON.stringify({
          success: true,
          message: "User Registered Successfully ✅"
        }), { headers: cors });

      } catch (e) {

        return new Response(JSON.stringify({
          success: false,
          error: e.message
        }), {
          status: 500,
          headers: cors
        });

      }

    }

    return new Response(JSON.stringify({
      success: false,
      message: "API Not Found"
    }), {
      status: 404,
      headers: cors
    });

  }
};