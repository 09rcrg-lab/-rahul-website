export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    // Home API
    if (url.pathname === "/") {
      return new Response("Rahul Social Hub API Running 🚀");
    }

    // Register API
    if (url.pathname === "/api/register" && request.method === "POST") {

      const { username, email, password } = await request.json();

      try {

        await env.DB.prepare(
          "INSERT INTO users (username,email,password,coins) VALUES (?,?,?,?)"
        )
        .bind(username, email, password, 0)
        .run();

        return Response.json({
          success: true,
          message: "User Registered Successfully"
        });

      } catch (e) {

        return Response.json({
          success: false,
          message: "Email already registered"
        });

      }

    }

    return new Response("API Not Found", {
      status: 404
    });

  }
}