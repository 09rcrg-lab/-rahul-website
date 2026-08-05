export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const headers = {
      "Content-Type": "application/json; charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    };

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers
      });

    if (request.method === "OPTIONS") {
      return json({ success: true });
    }

    async function getBody() {
      try {
        return await request.json();
      } catch {
        return {};
      }
    }

    function makeToken(userId) {
      return String(userId);
    }

    async function getUser() {
      const auth = request.headers.get("Authorization") || "";

      if (!auth.startsWith("Bearer ")) {
        return null;
      }

      const token = auth.substring(7);
      const userId = Number(token);

      if (!Number.isInteger(userId) || userId <= 0) {
        return null;
      }

      return await env.DB.prepare(`
        SELECT id, username, email, avatar
        FROM users
        WHERE id = ?
      `).bind(userId).first();
    }

    /* =====================================================
       HOME
    ===================================================== */

    if (url.pathname === "/" && request.method === "GET") {
      return json({
        success: true,
        message: "Rahul Live API Running 🚀"
      });
    }

    /* =====================================================
       REGISTER
    ===================================================== */

    if (
      url.pathname === "/api/register" &&
      request.method === "POST"
    ) {
      const {
        username,
        email,
        password
      } = await getBody();

      if (!username || !email || !password) {
        return json({
          success: false,
          message: "Username, email और password जरूरी हैं।"
        }, 400);
      }

      if (String(username).trim().length < 3) {
        return json({
          success: false,
          message: "Username कम से कम 3 characters का होना चाहिए।"
        }, 400);
      }

      if (String(password).length < 6) {
        return json({
          success: false,
          message: "Password कम से कम 6 characters का होना चाहिए।"
        }, 400);
      }

      const existing = await env.DB.prepare(`
        SELECT id
        FROM users
        WHERE username = ? OR email = ?
        LIMIT 1
      `).bind(
        String(username).trim(),
        String(email).trim()
      ).first();

      if (existing) {
        return json({
          success: false,
          message: "Username या email पहले से मौजूद है।"
        }, 409);
      }

      const result = await env.DB.prepare(`
        INSERT INTO users
        (username, email, password, avatar)
        VALUES (?, ?, ?, ?)
      `).bind(
        String(username).trim(),
        String(email).trim(),
        String(password),
        ""
      ).run();

      const user = await env.DB.prepare(`
        SELECT id, username, email, avatar
        FROM users
        WHERE id = ?
      `).bind(result.meta.last_row_id).first();

      return json({
        success: true,
        message: "Registration successful.",
        user,
        token: makeToken(user.id)
      }, 201);
    }

    /* =====================================================
       LOGIN
    ===================================================== */

    if (
      url.pathname === "/api/login" &&
      request.method === "POST"
    ) {
      const {
        identifier,
        password
      } = await getBody();

      if (!identifier || !password) {
        return json({
          success: false,
          message: "Login details भरें।"
        }, 400);
      }

      const user = await env.DB.prepare(`
        SELECT id, username, email, password, avatar
        FROM users
        WHERE username = ? OR email = ?
        LIMIT 1
      `).bind(
        String(identifier).trim(),
        String(identifier).trim()
      ).first();

      if (!user || user.password !== password) {
        return json({
          success: false,
          message: "Username/email या password गलत है।"
        }, 401);
      }

      delete user.password;

      return json({
        success: true,
        message: "Login successful.",
        user,
        token: makeToken(user.id)
      });
    }

    /* =====================================================
       AUTH
    ===================================================== */

    const user = await getUser();

    /* =====================================================
       ROOMS — GET
    ===================================================== */

    if (
      url.pathname === "/api/rooms" &&
      request.method === "GET"
    ) {
      const result = await env.DB.prepare(`
        SELECT
          r.id,
          r.name,
          r.cover,
          r.announcement,
          r.host_id,
          r.is_live,
          u.username AS host_name,
          u.avatar AS host_avatar,
          (
            SELECT COUNT(*)
            FROM room_viewers v
            WHERE v.room_id = r.id
          ) AS viewers
        FROM rooms r
        INNER JOIN users u
          ON u.id = r.host_id
        WHERE r.is_live = 1
        ORDER BY r.created_at DESC
      `).all();

      return json({
        success: true,
        rooms: result.results || []
      });
    }

    /* =====================================================
       ROOMS — CREATE
    ===================================================== */

    if (
      url.pathname === "/api/rooms" &&
      request.method === "POST"
    ) {
      if (!user) {
        return json({
          success: false,
          message: "Login required."
        }, 401);
      }

      const { name } = await getBody();

      if (!name || !String(name).trim()) {
        return json({
          success: false,
          message: "Room name जरूरी है।"
        }, 400);
      }

      const result = await env.DB.prepare(`
        INSERT INTO rooms
        (name, host_id, cover, announcement, is_live)
        VALUES (?, ?, ?, ?, 1)
      `).bind(
        String(name).trim(),
        user.id,
        "",
        "Welcome to Rahul Live!"
      ).run();

      const room = await env.DB.prepare(`
        SELECT
          id,
          name,
          cover,
          announcement,
          host_id,
          is_live
        FROM rooms
        WHERE id = ?
      `).bind(result.meta.last_row_id).first();

      return json({
        success: true,
        room
      }, 201);
    }

    /* =====================================================
       ROOM ROUTES
    ===================================================== */

    const match = url.pathname.match(
      /^\/api\/rooms\/([0-9]+)(?:\/(.+))?$/
    );

    if (!match) {
      return json({
        success: false,
        message: "API endpoint नहीं मिला।"
      }, 404);
    }

    const roomId = Number(match[1]);
    const action = match[2] || "";

    /* =====================================================
       GET ROOM
    ===================================================== */

    if (
      action === "" &&
      request.method === "GET"
    ) {
      const room = await env.DB.prepare(`
        SELECT
          r.id,
          r.name,
          r.cover,
          r.announcement,
          r.host_id,
          r.is_live,
          r.created_at,
          u.username AS host_name,
          u.avatar AS host_avatar,
          (
            SELECT COUNT(*)
            FROM room_viewers v
            WHERE v.room_id = r.id
          ) AS viewers
        FROM rooms r
        INNER JOIN users u
          ON u.id = r.host_id
        WHERE r.id = ?
        LIMIT 1
      `).bind(roomId).first();

      if (!room) {
        return json({
          success: false,
          message: "Room नहीं मिला।"
        }, 404);
      }

      const seats = await env.DB.prepare(`
        SELECT
          s.seat_number,
          s.user_id,
          s.mic_on,
          s.joined_at,
          u.username,
          u.avatar
        FROM room_seats s
        LEFT JOIN users u
          ON u.id = s.user_id
        WHERE s.room_id = ?
        ORDER BY s.seat_number ASC
      `).bind(roomId).all();

      return json({
        success: true,
        room: {
          ...room,
          seats: seats.results || []
        }
      });
    }

    /* =====================================================
       ALL ACTIONS BELOW REQUIRE LOGIN
    ===================================================== */

    if (!user) {
      return json({
        success: false,
        message: "Login required."
      }, 401);
    }

    /* =====================================================
       JOIN ROOM
    ===================================================== */

    if (
      action === "join" &&
      request.method === "POST"
    ) {
      const room = await env.DB.prepare(`
        SELECT id
        FROM rooms
        WHERE id = ?
      `).bind(roomId).first();

      if (!room) {
        return json({
          success: false,
          message: "Room नहीं मिला।"
        }, 404);
      }

      await env.DB.prepare(`
        INSERT INTO room_viewers
        (room_id, user_id, joined_at, last_seen)
        VALUES (?, ?, unixepoch(), unixepoch())
        ON CONFLICT(room_id, user_id)
        DO UPDATE SET last_seen = unixepoch()
      `).bind(
        roomId,
        user.id
      ).run();

      return json({
        success: true,
        message: "Room joined."
      });
    }

    /* =====================================================
       LEAVE ROOM
    ===================================================== */

    if (
      action === "leave" &&
      request.method === "POST"
    ) {
      await env.DB.prepare(`
        DELETE FROM room_viewers
        WHERE room_id = ? AND user_id = ?
      `).bind(
        roomId,
        user.id
      ).run();

      await env.DB.prepare(`
        UPDATE room_seats
        SET
          user_id = NULL,
          mic_on = 0,
          joined_at = NULL
        WHERE room_id = ?
          AND user_id = ?
      `).bind(
        roomId,
        user.id
      ).run();

      return json({
        success: true,
        message: "Room left."
      });
    }

    /* =====================================================
       JOIN VOICE SEAT
    ===================================================== */

    if (
      action === "seat" &&
      request.method === "POST"
    ) {
      const {
        seat_number
      } = await getBody();

      const seat = Number(seat_number);

      if (
        !Number.isInteger(seat) ||
        seat < 1 ||
        seat > 12
      ) {
        return json({
          success: false,
          message: "Seat number 1 से 12 के बीच होना चाहिए।"
        }, 400);
      }

      const room = await env.DB.prepare(`
        SELECT id
        FROM rooms
        WHERE id = ?
      `).bind(roomId).first();

      if (!room) {
        return json({
          success: false,
          message: "Room नहीं मिला।"
        }, 404);
      }

      const targetSeat = await env.DB.prepare(`
        SELECT user_id
        FROM room_seats
        WHERE room_id = ?
          AND seat_number = ?
      `).bind(
        roomId,
        seat
      ).first();

      if (!targetSeat) {
        return json({
          success: false,
          message: "यह seat उपलब्ध नहीं है।"
        }, 404);
      }

      if (
        targetSeat.user_id &&
        Number(targetSeat.user_id) !== Number(user.id)
      ) {
        return json({
          success: false,
          message: "यह seat पहले से occupied है।"
        }, 409);
      }

      await env.DB.prepare(`
        UPDATE room_seats
        SET
          user_id = NULL,
          mic_on = 0,
          joined_at = NULL
        WHERE room_id = ?
          AND user_id = ?
      `).bind(
        roomId,
        user.id
      ).run();

      await env.DB.prepare(`
        UPDATE room_seats
        SET
          user_id = ?,
          mic_on = 0,
          joined_at = unixepoch()
        WHERE room_id = ?
          AND seat_number = ?
      `).bind(
        user.id,
        roomId,
        seat
      ).run();

      return json({
        success: true,
        seat_number: seat
      });
    }

    /* =====================================================
       MICROPHONE
    ===================================================== */

    if (
      action === "mic" &&
      request.method === "POST"
    ) {
      const {
        mic_on
      } = await getBody();

      await env.DB.prepare(`
        UPDATE room_seats
        SET mic_on = ?
        WHERE room_id = ?
          AND user_id = ?
      `).bind(
        mic_on ? 1 : 0,
        roomId,
        user.id
      ).run();

      return json({
        success: true,
        mic_on: Boolean(mic_on)
      });
    }

    /* =====================================================
       CHAT — GET
    ===================================================== */

    if (
      action === "messages" &&
      request.method === "GET"
    ) {
      const result = await env.DB.prepare(`
        SELECT
          m.id,
          m.message,
          m.type,
          m.created_at,
          u.username,
          u.avatar
        FROM room_messages m
        LEFT JOIN users u
          ON u.id = m.user_id
        WHERE m.room_id = ?
        ORDER BY m.id DESC
        LIMIT 100
      `).bind(roomId).all();

      return json({
        success: true,
        messages: (result.results || []).reverse()
      });
    }

    /* =====================================================
       CHAT — SEND
    ===================================================== */

    if (
      action === "messages" &&
      request.method === "POST"
    ) {
      const {
        message
      } = await getBody();

      const cleanMessage =
        String(message || "").trim();

      if (!cleanMessage) {
        return json({
          success: false,
          message: "Message खाली है।"
        }, 400);
      }

      if (cleanMessage.length > 300) {
        return json({
          success: false,
          message: "Message 300 characters से ज्यादा नहीं हो सकता।"
        }, 400);
      }

      const result = await env.DB.prepare(`
        INSERT INTO room_messages
        (room_id, user_id, message, type)
        VALUES (?, ?, ?, 'chat')
      `).bind(
        roomId,
        user.id,
        cleanMessage
      ).run();

      const newMessage = await env.DB.prepare(`
        SELECT
          m.id,
          m.message,
          m.type,
          m.created_at,
          u.username,
          u.avatar
        FROM room_messages m
        LEFT JOIN users u
          ON u.id = m.user_id
        WHERE m.id = ?
      `).bind(
        result.meta.last_row_id
      ).first();

      return json({
        success: true,
        message: newMessage
      }, 201);
    }

    /* =====================================================
       REACTION
    ===================================================== */

    if (
      action === "reaction" &&
      request.method === "POST"
    ) {
      const {
        emoji
      } = await getBody();

      if (!emoji) {
        return json({
          success: false,
          message: "Emoji required."
        }, 400);
      }

      await env.DB.prepare(`
        INSERT INTO room_reactions
        (room_id, user_id, emoji)
        VALUES (?, ?, ?)
      `).bind(
        roomId,
        user.id,
        String(emoji)
      ).run();

      return json({
        success: true
      });
    }

    /* =====================================================
       GIFT
    ===================================================== */

    if (
      action === "gift" &&
      request.method === "POST"
    ) {
      const {
        gift
      } = await getBody();

      if (!gift) {
        return json({
          success: false,
          message: "Gift required."
        }, 400);
      }

      await env.DB.prepare(`
        INSERT INTO room_gifts
        (room_id, sender_id, gift)
        VALUES (?, ?, ?)
      `).bind(
        roomId,
        user.id,
        String(gift)
      ).run();

      await env.DB.prepare(`
        INSERT INTO room_messages
        (room_id, user_id, message, type)
        VALUES (?, ?, ?, 'gift')
      `).bind(
        roomId,
        user.id,
        `sent ${String(gift)}`
      ).run();

      return json({
        success: true
      });
    }

    return json({
      success: false,
      message: "Action नहीं मिली।"
    }, 404);
  }
};