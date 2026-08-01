export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {

      // =========================
      // HOME API
      // =========================
      if (url.pathname === "/") {
        return Response.json(
          {
            success: true,
            app: "Rahul Social Hub",
            version: "1.0.0",
            message: "API Running 🚀"
          },
          { headers: corsHeaders }
        );
      }

      // ===== NEXT PART BELOW =====
// =========================
// REGISTER API
// =========================
if (url.pathname === "/api/register" && request.method === "POST") {

  const body = await request.json();
  const { username, email, password } = body;

  if (!username || !email || !password) {
    return Response.json(
      {
        success: false,
        message: "All fields are required"
      },
      { headers: corsHeaders }
    );
  }

  const existing = await env.DB.prepare(
    "SELECT id FROM users WHERE email = ? OR username = ?"
  )
  .bind(email, username)
  .first();

  if (existing) {
    return Response.json(
      {
        success: false,
        message: "Username or Email already exists"
      },
      { headers: corsHeaders }
    );
  }

  await env.DB.prepare(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)"
  )
  .bind(username, email, password)
  .run();

  return Response.json(
    {
      success: true,
      message: "Registration Successful"
    },
    { headers: corsHeaders }
  );
}
// =========================
// LOGIN API
// =========================
if (url.pathname === "/api/login" && request.method === "POST") {

  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return Response.json(
      {
        success: false,
        message: "Email and Password are required"
      },
      { headers: corsHeaders }
    );
  }

  const user = await env.DB.prepare(
    `SELECT id, username, email
     FROM users
     WHERE email = ? AND password = ?`
  )
  .bind(email, password)
  .first();

  if (!user) {
    return Response.json(
      {
        success: false,
        message: "Invalid Email or Password"
      },
      { headers: corsHeaders }
    );
  }

  return Response.json(
    {
      success: true,
      message: "Login Successful",
      user
    },
    { headers: corsHeaders }
  );
}
// =========================
// VIDEO UPLOAD API
// =========================
if (url.pathname === "/api/upload-video" && request.method === "POST") {

  const body = await request.json();

  const {
    user_id,
    title,
    description,
    video_url,
    thumbnail_url
  } = body;

  if (!user_id || !title || !video_url) {
    return Response.json(
      {
        success: false,
        message: "User ID, title and video URL are required"
      },
      { headers: corsHeaders }
    );
  }

  const user = await env.DB.prepare(
    "SELECT id, username FROM users WHERE id = ?"
  )
  .bind(user_id)
  .first();

  if (!user) {
    return Response.json(
      {
        success: false,
        message: "User not found"
      },
      { headers: corsHeaders }
    );
  }

  const result = await env.DB.prepare(
    `INSERT INTO videos
    (user_id, title, description, video_url, thumbnail_url)
    VALUES (?, ?, ?, ?, ?)`
  )
  .bind(
    user_id,
    title,
    description || "",
    video_url,
    thumbnail_url || ""
  )
  .run();

  return Response.json(
    {
      success: true,
      message: "Video uploaded successfully",
      video_id: result.meta.last_row_id
    },
    { headers: corsHeaders }
  );
}
      return Response.json(
        {
          success: false,
          message: "API Not Found"
        },
        {
          status: 404,
          headers: corsHeaders
        }
      );

    } catch (error) {

      return Response.json(
        {
          success: false,
          error: error.message
        },
        {
          status: 500,
          headers: corsHeaders
        }
      );

    }

  }
}