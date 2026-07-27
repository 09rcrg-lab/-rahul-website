await env.DB.prepare(
  "INSERT INTO users(username,email,password) VALUES(?,?,?)"
)
.bind(
  data.username,
  data.email,
  data.password
)
.run();// Check duplicate email
const check = await env.DB
  .prepare("SELECT id FROM users WHERE email = ?")
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

// Save user
await env.DB.prepare(
  `INSERT INTO users
  (username,email,password,referral_code)
  VALUES(?,?,?,?)`
)
.bind(
  data.username,
  data.email,
  data.password,
  "RH" + Date.now()
)
.run();// Login API
if (url.pathname === "/api/login" && request.method === "POST") {

  try {

    const data = await request.json();

    const user = await env.DB.prepare(
      "SELECT * FROM users WHERE email=? AND password=?"
    )
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

}