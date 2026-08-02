export default {

  async fetch(request, env) {

    const url = new URL(request.url);

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors
      });
    }

    function json(data, status = 200) {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...cors
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


    /* ================= HOME ================= */

    if (url.pathname === "/") {
      return json({
        success: true,
        message: "Rahul Live API Running 🚀"
      });
    }


    /* ================= TEST ================= */

    if (
      url.pathname === "/api/test" &&
      request.method === "GET"
    ) {

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
        tables: result.results
      });
    }


    /* ================= REGISTER ================= */

    if (
      url.pathname === "/api/register" &&
      request.method === "POST"
    ) {

      const data = await body();

      const username =
        String(data.username || "").trim();

      const email =
        String(data.email || "").trim().toLowerCase();

      const password =
        String(data.password || "");

      if (!username || !email || !password) {
        return json({
          success: false,
          message: "सभी जानकारी भरें"
        }, 400);
      }

      const existing = await env.DB
        .prepare(`
          SELECT id
          FROM users
          WHERE username = ? OR email = ?
          LIMIT 1
        `)
        .bind(username, email)
        .first();

      if (existing) {
        return json({
          success: false,
          message: "Username या email पहले से मौजूद है"
        }, 409);
      }

      const result = await env.DB
        .prepare(`
          INSERT INTO users
          (username, email, password)
          VALUES (?, ?, ?)
        `)
        .bind(username, email, password)
        .run();

      return json({
        success: true,
        message: "Registration successful",
        user: {
          id: result.meta.last_row_id,
          username,
          email
        }
      });
    }


    /* ================= LOGIN ================= */

    if (
      url.pathname === "/api/login" &&
      request.method === "POST"
    ) {

      const data = await body();

      const username =
        String(data.username || "").trim();

      const password =
        String(data.password || "");

      if (!username || !password) {
        return json({
          success: false,
          message: "Username और password भरें"
        }, 400);
      }

      const user = await env.DB
        .prepare(`
          SELECT id, username, email
          FROM users
          WHERE username = ?
          AND password = ?
          LIMIT 1
        `)
        .bind(username, password)
        .first();

      if (!user) {
        return json({
          success: false,
          message: "Username या password गलत है"
        }, 401);
      }

      return json({
        success: true,
        message: "Login successful",
        user
      });
    }


    /* ================= CREATE LIVE ================= */

    if (
      url.pathname === "/api/live/create" &&
      request.method === "POST"
    ) {

      const data = await body();

      const hostId = Number(data.host_id);

      const title =
        String(
          data.title ||
          "Chat LIVE Room"
        ).trim();

      if (!hostId) {
        return json({
          success: false,
          message: "Host ID missing"
        }, 400);
      }

      const host = await env.DB
        .prepare(`
          SELECT id, username
          FROM users
          WHERE id = ?
          LIMIT 1
        `)
        .bind(hostId)
        .first();

      if (!host) {
        return json({
          success: false,
          message: "Host नहीं मिला"
        }, 404);
      }

      const result = await env.DB
        .prepare(`
          INSERT INTO live_rooms
          (host_id, title, status)
          VALUES (?, ?, 'live')
        `)
        .bind(hostId, title)
        .run();

      const roomId =
        result.meta.last_row_id;

      await env.DB
        .prepare(`
          INSERT INTO live_room_settings
          (live_room_id)
          VALUES (?)
        `)
        .bind(roomId)
        .run();

      await env.DB
        .prepare(`
          INSERT INTO live_viewers
          (live_room_id, user_id)
          VALUES (?, ?)
        `)
        .bind(roomId, hostId)
        .run();

      return json({
        success: true,
        message: "LIVE started",
        room: {
          id: roomId,
          host_id: hostId,
          host_username: host.username,
          title,
          status: "live"
        }
      });
    }


    /* ================= LIVE ROOMS ================= */

    if (
      url.pathname === "/api/live/rooms" &&
      request.method === "GET"
    ) {

      const result = await env.DB
        .prepare(`
          SELECT
            lr.id,
            lr.host_id,
            lr.title,
            lr.status,
            u.username AS host_username,
            (
              SELECT COUNT(*)
              FROM live_viewers lv
              WHERE lv.live_room_id = lr.id
            ) AS viewer_count
          FROM live_rooms lr
          JOIN users u
            ON u.id = lr.host_id
          WHERE lr.status = 'live'
          ORDER BY lr.id DESC
        `)
        .all();

      return json({
        success: true,
        rooms: result.results
      });
    }


    /* ================= GET ROOM ================= */

    if (
      url.pathname.startsWith("/api/live/room/") &&
      request.method === "GET"
    ) {

      const id =
        Number(
          url.pathname.split("/").pop()
        );

      const room = await env.DB
        .prepare(`
          SELECT
            lr.id,
            lr.host_id,
            lr.title,
            lr.status,
            u.username AS host_username
          FROM live_rooms lr
          JOIN users u
            ON u.id = lr.host_id
          WHERE lr.id = ?
          LIMIT 1
        `)
        .bind(id)
        .first();

      if (!room) {
        return json({
          success: false,
          message: "LIVE room नहीं मिला"
        }, 404);
      }

      return json({
        success: true,
        room
      });
    }


    /* ================= JOIN LIVE ================= */

    if (
      url.pathname === "/api/live/join" &&
      request.method === "POST"
    ) {

      const data = await body();

      const roomId =
        Number(data.live_room_id);

      const userId =
        Number(data.user_id);

      const room = await env.DB
        .prepare(`
          SELECT id, status
          FROM live_rooms
          WHERE id = ?
          LIMIT 1
        `)
        .bind(roomId)
        .first();

      if (!room || room.status !== "live") {
        return json({
          success: false,
          message: "LIVE अब उपलब्ध नहीं है"
        }, 404);
      }

      const existing = await env.DB
        .prepare(`
          SELECT id
          FROM live_viewers
          WHERE live_room_id = ?
          AND user_id = ?
          LIMIT 1
        `)
        .bind(roomId, userId)
        .first();

      if (!existing) {

        await env.DB
          .prepare(`
            INSERT INTO live_viewers
            (live_room_id, user_id)
            VALUES (?, ?)
          `)
          .bind(roomId, userId)
          .run();

      }

      return json({
        success: true,
        message: "LIVE joined"
      });
    }


    /* ================= LEAVE LIVE ================= */

    if (
      url.pathname === "/api/live/leave" &&
      request.method === "POST"
    ) {

      const data = await body();

      await env.DB
        .prepare(`
          DELETE FROM live_viewers
          WHERE live_room_id = ?
          AND user_id = ?
        `)
        .bind(
          Number(data.live_room_id),
          Number(data.user_id)
        )
        .run();

      return json({
        success: true,
        message: "LIVE left"
      });
    }


    /* ================= VIEWERS ================= */

    if (
      url.pathname.startsWith("/api/live/viewers/") &&
      request.method === "GET"
    ) {

      const roomId =
        Number(
          url.pathname.split("/").pop()
        );

      const result = await env.DB
        .prepare(`
          SELECT
            lv.user_id,
            u.username
          FROM live_viewers lv
          JOIN users u
            ON u.id = lv.user_id
          WHERE lv.live_room_id = ?
          ORDER BY lv.id ASC
        `)
        .bind(roomId)
        .all();

      return json({
        success: true,
        viewers: result.results
      });
    }


    /* ================= SEND MESSAGE ================= */

    if (
      url.pathname === "/api/live/message" &&
      request.method === "POST"
    ) {

      const data = await body();

      const roomId =
        Number(data.live_room_id);

      const userId =
        Number(data.user_id);

      const message =
        String(data.message || "").trim();

      if (!roomId || !userId || !message) {
        return json({
          success: false,
          message: "Message खाली नहीं हो सकता"
        }, 400);
      }

      await env.DB
        .prepare(`
          INSERT INTO live_messages
          (live_room_id, user_id, message)
          VALUES (?, ?, ?)
        `)
        .bind(
          roomId,
          userId,
          message
        )
        .run();

      return json({
        success: true,
        message: "Message sent"
      });
    }


    /* ================= GET MESSAGES ================= */

    if (
      url.pathname.startsWith("/api/live/messages/") &&
      request.method === "GET"
    ) {

      const roomId =
        Number(
          url.pathname.split("/").pop()
        );

      const result = await env.DB
        .prepare(`
          SELECT
            lm.id,
            lm.user_id,
            lm.message,
            lm.created_at,
            u.username
          FROM live_messages lm
          JOIN users u
            ON u.id = lm.user_id
          WHERE lm.live_room_id = ?
          ORDER BY lm.id ASC
          LIMIT 200
        `)
        .bind(roomId)
        .all();

      return json({
        success: true,
        messages: result.results
      });
    }


    /* ================= REACTION ================= */

    if (
      url.pathname === "/api/live/reaction" &&
      request.method === "POST"
    ) {

      const data = await body();

      const roomId =
        Number(data.live_room_id);

      const userId =
        Number(data.user_id);

      const reaction =
        String(data.reaction || "").trim();

      if (!roomId || !userId || !reaction) {
        return json({
          success: false,
          message: "Invalid reaction"
        }, 400);
      }

      await env.DB
        .prepare(`
          INSERT INTO live_messages
          (live_room_id, user_id, message)
          VALUES (?, ?, ?)
        `)
        .bind(
          roomId,
          userId,
          reaction
        )
        .run();

      return json({
        success: true,
        message: "Reaction sent"
      });
    }


    /* ================= MODERATION ================= */

    if (
      url.pathname === "/api/live/moderate" &&
      request.method === "POST"
    ) {

      const data = await body();

      const roomId =
        Number(data.live_room_id);

      const hostId =
        Number(data.host_id);

      const targetId =
        Number(data.target_user_id);

      const action =
        String(data.action || "").trim();

      const room = await env.DB
        .prepare(`
          SELECT host_id
          FROM live_rooms
          WHERE id = ?
          LIMIT 1
        `)
        .bind(roomId)
        .first();

      if (
        !room ||
        Number(room.host_id) !== hostId
      ) {
        return json({
          success: false,
          message: "आप Host नहीं हैं"
        }, 403);
      }

      await env.DB
        .prepare(`
          INSERT INTO live_moderation
          (live_room_id, moderator_id, target_user_id, action)
          VALUES (?, ?, ?, ?)
        `)
        .bind(
          roomId,
          hostId,
          targetId,
          action
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
            roomId,
            targetId
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
    }


    /* ================= END LIVE ================= */

    if (
      url.pathname === "/api/live/end" &&
      request.method === "POST"
    ) {

      const data = await body();

      const roomId =
        Number(data.live_room_id);

      const hostId =
        Number(data.host_id);

      const room = await env.DB
        .prepare(`
          SELECT host_id
          FROM live_rooms
          WHERE id = ?
          LIMIT 1
        `)
        .bind(roomId)
        .first();

      if (
        !room ||
        Number(room.host_id) !== hostId
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
        .bind(roomId)
        .run();

      await env.DB
        .prepare(`
          DELETE FROM live_viewers
          WHERE live_room_id = ?
        `)
        .bind(roomId)
        .run();

      return json({
        success: true,
        message: "LIVE ended"
      });
    }


    /* ================= 404 ================= */

    return json({
      success: false,
      message: "API endpoint नहीं मिला"
    }, 404);

  }
};