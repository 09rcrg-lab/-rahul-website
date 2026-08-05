export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    const headers = {
      "Content-Type": "application/json; charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    };

    const json = (data, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers
      });
    };

    if (request.method === "OPTIONS") {
      return json({ success: true });
    }

    if (!env.DB) {
      return json({
        success: false,
        message: "Database binding DB नहीं मिला।"
      }, 500);
    }

    async function body() {
      try {
        return await request.json();
      } catch {
        return {};
      }
    }

    async function hashPassword(password) {
      const data = new TextEncoder().encode(password);

      const hash = await crypto.subtle.digest(
        "SHA-256",
        data
      );

      return [...new Uint8Array(hash)]
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
    }

    function makeToken(userId) {
      return btoa(
        JSON.stringify({
          id: Number(userId),
          created: Date.now()
        })
      );
    }

    function readToken(token) {
      try {
        const data = JSON.parse(atob(token));

        if (
          !data ||
          !Number.isInteger(Number(data.id)) ||
          Number(data.id) <= 0
        ) {
          return null;
        }

        return Number(data.id);

      } catch {
        return null;
      }
    }

    async function currentUser() {

      const authorization =
        request.headers.get("Authorization") || "";

      if (!authorization.startsWith("Bearer ")) {
        return null;
      }

      const token =
        authorization.substring(7).trim();

      const userId = readToken(token);

      if (!userId) {
        return null;
      }

      return await env.DB.prepare(`
        SELECT
          id,
          username,
          email,
          avatar
        FROM users
        WHERE id = ?
        LIMIT 1
      `)
      .bind(userId)
      .first();
    }

    /* =====================================================
       API HOME
    ===================================================== */

    if (
      url.pathname === "/" &&
      request.method === "GET"
    ) {
      return json({
        success: true,
        status: "online",
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
          message: "Username, email और password जरूरी हैं।"
        }, 400);
      }

      if (username.length < 3) {
        return json({
          success: false,
          message: "Username कम से कम 3 characters का होना चाहिए।"
        }, 400);
      }

      if (password.length < 6) {
        return json({
          success: false,
          message: "Password कम से कम 6 characters का होना चाहिए।"
        }, 400);
      }

      const exists = await env.DB.prepare(`
        SELECT id
        FROM users
        WHERE username = ? OR email = ?
        LIMIT 1
      `)
      .bind(username, email)
      .first();

      if (exists) {
        return json({
          success: false,
          message: "Username या email पहले से मौजूद है।"
        }, 409);
      }

      const passwordHash =
        await hashPassword(password);

      const result = await env.DB.prepare(`
        INSERT INTO users
        (
          username,
          email,
          password,
          avatar
        )
        VALUES (?, ?, ?, ?)
      `)
      .bind(
        username,
        email,
        passwordHash,
        ""
      )
      .run();

      const user =
        await env.DB.prepare(`
          SELECT
            id,
            username,
            email,
            avatar
          FROM users
          WHERE id = ?
        `)
        .bind(result.meta.last_row_id)
        .first();

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

      const data = await body();

      const identifier =
        String(data.identifier || "").trim().toLowerCase();

      const password =
        String(data.password || "");

      if (!identifier || !password) {
        return json({
          success: false,
          message: "Login details भरें।"
        }, 400);
      }

      const user =
        await env.DB.prepare(`
          SELECT
            id,
            username,
            email,
            password,
            avatar
          FROM users
          WHERE
            LOWER(username) = ?
            OR LOWER(email) = ?
          LIMIT 1
        `)
        .bind(identifier, identifier)
        .first();

      if (!user) {
        return json({
          success: false,
          message: "User नहीं मिला।"
        }, 401);
      }

      const passwordHash =
        await hashPassword(password);

      if (user.password !== passwordHash) {

        return json({
          success: false,
          message: "Password गलत है।"
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

    const user = await currentUser();

    /* =====================================================
       GET ROOMS
    ===================================================== */

    if (
      url.pathname === "/api/rooms" &&
      request.method === "GET"
    ) {

      const result =
        await env.DB.prepare(`
          SELECT
            r.id,
            r.name,
            r.host_id,
            r.cover,
            r.announcement,
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

          WHERE r.is_live = 1

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
      url.pathname === "/api/rooms" &&
      request.method === "POST"
    ) {

      if (!user) {
        return json({
          success: false,
          message: "Login required."
        }, 401);
      }

      const data = await body();

      const name =
        String(data.name || "").trim();

      if (!name) {
        return json({
          success: false,
          message: "Room name जरूरी है।"
        }, 400);
      }

      const result =
        await env.DB.prepare(`
          INSERT INTO rooms
          (
            name,
            host_id,
            cover,
            announcement,
            is_live
          )
          VALUES (?, ?, ?, ?, 1)
        `)
        .bind(
          name,
          user.id,
          String(data.cover || ""),
          String(
            data.announcement ||
            "Welcome to Rahul Live!"
          )
        )
        .run();

      const room =
        await env.DB.prepare(`
          SELECT *
          FROM rooms
          WHERE id = ?
        `)
        .bind(result.meta.last_row_id)
        .first();

      return json({
        success: true,
        room
      }, 201);
    }

    /* =====================================================
       ROOM ROUTER
    ===================================================== */

    const match =
      url.pathname.match(
        /^\/api\/rooms\/([0-9]+)(?:\/(.+))?$/
      );

    if (!match) {

      return json({
        success: false,
        message: "API endpoint नहीं मिला।"
      }, 404);
    }

    const roomId =
      Number(match[1]);

    const action =
      match[2] || "";

    /* =====================================================
       GET ROOM
    ===================================================== */

    if (
      action === "" &&
      request.method === "GET"
    ) {

      const room =
        await env.DB.prepare(`
          SELECT
            r.id,
            r.name,
            r.host_id,
            r.cover,
            r.announcement,
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
        `)
        .bind(roomId)
        .first();

      if (!room) {
        return json({
          success: false,
          message: "Room नहीं मिला।"
        }, 404);
      }

      const seats =
        await env.DB.prepare(`
          SELECT
            s.id,
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
        `)
        .bind(roomId)
        .all();

      return json({
        success: true,

        room: {
          ...room,
          seats: seats.results || []
        }
      });
    }

    /* =====================================================
       LOGIN REQUIRED
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

      const room =
        await env.DB.prepare(`
          SELECT id
          FROM rooms
          WHERE id = ?
          LIMIT 1
        `)
        .bind(roomId)
        .first();

      if (!room) {
        return json({
          success: false,
          message: "Room नहीं मिला।"
        }, 404);
      }

      await env.DB.prepare(`
        INSERT INTO room_viewers
        (
          room_id,
          user_id,
          joined_at,
          last_seen
        )
        VALUES (?, ?, unixepoch(), unixepoch())

        ON CONFLICT(room_id, user_id)
        DO UPDATE SET
          last_seen = unixepoch()
      `)
      .bind(
        roomId,
        user.id
      )
      .run();

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
        WHERE room_id = ?
        AND user_id = ?
      `)
      .bind(
        roomId,
        user.id
      )
      .run();

      await env.DB.prepare(`
        UPDATE room_seats
        SET
          user_id = NULL,
          mic_on = 0,
          joined_at = NULL
        WHERE room_id = ?
        AND user_id = ?
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
       TAKE VOICE SEAT
    ===================================================== */

    if (
      action === "seat" &&
      request.method === "POST"
    ) {

      const data = await body();

      const seatNumber =
        Number(data.seat_number);

      if (
        !Number.isInteger(seatNumber) ||
        seatNumber < 1 ||
        seatNumber > 12
      ) {
        return json({
          success: false,
          message: "Seat number 1 से 12 के बीच होना चाहिए।"
        }, 400);
      }

      const seat =
        await env.DB.prepare(`
          SELECT
            id,
            user_id
          FROM room_seats

          WHERE room_id = ?
          AND seat_number = ?

          LIMIT 1
        `)
        .bind(
          roomId,
          seatNumber
        )
        .first();

      if (!seat) {
        return json({
          success: false,
          message: "Seat नहीं मिली।"
        }, 404);
      }

      if (
        seat.user_id &&
        Number(seat.user_id) !== Number(user.id)
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
      `)
      .bind(
        roomId,
        user.id
      )
      .run();

      await env.DB.prepare(`
        UPDATE room_seats

        SET
          user_id = ?,
          mic_on = 0,
          joined_at = unixepoch()

        WHERE room_id = ?
        AND seat_number = ?
      `)
      .bind(
        user.id,
        roomId,
        seatNumber
      )
      .run();

      return json({
        success: true,
        message: "Seat joined.",
        seat_number: seatNumber
      });
    }

    /* =====================================================
       LEAVE VOICE SEAT
    ===================================================== */

    if (
      action === "seat/leave" &&
      request.method === "POST"
    ) {

      await env.DB.prepare(`
        UPDATE room_seats

        SET
          user_id = NULL,
          mic_on = 0,
          joined_at = NULL

        WHERE room_id = ?
        AND user_id = ?
      `)
      .bind(
        roomId,
        user.id
      )
      .run();

      return json({
        success: true,
        message: "Seat छोड़ दी गई।"
      });
    }

    /* =====================================================
       MICROPHONE STATUS
    ===================================================== */

    if (
      action === "mic" &&
      request.method === "POST"
    ) {

      const data = await body();

      const micOn =
        Boolean(data.mic_on);

      await env.DB.prepare(`
        UPDATE room_seats

        SET mic_on = ?

        WHERE room_id = ?
        AND user_id = ?
      `)
      .bind(
        micOn ? 1 : 0,
        roomId,
        user.id
      )
      .run();

      return json({
        success: true,
        mic_on: micOn
      });
    }

    /* =====================================================
       CHAT GET
    ===================================================== */

    if (
      action === "messages" &&
      request.method === "GET"
    ) {

      const result =
        await env.DB.prepare(`
          SELECT
            m.id,
            m.room_id,
            m.user_id,
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
        `)
        .bind(roomId)
        .all();

      return json({
        success: true,
        messages:
          (result.results || []).reverse()
      });
    }

    /* =====================================================
       CHAT SEND
    ===================================================== */

    if (
      action === "messages" &&
      request.method === "POST"
    ) {

      const data = await body();

      const message =
        String(data.message || "").trim();

      if (!message) {
        return json({
          success: false,
          message: "Message खाली है।"
        }, 400);
      }

      if (message.length > 300) {
        return json({
          success: false,
          message: "Message बहुत लंबा है।"
        }, 400);
      }

      const result =
        await env.DB.prepare(`
          INSERT INTO room_messages
          (
            room_id,
            user_id,
            message,
            type
          )
          VALUES (?, ?, ?, 'chat')
        `)
        .bind(
          roomId,
          user.id,
          message
        )
        .run();

      return json({
        success: true,
        message: {
          id: result.meta.last_row_id,
          username: user.username,
          avatar: user.avatar,
          message,
          type: "chat"
        }
      }, 201);
    }

    /* =====================================================
       REACTION
    ===================================================== */

    if (
      action === "reaction" &&
      request.method === "POST"
    ) {

      const data = await body();

      const emoji =
        String(data.emoji || "").trim();

      if (!emoji) {
        return json({
          success: false,
          message: "Reaction जरूरी है।"
        }, 400);
      }

      await env.DB.prepare(`
        INSERT INTO room_reactions
        (
          room_id,
          user_id,
          emoji
        )
        VALUES (?, ?, ?)
      `)
      .bind(
        roomId,
        user.id,
        emoji
      )
      .run();

      return json({
        success: true,
        emoji
      });
    }

    /* =====================================================
       GIFT
    ===================================================== */

    if (
      action === "gift" &&
      request.method === "POST"
    ) {

      const data = await body();

      const gift =
        String(data.gift || "").trim();

      if (!gift) {
        return json({
          success: false,
          message: "Gift जरूरी है।"
        }, 400);
      }

      await env.DB.prepare(`
        INSERT INTO room_gifts
        (
          room_id,
          sender_id,
          gift
        )
        VALUES (?, ?, ?)
      `)
      .bind(
        roomId,
        user.id,
        gift
      )
      .run();

      return json({
        success: true,
        gift
      });
    }

    /* =====================================================
       UPDATE AVATAR
    ===================================================== */

    if (
      action === "avatar" &&
      request.method === "POST"
    ) {

      const data = await body();

      const avatar =
        String(data.avatar || "").trim();

      if (!avatar) {
        return json({
          success: false,
          message: "Avatar जरूरी है।"
        }, 400);
      }

      if (avatar.length > 2_000_000) {
        return json({
          success: false,
          message: "Avatar बहुत बड़ा है।"
        }, 400);
      }

      await env.DB.prepare(`
        UPDATE users

        SET avatar = ?

        WHERE id = ?
      `)
      .bind(
        avatar,
        user.id
      )
      .run();

      return json({
        success: true,
        avatar
      });
    }

    /* =====================================================
       UPDATE VIEWER HEARTBEAT
    ===================================================== */

    if (
      action === "heartbeat" &&
      request.method === "POST"
    ) {

      await env.DB.prepare(`
        UPDATE room_viewers

        SET last_seen = unixepoch()

        WHERE room_id = ?
        AND user_id = ?
      `)
      .bind(
        roomId,
        user.id
      )
      .run();

      return json({
        success: true
      });
    }

    /* =====================================================
       UNKNOWN ACTION
    ===================================================== */

    return json({
      success: false,
      message: "यह action उपलब्ध नहीं है।"
    }, 404);
  }
};