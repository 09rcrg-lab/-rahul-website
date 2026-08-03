export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    try {

      /* ================= HOME ================= */

      if (url.pathname === "/" && request.method === "GET") {
        return Response.json(
          {
            success: true,
            message: "Rahul Live Voice Rooms API Running 🚀"
          },
          { headers: corsHeaders }
        );
      }


      /* ================= TEST DATABASE ================= */

      if (url.pathname === "/api/test" && request.method === "GET") {

        const result = await env.DB
          .prepare(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
          )
          .all();

        return Response.json(
          {
            success: true,
            tables: result.results || []
          },
          { headers: corsHeaders }
        );
      }


      /* ================= REGISTER ================= */

      if (
        url.pathname === "/api/register" &&
        request.method === "POST"
      ) {

        const data = await request.json();

        const username =
          String(data.username || "").trim();

        const email =
          String(data.email || "").trim();

        const password =
          String(data.password || "");

        if (!username || !email || !password) {
          return Response.json(
            {
              success: false,
              message: "All fields are required"
            },
            {
              status: 400,
              headers: corsHeaders
            }
          );
        }

        if (password.length < 6) {
          return Response.json(
            {
              success: false,
              message: "Password must contain at least 6 characters"
            },
            {
              status: 400,
              headers: corsHeaders
            }
          );
        }

        const existing =
          await env.DB
            .prepare(
              "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1"
            )
            .bind(username, email)
            .first();

        if (existing) {
          return Response.json(
            {
              success: false,
              message: "Username or email already exists"
            },
            {
              status: 409,
              headers: corsHeaders
            }
          );
        }

        const result =
          await env.DB
            .prepare(
              `INSERT INTO users
              (username, email, password, coins, level)
              VALUES (?, ?, ?, 0, 1)`
            )
            .bind(username, email, password)
            .run();

        return Response.json(
          {
            success: true,
            message: "Registration successful",
            userId: result.meta?.last_row_id || null
          },
          {
            status: 201,
            headers: corsHeaders
          }
        );
      }


      /* ================= LOGIN ================= */

      if (
        url.pathname === "/api/login" &&
        request.method === "POST"
      ) {

        const data = await request.json();

        const username =
          String(data.username || "").trim();

        const password =
          String(data.password || "");

        if (!username || !password) {
          return Response.json(
            {
              success: false,
              message: "Username and password are required"
            },
            {
              status: 400,
              headers: corsHeaders
            }
          );
        }

        const user =
          await env.DB
            .prepare(
              `SELECT id, username, email, coins, level
               FROM users
               WHERE username = ? AND password = ?
               LIMIT 1`
            )
            .bind(username, password)
            .first();

        if (!user) {
          return Response.json(
            {
              success: false,
              message: "Invalid username or password"
            },
            {
              status: 401,
              headers: corsHeaders
            }
          );
        }

        return Response.json(
          {
            success: true,
            message: "Login successful",
            user
          },
          { headers: corsHeaders }
        );
      }


      /* ================= ROOMS ================= */

      if (
        url.pathname === "/api/rooms" &&
        request.method === "GET"
      ) {

        const result =
          await env.DB
            .prepare(
              `SELECT
                rooms.id,
                rooms.room_code,
                rooms.name,
                rooms.category,
                rooms.viewers,
                rooms.is_live,
                rooms.host_id,
                users.username AS host_username
               FROM rooms
               JOIN users
               ON users.id = rooms.host_id
               WHERE rooms.is_live = 1
               ORDER BY rooms.created_at DESC`
            )
            .all();

        return Response.json(
          {
            success: true,
            rooms: result.results || []
          },
          { headers: corsHeaders }
        );
      }


      /* ================= CREATE ROOM ================= */

      if (
        url.pathname === "/api/rooms" &&
        request.method === "POST"
      ) {

        const data = await request.json();

        const name =
          String(data.name || "").trim();

        const category =
          String(data.category || "chat").trim();

        const hostId =
          Number(data.hostId);

        if (!name || !hostId) {
          return Response.json(
            {
              success: false,
              message: "Room name and hostId are required"
            },
            {
              status: 400,
              headers: corsHeaders
            }
          );
        }

        const roomCode =
          Math.floor(
            100000 + Math.random() * 900000
          ).toString();

        const result =
          await env.DB
            .prepare(
              `INSERT INTO rooms
              (room_code, name, category, host_id, viewers, is_live)
              VALUES (?, ?, ?, ?, 1, 1)`
            )
            .bind(
              roomCode,
              name,
              category,
              hostId
            )
            .run();

        return Response.json(
          {
            success: true,
            message: "Room created",
            roomId: result.meta?.last_row_id || null,
            roomCode
          },
          {
            status: 201,
            headers: corsHeaders
          }
        );
      }


      /* ================= ROOM MESSAGES ================= */

      if (
        url.pathname === "/api/messages" &&
        request.method === "GET"
      ) {

        const roomId =
          Number(url.searchParams.get("roomId"));

        if (!roomId) {
          return Response.json(
            {
              success: false,
              message: "roomId is required"
            },
            {
              status: 400,
              headers: corsHeaders
            }
          );
        }

        const result =
          await env.DB
            .prepare(
              `SELECT
                messages.id,
                messages.message,
                messages.created_at,
                users.id AS user_id,
                users.username
               FROM messages
               JOIN users
               ON users.id = messages.user_id
               WHERE messages.room_id = ?
               ORDER BY messages.created_at ASC
               LIMIT 100`
            )
            .bind(roomId)
            .all();

        return Response.json(
          {
            success: true,
            messages: result.results || []
          },
          { headers: corsHeaders }
        );
      }


      /* ================= SEND MESSAGE ================= */

      if (
        url.pathname === "/api/messages" &&
        request.method === "POST"
      ) {

        const data = await request.json();

        const roomId =
          Number(data.roomId);

        const userId =
          Number(data.userId);

        const message =
          String(data.message || "").trim();

        if (!roomId || !userId || !message) {
          return Response.json(
            {
              success: false,
              message: "roomId, userId and message are required"
            },
            {
              status: 400,
              headers: corsHeaders
            }
          );
        }

        await env.DB
          .prepare(
            `INSERT INTO messages
            (room_id, user_id, message)
            VALUES (?, ?, ?)`
          )
          .bind(
            roomId,
            userId,
            message
          )
          .run();

        return Response.json(
          {
            success: true,
            message: "Message sent"
          },
          { headers: corsHeaders }
        );
      }


      /* ================= GIFTS ================= */

      if (
        url.pathname === "/api/gifts" &&
        request.method === "GET"
      ) {

        const result =
          await env.DB
            .prepare(
              "SELECT id, name, emoji, cost FROM gifts ORDER BY cost ASC"
            )
            .all();

        return Response.json(
          {
            success: true,
            gifts: result.results || []
          },
          { headers: corsHeaders }
        );
      }


      /* ================= ROOM JOIN ================= */

      if (
        url.pathname === "/api/rooms/join" &&
        request.method === "POST"
      ) {

        const data = await request.json();

        const roomId =
          Number(data.roomId);

        const userId =
          Number(data.userId);

        if (!roomId || !userId) {
          return Response.json(
            {
              success: false,
              message: "roomId and userId are required"
            },
            {
              status: 400,
              headers: corsHeaders
            }
          );
        }

        const existing =
          await env.DB
            .prepare(
              `SELECT id
               FROM room_members
               WHERE room_id = ? AND user_id = ?
               LIMIT 1`
            )
            .bind(roomId, userId)
            .first();

        if (!existing) {

          await env.DB
            .prepare(
              `INSERT INTO room_members
              (room_id, user_id, role, mic_enabled)
              VALUES (?, ?, 'listener', 0)`
            )
            .bind(roomId, userId)
            .run();

          await env.DB
            .prepare(
              `UPDATE rooms
               SET viewers = viewers + 1
               WHERE id = ?`
            )
            .bind(roomId)
            .run();
        }

        return Response.json(
          {
            success: true,
            message: "Joined room"
          },
          { headers: corsHeaders }
        );
      }


      /* ================= 404 ================= */

      return Response.json(
        {
          success: false,
          message: "API endpoint not found"
        },
        {
          status: 404,
          headers: corsHeaders
        }
      );

    } catch (error) {

      return Response.json(
        {
          success: false,
          message: "Server error",
          error: error.message
        },
        {
          status: 500,
          headers: corsHeaders
        }
      );
    }
  }
};