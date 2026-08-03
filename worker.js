export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================
    // HOME
    // =========================

    if (url.pathname === "/" && request.method === "GET") {
      return Response.json({
        success: true,
        message: "Rahul Live API Running 🚀"
      });
    }

    // =========================
    // HEALTH
    // =========================

    if (url.pathname === "/api/health" && request.method === "GET") {
      return Response.json({
        success: true,
        database: !!env.DB
      });
    }

    // =========================
    // REGISTER
    // =========================

    if (
      url.pathname === "/api/register" &&
      request.method === "POST"
    ) {
      try {
        const { username, email, password } =
          await request.json();

        if (!username || !email || !password) {
          return Response.json(
            {
              success: false,
              message: "Username, Gmail and password are required"
            },
            { status: 400 }
          );
        }

        const cleanUsername =
          String(username).trim();

        const cleanEmail =
          String(email).trim().toLowerCase();

        const cleanPassword =
          String(password);

        if (cleanUsername.length < 3) {
          return Response.json(
            {
              success: false,
              message: "Username must be at least 3 characters"
            },
            { status: 400 }
          );
        }

        if (cleanPassword.length < 6) {
          return Response.json(
            {
              success: false,
              message: "Password must be at least 6 characters"
            },
            { status: 400 }
          );
        }

        const existingUser =
          await env.DB
            .prepare(
              `SELECT id FROM users
               WHERE username = ? OR email = ?`
            )
            .bind(
              cleanUsername,
              cleanEmail
            )
            .first();

        if (existingUser) {
          return Response.json(
            {
              success: false,
              message: "Username or Gmail already registered"
            },
            { status: 409 }
          );
        }

        await env.DB
          .prepare(
            `INSERT INTO users
             (username, email, password)
             VALUES (?, ?, ?)`
          )
          .bind(
            cleanUsername,
            cleanEmail,
            cleanPassword
          )
          .run();

        return Response.json({
          success: true,
          message: "Registration successful"
        });

      } catch (error) {

        return Response.json(
          {
            success: false,
            message: "Registration failed"
          },
          { status: 500 }
        );
      }
    }

    // =========================
    // LOGIN
    // =========================

    if (
      url.pathname === "/api/login" &&
      request.method === "POST"
    ) {
      try {
        const { email, password } =
          await request.json();

        if (!email || !password) {
          return Response.json(
            {
              success: false,
              message: "Gmail and password are required"
            },
            { status: 400 }
          );
        }

        const cleanEmail =
          String(email).trim().toLowerCase();

        const cleanPassword =
          String(password);

        const user =
          await env.DB
            .prepare(
              `SELECT id, username, email
               FROM users
               WHERE email = ? AND password = ?`
            )
            .bind(
              cleanEmail,
              cleanPassword
            )
            .first();

        if (!user) {
          return Response.json(
            {
              success: false,
              message: "Invalid Gmail or password"
            },
            { status: 401 }
          );
        }

        return Response.json({
          success: true,
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        });

      } catch (error) {

        return Response.json(
          {
            success: false,
            message: "Login failed"
          },
          { status: 500 }
        );
      }
    }

    // =========================
    // GMAIL + PASSPORT
    // =========================

    if (
      url.pathname === "/api/identity" &&
      request.method === "POST"
    ) {
      try {
        const { email, passport } =
          await request.json();

        if (!email || !passport) {
          return Response.json(
            {
              success: false,
              message: "Gmail and Passport are required"
            },
            { status: 400 }
          );
        }

        const cleanEmail =
          String(email).trim().toLowerCase();

        const cleanPassport =
          String(passport).trim();

        await env.DB
          .prepare(
            `INSERT INTO user_identity
             (email, passport)
             VALUES (?, ?)
             ON CONFLICT(email)
             DO UPDATE SET
             passport = excluded.passport`
          )
          .bind(
            cleanEmail,
            cleanPassport
          )
          .run();

        return Response.json({
          success: true,
          message: "Details saved successfully"
        });

      } catch (error) {

        return Response.json(
          {
            success: false,
            message: "Database error"
          },
          { status: 500 }
        );
      }
    }

    // =========================
    // NOT FOUND
    // =========================

    return Response.json(
      {
        success: false,
        message: "API route not found"
      },
      { status: 404 }
    );
  }
};