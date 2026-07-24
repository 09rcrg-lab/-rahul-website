export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    if (url.pathname === "/") {

      return new Response(
        JSON.stringify({
          status: "online",
          message: "Rahul Social Hub API Running 🚀"
        }),
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

    }


    if (url.pathname === "/api/test") {

      const result = await env.DB
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all();

      return new Response(
        JSON.stringify({
          message: "D1 Database Connected ✅",
          tables: result.results
        }),
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

    }


    return new Response(
      "Rahul Social Hub Server"
    );

  }
};export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    // Home
    if (url.pathname === "/") {
      return new Response(
        JSON.stringify({
          status: "online",
          message: "Rahul Social Hub API Running 🚀"
        }),
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    // Test Database
    if (url.pathname === "/api/test") {
      const result = await env.DB
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all();

      return new Response(
        JSON.stringify({
          message: "D1 Database Connected ✅",
          tables: result.results
        }),
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    // Register User
    if (url.pathname === "/api/register" && request.method === "POST") {

      const data = await request.json();

      await env.DB.prepare(
        "INSERT INTO users (username,email,password) VALUES (?,?,?)"
      )
      .bind(
        data.username,
        data.email,
        data.password
      )
      .run();

      return new Response(
        JSON.stringify({
          success: true,
          message: "User Registered Successfully ✅"
        }),
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    return new Response("Rahul Social Hub Server");
  }
};