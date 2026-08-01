export default {

  async fetch(request, env) {

    const url = new URL(request.url);

    const origin = request.headers.get("Origin") || "*";

    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    };


    // =====================================================
    // CORS PREFLIGHT
    // =====================================================

    if (request.method === "OPTIONS") {

      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });

    }


    // =====================================================
    // RESPONSE HELPERS
    // =====================================================

    function json(data, status = 200) {

      return new Response(
        JSON.stringify(data),
        {
          status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json; charset=UTF-8"
          }
        }
      );

    }


    function error(message, status = 400) {

      return json({
        success: false,
        error: message
      }, status);

    }


    async function getBody() {

      try {

        return await request.json();

      } catch {

        return null;

      }

    }


    // =====================================================
    // PASSWORD HASH
    // =====================================================

    async function hashPassword(password) {

      const data =
        new TextEncoder().encode(password);

      const hash =
        await crypto.subtle.digest(
          "SHA-256",
          data
        );

      return Array
        .from(new Uint8Array(hash))
        .map(
          byte =>
            byte
              .toString(16)
              .padStart(2, "0")
        )
        .join("");

    }


    // =====================================================
    // HOME
    // =====================================================

    if (
      url.pathname === "/" &&
      request.method === "GET"
    ) {

      return json({
        success: true,
        message: "Rahul Live API Running 🚀",
        version: "2.0",
        database: "D1"
      });

    }


    // =====================================================
    // DATABASE TEST
    // =====================================================

    if (
      url.pathname === "/api/test" &&
      request.method === "GET"
    ) {

      try {

        const result =
          await env.DB
            .prepare(`
              SELECT name
              FROM sqlite_master
              WHERE type = 'table'
              ORDER BY name
            `)
            .all();

        return json({
          success: true,
          tables: result.results || []
        });

      } catch (e) {

        return error(
          e.message,
          500
        );

      }

    }


    // =====================================================
    // REGISTER
    // =====================================================

    if (
      url.pathname === "/api/register" &&
      request.method === "POST"
    ) {

      const body =
        await getBody();

      if (!body) {

        return error(
          "Invalid JSON."
        );

      }


      const username =
        String(
          body.username || ""
        ).trim();

      const email =
        String(
          body.email || ""
        ).trim()
        .toLowerCase();

      const password =
        String(
          body.password || ""
        );


      if (
        !username ||
        !email ||
        !password
      ) {

        return error(
          "Username, email और password जरूरी हैं।"
        );

      }


      if (
        username.length < 3
      ) {

        return error(
          "Username कम से कम 3 characters का होना चाहिए।"
        );

      }


      if (
        password.length < 6
      ) {

        return error(
          "Password कम से कम 6 characters का होना चाहिए।"
        );

      }


      try {

        const existing =
          await env.DB
            .prepare(`
              SELECT id
              FROM users
              WHERE username = ? OR email = ?
              LIMIT 1
            `)
            .bind(
              username,
              email
            )
            .first();


        if (existing) {

          return error(
            "Username या Email पहले से मौजूद है।",
            409
          );

        }


        const passwordHash =
          await hashPassword(
            password
          );


        const result =
          await env.DB
            .prepare(`
              INSERT INTO users
              (
                username,
                email,
                password
              )
              VALUES (?, ?, ?)
            `)
            .bind(
              username,
              email,
              passwordHash
            )
            .run();


        return json({
          success: true,
          message: "Account successfully created.",
          user_id: result.meta.last_row_id
        }, 201);


      } catch (e) {

        return error(
          e.message,
          500
        );

      }

    }


    // =====================================================
    // LOGIN
    // =====================================================

    if (
      url.pathname === "/api/login" &&
      request.method === "POST"
    ) {

      const body =
        await getBody();

      if (!body) {

        return error(
          "Invalid JSON."
        );

      }


      const username =
        String(
          body.username || ""
        ).trim();

      const password =
        String(
          body.password || ""
        );


      if (
        !username ||
        !password
      ) {

        return error(
          "Username/Email और password जरूरी हैं।"
        );

      }


      try {

        const user =
          await env.DB
            .prepare(`
              SELECT
                id,
                username,
                email,
                password,
                bio,
                avatar_url,
                followers_count,
                following_count,
                videos_count,
                created_at
              FROM users
              WHERE username = ? OR email = ?
              LIMIT 1
            `)
            .bind(
              username,
              username.toLowerCase()
            )
            .first();


        if (!user) {

          return error(
            "Username या Email गलत है।",
            401
          );

        }


        const passwordHash =
          await hashPassword(
            password
          );


        if (
          passwordHash !==
          user.password
        ) {

          return error(
            "Password गलत है।",
            401
          );

        }


        delete user.password;


        return json({
          success: true,
          message: "Login successful.",
          user
        });


      } catch (e) {

        return error(
          e.message,
          500
        );

      }

    }


    // =====================================================
    // GET VIDEOS
    // =====================================================

    if (
      url.pathname === "/api/videos" &&
      request.method === "GET"
    ) {

      try {

        const result =
          await env.DB
            .prepare(`
              SELECT
                videos.id,
                videos.user_id,
                videos.video_url,
                videos.thumbnail_url,
                videos.caption,
                videos.likes_count,
                videos.comments_count,
                videos.shares_count,
                videos.views_count,
                videos.status,
                videos.created_at,
                users.username,
                users.avatar_url
              FROM videos
              INNER JOIN users
                ON users.id = videos.user_id
              WHERE videos.status = 'published'
              ORDER BY videos.created_at DESC
              LIMIT 100
            `)
            .all();


        return json({
          success: true,
          videos: result.results || []
        });


      } catch (e) {

        return error(
          e.message,
          500
        );

      }

    }


    // =====================================================
    // LIKE VIDEO
    // =====================================================

    if (
      url.pathname === "/api/videos/like" &&
      request.method === "POST"
    ) {

      const body =
        await getBody();

      if (!body) {

        return error(
          "Invalid JSON."
        );

      }


      const videoId =
        Number(
          body.video_id
        );

      const userId =
        Number(
          body.user_id
        );


      if (
        !videoId ||
        !userId
      ) {

        return error(
          "video_id और user_id जरूरी हैं।"
        );

      }


      try {

        const existing =
          await env.DB
            .prepare(`
              SELECT id
              FROM video_likes
              WHERE video_id = ?
              AND user_id = ?
              LIMIT 1
            `)
            .bind(
              videoId,
              userId
            )
            .first();


        if (existing) {

          await env.DB
            .prepare(`
              DELETE FROM video_likes
              WHERE video_id = ?
              AND user_id = ?
            `)
            .bind(
              videoId,
              userId
            )
            .run();


          await env.DB
            .prepare(`
              UPDATE videos
              SET likes_count =
                CASE
                  WHEN likes_count > 0
                  THEN likes_count - 1
                  ELSE 0
                END
              WHERE id = ?
            `)
            .bind(videoId)
            .run();


          return json({
            success: true,
            liked: false
          });

        }


        await env.DB
          .prepare(`
            INSERT INTO video_likes
            (
              video_id,
              user_id
            )
            VALUES (?, ?)
          `)
          .bind(
            videoId,
            userId
          )
          .run();


        await env.DB
          .prepare(`
            UPDATE videos
            SET likes_count =
              likes_count + 1
            WHERE id = ?
          `)
          .bind(videoId)
          .run();


        return json({
          success: true,
          liked: true
        });


      } catch (e) {

        return error(
          e.message,
          500
        );

      }

    }


    // =====================================================
    // COMMENT VIDEO
    // =====================================================

    if (
      url.pathname === "/api/videos/comment" &&
      request.method === "POST"
    ) {

      const body =
        await getBody();

      if (!body) {

        return error(
          "Invalid JSON."
        );

      }


      const videoId =
        Number(
          body.video_id
        );

      const userId =
        Number(
          body.user_id
        );

      const comment =
        String(
          body.comment || ""
        ).trim();


      if (
        !videoId ||
        !userId ||
        !comment
      ) {

        return error(
          "Video, user और comment जरूरी हैं।"
        );

      }


      if (
        comment.length > 1000
      ) {

        return error(
          "Comment बहुत लंबा है।"
        );

      }


      try {

        await env.DB
          .prepare(`
            INSERT INTO video_comments
            (
              video_id,
              user_id,
              comment
            )
            VALUES (?, ?, ?)
          `)
          .bind(
            videoId,
            userId,
            comment
          )
          .run();


        await env.DB
          .prepare(`
            UPDATE videos
            SET comments_count =
              comments_count + 1
            WHERE id = ?
          `)
          .bind(videoId)
          .run();


        return json({
          success: true,
          message: "Comment added."
        });


      } catch (e) {

        return error(
          e.message,
          500
        );

      }

    }


    // =====================================================
    // VIDEO VIEW
    // =====================================================

    if (
      url.pathname === "/api/videos/view" &&
      request.method === "POST"
    ) {

      const body =
        await getBody();

      if (!body) {

        return error(
          "Invalid JSON."
        );

      }


      const videoId =
        Number(
          body.video_id
        );

      const userId =
        body.user_id
          ? Number(body.user_id)
          : null;


      if (!videoId) {

        return error(
          "video_id जरूरी है।"
        );

      }


      try {

        await env.DB
          .prepare(`
            INSERT INTO video_views
            (
              video_id,
              user_id
            )
            VALUES (?, ?)
          `)
          .bind(
            videoId,
            userId
          )
          .run();


        await env.DB
          .prepare(`
            UPDATE videos
            SET views_count =
              views_count + 1
            WHERE id = ?
          `)
          .bind(videoId)
          .run();


        return json({
          success: true
        });


      } catch (e) {

        return error(
          e.message,
          500
        );

      }

    }


    // =====================================================
    // START LIVE
    // =====================================================

    if (
      url.pathname === "/api/live/start" &&
      request.method === "POST"
    ) {

      const body =
        await getBody();

      if (!body) {

        return error(
          "Invalid JSON."
        );

      }


      const userId =
        Number(
          body.user_id
        );

      const title =
        String(
          body.title || "Rahul Live"
        )
        .trim()
        .slice(0, 150);


      if (!userId) {

        return error(
          "user_id जरूरी है।"
        );

      }


      try {

        const user =
          await env.DB
            .prepare(`
              SELECT id
              FROM users
              WHERE id = ?
              LIMIT 1
            `)
            .bind(userId)
            .first();


        if (!user) {

          return error(
            "User नहीं मिला।",
            404
          );

        }


        const alreadyLive =
          await env.DB
            .prepare(`
              SELECT id
              FROM live_streams
              WHERE user_id = ?
              AND status = 'live'
              LIMIT 1
            `)
            .bind(userId)
            .first();


        if (alreadyLive) {

          return error(
            "आप पहले से LIVE हैं।",
            409
          );

        }


        const result =
          await env.DB
            .prepare(`
              INSERT INTO live_streams
              (
                user_id,
                title,
                status
              )
              VALUES (?, ?, 'live')
            `)
            .bind(
              userId,
              title || "Rahul Live"
            )
            .run();


        return json({
          success: true,
          live_id: result.meta.last_row_id,
          message: "LIVE session created."
        });


      } catch (e) {

        return error(
          e.message,
          500
        );

      }

    }


    // =====================================================
    // END LIVE
    // =====================================================

    if (
      url.pathname === "/api/live/end" &&
      request.method === "POST"
    ) {

      const body =
        await getBody();

      if (!body) {

        return error(
          "Invalid JSON."
        );

      }


      const liveId =
        Number(
          body.live_id
        );


      if (!liveId) {

        return error(
          "live_id जरूरी है।"
        );

      }


      try {

        const result =
          await env.DB
            .prepare(`
              UPDATE live_streams
              SET
                status = 'ended',
                ended_at = CURRENT_TIMESTAMP
              WHERE id = ?
              AND status = 'live'
            `)
            .bind(liveId)
            .run();


        if (
          !result.meta.changes
        ) {

          return error(
            "LIVE session नहीं मिली।",
            404
          );

        }


        return json({
          success: true,
          message: "LIVE ended."
        });


      } catch (e) {

        return error(
          e.message,
          500
        );

      }

    }


    // =====================================================
    // GET LIVE STREAMS
    // =====================================================

    if (
      url.pathname === "/api/live" &&
      request.method === "GET"
    ) {

      try {

        const result =
          await env.DB
            .prepare(`
              SELECT
                live_streams.id,
                live_streams.user_id,
                live_streams.title,
                live_streams.stream_url,
                live_streams.playback_url,
                live_streams.thumbnail_url,
                live_streams.status,
                live_streams.viewers_count,
                live_streams.started_at,
                users.username,
                users.avatar_url
              FROM live_streams
              INNER JOIN users
                ON users.id = live_streams.user_id
              WHERE live_streams.status = 'live'
              ORDER BY live_streams.started_at DESC
              LIMIT 100
            `)
            .all();


        return json({
          success: true,
          live_streams:
            result.results || []
        });


      } catch (e) {

        return error(
          e.message,
          500
        );

      }

    }


    // =====================================================
    // 404
    // =====================================================

    return error(
      "API endpoint not found.",
      404
    );

  }

};