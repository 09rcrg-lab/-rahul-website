export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      /* =====================================================
         RESPONSE HELPERS
         ===================================================== */
      function json(data, status = 200) {
        return new Response(
          JSON.stringify(data),
          {
            status,
            headers: {
              "Content-Type": "application/json; charset=UTF-8",
              ...corsHeaders
            }
          }
        );
      }
      function error(message, status = 400) {
        return json({
          success: false,
          message
        }, status);
      }
      async function body() {
        try {
          return await request.json();
        } catch {
          return {};
        }
      }
      /* =====================================================
         PASSWORD HASH
         ===================================================== */
      const encoder =
        new TextEncoder();
      function bytesToHex(bytes) {
        return [...new Uint8Array(bytes)]
          .map(
            b => b.toString(16).padStart(2, "0")
          )
          .join("");
      }
      async function hashPassword(password) {
        const salt =
          crypto.randomUUID();
        const key =
          await crypto.subtle.importKey(
            "raw",
            encoder.encode(password),
            "PBKDF2",
            false,
            ["deriveBits"]
          );
        const bits =
          await crypto.subtle.deriveBits(
            {
              name: "PBKDF2",
              salt: encoder.encode(salt),
              iterations: 100000,
              hash: "SHA-256"
            },
            key,
            256
          );
        return `${salt}:${bytesToHex(bits)}`;
      }
      async function verifyPassword(
        password,
        stored
      ) {
        if (!stored || !stored.includes(":")) {
          return false;
        }
        const [
          salt,
          originalHash
        ] = stored.split(":");
        const key =
          await crypto.subtle.importKey(
            "raw",
            encoder.encode(password),
            "PBKDF2",
            false,
            ["deriveBits"]
          );
        const bits =
          await crypto.subtle.deriveBits(
            {
              name: "PBKDF2",
              salt: encoder.encode(salt),
              iterations: 100000,
              hash: "SHA-256"
            },
            key,
            256
          );
        return (
          bytesToHex(bits) ===
          originalHash
        );
      }
      /* =====================================================
         SESSION TOKEN
         ===================================================== */
      async function createToken() {
        const bytes =
          crypto.getRandomValues(
            new Uint8Array(32)
          );
        return bytesToHex(bytes);
      }
      async function hashToken(token) {
        const digest =
          await crypto.subtle.digest(
            "SHA-256",
            encoder.encode(token)
          );
        return bytesToHex(digest);
      }
      /* =====================================================
         AUTHENTICATED USER
         ===================================================== */
      async function getUser() {
        const authorization =
          request.headers.get(
            "Authorization"
          );
        if (!authorization) {
          return null;
        }
        if (
          !authorization
            .toLowerCase()
            .startsWith("bearer ")
        ) {
          return null;
        }
        const token =
          authorization
            .slice(7)
            .trim();
        if (!token) {
          return null;
        }
        const tokenHash =
          await hashToken(token);
        const result =
          await env.DB
            .prepare(`
              SELECT
                u.id,
                u.name,
                u.email,
                u.username,
                u.avatar_url,
                u.bio,
                u.coins,
                u.is_online
              FROM sessions s
              INNER JOIN users u
                ON u.id = s.user_id
              WHERE s.token_hash = ?
                AND s.expires_at > CURRENT_TIMESTAMP
              LIMIT 1
            `)
            .bind(tokenHash)
            .first();
        return result || null;
      }
      /* =====================================================
         HOME
         ===================================================== */
      if (path === "/" && request.method === "GET") {
        return json({
          success: true,
          service: "Rahul Live API",
          status: "running"
        });
      }
      /* =====================================================
         API TEST
         ===================================================== */
      if (
        path === "/api/test" &&
        request.method === "GET"
      ) {
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
          database: "connected",
          tables: result.results || []
        });
      }
      /* =====================================================
         REGISTER
         ===================================================== */
      if (
        path === "/api/register" &&
        request.method === "POST"
      ) {
        const data =
          await body();
        const name =
          String(data.name || "").trim();
        const email =
          String(data.email || "")
            .trim()
            .toLowerCase();
        const password =
          String(data.password || "");
        if (!name) {
          return error(
            "Name जरूरी है।"
          );
        }
        if (!email) {
          return error(
            "Email जरूरी है।"
          );
        }
        if (
          password.length < 6
        ) {
          return error(
            "Password कम से कम 6 characters का होना चाहिए।"
          );
        }
        const existing =
          await env.DB
            .prepare(`
              SELECT id
              FROM users
              WHERE email = ?
              LIMIT 1
            `)
            .bind(email)
            .first();
        if (existing) {
          return error(
            "यह email पहले से registered है।",
            409
          );
        }
        const passwordHash =
          await hashPassword(password);
        const usernameBase =
          email
            .split("@")[0]
            .replace(
              /[^a-zA-Z0-9_]/g,
              ""
            )
            .slice(0, 25) ||
          `user${Date.now()}`;
        let username =
          usernameBase;
        let counter = 1;
        while (true) {
          const check =
            await env.DB
              .prepare(`
                SELECT id
                FROM users
                WHERE username = ?
                LIMIT 1
              `)
              .bind(username)
              .first();
          if (!check) {
            break;
          }
          username =
            `${usernameBase}${counter}`;
          counter++;
        }
        const result =
          await env.DB
            .prepare(`
              INSERT INTO users
              (
                name,
                email,
                password_hash,
                username,
                coins,
                is_online
              )
              VALUES (?, ?, ?, ?, 0, 0)
            `)
            .bind(
              name,
              email,
              passwordHash,
              username
            )
            .run();
        if (!result.success) {
          return error(
            "Account create नहीं हुआ।",
            500
          );
        }
        return json({
          success: true,
          message: "Registration successful."
        }, 201);
      }
      /* =====================================================
         LOGIN
         ===================================================== */
      if (
        path === "/api/login" &&
        request.method === "POST"
      ) {
        const data =
          await body();
        const email =
          String(data.email || "")
            .trim()
            .toLowerCase();
        const password =
          String(data.password || "");
        if (!email || !password) {
          return error(
            "Email और password दोनों जरूरी हैं।"
          );
        }
        const user =
          await env.DB
            .prepare(`
              SELECT *
              FROM users
              WHERE email = ?
              LIMIT 1
            `)
            .bind(email)
            .first();
        if (!user) {
          return error(
            "Email या password गलत है।",
            401
          );
        }
        const valid =
          await verifyPassword(
            password,
            user.password_hash
          );
        if (!valid) {
          return error(
            "Email या password गलत है।",
            401
          );
        }
        const token =
          await createToken();
        const tokenHash =
          await hashToken(token);
        await env.DB
          .prepare(`
            INSERT INTO sessions
            (
              user_id,
              token_hash,
              expires_at
            )
            VALUES (
              ?,
              ?,
              datetime('now', '+30 days')
            )
          `)
          .bind(
            user.id,
            tokenHash
          )
          .run();
        await env.DB
          .prepare(`
            UPDATE users
            SET
              is_online = 1,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `)
          .bind(user.id)
          .run();
        return json({
          success: true,
          message: "Login successful.",
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            avatar_url: user.avatar_url,
            bio: user.bio,
            coins: user.coins,
            is_online: 1
          }
        });
      }
      /* =====================================================
         CURRENT USER
         ===================================================== */
      if (
        path === "/api/me" &&
        request.method === "GET"
      ) {
        const user =
          await getUser();
        if (!user) {
          return error(
            "Authentication required.",
            401
          );
        }
        return json({
          success: true,
          user
        });
      }
      /* =====================================================
         LOGOUT
         ===================================================== */
      if (
        path === "/api/logout" &&
        request.method === "POST"
      ) {
        const user =
          await getUser();
        const authorization =
          request.headers.get(
            "Authorization"
          );
        if (authorization) {
          const token =
            authorization
              .slice(7)
              .trim();
          if (token) {
            const tokenHash =
              await hashToken(token);
            await env.DB
              .prepare(`
                DELETE FROM sessions
                WHERE token_hash = ?
              `)
              .bind(tokenHash)
              .run();
          }
        }
        if (user) {
          await env.DB
            .prepare(`
              UPDATE users
              SET
                is_online = 0,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `)
            .bind(user.id)
            .run();
        }
        return json({
          success: true,
          message: "Logout successful."
        });
      }
      /* =====================================================
         GET ROOMS
         ===================================================== */
      if (
        path === "/api/rooms" &&
        request.method === "GET"
      ) {
        const result =
          await env.DB
            .prepare(`
              SELECT
                r.id,
                r.owner_id,
                r.name,
                r.description,
                r.room_type,
                r.cover_url,
                r.is_active,
                r.created_at,
                u.name AS owner_name,
                u.username AS owner_username,
                (
                  SELECT COUNT(*)
                  FROM room_viewers rv
                  WHERE rv.room_id = r.id
                    AND rv.is_inside = 1
                ) AS viewer_count
              FROM rooms r
              INNER JOIN users u
                ON u.id = r.owner_id
              WHERE r.is_active = 1
              ORDER BY r.created_at DESC
            `)
            .all();
        return json({
          success: true,
          rooms: result.results || []
        });
      }
      /* =====================================================
         CREATE ROOM
         ===================================================== */
      if (
        path === "/api/rooms" &&
        request.method === "POST"
      ) {
        const user =
          await getUser();
        if (!user) {
          return error(
            "Login required.",
            401
          );
        }
        const data =
          await body();
        const name =
          String(data.name || "").trim();
        const description =
          String(
            data.description || ""
          ).trim();
        const roomType =
          data.room_type === "private"
            ? "private"
            : "public";
        if (!name) {
          return error(
            "Room name जरूरी है।"
          );
        }
        const result =
          await env.DB
            .prepare(`
              INSERT INTO rooms
              (
                owner_id,
                name,
                description,
                room_type
              )
              VALUES (?, ?, ?, ?)
            `)
            .bind(
              user.id,
              name,
              description,
              roomType
            )
            .run();
        if (!result.success) {
          return error(
            "Room create नहीं हुआ।",
            500
          );
        }
        const roomId =
          result.meta?.last_row_id;
        /*
          Owner को room member बनाया जा रहा है।
        */
        await env.DB
          .prepare(`
            INSERT INTO room_members
            (
              room_id,
              user_id,
              role,
              is_inside
            )
            VALUES (?, ?, 'owner', 1)
          `)
          .bind(
            roomId,
            user.id
          )
          .run();
        return json({
          success: true,
          message: "Room created.",
          room_id: roomId
        }, 201);
      }
      /* =====================================================
         JOIN ROOM
         ===================================================== */
      const joinMatch =
        path.match(
          /^\/api\/rooms\/(\d+)\/join$/
        );
      if (
        joinMatch &&
        request.method === "POST"
      ) {
        const roomId =
          Number(joinMatch[1]);
        const user =
          await getUser();
        if (!user) {
          return error(
            "Login required.",
            401
          );
        }
        const room =
          await env.DB
            .prepare(`
              SELECT *
              FROM rooms
              WHERE id = ?
                AND is_active = 1
              LIMIT 1
            `)
            .bind(roomId)
            .first();
        if (!room) {
          return error(
            "Room नहीं मिला।",
            404
          );
        }
        await env.DB
          .prepare(`
            INSERT INTO room_members
            (
              room_id,
              user_id,
              role,
              is_inside
            )
            VALUES (?, ?, 'member', 1)
            ON CONFLICT(room_id, user_id)
            DO UPDATE SET
              is_inside = 1,
              left_at = NULL
          `)
          .bind(
            roomId,
            user.id
          )
          .run();
        await env.DB
          .prepare(`
            INSERT INTO room_viewers
            (
              room_id,
              user_id,
              is_inside
            )
            VALUES (?, ?, 1)
          `)
          .bind(
            roomId,
            user.id
          )
          .run();
        return json({
          success: true,
          message: "Room joined.",
          room
        });
      }
      /* =====================================================
         LEAVE ROOM
         ===================================================== */
      const leaveMatch =
        path.match(
          /^\/api\/rooms\/(\d+)\/leave$/
        );
      if (
        leaveMatch &&
        request.method === "POST"
      ) {
        const roomId =
          Number(leaveMatch[1]);
        const user =
          await getUser();
        if (!user) {
          return error(
            "Login required.",
            401
          );
        }
        await env.DB
          .prepare(`
            UPDATE room_members
            SET
              is_inside = 0,
              left_at = CURRENT_TIMESTAMP
            WHERE room_id = ?
              AND user_id = ?
          `)
          .bind(
            roomId,
            user.id
          )
          .run();
        await env.DB
          .prepare(`
            UPDATE room_viewers
            SET
              is_inside = 0,
              left_at = CURRENT_TIMESTAMP
            WHERE room_id = ?
              AND user_id = ?
              AND is_inside = 1
          `)
          .bind(
            roomId,
            user.id
          )
          .run();
        return json({
          success: true,
          message: "Room left."
        });
      }
      /* =====================================================
         GET ROOM MESSAGES
         ===================================================== */
      const messagesGetMatch =
        path.match(
          /^\/api\/rooms\/(\d+)\/messages$/
        );
      if (
        messagesGetMatch &&
        request.method === "GET"
      ) {
        const roomId =
          Number(messagesGetMatch[1]);
        const result =
          await env.DB
            .prepare(`
              SELECT
                rm.id,
                rm.room_id,
                rm.user_id,
                rm.message,
                rm.message_type,
                rm.created_at,
                u.name,
                u.username,
                u.avatar_url
              FROM room_messages rm
              INNER JOIN users u
                ON u.id = rm.user_id
              WHERE rm.room_id = ?
              ORDER BY rm.id ASC
              LIMIT 200
            `)
            .bind(roomId)
            .all();
        return json({
          success: true,
          messages: result.results || []
        });
      }
      /* =====================================================
         SEND ROOM MESSAGE
         ===================================================== */
      const messagesPostMatch =
        path.match(
          /^\/api\/rooms\/(\d+)\/messages$/
        );
      if (
        messagesPostMatch &&
        request.method === "POST"
      ) {
        const roomId =
          Number(messagesPostMatch[1]);
        const user =
          await getUser();
        if (!user) {
          return error(
            "Login required.",
            401
          );
        }
        const data =
          await body();
        const message =
          String(data.message || "")
            .trim();
        if (!message) {
          return error(
            "Message खाली नहीं हो सकता।"
          );
        }
        if (message.length > 2000) {
          return error(
            "Message बहुत लंबा है।"
          );
        }
        const member =
          await env.DB
            .prepare(`
              SELECT id
              FROM room_members
              WHERE room_id = ?
                AND user_id = ?
                AND is_inside = 1
              LIMIT 1
            `)
            .bind(
              roomId,
              user.id
            )
            .first();
        if (!member) {
          return error(
            "पहले room join करें।",
            403
          );
        }
        const result =
          await env.DB
            .prepare(`
              INSERT INTO room_messages
              (
                room_id,
                user_id,
                message,
                message_type
              )
              VALUES (?, ?, ?, 'text')
            `)
            .bind(
              roomId,
              user.id,
              message
            )
            .run();
        return json({
          success: true,
          message_id:
            result.meta?.last_row_id
        }, 201);
      }
      /* =====================================================
         NOT FOUND
         ===================================================== */
      return error(
        "API endpoint नहीं मिला।",
        404
      );
    } catch (err) {
      console.error(
        "Rahul Live API Error:",
        err
      );
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Server error.",
          error:
            String(err?.message || err)
        }),
        {
          status: 500,
          headers: {
            "Content-Type":
              "application/json; charset=UTF-8",
            "Access-Control-Allow-Origin":
              "*"
          }
        }
      );
    }
  }
};