export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin =
      request.headers.get("Origin") || "*";
    const cors = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors
      });
    }
    function json(data, status = 200) {
      return new Response(
        JSON.stringify(data),
        {
          status,
          headers: {
            ...cors,
            "Content-Type":
              "application/json; charset=UTF-8"
          }
        }
      );
    }
    function fail(message, status = 400) {
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
    async function hash(value) {
      const bytes =
        new TextEncoder().encode(value);
      const digest =
        await crypto.subtle.digest(
          "SHA-256",
          bytes
        );
      return Array
        .from(new Uint8Array(digest))
        .map(
          x =>
            x.toString(16).padStart(2, "0")
        )
        .join("");
    }
    function token() {
      const bytes =
        crypto.getRandomValues(
          new Uint8Array(32)
        );
      return Array
        .from(bytes)
        .map(
          x =>
            x.toString(16).padStart(2, "0")
        )
        .join("");
    }
    async function currentUser() {
      const header =
        request.headers.get("Authorization");
      if (!header) {
        return null;
      }
      const raw =
        header.replace(/^Bearer\s+/i, "").trim();
      if (!raw) {
        return null;
      }
      const tokenHash =
        await hash(raw);
      const row =
        await env.DB
          .prepare(`
            SELECT
              users.id,
              users.name,
              users.email,
              users.username,
              users.avatar_url,
              users.bio,
              users.coins,
              users.is_online
            FROM sessions
            INNER JOIN users
              ON users.id = sessions.user_id
            WHERE sessions.token_hash = ?
              AND sessions.expires_at > CURRENT_TIMESTAMP
            LIMIT 1
          `)
          .bind(tokenHash)
          .first();
      return row || null;
    }
    async function requireUser() {
      const user =
        await currentUser();
      if (!user) {
        return {
          error: fail(
            "Login required.",
            401
          )
        };
      }
      return { user };
    }
    /* =====================================================
       HOME
    ===================================================== */
    if (
      url.pathname === "/" &&
      request.method === "GET"
    ) {
      return json({
        success: true,
        service: "Rahul Live API",
        status: "running",
        database: "D1"
      });
    }
    /* =====================================================
       DATABASE
    ===================================================== */
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
          database: "connected",
          tables:
            result.results || []
        });
      } catch (e) {
        return fail(
          e.message,
          500
        );
      }
    }
    /* =====================================================
       REGISTER
    ===================================================== */
    if (
      url.pathname === "/api/register" &&
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
      if (!name || !email || !password) {
        return fail(
          "Name, email और password जरूरी हैं।"
        );
      }
      if (password.length < 6) {
        return fail(
          "Password कम से कम 6 characters का होना चाहिए।"
        );
      }
      const username =
        String(
          data.username ||
          name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .slice(0, 20)
        ).trim() ||
        `user${Date.now()}`;
      try {
        const existing =
          await env.DB
            .prepare(`
              SELECT id
              FROM users
              WHERE email = ?
                 OR username = ?
              LIMIT 1
            `)
            .bind(
              email,
              username
            )
            .first();
        if (existing) {
          return fail(
            "Email या username पहले से मौजूद है।",
            409
          );
        }
        const passwordHash =
          await hash(password);
        const result =
          await env.DB
            .prepare(`
              INSERT INTO users
              (
                name,
                email,
                password_hash,
                username,
                avatar_url,
                bio,
                coins,
                is_online
              )
              VALUES (?, ?, ?, ?, '', '', 0, 0)
            `)
            .bind(
              name,
              email,
              passwordHash,
              username
            )
            .run();
        return json({
          success: true,
          message: "Account successfully created.",
          user_id:
            result.meta.last_row_id
        }, 201);
      } catch (e) {
        return fail(
          e.message,
          500
        );
      }
    }
    /* =====================================================
       LOGIN
    ===================================================== */
    if (
      url.pathname === "/api/login" &&
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
        return fail(
          "Email और password जरूरी हैं।"
        );
      }
      try {
        const user =
          await env.DB
            .prepare(`
              SELECT
                id,
                name,
                email,
                username,
                avatar_url,
                bio,
                coins,
                is_online,
                password_hash
              FROM users
              WHERE email = ?
              LIMIT 1
            `)
            .bind(email)
            .first();
        if (!user) {
          return fail(
            "Email या password गलत है।",
            401
          );
        }
        const passwordHash =
          await hash(password);
        if (
          passwordHash !==
          user.password_hash
        ) {
          return fail(
            "Email या password गलत है।",
            401
          );
        }
        const rawToken =
          token();
        const tokenHash =
          await hash(rawToken);
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
        delete user.password_hash;
        return json({
          success: true,
          token: rawToken,
          user
        });
      } catch (e) {
        return fail(
          e.message,
          500
        );
      }
    }
    /* =====================================================
       LOGOUT
    ===================================================== */
    if (
      url.pathname === "/api/logout" &&
      request.method === "POST"
    ) {
      const user =
        await currentUser();
      const header =
        request.headers.get("Authorization");
      if (header) {
        const raw =
          header
            .replace(/^Bearer\s+/i, "")
            .trim();
        if (raw) {
          const tokenHash =
            await hash(raw);
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
        success: true
      });
    }
    /* =====================================================
       ME
    ===================================================== */
    if (
      url.pathname === "/api/me" &&
      request.method === "GET"
    ) {
      const result =
        await requireUser();
      if (result.error) {
        return result.error;
      }
      return json({
        success: true,
        user: result.user
      });
    }
    /* =====================================================
       GET ROOMS
    ===================================================== */
    if (
      url.pathname === "/api/rooms" &&
      request.method === "GET"
    ) {
      try {
        const result =
          await env.DB
            .prepare(`
              SELECT
                rooms.id,
                rooms.owner_id,
                rooms.name,
                rooms.description,
                rooms.room_type,
                rooms.cover_url,
                rooms.created_at,
                users.name AS owner_name,
                users.username AS owner_username,
                users.avatar_url AS owner_avatar,
                (
                  SELECT COUNT(*)
                  FROM room_viewers
                  WHERE room_viewers.room_id = rooms.id
                    AND room_viewers.is_inside = 1
                ) AS viewer_count
              FROM rooms
              INNER JOIN users
                ON users.id = rooms.owner_id
              WHERE rooms.is_active = 1
              ORDER BY rooms.created_at DESC
              LIMIT 100
            `)
            .all();
        return json({
          success: true,
          rooms:
            result.results || []
        });
      } catch (e) {
        return fail(
          e.message,
          500
        );
      }
    }
    /* =====================================================
       CREATE ROOM
    ===================================================== */
    if (
      url.pathname === "/api/rooms" &&
      request.method === "POST"
    ) {
      const auth =
        await requireUser();
      if (auth.error) {
        return auth.error;
      }
      const data =
        await body();
      const name =
        String(data.name || "")
          .trim()
          .slice(0, 80);
      const description =
        String(data.description || "")
          .trim()
          .slice(0, 300);
      const roomType =
        data.room_type === "private"
          ? "private"
          : "public";
      if (!name) {
        return fail(
          "Room name जरूरी है।"
        );
      }
      try {
        const result =
          await env.DB
            .prepare(`
              INSERT INTO rooms
              (
                owner_id,
                name,
                description,
                room_type,
                is_active
              )
              VALUES (?, ?, ?, ?, 1)
            `)
            .bind(
              auth.user.id,
              name,
              description,
              roomType
            )
            .run();
        const roomId =
          result.meta.last_row_id;
        /* Create exactly 8 seats */
        for (
          let i = 1;
          i <= 8;
          i++
        ) {
          await env.DB
            .prepare(`
              INSERT INTO room_seats
              (
                room_id,
                seat_number,
                user_id,
                is_muted
              )
              VALUES (?, ?, NULL, 0)
            `)
            .bind(
              roomId,
              i
            )
            .run();
        }
        return json({
          success: true,
          room_id: roomId,
          message: "Room created."
        }, 201);
      } catch (e) {
        return fail(
          e.message,
          500
        );
      }
    }
    /* =====================================================
       ROOM DETAILS
    ===================================================== */
    const roomMatch =
      url.pathname.match(
        /^\/api\/rooms\/(\d+)$/
      );
    if (
      roomMatch &&
      request.method === "GET"
    ) {
      const roomId =
        Number(roomMatch[1]);
      try {
        const room =
          await env.DB
            .prepare(`
              SELECT
                rooms.*,
                users.name AS owner_name,
                users.username AS owner_username,
                users.avatar_url AS owner_avatar
              FROM rooms
              INNER JOIN users
                ON users.id = rooms.owner_id
              WHERE rooms.id = ?
              LIMIT 1
            `)
            .bind(roomId)
            .first();
        if (!room) {
          return fail(
            "Room नहीं मिला।",
            404
          );
        }
        const seats =
          await env.DB
            .prepare(`
              SELECT
                room_seats.id,
                room_seats.room_id,
                room_seats.seat_number,
                room_seats.user_id,
                room_seats.is_muted,
                room_seats.joined_at,
                users.name,
                users.username,
                users.avatar_url
              FROM room_seats
              LEFT JOIN users
                ON users.id =
                   room_seats.user_id
              WHERE room_seats.room_id = ?
              ORDER BY room_seats.seat_number
            `)
            .bind(roomId)
            .all();
        const members =
          await env.DB
            .prepare(`
              SELECT
                room_members.user_id,
                room_members.role,
                room_members.joined_at,
                users.name,
                users.username,
                users.avatar_url
              FROM room_members
              INNER JOIN users
                ON users.id =
                   room_members.user_id
              WHERE room_members.room_id = ?
                AND room_members.is_inside = 1
              ORDER BY room_members.joined_at
            `)
            .bind(roomId)
            .all();
        return json({
          success: true,
          room,
          seats:
            seats.results || [],
          members:
            members.results || []
        });
      } catch (e) {
        return fail(
          e.message,
          500
        );
      }
    }
    /* =====================================================
       JOIN ROOM
    ===================================================== */
    const joinMatch =
      url.pathname.match(
        /^\/api\/rooms\/(\d+)\/join$/
      );
    if (
      joinMatch &&
      request.method === "POST"
    ) {
      const auth =
        await requireUser();
      if (auth.error) {
        return auth.error;
      }
      const roomId =
        Number(joinMatch[1]);
      try {
        const room =
          await env.DB
            .prepare(`
              SELECT id, room_type, is_active
              FROM rooms
              WHERE id = ?
              LIMIT 1
            `)
            .bind(roomId)
            .first();
        if (!room || !room.is_active) {
          return fail(
            "Room उपलब्ध नहीं है।",
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
              is_inside,
              left_at
            )
            VALUES (?, ?, ?, 1, NULL)
            ON CONFLICT(room_id, user_id)
            DO UPDATE SET
              is_inside = 1,
              left_at = NULL
          `)
          .bind(
            roomId,
            auth.user.id,
            Number(room.owner_id) ===
              Number(auth.user.id)
              ? "owner"
              : "member"
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
            auth.user.id
          )
          .run();
        return json({
          success: true,
          message: "Joined room."
        });
      } catch (e) {
        return fail(
          e.message,
          500
        );
      }
    }
    /* =====================================================
       LEAVE ROOM
    ===================================================== */
    const leaveMatch =
      url.pathname.match(
        /^\/api\/rooms\/(\d+)\/leave$/
      );
    if (
      leaveMatch &&
      request.method === "POST"
    ) {
      const auth =
        await requireUser();
      if (auth.error) {
        return auth.error;
      }
      const roomId =
        Number(leaveMatch[1]);
      try {
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
            auth.user.id
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
            auth.user.id
          )
          .run();
        await env.DB
          .prepare(`
            UPDATE room_seats
            SET
              user_id = NULL,
              is_muted = 0,
              joined_at = NULL
            WHERE room_id = ?
              AND user_id = ?
          `)
          .bind(
            roomId,
            auth.user.id
          )
          .run();
        return json({
          success: true
        });
      } catch (e) {
        return fail(
          e.message,
          500
        );
      }
    }
    /* =====================================================
       ROOM SEATS
    ===================================================== */
    const seatsMatch =
      url.pathname.match(
        /^\/api\/rooms\/(\d+)\/seats$/
      );
    if (
      seatsMatch &&
      request.method === "GET"
    ) {
      const roomId =
        Number(seatsMatch[1]);
      try {
        const result =
          await env.DB
            .prepare(`
              SELECT
                room_seats.*,
                users.name,
                users.username,
                users.avatar_url,
                CASE
                  WHEN room_seats.user_id IS NULL
                  THEN 0
                  ELSE 1
                END AS is_occupied,
                CASE
                  WHEN room_seats.is_muted = 1
                  THEN 0
                  ELSE 1
                END AS mic_on
              FROM room_seats
              LEFT JOIN users
                ON users.id =
                   room_seats.user_id
              WHERE room_seats.room_id = ?
              ORDER BY room_seats.seat_number
            `)
            .bind(roomId)
            .all();
        return json({
          success: true,
          seats:
            result.results || []
        });
      } catch (e) {
        return fail(
          e.message,
          500
        );
      }
    }
    /* =====================================================
       JOIN SEAT
    ===================================================== */
    const seatJoinMatch =
      url.pathname.match(
        /^\/api\/rooms\/(\d+)\/seats\/(\d+)\/join$/
      );
    if (
      seatJoinMatch &&
      request.method === "POST"
    ) {
      const auth =
        await requireUser();
      if (auth.error) {
        return auth.error;
      }
      const roomId =
        Number(seatJoinMatch[1]);
      const seatNumber =
        Number(seatJoinMatch[2]);
      if (
        seatNumber < 1 ||
        seatNumber > 8
      ) {
        return fail(
          "Invalid seat."
        );
      }
      try {
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
              auth.user.id
            )
            .first();
        if (!member) {
          return fail(
            "पहले room join करें।"
          );
        }
        const seat =
          await env.DB
            .prepare(`
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
          return fail(
            "Seat नहीं मिली।",
            404
          );
        }
        if (
          seat.user_id &&
          Number(seat.user_id) !==
            Number(auth.user.id)
        ) {
          return fail(
            "यह seat पहले से occupied है।",
            409
          );
        }
        /* Remove user from another seat */
        await env.DB
          .prepare(`
            UPDATE room_seats
            SET
              user_id = NULL,
              is_muted = 0,
              joined_at = NULL
            WHERE room_id = ?
              AND user_id = ?
          `)
          .bind(
            roomId,
            auth.user.id
          )
          .run();
        await env.DB
          .prepare(`
            UPDATE room_seats
            SET
              user_id = ?,
              is_muted = 1,
              joined_at = CURRENT_TIMESTAMP
            WHERE room_id = ?
              AND seat_number = ?
          `)
          .bind(
            auth.user.id,
            roomId,
            seatNumber
          )
          .run();
        return json({
          success: true,
          seat_number: seatNumber
        });
      } catch (e) {
        return fail(
          e.message,
          500
        );
      }
    }
    /* =====================================================
       LEAVE SEAT
    ===================================================== */
    const seatLeaveMatch =
      url.pathname.match(
        /^\/api\/rooms\/(\d+)\/seats\/(\d+)\/leave$/
      );
    if (
      seatLeaveMatch &&
      request.method === "POST"
    ) {
      const auth =
        await requireUser();
      if (auth.error) {
        return auth.error;
      }
      const roomId =
        Number(seatLeaveMatch[1]);
      const seatNumber =
        Number(seatLeaveMatch[2]);
      try {
        await env.DB
          .prepare(`
            UPDATE room_seats
            SET
              user_id = NULL,
              is_muted = 0,
              joined_at = NULL
            WHERE room_id = ?
              AND seat_number = ?
              AND user_id = ?
          `)
          .bind(
            roomId,
            seatNumber,
            auth.user.id
          )
          .run();
        return json({
          success: true
        });
      } catch (e) {
        return fail(
          e.message,
          500
        );
      }
    }
    /* =====================================================
       MICROPHONE
    ===================================================== */
    const micMatch =
      url.pathname.match(
        /^\/api\/rooms\/(\d+)\/seats\/(\d+)\/mic$/
      );
    if (
      micMatch &&
      request.method === "POST"
    ) {
      const auth =
        await requireUser();
      if (auth.error) {
        return auth.error;
      }
      const roomId =
        Number(micMatch[1]);
      const seatNumber =
        Number(micMatch[2]);
      const data =
        await body();
      const micOn =
        Boolean(data.mic_on);
      try {
        const result =
          await env.DB
            .prepare(`
              UPDATE room_seats
              SET is_muted = ?
              WHERE room_id = ?
                AND seat_number = ?
                AND user_id = ?
            `)
            .bind(
              micOn ? 0 : 1,
              roomId,
              seatNumber,
              auth.user.id
            )
            .run();
        if (!result.meta.changes) {
          return fail(
            "आप इस seat पर नहीं हैं।"
          );
        }
        return json({
          success: true,
          mic_on: micOn
        });
      } catch (e) {
        return fail(
          e.message,
          500
        );
      }
    }
    /* =====================================================
       ROOM CHAT - GET
    ===================================================== */
    const messagesGet =
      url.pathname.match(
        /^\/api\/rooms\/(\d+)\/messages$/
      );
    if (
      messagesGet &&
      request.method === "GET"
    ) {
      const roomId =
        Number(messagesGet[1]);
      try {
        const result =
          await env.DB
            .prepare(`
              SELECT
                room_messages.id,
                room_messages.room_id,
                room_messages.user_id,
                room_messages.message,
                room_messages.message_type,
                room_messages.created_at,
                users.name,
                users.username,
                users.avatar_url
              FROM room_messages
              INNER JOIN users
                ON users.id =
                   room_messages.user_id
              WHERE room_messages.room_id = ?
              ORDER BY room_messages.id DESC
              LIMIT 100
            `)
            .bind(roomId)
            .all();
        const messages =
          (result.results || [])
            .reverse();
        return json({
          success: true,
          messages
        });
      } catch (e) {
        return fail(
          e.message,
          500
        );
      }
    }
    /* =====================================================
       ROOM CHAT - SEND
    ===================================================== */
    if (
      messagesGet &&
      request.method === "POST"
    ) {
      const auth =
        await requireUser();
      if (auth.error) {
        return auth.error;
      }
      const roomId =
        Number(messagesGet[1]);
      const data =
        await body();
      const message =
        String(data.message || "")
          .trim()
          .slice(0, 500);
      if (!message) {
        return fail(
          "Message खाली नहीं हो सकता।"
        );
      }
      try {
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
              auth.user.id
            )
            .first();
        if (!member) {
          return fail(
            "Room में join करें।",
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
              auth.user.id,
              message
            )
            .run();
        return json({
          success: true,
          message_id:
            result.meta.last_row_id
        });
      } catch (e) {
        return fail(
          e.message,
          500
        );
      }
    }
    /* =====================================================
       REACTION
    ===================================================== */
    const reactionMatch =
      url.pathname.match(
        /^\/api\/rooms\/(\d+)\/reactions$/
      );
    if (
      reactionMatch &&
      request.method === "POST"
    ) {
      const auth =
        await requireUser();
      if (auth.error) {
        return auth.error;
      }
      const roomId =
        Number(reactionMatch[1]);
      const data =
        await body();
      const emoji =
        String(data.emoji || "❤️")
          .slice(0, 20);
      try {
        await env.DB
          .prepare(`
            INSERT INTO room_reactions
            (
              room_id,
              user_id,
              reaction
            )
            VALUES (?, ?, ?)
          `)
          .bind(
            roomId,
            auth.user.id,
            emoji
          )
          .run();
        return json({
          success: true
        });
      } catch (e) {
        return fail(
          e.message,
          500
        );
      }
    }
    /* =====================================================
       MUSIC - LIST
    ===================================================== */
    if (
      url.pathname === "/api/music" &&
      request.method === "GET"
    ) {
      try {
        const result =
          await env.DB
            .prepare(`
              SELECT
                id,
                title,
                artist,
                audio_url,
                cover_url
              FROM music_tracks
              WHERE is_active = 1
              ORDER BY title
              LIMIT 200
            `)
            .all();
        return json({
          success: true,
          tracks:
            result.results || []
        });
      } catch (e) {
        return fail(
          e.message,
          500
        );
      }
    }
    /* =====================================================
       ROOM MUSIC - CURRENT
    ===================================================== */
    const musicRoomMatch =
      url.pathname.match(
        /^\/api\/rooms\/(\d+)\/music$/
      );
    if (
      musicRoomMatch &&
      request.method === "GET"
    ) {
      const roomId =
        Number(musicRoomMatch[1]);
      try {
        const music =
          await env.DB
            .prepare(`
              SELECT
                room_music.id,
                room_music.room_id,
                room_music.track_id,
                room_music.is_playing,
                room_music.started_at,
                room_music.stopped_at,
                music_tracks.title,
                music_tracks.artist,
                music_tracks.audio_url,
                music_tracks.cover_url
              FROM room_music
              INNER JOIN music_tracks
                ON music_tracks.id =
                   room_music.track_id
              WHERE room_music.room_id = ?
              ORDER BY room_music.id DESC
              LIMIT 1
            `)
            .bind(roomId)
            .first();
        return json({
          success: true,
          music: music || null
        });
      } catch (e) {
        return fail(
          e.message,
          500
        );
      }
    }
    /* =====================================================
       PLAY MUSIC
    ===================================================== */
    if (
      musicRoomMatch &&
      request.method === "POST"
    ) {
      const auth =
        await requireUser();
      if (auth.error) {
        return auth.error;
      }
      const roomId =
        Number(musicRoomMatch[1]);
      const data =
        await body();
      const trackId =
        Number(data.track_id);
      if (!trackId) {
        return fail(
          "track_id जरूरी है।"
        );
      }
      try {
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
              auth.user.id
            )
            .first();
        if (!member) {
          return fail(
            "Room join करें।",
            403
          );
        }
        const track =
          await env.DB
            .prepare(`
              SELECT id
              FROM music_tracks
              WHERE id = ?
                AND is_active = 1
              LIMIT 1
            `)
            .bind(trackId)
            .first();
        if (!track) {
          return fail(
            "Music track नहीं मिला।",
            404
          );
        }
        await env.DB
          .prepare(`
            UPDATE room_music
            SET
              is_playing = 0,
              stopped_at = CURRENT_TIMESTAMP
            WHERE room_id = ?
              AND is_playing = 1
          `)
          .bind(roomId)
          .run();
        const result =
          await env.DB
            .prepare(`
              INSERT INTO room_music
              (
                room_id,
                track_id,
                started_by,
                is_playing,
                started_at
              )
              VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
            `)
            .bind(
              roomId,
              trackId,
              auth.user.id
            )
            .run();
        return json({
          success: true,
          music_id:
            result.meta.last_row_id
        });
      } catch (e) {
        return fail(
          e.message,
          500
        );
      }
    }
    /* =====================================================
       STOP MUSIC
    ===================================================== */
    const stopMusicMatch =
      url.pathname.match(
        /^\/api\/rooms\/(\d+)\/music\/stop$/
      );
    if (
      stopMusicMatch &&
      request.method === "POST"
    ) {
      const auth =
        await requireUser();
      if (auth.error) {
        return auth.error;
      }
      const roomId =
        Number(stopMusicMatch[1]);
      try {
        await env.DB
          .prepare(`
            UPDATE room_music
            SET
              is_playing = 0,
              stopped_at = CURRENT_TIMESTAMP
            WHERE room_id = ?
              AND is_playing = 1
          `)
          .bind(roomId)
          .run();
        return json({
          success: true
        });
      } catch (e) {
        return fail(
          e.message,
          500
        );
      }
    }
    /* =====================================================
       GIFTS - LIST
    ===================================================== */
    if (
      url.pathname === "/api/gifts" &&
      request.method === "GET"
    ) {
      try {
        const result =
          await env.DB
            .prepare(`
              SELECT
                id,
                name,
                icon_url,
                coin_cost
              FROM gifts
              WHERE is_active = 1
              ORDER BY coin_cost
            `)
            .all();
        return json({
          success: true,
          gifts:
            result.results || []
        });
      } catch (e) {
        return fail(
          e.message,
          500
        );
      }
    }
    /* =====================================================
       SUPPORT TICKET
    ===================================================== */
    if (
      url.pathname === "/api/support" &&
      request.method === "POST"
    ) {
      const auth =
        await requireUser();
      if (auth.error) {
        return auth.error;
      }
      const data =
        await body();
      const subject =
        String(data.subject || "")
          .trim()
          .slice(0, 150);
      const message =
        String(data.message || "")
          .trim()
          .slice(0, 2000);
      if (!subject || !message) {
        return fail(
          "Subject और message जरूरी हैं।"
        );
      }
      try {
        const result =
          await env.DB
            .prepare(`
              INSERT INTO support_tickets
              (
                user_id,
                subject,
                message,
                status
              )
              VALUES (?, ?, ?, 'open')
            `)
            .bind(
              auth.user.id,
              subject,
              message
            )
            .run();
        return json({
          success: true,
          ticket_id:
            result.meta.last_row_id,
          message:
            "Support request भेज दी गई है।"
        }, 201);
      } catch (e) {
        return fail(
          e.message,
          500
        );
      }
    }
    /* =====================================================
       404
    ===================================================== */
    return fail(
      "API endpoint not found.",
      404
    );
  }
};