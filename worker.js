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
// Login API
if (url.pathname === "/api/login" && request.method === "POST") {

  const { email, password } = await request.json();

  const user = await env.DB.prepare(
    "SELECT * FROM users WHERE email = ? AND password = ?"
  )
  .bind(email, password)
  .first();

  if (!user) {
    return Response.json({
      success: false,
      message: "Invalid Email or Password"
    });
  }

  return Response.json({
    success: true,
    message: "Login Successful",
    user
  });

}
    return new Response("API Not Found", {
      status: 404
    });

  }
}