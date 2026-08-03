export default {

  async fetch(request, env) {

    const url = new URL(request.url);

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods":
        "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization"
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
              "application/json"
          }
        }
      );
    }


    async function body() {

      try {
        return await request.json();
      } catch {
        return {};
      }

    }


    async function hashPassword(password) {

      const data =
        new TextEncoder().encode(password);

      const hash =
        await crypto.subtle.digest(
          "SHA-256",
          data
        );

      return [...new Uint8Array(hash)]
        .map(
          b => b.toString(16).padStart(2, "0")
        )
        .join("");
    }


    function token() {

      return crypto.randomUUID() +
        "-" +
        crypto.randomUUID();

    }


    async function auth() {

      const header =
        request.headers.get(
          "Authorization"
        );

      if (!header) return null;

      const tokenValue =
        header.replace(
          /^Bearer\s+/i,
          ""
        ).trim();

      if (!tokenValue) return null;

      const result =
        await env.DB.prepare(`
          SELECT
            sessions.user_id,
            users.id,
            users.name,
            users.email,
            users.username,
            users.avatar_url,
            users.bio,
            users.coins,
            users.is_online
          FROM sessions
          JOIN users
            ON users.id = sessions.user_id
          WHERE sessions.token = ?
          AND (
            sessions.expires_at IS NULL
            OR sessions.expires_at > CURRENT_TIMESTAMP
          )
          LIMIT 1
        `)
        .bind(tokenValue)
        .first();

      return result || null;
    }


    async function setup() {

      await env.DB.batch([

        env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            username TEXT UNIQUE,
            avatar_url TEXT,
            bio TEXT DEFAULT '',
            coins INTEGER NOT NULL DEFAULT 0,
            is_online INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `),

        env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL UNIQUE,
            expires_at TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `),

        env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            room_type TEXT DEFAULT 'public',
            status TEXT DEFAULT 'live',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `),

        env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS room_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            left_at TEXT
          )
        `),

        env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS room_seats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id INTEGER NOT NULL,
            seat_number INTEGER NOT NULL,
            user_id INTEGER,
            is_muted INTEGER NOT NULL DEFAULT 1,
            joined_at TEXT,
            UNIQUE(room_id, seat_number)
          )
        `),

        env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS room_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `),

        env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS room_reactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            emoji TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `),

        env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS live_viewers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            left_at TEXT
          )
        `),

        env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS gifts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            coin_cost INTEGER NOT NULL DEFAULT 0,
            image_url TEXT
          )
        `),

        env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS gift_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id INTEGER NOT NULL,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER,
            gift_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `),

        env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS music_tracks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            artist TEXT DEFAULT '',
            audio_url TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `),

        env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS room_music (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id INTEGER NOT NULL,
            track_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `),

        env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS support_tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'open',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `)

      ]);

      /*
        हर room के लिए 8 fixed seats.
      */

      const rooms =
        await env.DB.prepare(`
          SELECT id
          FROM rooms
        `).all();

      for (
        const room of
        (rooms.results || [])
      ) {

        const statements = [];

        for (
          let seat = 1;
          seat <= 8;
          seat++
        ) {

          statements.push(
            env.DB.prepare(`
              INSERT OR IGNORE INTO
              room_seats
              (
                room_id,
                seat_number,
                user_id,
                is_muted
              )
              VALUES (?, ?, NULL, 1)
            `)
            .bind(
              room.id,
              seat
            )
          );

        }

        if (statements.length) {
          await env.DB.batch(
            statements
          );
        }

      }

    }


    try {

      await setup();


      /* =========================================
         HOME
      ========================================= */

      if (
        url.pathname === "/" &&
        request.method === "GET"
      ) {

        return json({
          success: true,
          service: "Rahul Live API",
          status: "running"
        });

      }


      /* =========================================
         DATABASE TEST
      ========================================= */

      if (
        url.pathname === "/api/test" &&
        request.method === "GET"
      ) {

        const result =
          await env.DB.prepare(`
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

      }


      /* =========================================
         REGISTER
      ========================================= */

      if (
        url.pathname === "/api/register" &&
        request.method === "POST"
      ) {

        const data =
          await body();

        const name =
          String(data.name || "")
            .trim();

        const email =
          String(data.email || "")
            .trim()
            .toLowerCase();

        const password =
          String(data.password || "");

        if (
          !name ||
          !email ||
          !password
        ) {

          return json({
            success: false,
            message:
              "Name, email और password जरूरी हैं।"
          }, 400);

        }

        if (password.length < 6) {

          return json({
            success: false,
            message:
              "Password कम से कम 6 characters का होना चाहिए।"
          }, 400);

        }

        const existing =
          await env.DB.prepare(`
            SELECT id
            FROM users
            WHERE email = ?
            LIMIT 1
          `)
          .bind(email)
          .first();

        if (existing) {

          return json({
            success: false,
            message:
              "यह email पहले से registered है।"
          }, 409);

        }

        const username =
          "rahul_" +
          Math.random()
            .toString(36)
            .slice(2, 9);

        const passwordHash =
          await hashPassword(
            password
          );

        const result =
          await env.DB.prepare(`
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
            RETURNING
              id,
              name,
              email,
              username,
              avatar_url,
              bio,
              coins,
              is_online
          `)
          .bind(
            name,
            email,
            passwordHash,
            username
          )
          .first();

        return json({
          success: true,
          message:
            "Registration successful.",
          user: result
        });

      }


      /* =========================================
         LOGIN
      ========================================= */

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

        if (
          !email ||
          !password
        ) {

          return json({
            success: false,
            message:
              "Email और password डालें।"
          }, 400);

        }

        const passwordHash =
          await hashPassword(
            password
          );

        const user =
          await env.DB.prepare(`
            SELECT
              id,
              name,
              email,
              username,
              avatar_url,
              bio,
              coins,
              is_online
            FROM users
            WHERE email = ?
            AND password_hash = ?
            LIMIT 1
          `)
          .bind(
            email,
            passwordHash
          )
          .first();

        if (!user) {

          return json({
            success: false,
            message:
              "Email या password गलत है।"
          }, 401);

        }

        const sessionToken =
          token();

        await env.DB.prepare(`
          INSERT INTO sessions
          (
            user_id,
            token,
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
          sessionToken
        )
        .run();

        await env.DB.prepare(`
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
          token: sessionToken,
          user: {
            ...user,
            is_online: 1
          }
        });

      }


      /* =========================================
         ME
      ========================================= */

      if (
        url.pathname === "/api/me" &&
        request.method === "GET"
      ) {

        const user =
          await auth();

        if (!user) {

          return json({
            success: false,
            message:
              "Login required."
          }, 401);

        }

        return json({
          success: true,
          user
        });

      }


      /* =========================================
         LOGOUT
      ========================================= */

      if (
        url.pathname === "/api/logout" &&
        request.method === "POST"
      ) {

        const user =
          await auth();

        const authorization =
          request.headers.get(
            "Authorization"
          );

        const sessionToken =
          authorization
            ?.replace(
              /^Bearer\s+/i,
              ""
            )
            .trim();

        if (sessionToken) {

          await env.DB.prepare(`
            DELETE FROM sessions
            WHERE token = ?
          `)
          .bind(
            sessionToken
          )
          .run();

        }

        if (user) {

          await env.DB.prepare(`
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
          message:
            "Logout successful."
        });

      }


      /* =========================================
         AUTH CHECK
      ========================================= */

      const user =
        await auth();

      if (!user) {

        return json({
          success: false,
          message:
            "Login required."
        }, 401);

      }


      /* =========================================
         CREATE ROOM
      ========================================= */

      if (
        url.pathname === "/api/rooms" &&
        request.method === "POST"
      ) {

        const data =
          await body();

        const name =
          String(data.name || "")
            .trim();

        const description =
          String(
            data.description || ""
          ).trim();

        const roomType =
          String(
            data.room_type || "public"
          );

        if (!name) {

          return json({
            success: false,
            message:
              "Room name जरूरी है।"
          }, 400);

        }

        const result =
          await env.DB.prepare(`
            INSERT INTO rooms
            (
              owner_id,
              name,
              description,
              room_type,
              status
            )
            VALUES (?, ?, ?, ?, 'live')
            RETURNING id
          `)
          .bind(
            user.id,
            name,
            description,
            roomType
          )
          .first();

        const roomId =
          result.id;

        const seatStatements = [];

        for (
          let seat = 1;
          seat <= 8;
          seat++
        ) {

          seatStatements.push(
            env.DB.prepare(`
              INSERT INTO room_seats
              (
                room_id,
                seat_number,
                user_id,
                is_muted
              )
              VALUES (?, ?, NULL, 1)
            `)
            .bind(
              roomId,
              seat
            )
          );

        }

        await env.DB.batch(
          seatStatements
        );

        await env.DB.prepare(`
          INSERT INTO room_members
          (
            room_id,
            user_id
          )
          VALUES (?, ?)
        `)
        .bind(
          roomId,
          user.id
        )
        .run();

        await env.DB.prepare(`
          INSERT INTO live_viewers
          (
            room_id,
            user_id
          )
          VALUES (?, ?)
        `)
        .bind(
          roomId,
          user.id
        )
        .run();

        return json({
          success: true,
          room_id: roomId
        });

      }


      /* =========================================
         ROOM LIST
      ========================================= */

      if (
        url.pathname === "/api/rooms" &&
        request.method === "GET"
      ) {

        const result =
          await env.DB.prepare(`
            SELECT
              r.id,
              r.name,
              r.description,
              r.room_type,
              r.status,
              r.owner_id,
              (
                SELECT COUNT(*)
                FROM live_viewers v
                WHERE v.room_id = r.id
                AND v.left_at IS NULL
              ) AS viewer_count
            FROM rooms r
            WHERE r.status = 'live'
            ORDER BY r.id DESC
          `)
          .all();

        return json({
          success: true,
          rooms:
            result.results || []
        });

      }


      /* =========================================
         ROOM DETAILS
      ========================================= */

      const roomMatch =
        url.pathname.match(
          /^\/api\/rooms\/(\d+)$/
        );

      if (
        roomMatch &&
        request.method === "GET"
      ) {

        const roomId =
          Number(
            roomMatch[1]
          );

        const room =
          await env.DB.prepare(`
            SELECT
              r.id,
              r.name,
              r.description,
              r.room_type,
              r.status,
              r.owner_id,
              (
                SELECT COUNT(*)
                FROM live_viewers v
                WHERE v.room_id = r.id
                AND v.left_at IS NULL
              ) AS viewer_count
            FROM rooms r
            WHERE r.id = ?
            LIMIT 1
          `)
          .bind(roomId)
          .first();

        if (!room) {

          return json({
            success: false,
            message:
              "Room नहीं मिला।"
          }, 404);

        }

        const seats =
          await env.DB.prepare(`
            SELECT
              s.seat_number,
              s.user_id,
              s.is_muted,
              s.joined_at,
              u.name,
              u.username,
              u.avatar_url
            FROM room_seats s
            LEFT JOIN users u
              ON u.id = s.user_id
            WHERE s.room_id = ?
            ORDER BY s.seat_number
          `)
          .bind(roomId)
          .all();

        return json({
          success: true,
          room,
          seats:
            seats.results || []
        });

      }


      /* =========================================
         JOIN ROOM
      ========================================= */

      const joinMatch =
        url.pathname.match(
          /^\/api\/rooms\/(\d+)\/join$/
        );

      if (
        joinMatch &&
        request.method === "POST"
      ) {

        const roomId =
          Number(
            joinMatch[1]
          );

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
            message:
              "Room नहीं मिला।"
          }, 404);

        }

        await env.DB.prepare(`
          UPDATE room_members
          SET left_at = CURRENT_TIMESTAMP
          WHERE room_id = ?
          AND user_id = ?
          AND left_at IS NULL
        `)
        .bind(
          roomId,
          user.id
        )
        .run();

        await env.DB.prepare(`
          INSERT INTO room_members
          (
            room_id,
            user_id
          )
          VALUES (?, ?)
        `)
        .bind(
          roomId,
          user.id
        )
        .run();

        await env.DB.prepare(`
          UPDATE live_viewers
          SET left_at = CURRENT_TIMESTAMP
          WHERE room_id = ?
          AND user_id = ?
          AND left_at IS NULL
        `)
        .bind(
          roomId,
          user.id
        )
        .run();

        await env.DB.prepare(`
          INSERT INTO live_viewers
          (
            room_id,
            user_id
          )
          VALUES (?, ?)
        `)
        .bind(
          roomId,
          user.id
        )
        .run();

        return json({
          success: true,
          message:
            "Room joined."
        });

      }


      /* =========================================
         LEAVE ROOM
      ========================================= */

      const leaveRoomMatch =
        url.pathname.match(
          /^\/api\/rooms\/(\d+)\/leave$/
        );

      if (
        leaveRoomMatch &&
        request.method === "POST"
      ) {

        const roomId =
          Number(
            leaveRoomMatch[1]
          );

        await env.DB.prepare(`
          UPDATE room_members
          SET left_at = CURRENT_TIMESTAMP
          WHERE room_id = ?
          AND user_id = ?
          AND left_at IS NULL
        `)
        .bind(
          roomId,
          user.id
        )
        .run();

        await env.DB.prepare(`
          UPDATE live_viewers
          SET left_at = CURRENT_TIMESTAMP
          WHERE room_id = ?
          AND user_id = ?
          AND left_at IS NULL
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
            is_muted = 1,
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
          message:
            "Room left."
        });

      }


      /* =========================================
         JOIN SEAT
      ========================================= */

      const seatJoinMatch =
        url.pathname.match(
          /^\/api\/rooms\/(\d+)\/seats\/(\d+)\/join$/
        );

      if (
        seatJoinMatch &&
        request.method === "POST"
      ) {

        const roomId =
          Number(
            seatJoinMatch[1]
          );

        const seatNumber =
          Number(
            seatJoinMatch[2]
          );

        if (
          seatNumber < 1 ||
          seatNumber > 8
        ) {

          return json({
            success: false,
            message:
              "Seat number 1 से 8 के बीच होना चाहिए।"
          }, 400);

        }

        const occupied =
          await env.DB.prepare(`
            SELECT user_id
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

        if (!occupied) {

          await env.DB.prepare(`
            INSERT INTO room_seats
            (
              room_id,
              seat_number,
              user_id,
              is_muted,
              joined_at
            )
            VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
          `)
          .bind(
            roomId,
            seatNumber,
            user.id
          )
          .run();

        } else if (
          occupied.user_id &&
          Number(occupied.user_id) !==
            Number(user.id)
        ) {

          return json({
            success: false,
            message:
              "यह seat पहले से occupied है।"
          }, 409);

        } else {

          await env.DB.prepare(`
            UPDATE room_seats
            SET
              user_id = ?,
              is_muted = 1,
              joined_at = CURRENT_TIMESTAMP
            WHERE room_id = ?
            AND seat_number = ?
          `)
          .bind(
            user.id,
            roomId,
            seatNumber
          )
          .run();

        }

        return json({
          success: true,
          seat_number:
            seatNumber
        });

      }


      /* =========================================
         LEAVE SEAT
      ========================================= */

      const seatLeaveMatch =
        url.pathname.match(
          /^\/api\/rooms\/(\d+)\/seats\/(\d+)\/leave$/
        );

      if (
        seatLeaveMatch &&
        request.method === "POST"
      ) {

        const roomId =
          Number(
            seatLeaveMatch[1]
          );

        const seatNumber =
          Number(
            seatLeaveMatch[2]
          );

        await env.DB.prepare(`
          UPDATE room_seats
          SET
            user_id = NULL,
            is_muted = 1,
            joined_at = NULL
          WHERE room_id = ?
          AND seat_number = ?
          AND user_id = ?
        `)
        .bind(
          roomId,
          seatNumber,
          user.id
        )
        .run();

        return json({
          success: true,
          message:
            "Seat left."
        });

      }


      /* =========================================
         MIC
      ========================================= */

      const micMatch =
        url.pathname.match(
          /^\/api\/rooms\/(\d+)\/seats\/(\d+)\/mic$/
        );

      if (
        micMatch &&
        request.method === "POST"
      ) {

        const roomId =
          Number(
            micMatch[1]
          );

        const seatNumber =
          Number(
            micMatch[2]
          );

        const data =
          await body();

        const micOn =
          Boolean(
            data.mic_on
          );

        await env.DB.prepare(`
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
          user.id
        )
        .run();

        return json({
          success: true,
          mic_on: micOn
        });

      }


      /* =========================================
         MESSAGES
      ========================================= */

      const messagesMatch =
        url.pathname.match(
          /^\/api\/rooms\/(\d+)\/messages$/
        );

      if (
        messagesMatch &&
        request.method === "GET"
      ) {

        const roomId =
          Number(
            messagesMatch[1]
          );

        const result =
          await env.DB.prepare(`
            SELECT
              m.id,
              m.room_id,
              m.user_id,
              m.message,
              m.created_at,
              u.name,
              u.username,
              u.avatar_url
            FROM room_messages m
            JOIN users u
              ON u.id = m.user_id
            WHERE m.room_id = ?
            ORDER BY m.id DESC
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

      }


      if (
        messagesMatch &&
        request.method === "POST"
      ) {

        const roomId =
          Number(
            messagesMatch[1]
          );

        const data =
          await body();

        const message =
          String(
            data.message || ""
          ).trim();

        if (!message) {

          return json({
            success: false,
            message:
              "Message खाली है।"
          }, 400);

        }

        if (message.length > 500) {

          return json({
            success: false,
            message:
              "Message बहुत लंबा है।"
          }, 400);

        }

        const result =
          await env.DB.prepare(`
            INSERT INTO room_messages
            (
              room_id,
              user_id,
              message
            )
            VALUES (?, ?, ?)
            RETURNING
              id,
              room_id,
              user_id,
              message,
              created_at
          `)
          .bind(
            roomId,
            user.id,
            message
          )
          .first();

        return json({
          success: true,
          message: result
        });

      }


      /* =========================================
         REACTIONS
      ========================================= */

      const reactionMatch =
        url.pathname.match(
          /^\/api\/rooms\/(\d+)\/reactions$/
        );

      if (
        reactionMatch &&
        request.method === "POST"
      ) {

        const roomId =
          Number(
            reactionMatch[1]
          );

        const data =
          await body();

        const emoji =
          String(
            data.emoji || ""
          ).trim();

        if (!emoji) {

          return json({
            success: false,
            message:
              "Reaction missing."
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
          success: true
        });

      }


      /* =========================================
         MUSIC LIST
      ========================================= */

      if (
        url.pathname === "/api/music" &&
        request.method === "GET"
      ) {

        const result =
          await env.DB.prepare(`
            SELECT
              id,
              title,
              artist,
              audio_url
            FROM music_tracks
            ORDER BY id DESC
          `)
          .all();

        return json({
          success: true,
          tracks:
            result.results || []
        });

      }


      /* =========================================
         ROOM MUSIC
      ========================================= */

      const roomMusicMatch =
        url.pathname.match(
          /^\/api\/rooms\/(\d+)\/music$/
        );

      if (
        roomMusicMatch &&
        request.method === "POST"
      ) {

        const roomId =
          Number(
            roomMusicMatch[1]
          );

        const data =
          await body();

        const trackId =
          Number(
            data.track_id
          );

        const track =
          await env.DB.prepare(`
            SELECT
              id,
              title,
              artist,
              audio_url
            FROM music_tracks
            WHERE id = ?
            LIMIT 1
          `)
          .bind(trackId)
          .first();

        if (!track) {

          return json({
            success: false,
            message:
              "Music track नहीं मिला।"
          }, 404);

        }

        await env.DB.prepare(`
          INSERT INTO room_music
          (
            room_id,
            track_id,
            user_id
          )
          VALUES (?, ?, ?)
        `)
        .bind(
          roomId,
          trackId,
          user.id
        )
        .run();

        return json({
          success: true,
          track
        });

      }


      /* =========================================
         GIFTS LIST
      ========================================= */

      if (
        url.pathname === "/api/gifts" &&
        request.method === "GET"
      ) {

        const result =
          await env.DB.prepare(`
            SELECT
              id,
              name,
              coin_cost,
              image_url
            FROM gifts
            ORDER BY coin_cost ASC, id ASC
          `)
          .all();

        return json({
          success: true,
          gifts:
            result.results || []
        });

      }


      /* =========================================
         SUPPORT
      ========================================= */

      if (
        url.pathname === "/api/support" &&
        request.method === "POST"
      ) {

        const data =
          await body();

        const subject =
          String(
            data.subject || ""
          ).trim();

        const message =
          String(
            data.message || ""
          ).trim();

        if (
          !subject ||
          !message
        ) {

          return json({
            success: false,
            message:
              "Subject और message जरूरी हैं।"
          }, 400);

        }

        await env.DB.prepare(`
          INSERT INTO support_tickets
          (
            user_id,
            subject,
            message
          )
          VALUES (?, ?, ?)
        `)
        .bind(
          user.id,
          subject,
          message
        )
        .run();

        return json({
          success: true,
          message:
            "Support request भेज दी गई।"
        });

      }


      /* =========================================
         NOT FOUND
      ========================================= */

      return json({
        success: false,
        message:
          "API endpoint नहीं मिला।"
      }, 404);


    } catch (error) {

      console.error(
        "Rahul Live API Error:",
        error
      );

      return json({
        success: false,
        message:
          error?.message ||
          "Server error."
      }, 500);

    }

  }

};