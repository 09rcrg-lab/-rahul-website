export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    // ================= HOME API =================

    if (url.pathname === "/") {
      return Response.json({
        success: true,
        message: "Rahul SMM Panel API Running 🚀"
      });
    }

    // ================= REGISTER API =================

    if (url.pathname === "/api/register" && request.method === "POST") {

      try {

        const {
          username,
          email,
          password
        } = await request.json();

        if (!username || !email || !password) {
          return Response.json({
            success: false,
            message: "All fields are required"
          });
        }

        const checkUser = await env.DB.prepare(
          "SELECT id FROM users WHERE email = ?"
        )
        .bind(email)
        .first();

        if (checkUser) {
          return Response.json({
            success: false,
            message: "Email already registered"
          });
        }

        await env.DB.prepare(
          `INSERT INTO users
          (username,email,password,coins)
          VALUES (?,?,?,100)`
        )
        .bind(username,email,password)
        .run();        return Response.json({
          success: true,
          message: "Registration Successful"
        });

      } catch (err) {

        return Response.json({
          success: false,
          message: err.message
        });

      }

    }

    // ================= LOGIN API =================

    if (url.pathname === "/api/login" && request.method === "POST") {

      try {

        const { email, password } = await request.json();

        const user = await env.DB.prepare(
          `SELECT id,username,email,coins
           FROM users
           WHERE email = ? AND password = ?`
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

      } catch (err) {

        return Response.json({
          success: false,
          message: err.message
        });

      }

    }    // ================= SAVE INSTAGRAM =================

    if (url.pathname === "/api/save-instagram" && request.method === "POST") {

      try {

        const { email, instagram } = await request.json();

        await env.DB.prepare(
          `UPDATE users
           SET instagram_username = ?
           WHERE email = ?`
        )
        .bind(instagram, email)
        .run();

        return Response.json({
          success: true,
          message: "Instagram Username Saved"
        });

      } catch (err) {

        return Response.json({
          success: false,
          message: err.message
        });

      }

    }

    // ================= SEARCH USER =================

    if (url.pathname === "/api/search-user" && request.method === "POST") {

      try {

        const { username } = await request.json();

        const user = await env.DB.prepare(
          `SELECT username
           FROM users
           WHERE username = ?`
        )
        .bind(username)
        .first();

        if (!user) {

          return Response.json({
            success: false,
            message: "User Not Found"
          });

        }

        return Response.json({
          success: true,
          user
        });

      } catch (err) {

        return Response.json({
          success: false,
          message: err.message
        });

      }

    }    // ================= FOLLOWERS REQUEST =================

    if (url.pathname === "/api/request-followers" && request.method === "POST") {

      try {

        const { email, followers } = await request.json();

        const user = await env.DB.prepare(
          `SELECT coins
           FROM users
           WHERE email = ?`
        )
        .bind(email)
        .first();

        if (!user) {

          return Response.json({
            success: false,
            message: "User not found"
          });

        }

        const requiredCoins = followers * 10;

        if (user.coins < requiredCoins) {

          return Response.json({
            success: false,
            message: "Not enough coins"
          });

        }

        await env.DB.prepare(
          `UPDATE users
           SET coins = coins - ?,
               followers_requested = followers_requested + ?,
               request_status = 'pending'
           WHERE email = ?`
        )
        .bind(requiredCoins, followers, email)
        .run();

        await env.DB.prepare(
          `INSERT INTO requests
          (username,service,amount,status)
          VALUES(?,?,?,'Pending')`
        )
        .bind(email, "Instagram Followers", followers)
        .run();

        return Response.json({
          success: true,
          message: "Followers Request Submitted"
        });

      } catch (err) {

        return Response.json({
          success: false,
          message: err.message
        });

      }

    }    // ================= API NOT FOUND =================

    return Response.json(
      {
        success: false,
        message: "API Not Found"
      },
      {
        status: 404
      }
    );

  }
}