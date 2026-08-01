export default {

  async fetch(request, env) {

    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };


    /* =====================================================
       OPTIONS / CORS
    ===================================================== */

    if (request.method === "OPTIONS") {

      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });

    }


    try {


      /* ===================================================
         HOME
      =================================================== */

      if (
        url.pathname === "/" &&
        request.method === "GET"
      ) {

        return json({
          success: true,
          message: "Rahul Live API Running 🚀"
        });

      }


      /* ===================================================
         TEST DATABASE
      =================================================== */

      if (
        url.pathname === "/api/test" &&
        request.method === "GET"
      ) {

        const result =
          await env.DB
            .prepare(
              "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
            )
            .all();


        return json({
          success: true,
          tables: result.results || []
        });

      }


      /* ===================================================
         REGISTER
      =================================================== */

      if (
        url.pathname === "/api/register" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        const username =
          String(body.username || "").trim();

        const email =
          String(body.email || "").trim().toLowerCase();

        const password =
          String(body.password || "");


        if (
          !username ||
          !email ||
          !password
        ) {

          return json({
            success: false,
            error: "All fields are required."
          }, 400);

        }


        if (password.length < 6) {

          return json({
            success: false,
            error: "Password must be at least 6 characters."
          }, 400);

        }


        const existing =
          await env.DB
            .prepare(
              `
              SELECT id
              FROM users
              WHERE username = ? OR email = ?
              LIMIT 1
              `
            )
            .bind(
              username,
              email
            )
            .first();


        if (existing) {

          return json({
            success: false,
            error: "Username or email already exists."
          }, 409);

        }


        const result =
          await env.DB
            .prepare(
              `
              INSERT INTO users
              (
                username,
                email,
                password
              )
              VALUES (?, ?, ?)
              `
            )
            .bind(
              username,
              email,
              password
            )
            .run();


        return json({
          success: true,
          message: "Account created successfully.",
          user_id: result.meta.last_row_id
        });

      }


      /* ===================================================
         LOGIN
      =================================================== */

      if (
        url.pathname === "/api/login" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        const username =
          String(body.username || "").trim();

        const password =
          String(body.password || "");


        if (
          !username ||
          !password
        ) {

          return json({
            success: false,
            error: "Username/email and password are required."
          }, 400);

        }


        const user =
          await env.DB
            .prepare(
              `
              SELECT
                id,
                username,
                email,
                password,
                bio,
                avatar_url,
                followers_count,
                following_count,
                videos_count
              FROM users
              WHERE
                (username = ? OR email = ?)
                AND password = ?
              LIMIT 1
              `
            )
            .bind(
              username,
              username.toLowerCase(),
              password
            )
            .first();


        if (!user) {

          return json({
            success: false,
            error: "Invalid username/email or password."
          }, 401);

        }


        delete user.password;


        return json({
          success: true,
          user
        });

      }


      /* ===================================================
         PROFILE
      =================================================== */

      if (
        url.pathname === "/api/profile" &&
        request.method === "GET"
      ) {

        const username =
          String(
            url.searchParams.get("username") || ""
          ).trim();


        if (!username) {

          return json({
            success: false,
            error: "Username is required."
          }, 400);

        }


        const user =
          await env.DB
            .prepare(
              `
              SELECT
                id,
                username,
                email,
                bio,
                avatar_url,
                followers_count,
                following_count,
                videos_count
              FROM users
              WHERE username = ?
              LIMIT 1
              `
            )
            .bind(username)
            .first();


        if (!user) {

          return json({
            success: false,
            error: "User not found."
          }, 404);

        }


        return json({
          success: true,
          user
        });

      }


      /* ===================================================
         GET SHORT VIDEOS
      =================================================== */

      if (
        url.pathname === "/api/videos" &&
        request.method === "GET"
      ) {

        const result =
          await env.DB
            .prepare(
              `
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
                users.username
              FROM videos

              INNER JOIN users
                ON users.id = videos.user_id

              WHERE videos.status = 'published'

              ORDER BY videos.created_at DESC

              LIMIT 100
              `
            )
            .all();


        return json({
          success: true,
          videos: result.results || []
        });

      }


      /* ===================================================
         LIKE / UNLIKE VIDEO
      =================================================== */

      if (
        url.pathname === "/api/videos/like" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        const videoId =
          Number(body.video_id);

        const userId =
          Number(body.user_id);


        if (
          !videoId ||
          !userId
        ) {

          return json({
            success: false,
            error: "Video and user are required."
          }, 400);

        }


        const existing =
          await env.DB
            .prepare(
              `
              SELECT id
              FROM video_likes
              WHERE video_id = ?
              AND user_id = ?
              LIMIT 1
              `
            )
            .bind(
              videoId,
              userId
            )
            .first();


        if (existing) {

          await env.DB
            .prepare(
              `
              DELETE FROM video_likes
              WHERE video_id = ?
              AND user_id = ?
              `
            )
            .bind(
              videoId,
              userId
            )
            .run();


          await env.DB
            .prepare(
              `
              UPDATE videos
              SET likes_count =
                CASE
                  WHEN likes_count > 0
                  THEN likes_count - 1
                  ELSE 0
                END
              WHERE id = ?
              `
            )
            .bind(videoId)
            .run();


          return json({
            success: true,
            liked: false
          });

        }


        await env.DB
          .prepare(
            `
            INSERT INTO video_likes
            (
              video_id,
              user_id
            )
            VALUES (?, ?)
            `
          )
          .bind(
            videoId,
            userId
          )
          .run();


        await env.DB
          .prepare(
            `
            UPDATE videos
            SET likes_count = likes_count + 1
            WHERE id = ?
            `
          )
          .bind(videoId)
          .run();


        return json({
          success: true,
          liked: true
        });

      }


      /* ===================================================
         VIDEO COMMENT
      =================================================== */

      if (
        url.pathname === "/api/videos/comment" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        const videoId =
          Number(body.video_id);

        const userId =
          Number(body.user_id);

        const comment =
          String(body.comment || "").trim();


        if (
          !videoId ||
          !userId ||
          !comment
        ) {

          return json({
            success: false,
            error: "Video, user and comment are required."
          }, 400);

        }


        if (comment.length > 1000) {

          return json({
            success: false,
            error: "Comment is too long."
          }, 400);

        }


        await env.DB
          .prepare(
            `
            INSERT INTO video_comments
            (
              video_id,
              user_id,
              comment
            )
            VALUES (?, ?, ?)
            `
          )
          .bind(
            videoId,
            userId,
            comment
          )
          .run();


        await env.DB
          .prepare(
            `
            UPDATE videos
            SET comments_count =
              comments_count + 1
            WHERE id = ?
            `
          )
          .bind(videoId)
          .run();


        return json({
          success: true,
          message: "Comment added."
        });

      }


      /* ===================================================
         VIDEO VIEW
      =================================================== */

      if (
        url.pathname === "/api/videos/view" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        const videoId =
          Number(body.video_id);

        const userId =
          Number(body.user_id);


        if (!videoId) {

          return json({
            success: false,
            error: "Video ID is required."
          }, 400);

        }


        await env.DB
          .prepare(
            `
            INSERT INTO video_views
            (
              video_id,
              user_id
            )
            VALUES (?, ?)
            `
          )
          .bind(
            videoId,
            userId || null
          )
          .run();


        await env.DB
          .prepare(
            `
            UPDATE videos
            SET views_count =
              views_count + 1
            WHERE id = ?
            `
          )
          .bind(videoId)
          .run();


        return json({
          success: true
        });

      }


      /* ===================================================
         FOLLOW USER
      =================================================== */

      if (
        url.pathname === "/api/follow" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        const followerId =
          Number(body.follower_id);

        const followingId =
          Number(body.following_id);


        if (
          !followerId ||
          !followingId
        ) {

          return json({
            success: false,
            error: "Follower and following user are required."
          }, 400);

        }


        if (
          followerId === followingId
        ) {

          return json({
            success: false,
            error: "You cannot follow yourself."
          }, 400);

        }


        const existing =
          await env.DB
            .prepare(
              `
              SELECT id
              FROM follows
              WHERE follower_id = ?
              AND following_id = ?
              LIMIT 1
              `
            )
            .bind(
              followerId,
              followingId
            )
            .first();


        if (existing) {

          await env.DB
            .prepare(
              `
              DELETE FROM follows
              WHERE follower_id = ?
              AND following_id = ?
              `
            )
            .bind(
              followerId,
              followingId
            )
            .run();


          await env.DB
            .prepare(
              `
              UPDATE users
              SET followers_count =
                CASE
                  WHEN followers_count > 0
                  THEN followers_count - 1
                  ELSE 0
                END
              WHERE id = ?
              `
            )
            .bind(followingId)
            .run();


          await env.DB
            .prepare(
              `
              UPDATE users
              SET following_count =
                CASE
                  WHEN following_count > 0
                  THEN following_count - 1
                  ELSE 0
                END
              WHERE id = ?
              `
            )
            .bind(followerId)
            .run();


          return json({
            success: true,
            following: false
          });

        }


        await env.DB
          .prepare(
            `
            INSERT INTO follows
            (
              follower_id,
              following_id
            )
            VALUES (?, ?)
            `
          )
          .bind(
            followerId,
            followingId
          )
          .run();


        await env.DB
          .prepare(
            `
            UPDATE users
            SET followers_count =
              followers_count + 1
            WHERE id = ?
            `
          )
          .bind(followingId)
          .run();


        await env.DB
          .prepare(
            `
            UPDATE users
            SET following_count =
              following_count + 1
            WHERE id = ?
            `
          )
          .bind(followerId)
          .run();


        return json({
          success: true,
          following: true
        });

      }


      /* ===================================================
         GET LIVE STREAMS
      =================================================== */

      if (
        url.pathname === "/api/live" &&
        request.method === "GET"
      ) {

        const result =
          await env.DB
            .prepare(
              `
              SELECT
                live_streams.id,
                live_streams.user_id,
                live_streams.title,
                live_streams.stream_url,
                live_streams.playback_url,
                live_streams.thumbnail_url,
                live_streams.viewers_count,
                live_streams.started_at,
                users.username
              FROM live_streams

              INNER JOIN users
                ON users.id = live_streams.user_id

              WHERE live_streams.status = 'live'

              ORDER BY live_streams.started_at DESC

              LIMIT 100
              `
            )
            .all();


        return json({
          success: true,
          live_streams:
            result.results || []
        });

      }


      /* ===================================================
         START LIVE
      =================================================== */

      if (
        url.pathname === "/api/live/start" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        const userId =
          Number(body.user_id);

        const title =
          String(
            body.title ||
            "Rahul Live"
          ).trim();


        if (!userId) {

          return json({
            success: false,
            error: "User ID is required."
          }, 400);

        }


        const active =
          await env.DB
            .prepare(
              `
              SELECT id
              FROM live_streams
              WHERE user_id = ?
              AND status = 'live'
              LIMIT 1
              `
            )
            .bind(userId)
            .first();


        if (active) {

          return json({
            success: false,
            error: "You already have an active LIVE."
          }, 409);

        }


        const result =
          await env.DB
            .prepare(
              `
              INSERT INTO live_streams
              (
                user_id,
                title,
                status
              )
              VALUES (?, ?, 'live')
              `
            )
            .bind(
              userId,
              title || "Rahul Live"
            )
            .run();


        return json({
          success: true,
          live_id:
            result.meta.last_row_id
        });

      }


      /* ===================================================
         END LIVE
      =================================================== */

      if (
        url.pathname === "/api/live/end" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();


        const liveId =
          Number(body.live_id);


        if (!liveId) {

          return json({
            success: false,
            error: "LIVE ID is required."
          }, 400);

        }


        await env.DB
          .prepare(
            `
            UPDATE live_streams

            SET
              status = 'ended',
              ended_at = CURRENT_TIMESTAMP

            WHERE id = ?
            `
          )
          .bind(liveId)
          .run();


        return json({
          success: true,
          message: "LIVE ended."
        });

      }


      /* ===================================================
         NOT FOUND
      =================================================== */

      return json({
        success: false,
        error: "API endpoint not found."
      }, 404);


    } catch (error) {

      return json({
        success: false,
        error:
          error?.message ||
          "Internal server error."
      }, 500);

    }

  }

};


/* =========================================================
   JSON RESPONSE
========================================================= */

function json(data, status = 200) {

  return new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",

        "Access-Control-Allow-Origin":
          "*",

        "Access-Control-Allow-Methods":
          "GET, POST, OPTIONS",

        "Access-Control-Allow-Headers":
          "Content-Type"
      }
    }
  );

}