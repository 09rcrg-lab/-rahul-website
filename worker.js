export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    /*
      =====================================================
      COMMON HELPERS
      =====================================================
    */
    const json = (data, status = 200) => {
      return new Response(
        JSON.stringify(data),
        {
          status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
          }
        }
      );
    };
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
        }
      });
    }
    /*
      =====================================================
      PASSWORD HASH
      =====================================================
    */
    async function hashPassword(password) {
      const data =
        new TextEncoder().encode(password);
      const hash =
        await crypto.subtle.digest(
          "SHA-256",
          data
        );
      return [...new Uint8Array(hash)]
        .map(byte =>
          byte.toString(16).padStart(2, "0")
        )
        .join("");
    }
    /*
      =====================================================
      TOKEN
      =====================================================
    */
    function createToken(user) {
      const payload = {
        id: user.id,
        username: user.username,
        role: user.role,
        time: Date.now()
      };
      return btoa(
        JSON.stringify(payload)
      );
    }
    function getToken(request) {
      const header =
        request.headers.get("Authorization");
      if (!header) return null;
      if (!header.startsWith("Bearer ")) {
        return null;
      }
      return header.substring(7);
    }
    function readToken(request) {
      try {
        const token =
          getToken(request);
        if (!token) return null;
        return JSON.parse(
          atob(token)
        );
      } catch {
        return null;
      }
    }
    async function getUser(request) {
      const tokenUser =
        readToken(request);
      if (!tokenUser) return null;
      return await env.DB.prepare(
        `
        SELECT id, username, email, role, is_blocked
        FROM users
        WHERE id = ?
        `
      )
      .bind(tokenUser.id)
      .first();
    }
    /*
      =====================================================
      HOME
      =====================================================
    */
    if (
      url.pathname === "/" &&
      method === "GET"
    ) {
      return json({
        success: true,
        message: "Rahul Live API Running 🚀"
      });
    }
    /*
      =====================================================
      TEST DATABASE
      =====================================================
    */
    if (
      url.pathname === "/api/test" &&
      method === "GET"
    ) {
      try {
        const result =
          await env.DB.prepare(
            `
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
            ORDER BY name
            `
          ).all();
        return json({
          success: true,
          tables: result.results
        });
      } catch (error) {
        return json({
          success: false,
          error: error.message
        }, 500);
      }
    }
    /*
      =====================================================
      REGISTER
      =====================================================
    */
    if (
      url.pathname === "/api/register" &&
      method === "POST"
    ) {
      try {
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
            error: "Username, email और password जरूरी हैं।"
          }, 400);
        }
        if (username.length < 3) {
          return json({
            success: false,
            error: "Username कम से कम 3 अक्षर का होना चाहिए।"
          }, 400);
        }
        if (password.length < 6) {
          return json({
            success: false,
            error: "Password कम से कम 6 अक्षर का होना चाहिए।"
          }, 400);
        }
        const existing =
          await env.DB.prepare(
            `
            SELECT id
            FROM users
            WHERE username = ?
               OR email = ?
            LIMIT 1
            `
          )
          .bind(username, email)
          .first();
        if (existing) {
          return json({
            success: false,
            error: "Username या email पहले से मौजूद है।"
          }, 409);
        }
        const passwordHash =
          await hashPassword(password);
        const result =
          await env.DB.prepare(
            `
            INSERT INTO users
            (
              username,
              email,
              password_hash,
              role
            )
            VALUES (?, ?, ?, 'viewer')
            `
          )
          .bind(
            username,
            email,
            passwordHash
          )
          .run();
        return json({
          success: true,
          message: "Registration सफल हुआ।",
          userId: result.meta.last_row_id
        });
      } catch (error) {
        return json({
          success: false,
          error: error.message
        }, 500);
      }
    }
    /*
      =====================================================
      LOGIN
      =====================================================
    */
    if (
      url.pathname === "/api/login" &&
      method === "POST"
    ) {
      try {
        const body =
          await request.json();
        const username =
          String(body.username || "").trim();
        const password =
          String(body.password || "");
        if (!username || !password) {
          return json({
            success: false,
            error: "Username और password जरूरी हैं।"
          }, 400);
        }
        const passwordHash =
          await hashPassword(password);
        const user =
          await env.DB.prepare(
            `
            SELECT
              id,
              username,
              email,
              password_hash,
              role,
              is_blocked
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
            error: "Username या password गलत है।"
          }, 401);
        }
        if (
          user.password_hash !== passwordHash
        ) {
          return json({
            success: false,
            error: "Username या password गलत है।"
          }, 401);
        }
        if (user.is_blocked) {
          return json({
            success: false,
            error: "यह account blocked है।"
          }, 403);
        }
        const token =
          createToken(user);
        return json({
          success: true,
          message: "Login successful.",
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        });
      } catch (error) {
        return json({
          success: false,
          error: error.message
        }, 500);
      }
    }
    /*
      =====================================================
      CURRENT USER
      =====================================================
    */
    if (
      url.pathname === "/api/me" &&
      method === "GET"
    ) {
      const user =
        await getUser(request);
      if (!user) {
        return json({
          success: false,
          error: "Unauthorized"
        }, 401);
      }
      return json({
        success: true,
        user
      });
    }
    /*
      =====================================================
      CREATE LIVE ROOM
      =====================================================
    */
    if (
      url.pathname === "/api/live/start" &&
      method === "POST"
    ) {
      try {
        const user =
          await getUser(request);
        if (!user) {
          return json({
            success: false,
            error: "Login required."
          }, 401);
        }
        if (user.is_blocked) {
          return json({
            success: false,
            error: "Account blocked."
          }, 403);
        }
        const body =
          await request.json().catch(
            () => ({})
          );
        const title =
          String(
            body.title ||
            "Chat LIVE Room"
          ).trim();
        /*
          User को host role दे रहे हैं।
        */
        await env.DB.prepare(
          `
          UPDATE users
          SET role = 'host'
          WHERE id = ?
          `
        )
        .bind(user.id)
        .run();
        const result =
          await env.DB.prepare(
            `
            INSERT INTO live_rooms
            (
              host_id,
              title,
              status
            )
            VALUES (?, ?, 'live')
            `
          )
          .bind(
            user.id,
            title
          )
          .run();
        const roomId =
          result.meta.last_row_id;
        await env.DB.prepare(
          `
          INSERT INTO live_room_settings
          (
            live_room_id
          )
          VALUES (?)
          `
        )
        .bind(roomId)
        .run();
        return json({
          success: true,
          roomId,
          title
        });
      } catch (error) {
        return json({
          success: false,
          error: error.message
        }, 500);
      }
    }
    /*
      =====================================================
      ACTIVE LIVE ROOMS
      =====================================================
    */
    if (
      url.pathname === "/api/live/rooms" &&
      method === "GET"
    ) {
      try {
        const rooms =
          await env.DB.prepare(
            `
            SELECT
              lr.id,
              lr.title,
              lr.host_id,
              lr.started_at,
              u.username AS host_name,
              COUNT(lv.id) AS viewer_count
            FROM live_rooms lr
            JOIN users u
              ON u.id = lr.host_id
            LEFT JOIN live_viewers lv
              ON lv.live_room_id = lr.id
             AND lv.left_at IS NULL
            WHERE lr.status = 'live'
            GROUP BY
              lr.id,
              lr.title,
              lr.host_id,
              lr.started_at,
              u.username
            ORDER BY lr.started_at DESC
            `
          )
          .all();
        return json({
          success: true,
          rooms: rooms.results
        });
      } catch (error) {
        return json({
          success: false,
          error: error.message
        }, 500);
      }
    }
    /*
      =====================================================
      JOIN LIVE
      =====================================================
    */
    if (
      url.pathname === "/api/live/join" &&
      method === "POST"
    ) {
      try {
        const user =
          await getUser(request);
        if (!user) {
          return json({
            success: false,
            error: "Login required."
          }, 401);
        }
        const body =
          await request.json();
        const roomId =
          Number(body.roomId);
        if (!roomId) {
          return json({
            success: false,
            error: "roomId जरूरी है।"
          }, 400);
        }
        const room =
          await env.DB.prepare(
            `
            SELECT
              id,
              host_id,
              status
            FROM live_rooms
            WHERE id = ?
            LIMIT 1
            `
          )
          .bind(roomId)
          .first();
        if (!room || room.status !== "live") {
          return json({
            success: false,
            error: "LIVE room उपलब्ध नहीं है।"
          }, 404);
        }
        const blocked =
          await env.DB.prepare(
            `
            SELECT id
            FROM live_moderation
            WHERE live_room_id = ?
              AND target_user_id = ?
              AND action = 'block'
            ORDER BY id DESC
            LIMIT 1
            `
          )
          .bind(
            roomId,
            user.id
          )
          .first();
        if (blocked) {
          return json({
            success: false,
            error: "आप इस LIVE में blocked हैं।"
          }, 403);
        }
        await env.DB.prepare(
          `
          INSERT INTO live_viewers
          (
            live_room_id,
            user_id
          )
          VALUES (?, ?)
          ON CONFLICT(
            live_room_id,
            user_id
          )
          DO UPDATE SET
            joined_at = CURRENT_TIMESTAMP,
            left_at = NULL
          `
        )
        .bind(
          roomId,
          user.id
        )
        .run();
        return json({
          success: true,
          message: "LIVE joined."
        });
      } catch (error) {
        return json({
          success: false,
          error: error.message
        }, 500);
      }
    }
    /*
      =====================================================
      LEAVE LIVE
      =====================================================
    */
    if (
      url.pathname === "/api/live/leave" &&
      method === "POST"
    ) {
      try {
        const user =
          await getUser(request);
        if (!user) {
          return json({
            success: false,
            error: "Login required."
          }, 401);
        }
        const body =
          await request.json();
        const roomId =
          Number(body.roomId);
        await env.DB.prepare(
          `
          UPDATE live_viewers
          SET left_at = CURRENT_TIMESTAMP
          WHERE live_room_id = ?
            AND user_id = ?
            AND left_at IS NULL
          `
        )
        .bind(
          roomId,
          user.id
        )
        .run();
        return json({
          success: true,
          message: "LIVE left."
        });
      } catch (error) {
        return json({
          success: false,
          error: error.message
        }, 500);
      }
    }
    /*
      =====================================================
      VIEWERS
      =====================================================
    */
    if (
      url.pathname === "/api/live/viewers" &&
      method === "GET"
    ) {
      try {
        const user =
          await getUser(request);
        if (!user) {
          return json({
            success: false,
            error: "Login required."
          }, 401);
        }
        const roomId =
          Number(
            url.searchParams.get("roomId")
          );
        if (!roomId) {
          return json({
            success: false,
            error: "roomId जरूरी है।"
          }, 400);
        }
        const viewers =
          await env.DB.prepare(
            `
            SELECT
              u.id,
              u.username,
              lv.joined_at
            FROM live_viewers lv
            JOIN users u
              ON u.id = lv.user_id
            WHERE lv.live_room_id = ?
              AND lv.left_at IS NULL
            ORDER BY lv.joined_at ASC
            `
          )
          .bind(roomId)
          .all();
        return json({
          success: true,
          count: viewers.results.length,
          viewers: viewers.results
        });
      } catch (error) {
        return json({
          success: false,
          error: error.message
        }, 500);
      }
    }
    /*
      =====================================================
      SEND CHAT MESSAGE
      =====================================================
    */
    if (
      url.pathname === "/api/live/message" &&
      method === "POST"
    ) {
      try {
        const user =
          await getUser(request);
        if (!user) {
          return json({
            success: false,
            error: "Login required."
          }, 401);
        }
        const body =
          await request.json();
        const roomId =
          Number(body.roomId);
        const message =
          String(
            body.message || ""
          ).trim();
        const messageType =
          String(
            body.messageType || "text"
          );
        if (!roomId || !message) {
          return json({
            success: false,
            error: "Room और message जरूरी हैं।"
          }, 400);
        }
        if (message.length > 500) {
          return json({
            success: false,
            error: "Message बहुत लंबा है।"
          }, 400);
        }
        const allowedTypes = [
          "text",
          "emoji",
          "reaction",
          "system"
        ];
        const safeType =
          allowedTypes.includes(
            messageType
          )
            ? messageType
            : "text";
        const room =
          await env.DB.prepare(
            `
            SELECT id, status
            FROM live_rooms
            WHERE id = ?
            LIMIT 1
            `
          )
          .bind(roomId)
          .first();
        if (!room || room.status !== "live") {
          return json({
            success: false,
            error: "LIVE समाप्त हो चुका है।"
          }, 404);
        }
        const muted =
          await env.DB.prepare(
            `
            SELECT id
            FROM live_moderation
            WHERE live_room_id = ?
              AND target_user_id = ?
              AND action = 'mute'
            ORDER BY id DESC
            LIMIT 1
            `
          )
          .bind(
            roomId,
            user.id
          )
          .first();
        if (muted) {
          return json({
            success: false,
            error: "आपको Host ने mute किया है।"
          }, 403);
        }
        const blocked =
          await env.DB.prepare(
            `
            SELECT id
            FROM live_moderation
            WHERE live_room_id = ?
              AND target_user_id = ?
              AND action = 'block'
            ORDER BY id DESC
            LIMIT 1
            `
          )
          .bind(
            roomId,
            user.id
          )
          .first();
        if (blocked) {
          return json({
            success: false,
            error: "आप blocked हैं।"
          }, 403);
        }
        const result =
          await env.DB.prepare(
            `
            INSERT INTO live_messages
            (
              live_room_id,
              user_id,
              message,
              message_type
            )
            VALUES (?, ?, ?, ?)
            `
          )
          .bind(
            roomId,
            user.id,
            message,
            safeType
          )
          .run();
        return json({
          success: true,
          messageId: result.meta.last_row_id
        });
      } catch (error) {
        return json({
          success: false,
          error: error.message
        }, 500);
      }
    }
    /*
      =====================================================
      GET CHAT MESSAGES
      =====================================================
    */
    if (
      url.pathname === "/api/live/messages" &&
      method === "GET"
    ) {
      try {
        const user =
          await getUser(request);
        if (!user) {
          return json({
            success: false,
            error: "Login required."
          }, 401);
        }
        const roomId =
          Number(
            url.searchParams.get("roomId")
          );
        const limitParam =
          Number(
            url.searchParams.get("limit") || 100
          );
        const limit =
          Math.min(
            Math.max(limitParam, 1),
            200
          );
        const messages =
          await env.DB.prepare(
            `
            SELECT
              lm.id,
              lm.message,
              lm.message_type,
              lm.created_at,
              u.id AS user_id,
              u.username
            FROM live_messages lm
            JOIN users u
              ON u.id = lm.user_id
            WHERE lm.live_room_id = ?
            ORDER BY lm.id DESC
            LIMIT ?
            `
          )
          .bind(
            roomId,
            limit
          )
          .all();
        return json({
          success: true,
          messages:
            messages.results.reverse()
        });
      } catch (error) {
        return json({
          success: false,
          error: error.message
        }, 500);
      }
    }
    /*
      =====================================================
      HOST CHECK
      =====================================================
    */
    async function getHostRoom(
      request,
      roomId
    ) {
      const user =
        await getUser(request);
      if (!user) {
        return {
          error: "Login required.",
          status: 401
        };
      }
      const room =
        await env.DB.prepare(
          `
          SELECT
            id,
            host_id,
            status
          FROM live_rooms
          WHERE id = ?
          LIMIT 1
          `
        )
        .bind(roomId)
        .first();
      if (!room) {
        return {
          error: "LIVE room नहीं मिला।",
          status: 404
        };
      }
      if (room.host_id !== user.id) {
        return {
          error: "सिर्फ Host यह action कर सकता है।",
          status: 403
        };
      }
      return {
        user,
        room
      };
    }
    /*
      =====================================================
      MUTE / UNMUTE
      =====================================================
    */
    if (
      url.pathname === "/api/live/moderate" &&
      method === "POST"
    ) {
      try {
        const body =
          await request.json();
        const roomId =
          Number(body.roomId);
        const targetUserId =
          Number(body.targetUserId);
        const action =
          String(body.action || "");
        if (
          !roomId ||
          !targetUserId ||
          ![
            "mute",
            "unmute",
            "kick",
            "block",
            "unblock"
          ].includes(action)
        ) {
          return json({
            success: false,
            error: "Invalid moderation request."
          }, 400);
        }
        const host =
          await getHostRoom(
            request,
            roomId
          );
        if (host.error) {
          return json({
            success: false,
            error: host.error
          }, host.status);
        }
        if (
          targetUserId ===
          host.user.id
        ) {
          return json({
            success: false,
            error: "Host खुद पर यह action नहीं कर सकता।"
          }, 400);
        }
        await env.DB.prepare(
          `
          INSERT INTO live_moderation
          (
            live_room_id,
            host_id,
            target_user_id,
            action
          )
          VALUES (?, ?, ?, ?)
          `
        )
        .bind(
          roomId,
          host.user.id,
          targetUserId,
          action
        )
        .run();
        /*
          Kick होने पर viewer की active
          session समाप्त कर रहे हैं।
        */
        if (action === "kick") {
          await env.DB.prepare(
            `
            UPDATE live_viewers
            SET left_at = CURRENT_TIMESTAMP
            WHERE live_room_id = ?
              AND user_id = ?
              AND left_at IS NULL
            `
          )
          .bind(
            roomId,
            targetUserId
          )
          .run();
        }
        /*
          Block होने पर viewer को भी बाहर करें।
        */
        if (action === "block") {
          await env.DB.prepare(
            `
            UPDATE live_viewers
            SET left_at = CURRENT_TIMESTAMP
            WHERE live_room_id = ?
              AND user_id = ?
              AND left_at IS NULL
            `
          )
          .bind(
            roomId,
            targetUserId
          )
          .run();
        }
        return json({
          success: true,
          message: `${action} successful.`
        });
      } catch (error) {
        return json({
          success: false,
          error: error.message
        }, 500);
      }
    }
    /*
      =====================================================
      END LIVE
      =====================================================
    */
    if (
      url.pathname === "/api/live/end" &&
      method === "POST"
    ) {
      try {
        const body =
          await request.json();
        const roomId =
          Number(body.roomId);
        const host =
          await getHostRoom(
            request,
            roomId
          );
        if (host.error) {
          return json({
            success: false,
            error: host.error
          }, host.status);
        }
        await env.DB.prepare(
          `
          UPDATE live_rooms
          SET
            status = 'ended',
            ended_at = CURRENT_TIMESTAMP
          WHERE id = ?
          `
        )
        .bind(roomId)
        .run();
        await env.DB.prepare(
          `
          UPDATE live_viewers
          SET left_at = CURRENT_TIMESTAMP
          WHERE live_room_id = ?
            AND left_at IS NULL
          `
        )
        .bind(roomId)
        .run();
        return json({
          success: true,
          message: "LIVE समाप्त हो गया।"
        });
      } catch (error) {
        return json({
          success: false,
          error: error.message
        }, 500);
      }
    }
    /*
      =====================================================
      UNKNOWN ROUTE
      =====================================================
    */
    return json({
      success: false,
      error: "API route not found."
    }, 404);
  }
};