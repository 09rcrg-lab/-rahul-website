export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    // ==========================
    // HOME API
    // ==========================
    if (url.pathname === "/") {
      return Response.json({
        success: true,
        name: "InstaBoost Hub API",
        status: "Online 🚀",
        version: "1.0"
      });
    }

    // ==========================
    // REGISTER API
    // ==========================
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
            message: "All fields are required."
          });
        }

        const user = await env.DB.prepare(
          "SELECT id FROM users WHERE email=? OR username=?"
        )
        .bind(email, username)
        .first();

        if (user) {
          return Response.json({
            success: false,
            message: "Username or Email already exists."
          });
        }

        await env.DB.prepare(`
          INSERT INTO users
          (username,email,password)
          VALUES(?,?,?)
        `)
        .bind(username, email, password)
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

    }    // ==========================
    // LOGIN API
    // ==========================
    if (url.pathname === "/api/login" && request.method === "POST") {

      try {

        const {
          email,
          password
        } = await request.json();

        if (!email || !password) {
          return Response.json({
            success: false,
            message: "Email and Password required."
          });
        }

        const user = await env.DB.prepare(
          `SELECT * FROM users
           WHERE email=? AND password=?`
        )
        .bind(email, password)
        .first();

        if (!user) {
          return Response.json({
            success: false,
            message: "Invalid Email or Password."
          });
        }

        return Response.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            wallet: user.wallet,
            coins: user.coins
          }
        });

      } catch (e) {

        return Response.json({
          success: false,
          error: e.message
        });

      }

    }

    // ==========================
    // USER PROFILE API
    // ==========================
    if (url.pathname === "/api/profile") {

      const id = url.searchParams.get("id");

      const user = await env.DB.prepare(
        "SELECT id,username,email,wallet,coins,created_at FROM users WHERE id=?"
      )
      .bind(id)
      .first();

      if (!user) {
        return Response.json({
          success: false,
          message: "User not found."
        });
      }

      return Response.json({
        success: true,
        user
      });

    }    // ==========================
    // WALLET API
    // ==========================
    if (url.pathname === "/api/wallet") {

      const userId = url.searchParams.get("user_id");

      const user = await env.DB.prepare(
        "SELECT wallet,coins FROM users WHERE id=?"
      )
      .bind(userId)
      .first();

      if (!user) {
        return Response.json({
          success: false,
          message: "User not found."
        });
      }

      return Response.json({
        success: true,
        wallet: user.wallet,
        coins: user.coins
      });

    }

    // ==========================
    // CREATE ORDER API
    // ==========================
    if (url.pathname === "/api/order" && request.method === "POST") {

      try {

        const {
          user_id,
          instagram_username,
          service_id,
          quantity,
          amount
        } = await request.json();

        if (
          !user_id ||
          !instagram_username ||
          !service_id ||
          !quantity ||
          !amount
        ) {
          return Response.json({
            success: false,
            message: "Missing required fields."
          });
        }

        await env.DB.prepare(`
          INSERT INTO orders
          (user_id,instagram_username,service_id,quantity,amount)
          VALUES(?,?,?,?,?)
        `)
        .bind(
          user_id,
          instagram_username,
          service_id,
          quantity,
          amount
        )
        .run();

        return Response.json({
          success: true,
          message: "Order placed successfully."
        });

      } catch (e) {

        return Response.json({
          success: false,
          error: e.message
        });

      }

    }    // ==========================
    // ORDER HISTORY API
    // ==========================
    if (url.pathname === "/api/orders") {

      const userId = url.searchParams.get("user_id");

      const orders = await env.DB.prepare(`
        SELECT
          orders.id,
          orders.instagram_username,
          services.service_name,
          orders.quantity,
          orders.amount,
          orders.status,
          orders.created_at
        FROM orders
        LEFT JOIN services
        ON orders.service_id = services.id
        WHERE orders.user_id = ?
        ORDER BY orders.id DESC
      `)
      .bind(userId)
      .all();

      return Response.json({
        success: true,
        orders: orders.results
      });

    }

    // ==========================
    // SERVICES API
    // ==========================
    if (url.pathname === "/api/services") {

      const services = await env.DB.prepare(`
        SELECT *
        FROM services
        WHERE status='Active'
        ORDER BY id ASC
      `).all();

      return Response.json({
        success: true,
        services: services.results
      });

    }    // ==========================
    // REFERRAL API
    // ==========================
    if (url.pathname === "/api/referral") {

      const userId = url.searchParams.get("user_id");

      const data = await env.DB.prepare(`
        SELECT *
        FROM referrals
        WHERE user_id=?
      `)
      .bind(userId)
      .all();

      return Response.json({
        success: true,
        referrals: data.results
      });

    }

    // ==========================
    // DAILY REWARD API
    // ==========================
    if (
      url.pathname === "/api/daily-reward" &&
      request.method === "POST"
    ) {

      return Response.json({
        success: true,
        message: "Daily Reward API Ready"
      });

    }

    // ==========================
    // 404
    // ==========================
    return Response.json({
      success: false,
      message: "API Not Found"
    }, {
      status: 404
    });

  }
}