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
    // SAVE GMAIL + PASSPORT
    // =========================

    if (
      url.pathname === "/api/identity" &&
      request.method === "POST"
    ) {
      try {
        const body = await request.json();

        const email =
          typeof body.email === "string"
            ? body.email.trim().toLowerCase()
            : "";

        const passport =
          typeof body.passport === "string"
            ? body.passport.trim()
            : "";

        if (!email) {
          return Response.json(
            {
              success: false,
              message: "Gmail required"
            },
            { status: 400 }
          );
        }

        if (!passport) {
          return Response.json(
            {
              success: false,
              message: "Passport required"
            },
            { status: 400 }
          );
        }

        await env.DB
          .prepare(`
            INSERT INTO user_identity
              (email, passport)
            VALUES
              (?, ?)
            ON CONFLICT(email)
            DO UPDATE SET
              passport = excluded.passport
          `)
          .bind(email, passport)
          .run();

        return Response.json({
          success: true,
          message: "Gmail and Passport saved successfully"
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
    // UNKNOWN ROUTE
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