export default {

  async fetch(request, env) {

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {

      await initDatabase(env);

      /* =========================
         CORS
      ========================= */

      if (method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: corsHeaders()
        });
      }


      /* =========================
         BASIC
      ========================= */

      if (path === "/") {
        return json({
          success: true,
          service: "Rahul Live API",
          status: "running"
        });
      }


      if (path === "/api/test") {

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


      /* =========================
         REGISTER
      ========================= */

      if (
        path === "/api/register" &&
        method === "POST"
      ) {

        const body = await readJSON(request);

        const name =
          String(body.name || "").trim();

        const email =
          String(body.email || "")
            .trim()
            .toLowerCase();

        const password =
          String(body.password || "");

        if (!name || !email || !password) {
          return json({
            success: false,
            message: "Name, email और password जरूरी हैं।"
          }, 400);
        }

        if (password.length < 6) {
          return json({
            success: false,
            message: "Password कम से कम 6 characters का होना चाहिए।"
          }, 400);
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
          return json({
            success: false,
            message: "यह email पहले से registered है।"
          }, 409);
        }


        const passwordHash =
          await hashPassword(password);


        const username =
          await makeUsername(env, name);


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
          user_id: result.meta.last_row_id,
          username
        });
      }


      /* =========================
         LOGIN
      ========================= */

      if (
        path === "/api/login" &&
        method === "POST"
      ) {

        const body = await readJSON(request);

        const email =
          String(body.email || "")
            .trim()
            .toLowerCase();

        const password =
          String(body.password || "");


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
          return json({
            success: false,
            message: "Email या password गलत है।"
          }, 401);
        }


        const valid =
          await verifyPassword(
            password,
            user.password_hash
          );


        if (!valid) {
          return json({
            success: false,
            message: "Email या password गलत है।"
          }, 401);
        }


        const token =
          crypto.randomUUID() +
          "-" +
          crypto.randomUUID();


        await env.DB
          .prepare(`
            INSERT INTO sessions
            (
              token,
              user_id,
              created_at
            )
            VALUES (?, ?, CURRENT_TIMESTAMP)
          `)
          .bind(
            token,
            user.id
          )
          .run();


        await env.DB
          .prepare(`
            UPDATE users
            SET is_online = 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `)
          .bind(user.id)
          .run();


        return json({
          success: true,
          token,
          user: publicUser(user)
        });
      }


      /* =========================
         LOGOUT
      ========================= */

      if (
        path === "/api/logout" &&
        method === "POST"
      ) {

        const user =
          await authenticate(
            request,
            env
          );


        if (user) {

          await env.DB
            .prepare(`
              UPDATE users
              SET is_online = 0,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `)
            .bind(user.id)
            .run();


          const token =
            getToken(request);


          await env.DB
            .prepare(`
              DELETE FROM sessions
              WHERE token = ?
            `)
            .bind(token)
            .run();
        }


        return json({
          success: true,
          message: "Logged out."
        });
      }


      /* =========================
         CURRENT USER
      ========================= */

      if (
        path === "/api/me" &&
        method === "GET"
      ) {

        const user =
          await requireAuth(
            request,
            env
          );


        return json({
          success: true,
          user: publicUser(user)
        });
      }


      /* =========================
         ROOMS LIST
      ========================= */

      if (
        path === "/api/rooms" &&
        method === "GET"
      ) {

        const rooms =
          await env.DB
            .prepare(`
              SELECT
                r.*,
                u.name AS owner_name,
                u.avatar_url AS owner_avatar,
                (
                  SELECT COUNT(*)
                  FROM room_viewers rv
                  WHERE rv.room_id = r.id
                ) AS viewer_count
              FROM rooms r
              LEFT JOIN users u
                ON u.id = r.owner_id
              ORDER BY r.id DESC
            `)
            .all();


        return json({
          success: true,
          rooms: rooms.results || []
        });
      }


      /* =========================
         CREATE ROOM
      ========================= */

      if (
        path === "/api/rooms" &&
        method === "POST"
      ) {

        const user =
          await requireAuth(
            request,
            env
          );


        const body =
          await readJSON(request);


        const name =
          String(body.name || "")
            .trim();

        const description =
          String(body.description || "")
            .trim();

        const roomType =
          body.room_type === "private"
            ? "private"
            : "public";


        if (!name) {
          return json({
            success: false,
            message: "Room name जरूरी है।"
          }, 400);
        }


        const result =
          await env.DB
            .prepare(`
              INSERT INTO rooms
              (
                owner_id,
                name,
                description,
                room_type,
                created_at
              )
              VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            `)
            .bind(
              user.id,
              name,
              description,
              roomType
            )
            .run();


        const roomId =
          result.meta.last_row_id;


        /* Host automatically joins */

        await env.DB
          .prepare(`
            INSERT OR IGNORE INTO room_members
            (
              room_id,
              user_id,
              joined_at
            )
            VALUES (?, ?, CURRENT_TIMESTAMP)
          `)
          .bind(
            roomId,
            user.id
          )
          .run();


        await env.DB
          .prepare(`
            INSERT OR IGNORE INTO room_viewers
            (
              room_id,
              user_id,
              joined_at
            )
            VALUES (?, ?, CURRENT_TIMESTAMP)
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
        });
      }


      /* =========================
         ROOM DETAILS
      ========================= */

      const roomMatch =
        path.match(
          /^\/api\/rooms\/(\d+)$/
        );


      if (
        roomMatch &&
        method === "GET"
      ) {

        const roomId =
          Number(roomMatch[1]);


        await requireAuth(
          request,
          env
        );


        const room =
          await env.DB
            .prepare(`
              SELECT
                r.*,
                u.name AS owner_name,
                u.avatar_url AS owner_avatar
              FROM rooms r
              LEFT JOIN users u
                ON u.id = r.owner_id
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
          await env.DB
            .prepare(`
              SELECT
                rs.*,
                u.name,
                u.username,
                u.avatar_url
              FROM room_seats rs
              LEFT JOIN users u
                ON u.id = rs.user_id
              WHERE rs.room_id = ?
              ORDER BY rs.seat_number
            `)
            .bind(roomId)
            .all();


        return json({
          success: true,
          room,
          seats: seats.results || []
        });
      }


      /* =========================
         JOIN ROOM
      ========================= */

      const joinMatch =
        path.match(
          /^\/api\/rooms\/(\d+)\/join$/
        );


      if (
        joinMatch &&
        method === "POST"
      ) {

        const roomId =
          Number(joinMatch[1]);

        const user =
          await requireAuth(
            request,
            env
          );


        const room =
          await env.DB
            .prepare(`
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


        await env.DB
          .prepare(`
            INSERT OR IGNORE INTO room_members
            (
              room_id,
              user_id,
              joined_at
            )
            VALUES (?, ?, CURRENT_TIMESTAMP)
          `)
          .bind(
            roomId,
            user.id
          )
          .run();


        await env.DB
          .prepare(`
            INSERT OR IGNORE INTO room_viewers
            (
              room_id,
              user_id,
              joined_at
            )
            VALUES (?, ?, CURRENT_TIMESTAMP)
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


      /* =========================
         LEAVE ROOM
      ========================= */

      const leaveMatch =
        path.match(
          /^\/api\/rooms\/(\d+)\/leave$/
        );


      if (
        leaveMatch &&
        method === "POST"
      ) {

        const roomId =
          Number(leaveMatch[1]);

        const user =
          await requireAuth(
            request,
            env
          );


        await env.DB
          .prepare(`
            DELETE FROM room_viewers
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
            DELETE FROM room_seats
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


      /* =========================
         ROOM SEATS
      ========================= */

      const seatsMatch =
        path.match(
          /^\/api\/rooms\/(\d+)\/seats$/
        );


      if (
        seatsMatch &&
        method === "GET"
      ) {

        const roomId =
          Number(seatsMatch[1]);


        await requireAuth(
          request,
          env
        );


        const seats =
          await env.DB
            .prepare(`
              SELECT
                rs.*,
                u.name,
                u.username,
                u.avatar_url
              FROM room_seats rs
              LEFT JOIN users u
                ON u.id = rs.user_id
              WHERE rs.room_id = ?
              ORDER BY rs.seat_number
            `)
            .bind(roomId)
            .all();


        return json({
          success: true,
          seats: seats.results || []
        });
      }


      /* =========================
         JOIN SEAT
      ========================= */

      const seatJoinMatch =
        path.match(
          /^\/api\/rooms\/(\d+)\/seats\/(\d+)\/join$/
        );


      if (
        seatJoinMatch &&
        method === "POST"
      ) {

        const roomId =
          Number(seatJoinMatch[1]);

        const seatNumber =
          Number(seatJoinMatch[2]);


        const user =
          await requireAuth(
            request,
            env
          );


        if (
          seatNumber < 1 ||
          seatNumber > 8
        ) {
          return json({
            success: false,
            message: "Invalid seat."
          }, 400);
        }


        const already =
          await env.DB
            .prepare(`
              SELECT id
              FROM room_seats
              WHERE room_id = ?
                AND user_id = ?
              LIMIT 1
            `)
            .bind(
              roomId,
              user.id
            )
            .first();


        if (already) {
          return json({
            success: false,
            message: "आप पहले से एक seat पर हैं।"
          }, 409);
        }


        const occupied =
          await env.DB
            .prepare(`
              SELECT id
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


        if (occupied) {
          return json({
            success: false,
            message: "यह seat अभी occupied है।"
          }, 409);
        }


        await env.DB
          .prepare(`
            INSERT INTO room_seats
            (
              room_id,
              seat_number,
              user_id,
              is_muted,
              joined_at
            )
            VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
          `)
          .bind(
            roomId,
            seatNumber,
            user.id
          )
          .run();


        return json({
          success: true,
          message: "Seat joined."
        });
      }


      /* =========================
         LEAVE SEAT
      ========================= */

      const seatLeaveMatch =
        path.match(
          /^\/api\/rooms\/(\d+)\/seats\/(\d+)\/leave$/
        );


      if (
        seatLeaveMatch &&
        method === "POST"
      ) {

        const roomId =
          Number(seatLeaveMatch[1]);

        const seatNumber =
          Number(seatLeaveMatch[2]);


        const user =
          await requireAuth(
            request,
            env
          );


        await env.DB
          .prepare(`
            DELETE FROM room_seats
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
          message: "Seat left."
        });
      }


      /* =========================
         MIC
      ========================= */

      const micMatch =
        path.match(
          /^\/api\/rooms\/(\d+)\/seats\/(\d+)\/mic$/
        );


      if (
        micMatch &&
        method === "POST"
      ) {

        const roomId =
          Number(micMatch[1]);

        const seatNumber =
          Number(micMatch[2]);


        const user =
          await requireAuth(
            request,
            env
          );


        const body =
          await readJSON(request);


        const micOn =
          Boolean(body.mic_on);


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
            user.id
          )
          .run();


        return json({
          success: true,
          mic_on: micOn
        });
      }


      /* =========================
         CHAT MESSAGE LIST
      ========================= */

      const messagesMatch =
        path.match(
          /^\/api\/rooms\/(\d+)\/messages$/
        );


      if (
        messagesMatch &&
        method === "GET"
      ) {

        const roomId =
          Number(messagesMatch[1]);


        await requireAuth(
          request,
          env
        );


        const result =
          await env.DB
            .prepare(`
              SELECT
                rm.*,
                u.name,
                u.username,
                u.avatar_url
              FROM room_messages rm
              LEFT JOIN users u
                ON u.id = rm.user_id
              WHERE rm.room_id = ?
              ORDER BY rm.id ASC
              LIMIT 100
            `)
            .bind(roomId)
            .all();


        return json({
          success: true,
          messages:
            result.results || []
        });
      }


      /* =========================
         SEND CHAT
      ========================= */

      if (
        messagesMatch &&
        method === "POST"
      ) {

        const roomId =
          Number(messagesMatch[1]);


        const user =
          await requireAuth(
            request,
            env
          );


        const body =
          await readJSON(request);


        const message =
          String(body.message || "")
            .trim();


        if (!message) {
          return json({
            success: false,
            message: "Message खाली है।"
          }, 400);
        }


        if (message.length > 500) {
          return json({
            success: false,
            message: "Message बहुत लंबा है।"
          }, 400);
        }


        await env.DB
          .prepare(`
            INSERT INTO room_messages
            (
              room_id,
              user_id,
              message,
              created_at
            )
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          `)
          .bind(
            roomId,
            user.id,
            message
          )
          .run();


        return json({
          success: true,
          message: "Message sent."
        });
      }


      /* =========================
         REACTION
      ========================= */

      const reactionMatch =
        path.match(
          /^\/api\/rooms\/(\d+)\/reactions$/
        );


      if (
        reactionMatch &&
        method === "POST"
      ) {

        const roomId =
          Number(reactionMatch[1]);


        const user =
          await requireAuth(
            request,
            env
          );


        const body =
          await readJSON(request);


        const emoji =
          String(body.emoji || "")
            .trim();


        if (!emoji) {
          return json({
            success: false,
            message: "Reaction missing."
          }, 400);
        }


        await env.DB
          .prepare(`
            INSERT INTO room_reactions
            (
              room_id,
              user_id,
              reaction,
              created_at
            )
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
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


      /* =========================
         MUSIC LIST
      ========================= */

      if (
        path === "/api/music" &&
        method === "GET"
      ) {

        await requireAuth(
          request,
          env
        );


        const result =
          await env.DB
            .prepare(`
              SELECT *
              FROM music_tracks
              WHERE is_active = 1
              ORDER BY id DESC
            `)
            .all();


        return json({
          success: true,
          tracks:
            result.results || []
        });
      }


      /* =========================
         ROOM MUSIC
      ========================= */

      const musicMatch =
        path.match(
          /^\/api\/rooms\/(\d+)\/music$/
        );


      if (
        musicMatch &&
        method === "POST"
      ) {

        const roomId =
          Number(musicMatch[1]);


        const user =
          await requireAuth(
            request,
            env
          );


        const body =
          await readJSON(request);


        const trackId =
          Number(body.track_id);


        const track =
          await env.DB
            .prepare(`
              SELECT *
              FROM music_tracks
              WHERE id = ?
                AND is_active = 1
              LIMIT 1
            `)
            .bind(trackId)
            .first();


        if (!track) {
          return json({
            success: false,
            message: "Music track नहीं मिला।"
          }, 404);
        }


        await env.DB
          .prepare(`
            INSERT INTO room_music
            (
              room_id,
              track_id,
              started_by,
              started_at
            )
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
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


      /* =========================
         GIFTS
      ========================= */

      if (
        path === "/api/gifts" &&
        method === "GET"
      ) {

        await requireAuth(
          request,
          env
        );


        const result =
          await env.DB
            .prepare(`
              SELECT *
              FROM gifts
              WHERE is_active = 1
              ORDER BY coin_cost ASC
            `)
            .all();


        return json({
          success: true,
          gifts:
            result.results || []
        });
      }


      /* =========================
         SUPPORT
      ========================= */

      if (
        path === "/api/support" &&
        method === "POST"
      ) {

        const user =
          await requireAuth(
            request,
            env
          );


        const body =
          await readJSON(request);


        const subject =
          String(body.subject || "")
            .trim();

        const message =
          String(body.message || "")
            .trim();


        if (!subject || !message) {
          return json({
            success: false,
            message: "Subject और message जरूरी हैं।"
          }, 400);
        }


        const result =
          await env.DB
            .prepare(`
              INSERT INTO support_tickets
              (
                user_id,
                subject,
                status,
                created_at
              )
              VALUES (?, ?, 'open', CURRENT_TIMESTAMP)
            `)
            .bind(
              user.id,
              subject
            )
            .run();


        await env.DB
          .prepare(`
            INSERT INTO support_messages
            (
              ticket_id,
              user_id,
              message,
              created_at
            )
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          `)
          .bind(
            result.meta.last_row_id,
            user.id,
            message
          )
          .run();


        return json({
          success: true,
          message:
            "आपकी support request भेज दी गई है।",
          ticket_id:
            result.meta.last_row_id
        });
      }


      /* =========================
         NOT FOUND
      ========================= */

      return json({
        success: false,
        message: "API endpoint नहीं मिला।"
      }, 404);


    } catch (error) {

      console.error(error);

      return json({
        success: false,
        message:
          error?.message ||
          "Server error."
      }, 500);
    }
  }
};


/* =====================================================
   DATABASE INITIALIZATION
===================================================== */

async function initDatabase(env) {

  const statements = [

    `
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      room_type TEXT NOT NULL DEFAULT 'public',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS room_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(room_id,user_id)
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS room_viewers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(room_id,user_id)
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS room_seats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      seat_number INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      is_muted INTEGER NOT NULL DEFAULT 0,
      joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(room_id,seat_number),
      UNIQUE(room_id,user_id)
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS room_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS room_reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      reaction TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS music_tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist TEXT DEFAULT '',
      audio_url TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS room_music (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      track_id INTEGER NOT NULL,
      started_by INTEGER NOT NULL,
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS gifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      coin_cost INTEGER NOT NULL DEFAULT 0,
      image_url TEXT DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS gift_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      gift_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      coins INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS support_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS support_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    `
  ];


  for (const sql of statements) {

    await env.DB
      .prepare(sql)
      .run();

  }


  /* Useful indexes */

  const indexes = [

    `
    CREATE INDEX IF NOT EXISTS
    idx_sessions_token
    ON sessions(token)
    `,

    `
    CREATE INDEX IF NOT EXISTS
    idx_room_messages_room
    ON room_messages(room_id,id)
    `,

    `
    CREATE INDEX IF NOT EXISTS
    idx_room_viewers_room
    ON room_viewers(room_id)
    `,

    `
    CREATE INDEX IF NOT EXISTS
    idx_room_seats_room
    ON room_seats(room_id)
    `

  ];


  for (const sql of indexes) {

    await env.DB
      .prepare(sql)
      .run();

  }

}


/* =====================================================
   AUTH
===================================================== */

async function authenticate(request, env) {

  const token =
    getToken(request);


  if (!token) {
    return null;
  }


  const result =
    await env.DB
      .prepare(`
        SELECT u.*
        FROM sessions s
        JOIN users u
          ON u.id = s.user_id
        WHERE s.token = ?
        LIMIT 1
      `)
      .bind(token)
      .first();


  return result || null;
}


async function requireAuth(request, env) {

  const user =
    await authenticate(
      request,
      env
    );


  if (!user) {
    throw new HTTPError(
      "Login required.",
      401
    );
  }


  return user;
}


function getToken(request) {

  const auth =
    request.headers.get(
      "Authorization"
    );


  if (
    auth &&
    auth.startsWith("Bearer ")
  ) {
    return auth.slice(7).trim();
  }


  return null;
}


/* =====================================================
   PASSWORD
===================================================== */

async function hashPassword(password) {

  const encoder =
    new TextEncoder();


  const data =
    encoder.encode(password);


  const hash =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );


  return [...new Uint8Array(hash)]
    .map(
      byte =>
        byte
          .toString(16)
          .padStart(2, "0")
    )
    .join("");
}


async function verifyPassword(
  password,
  storedHash
) {

  const hash =
    await hashPassword(password);


  return hash === storedHash;
}


/* =====================================================
   USERNAME
===================================================== */

async function makeUsername(
  env,
  name
) {

  let base =
    name
      .toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        ""
      )
      .slice(0, 20);


  if (!base) {
    base = "user";
  }


  let username = base;


  for (let i = 0; i < 100; i++) {

    const exists =
      await env.DB
        .prepare(`
          SELECT id
          FROM users
          WHERE username = ?
          LIMIT 1
        `)
        .bind(username)
        .first();


    if (!exists) {
      return username;
    }


    username =
      base +
      Math.floor(
        1000 + Math.random() * 9000
      );
  }


  return (
    "user" +
    Date.now()
  );
}


/* =====================================================
   PUBLIC USER
===================================================== */

function publicUser(user) {

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    avatar_url: user.avatar_url || "",
    bio: user.bio || "",
    coins: Number(user.coins || 0),
    is_online:
      Number(user.is_online || 0)
  };
}


/* =====================================================
   JSON
===================================================== */

function json(
  data,
  status = 200
) {

  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
        ...corsHeaders()
      }
    }
  );
}


function corsHeaders() {

  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization",
    "Access-Control-Allow-Methods":
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Cache-Control":
      "no-store"
  };

}


/* =====================================================
   REQUEST JSON
===================================================== */

async function readJSON(request) {

  try {

    return await request.json();

  } catch {

    throw new HTTPError(
      "Invalid JSON request.",
      400
    );

  }

}


/* =====================================================
   HTTP ERROR
===================================================== */

class HTTPError extends Error {

  constructor(
    message,
    status
  ) {

    super(message);

    this.status =
      status;

  }

}