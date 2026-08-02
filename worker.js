export default {

  async fetch(request, env) {

    const url = new URL(request.url);

    /* ================= CORS ================= */

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    function json(data, status = 200) {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...corsHeaders
        }
      });
    }

    async function body() {
      try {
        return await request.json();
      } catch {
        return {};
      }
    }

    function now() {
      return new Date().toISOString();
    }

    function userLetter(username) {
      return (username || "U").charAt(0).toUpperCase();
    }


    /* ================= HOME ================= */

    if (url.pathname === "/" && request.method === "GET") {

      return json({
        success: true,
        message: "Rahul Live API Running 🚀"
      });

    }


    /* ================= DATABASE TEST ================= */

    if (url.pathname === "/api/test") {

      try {

        const result = await env.DB
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

      } catch (error) {

        return json({
          success: false,
          message: error.message
        }, 500);

      }

    }


    /* =====================================================
       REGISTER
       ===================================================== */

    if (
      url.pathname === "/api/register" &&
      request.method === "POST"
    ) {

      try {

        const {
          username,
          email,
          password
        } = await body();

        if (!username || !email || !password) {
          return json({
            success: false,
            message: "Username, email और password जरूरी हैं"
          }, 400);
        }

        const cleanUsername =
          String(username).trim();

        const cleanEmail =
          String(email).trim().toLowerCase();

        const cleanPassword =
          String(password);

        const existing =
          await env.DB
            .prepare(`
              SELECT id, username, email
              FROM users
              WHERE username = ? OR email = ?
              LIMIT 1
            `)
            .bind(cleanUsername, cleanEmail)
            .first();

        if (existing) {

          return json({
            success: false,
            message: "Username या email पहले से मौजूद है"
          }, 409);

        }

        await env.DB
          .prepare(`
            INSERT INTO users
            (username, email, password)
            VALUES (?, ?, ?)
          `)
          .bind(
            cleanUsername,
            cleanEmail,
            cleanPassword
          )
          .run();

        const user =
          await env.DB
            .prepare(`
              SELECT id, username, email
              FROM users
              WHERE username = ?
              LIMIT 1
            `)
            .bind(cleanUsername)
            .first();

        return json({
          success: true,
          message: "Registration successful",
          user
        });

      } catch (error) {

        return json({
          success: false,
          message: error.message
        }, 500);

      }

    }


    /* =====================================================
       LOGIN
       ===================================================== */

    if (
      url.pathname === "/api/login" &&
      request.method === "POST"
    ) {

      try {

        const {
          username,
          password
        } = await body();

        if (!username || !password) {

          return json({
            success: false,
            message: "Username और password जरूरी हैं"
          }, 400);

        }

        const user =
          await env.DB
            .prepare(`
              SELECT id, username, email, password, role
              FROM users
              WHERE username = ?
              LIMIT 1
            `)
            .bind(String(username).trim())
            .first();

        if (!user) {

          return json({
            success: false,
            message: "Username या password गलत है"
          }, 401);

        }

        if (String(user.password) !== String(password)) {

          return json({
            success: false,
            message: "Username या password गलत है"
          }, 401);

        }

        return json({
          success: true,
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role || "user"
          }
        });

      } catch (error) {

        return json({
          success: false,
          message: error.message
        }, 500);

      }

    }


    /* =====================================================
       LIVE ROOMS
       ===================================================== */

    if (
      url.pathname === "/api/live/rooms" &&
      request.method === "GET"
    ) {

      try {

        const result =
          await env.DB
            .prepare(`
              SELECT
                lr.id,
                lr.host_id,
                lr.title,
                lr.status,
                lr.created_at,
                u.username AS host_username,
                (
                  SELECT COUNT(*)
                  FROM live_viewers lv
                  WHERE lv.live_room_id = lr.id
                ) AS viewer_count
              FROM live_rooms lr
              LEFT JOIN users u
                ON u.id = lr.host_id
              WHERE lr.status = 'live'
              ORDER BY lr.id DESC
            `)
            .all();

        return json({
          success: true,
          rooms: result.results || []
        });

      } catch (error) {

        return json({
          success: false,
          message: error.message
        }, 500);

      }

    }


    /* =====================================================
       CREATE LIVE
       ===================================================== */

    if (
      url.pathname === "/api/live/create" &&
      request.method === "POST"
    ) {

      try {

        const {
          host_id,
          title
        } = await body();

        if (!host_id) {

          return json({
            success: false,
            message: "Host ID जरूरी है"
          }, 400);

        }

        const existing =
          await env.DB
            .prepare(`
              SELECT id
              FROM live_rooms
              WHERE host_id = ?
              AND status = 'live'
              LIMIT 1
            `)
            .bind(host_id)
            .first();

        if (existing) {

          return json({
            success: true,
            message: "आपका LIVE पहले से चालू है",
            room: existing
          });

        }

        const result =
          await env.DB
            .prepare(`
              INSERT INTO live_rooms
              (host_id, title, status, created_at)
              VALUES (?, ?, 'live', ?)
            `)
            .bind(
              host_id,
              title || "Chat LIVE",
              now()
            )
            .run();

        const room =
          await env.DB
            .prepare(`
              SELECT
                lr.id,
                lr.host_id,
                lr.title,
                lr.status,
                lr.created_at,
                u.username AS host_username
              FROM live_rooms lr
              LEFT JOIN users u
                ON u.id = lr.host_id
              WHERE lr.id = ?
            `)
            .bind(result.meta.last_row_id)
            .first();

        return json({
          success: true,
          message: "LIVE started",
          room
        });

      } catch (error) {

        return json({
          success: false,
          message: error.message
        }, 500);

      }

    }


    /* =====================================================
       ROOM DETAILS
       ===================================================== */

    if (
      url.pathname.startsWith("/api/live/room/") &&
      request.method === "GET"
    ) {

      try {

        const roomId =
          url.pathname.split("/").pop();

        const room =
          await env.DB
            .prepare(`
              SELECT
                lr.id,
                lr.host_id,
                lr.title,
                lr.status,
                lr.created_at,
                u.username AS host_username
              FROM live_rooms lr
              LEFT JOIN users u
                ON u.id = lr.host_id
              WHERE lr.id = ?
              LIMIT 1
            `)
            .bind(roomId)
            .first();

        if (!room) {

          return json({
            success: false,
            message: "LIVE room नहीं मिला"
          }, 404);

        }

        const count =
          await env.DB
            .prepare(`
              SELECT COUNT(*) AS count
              FROM live_viewers
              WHERE live_room_id = ?
            `)
            .bind(roomId)
            .first();

        room.viewer_count =
          Number(count?.count || 0);

        return json({
          success: true,
          room
        });

      } catch (error) {

        return json({
          success: false,
          message: error.message
        }, 500);

      }

    }


    /* =====================================================
       JOIN LIVE
       ===================================================== */

    if (
      url.pathname === "/api/live/join" &&
      request.method === "POST"
    ) {

      try {

        const {
          live_room_id,
          user_id
        } = await body();

        if (!live_room_id || !user_id) {

          return json({
            success: false,
            message: "Room और user जरूरी हैं"
          }, 400);

        }

        const room =
          await env.DB
            .prepare(`
              SELECT id, status
              FROM live_rooms
              WHERE id = ?
              LIMIT 1
            `)
            .bind(live_room_id)
            .first();

        if (!room || room.status !== "live") {

          return json({
            success: false,
            message: "यह LIVE अब चालू नहीं है"
          }, 404);

        }

        const already =
          await env.DB
            .prepare(`
              SELECT id
              FROM live_viewers
              WHERE live_room_id = ?
              AND user_id = ?
              LIMIT 1
            `)
            .bind(
              live_room_id,
              user_id
            )
            .first();

        if (!already) {

          await env.DB
            .prepare(`
              INSERT INTO live_viewers
              (live_room_id, user_id, joined_at)
              VALUES (?, ?, ?)
            `)
            .bind(
              live_room_id,
              user_id,
              now()
            )
            .run();

        }

        return json({
          success: true,
          message: "LIVE joined"
        });

      } catch (error) {

        return json({
          success: false,
          message: error.message
        }, 500);

      }

    }


    /* =====================================================
       LEAVE LIVE
       ===================================================== */

    if (
      url.pathname === "/api/live/leave" &&
      request.method === "POST"
    ) {

      try {

        const {
          live_room_id,
          user_id
        } = await body();

        await env.DB
          .prepare(`
            DELETE FROM live_viewers
            WHERE live_room_id = ?
            AND user_id = ?
          `)
          .bind(
            live_room_id,
            user_id
          )
          .run();

        return json({
          success: true,
          message: "LIVE left"
        });

      } catch (error) {

        return json({
          success: false,
          message: error.message
        }, 500);

      }

    }


    /* =====================================================
       VIEWERS
       ===================================================== */

    if (
      url.pathname.startsWith("/api/live/viewers/") &&
      request.method === "GET"
    ) {

      try {

        const roomId =
          url.pathname.split("/").pop();

        const result =
          await env.DB
            .prepare(`
              SELECT
                lv.id,
                lv.user_id,
                lv.joined_at,
                u.username
              FROM live_viewers lv
              LEFT JOIN users u
                ON u.id = lv.user_id
              WHERE lv.live_room_id = ?
              ORDER BY lv.joined_at ASC
            `)
            .bind(roomId)
            .all();

        return json({
          success: true,
          viewers: result.results || []
        });

      } catch (error) {

        return json({
          success: false,
          message: error.message
        }, 500);

      }

    }


    /* =====================================================
       SEND CHAT MESSAGE
       ===================================================== */

    if (
      url.pathname === "/api/live/message" &&
      request.method === "POST"
    ) {

      try {

        const {
          live_room_id,
          user_id,
          message
        } = await body();

        if (
          !live_room_id ||
          !user_id ||
          !message
        ) {

          return json({
            success: false,
            message: "Message खाली नहीं हो सकता"
          }, 400);

        }

        const cleanMessage =
          String(message)
            .trim()
            .slice(0, 500);

        await env.DB
          .prepare(`
            INSERT INTO live_messages
            (live_room_id, user_id, message, created_at)
            VALUES (?, ?, ?, ?)
          `)
          .bind(
            live_room_id,
            user_id,
            cleanMessage,
            now()
          )
          .run();

        return json({
          success: true,
          message: "Message sent"
        });

      } catch (error) {

        return json({
          success: false,
          message: error.message
        }, 500);

      }

    }


    /* =====================================================
       GET CHAT
       ===================================================== */

    if (
      url.pathname.startsWith("/api/live/messages/") &&
      request.method === "GET"
    ) {

      try {

        const roomId =
          url.pathname.split("/").pop();

        const result =
          await env.DB
            .prepare(`
              SELECT
                lm.id,
                lm.live_room_id,
                lm.user_id,
                lm.message,
                lm.created_at,
                u.username
              FROM live_messages lm
              LEFT JOIN users u
                ON u.id = lm.user_id
              WHERE lm.live_room_id = ?
              ORDER BY lm.id ASC
              LIMIT 200
            `)
            .bind(roomId)
            .all();

        return json({
          success: true,
          messages: result.results || []
        });

      } catch (error) {

        return json({
          success: false,
          message: error.message
        }, 500);

      }

    }


    /* =====================================================
       REACTION
       ===================================================== */

    if (
      url.pathname === "/api/live/reaction" &&
      request.method === "POST"
    ) {

      try {

        const {
          live_room_id,
          user_id,
          reaction
        } = await body();

        /*
          Reaction को chat message की तरह save करते हैं,
          ताकि reaction भी LIVE activity में रहे।
        */

        if (
          live_room_id &&
          user_id &&
          reaction
        ) {

          await env.DB
            .prepare(`
              INSERT INTO live_messages
              (live_room_id, user_id, message, created_at)
              VALUES (?, ?, ?, ?)
            `)
            .bind(
              live_room_id,
              user_id,
              reaction,
              now()
            )
            .run();

        }

        return json({
          success: true,
          message: "Reaction sent"
        });

      } catch (error) {

        return json({
          success: false,
          message: error.message
        }, 500);

      }

    }


    /* =====================================================
       MODERATION
       ===================================================== */

    if (
      url.pathname === "/api/live/moderate" &&
      request.method === "POST"
    ) {

      try {

        const {
          live_room_id,
          host_id,
          target_user_id,
          action
        } = await body();

        if (
          !live_room_id ||
          !host_id ||
          !target_user_id ||
          !action
        ) {

          return json({
            success: false,
            message: "Moderation details missing"
          }, 400);

        }

        const room =
          await env.DB
            .prepare(`
              SELECT id, host_id
              FROM live_rooms
              WHERE id = ?
              LIMIT 1
            `)
            .bind(live_room_id)
            .first();

        if (
          !room ||
          String(room.host_id) !== String(host_id)
        ) {

          return json({
            success: false,
            message: "केवल Host यह action कर सकता है"
          }, 403);

        }

        await env.DB
          .prepare(`
            INSERT INTO live_moderation
            (live_room_id, moderator_id, target_user_id, action, created_at)
            VALUES (?, ?, ?, ?, ?)
          `)
          .bind(
            live_room_id,
            host_id,
            target_user_id,
            action,
            now()
          )
          .run();

        if (
          action === "kick" ||
          action === "block"
        ) {

          await env.DB
            .prepare(`
              DELETE FROM live_viewers
              WHERE live_room_id = ?
              AND user_id = ?
            `)
            .bind(
              live_room_id,
              target_user_id
            )
            .run();

        }

        return json({
          success: true,
          message:
            action === "mute"
              ? "Viewer muted"
              : action === "kick"
              ? "Viewer kicked"
              : "Viewer blocked"
        });

      } catch (error) {

        return json({
          success: false,
          message: error.message
        }, 500);

      }

    }


    /* =====================================================
       END LIVE
       ===================================================== */

    if (
      url.pathname === "/api/live/end" &&
      request.method === "POST"
    ) {

      try {

        const {
          live_room_id,
          host_id
        } = await body();

        const room =
          await env.DB
            .prepare(`
              SELECT id, host_id
              FROM live_rooms
              WHERE id = ?
              LIMIT 1
            `)
            .bind(live_room_id)
            .first();

        if (!room) {

          return json({
            success: false,
            message: "LIVE room नहीं मिला"
          }, 404);

        }

        if (
          String(room.host_id) !==
          String(host_id)
        ) {

          return json({
            success: false,
            message: "केवल Host LIVE end कर सकता है"
          }, 403);

        }

        await env.DB
          .prepare(`
            UPDATE live_rooms
            SET status = 'ended'
            WHERE id = ?
          `)
          .bind(live_room_id)
          .run();

        await env.DB
          .prepare(`
            DELETE FROM live_viewers
            WHERE live_room_id = ?
          `)
          .bind(live_room_id)
          .run();

        return json({
          success: true,
          message: "LIVE ended"
        });

      } catch (error) {

        return json({
          success: false,
          message: error.message
        }, 500);

      }

    }


    /* ================= 404 ================= */

    return json({
      success: false,
      message: "API endpoint नहीं मिला"
    }, 404);

  }
};