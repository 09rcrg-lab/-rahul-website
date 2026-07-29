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
INSERT INTO users
(username,email,password,coins,instagram_username,followers_requested,followers_completed,request_status)
VALUES (?,?,?,?,?,?,?,?)
        )
.bind(
  username,
  email,
  password,
  0,
  "",
  0,
  0,
  "none"
)
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

}// Search User API
// Save Instagram Username
if (url.pathname === "/api/save-instagram" && request.method === "POST") {

  const { email, instagram } = await request.json();

  await env.DB.prepare(
    "UPDATE users SET instagram_username = ? WHERE email = ?"
  )
  .bind(instagram, email)
  .run();

  return Response.json({
    success: true,
    message: "Instagram Username Saved"
  });

}
if (url.pathname === "/api/search-user" && request.method === "POST") {

  const { username } = await request.json();

  const user = await env.DB.prepare(
    "SELECT username FROM users WHERE username = ?"
  )
  .bind(username)
  .first();

  if (!user) {
    return Response.json({
      success: false,
      message: "User not found"
    });
  }

  return Response.json({
    success: true,
    user
  });

}// Followers Request API
if (url.pathname === "/api/request-followers" && request.method === "POST") {

  const { email, followers } = await request.json();

  const user = await env.DB.prepare(
    "SELECT coins FROM users WHERE email = ?"
  )
  .bind(email)
  .first();

  if (!user) {
    return Response.json({
      success: false,
      message: "User not found"
    });
  }

  if (user.coins < followers) {
    return Response.json({
      success: false,
      message: "Not enough coins"
    });
  }

  await env.DB.prepare(
    `UPDATE users
     SET coins = coins - ?,
         followers_requested = ?,
         request_status = 'pending'
     WHERE email = ?`
  )
  .bind(followers, followers, email)
  .run();

  return Response.json({
    success: true,
    message: "Followers request submitted"
  });

}
    return new Response("API Not Found", {
      status: 404
    });

  }
}