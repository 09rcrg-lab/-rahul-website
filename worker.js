const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS
    }
  });
}

function ok(data = {}) {
  return json({
    success: true,
    ...data
  });
}

function fail(message, status = 400) {
  return json({
    success: false,
    message
  }, status);
}

async function body(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function token(request) {
  const value =
    request.headers.get("Authorization") || "";

  if (!value.startsWith("Bearer ")) {
    return "";
  }

  return value.slice(7).trim();
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
    .map(x => x.toString(16).padStart(2, "0"))
    .join("");
}

function randomToken() {
  return crypto.randomUUID() +
    "-" +
    crypto.randomUUID();
}


/* =====================================================
   AUTH
===================================================== */

async function getUser(request, env) {

  const sessionToken =
    token(request);

  if (!sessionToken) {
    return null;
  }

  const session =
    await env.DB.prepare(`
      SELECT
        s.user_id,
        u.id,
        u.name,
        u.email,
        u.username,
        u.avatar_url,
        u.bio,
        u.coins,
        u.is_online
      FROM sessions s
      JOIN users u
        ON u.id = s.user_id
      WHERE s.token = ?
      LIMIT 1
    `)
    .bind(sessionToken)
    .first();

  return session || null;
}


/* =====================================================
   REGISTER
===================================================== */

async function register(request, env) {

  const data =
    await body(request);

  const name =
    String(data.name || "").trim();

  const email =
    String(data.email || "").trim()
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
    return fail(
      "यह email पहले से registered है।"
    );
  }

  const passwordHash =
    await hashPassword(password);

  const username =
    "user" +
    Date.now().toString().slice(-8);

  const result =
    await env.DB.prepare(`
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

  return ok({
    message: "Registration successful.",
    user_id: result.meta.last_row_id
  });
}


/* =====================================================
   LOGIN
===================================================== */

async function login(request, env) {

  const data =
    await body(request);

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

  const passwordHash =
    await hashPassword(password);

  const user =
    await env.DB.prepare(`
      SELECT
        id,
        name,
        email,
        username,
        avatar_url,
        bio,
        coins
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
    return fail(
      "Email या password गलत है।",
      401
    );
  }

  const sessionToken =
    randomToken();

  await env.DB.prepare(`
    INSERT INTO sessions
    (
      token,
      user_id
    )
    VALUES (?, ?)
  `)
  .bind(
    sessionToken,
    user.id
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

  return ok({
    message: "Login successful.",
    token: sessionToken,
    user
  });
}


/* =====================================================
   LOGOUT
===================================================== */

async function logout(request, env) {

  const sessionToken =
    token(request);

  if (sessionToken) {

    const session =
      await env.DB.prepare(`
        SELECT user_id
        FROM sessions
        WHERE token = ?
        LIMIT 1
      `)
      .bind(sessionToken)
      .first();

    if (session) {

      await env.DB.prepare(`
        UPDATE users
        SET
          is_online = 0,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(session.user_id)
      .run();
    }

    await env.DB.prepare(`
      DELETE FROM sessions
      WHERE token = ?
    `)
    .bind(sessionToken)
    .run();
  }

  return ok({
    message: "Logged out."
  });
}


/* =====================================================
   ME
===================================================== */

async function me(request, env) {

  const user =
    await getUser(
      request,
      env
    );

  if (!user) {
    return fail(
      "Login required.",
      401
    );
  }

  return ok({
    user
  });
}


/* =====================================================
   ROOMS LIST
===================================================== */

async function rooms(request, env) {

  const user =
    await getUser(
      request,
      env
    );

  if (!user) {
    return fail(
      "Login required.",
      401
    );
  }

  const result =
    await env.DB.prepare(`
      SELECT
        r.id,
        r.name,
        r.description,
        r.room_type,
        r.owner_id,
        u.name AS owner_name,
        (
          SELECT COUNT(*)
          FROM room_viewers rv
          WHERE rv.room_id = r.id
        ) AS viewer_count
      FROM rooms r
      JOIN users u
        ON u.id = r.owner_id
      ORDER BY r.id DESC
    `)
    .all();

  return ok({
    rooms: result.results || []
  });
}


/* =====================================================
   CREATE ROOM
===================================================== */

async function createRoom(request, env) {

  const user =
    await getUser(
      request,
      env
    );

  if (!user) {
    return fail(
      "Login required.",
      401
    );
  }

  const data =
    await body(request);

  const name =
    String(data.name || "").trim();

  const description =
    String(data.description || "").trim();

  const roomType =
    String(data.room_type || "public");

  if (!name) {
    return fail(
      "Room name जरूरी है।"
    );
  }

  const result =
    await env.DB.prepare(`
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

  const roomId =
    result.meta.last_row_id;

  await env.DB.prepare(`
    INSERT OR IGNORE INTO live_room_settings
    (
      room_id,
      max_seats,
      chat_enabled,
      reactions_enabled,
      music_enabled,
      gifts_enabled
    )
    VALUES (?, 8, 1, 1, 1, 1)
  `)
  .bind(roomId)
  .run();

  await env.DB.prepare(`
    INSERT OR IGNORE INTO live_rooms
    (
      room_id,
      status
    )
    VALUES (?, 'live')
  `)
  .bind(roomId)
  .run();

  await env.DB.prepare(`
    INSERT OR IGNORE INTO room_members
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

  return ok({
    message: "Room created.",
    room_id: roomId
  });
}


/* =====================================================
   ROOM DETAILS
===================================================== */

async function roomDetails(
  request,
  env,
  roomId
) {

  const user =
    await getUser(
      request,
      env
    );

  if (!user) {
    return fail(
      "Login required.",
      401
    );
  }

  const room =
    await env.DB.prepare(`
      SELECT
        r.*,
        u.name AS owner_name
      FROM rooms r
      JOIN users u
        ON u.id = r.owner_id
      WHERE r.id = ?
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
    await env.DB.prepare(`
      SELECT
        rs.seat_number,
        rs.user_id,
        rs.is_muted,
        u.name,
        u.username,
        u.avatar_url
      FROM room_seats rs
      JOIN users u
        ON u.id = rs.user_id
      WHERE rs.room_id = ?
      ORDER BY rs.seat_number
    `)
    .bind(roomId)
    .all();

  return ok({
    room,
    seats: seats.results || []
  });
}


/* =====================================================
   JOIN ROOM
===================================================== */

async function joinRoom(
  request,
  env,
  roomId
) {

  const user =
    await getUser(
      request,
      env
    );

  if (!user) {
    return fail(
      "Login required.",
      401
    );
  }

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
    return fail(
      "Room नहीं मिला।",
      404
    );
  }

  await env.DB.prepare(`
    INSERT OR IGNORE INTO room_members
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
    INSERT OR REPLACE INTO room_viewers
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

  return ok({
    message: "Room joined."
  });
}


/* =====================================================
   LEAVE ROOM
===================================================== */

async function leaveRoom(
  request,
  env,
  roomId
) {

  const user =
    await getUser(
      request,
      env
    );

  if (!user) {
    return fail(
      "Login required.",
      401
    );
  }

  await env.DB.prepare(`
    DELETE FROM room_seats
    WHERE room_id = ?
      AND user_id = ?
  `)
  .bind(
    roomId,
    user.id
  )
  .run();

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

  return ok({
    message: "Left room."
  });
}


/* =====================================================
   SEATS
===================================================== */

async function getSeats(
  request,
  env,
  roomId
) {

  const user =
    await getUser(
      request,
      env
    );

  if (!user) {
    return fail(
      "Login required.",
      401
    );
  }

  const result =
    await env.DB.prepare(`
      SELECT
        rs.seat_number,
        rs.user_id,
        rs.is_muted,
        u.name,
        u.username,
        u.avatar_url
      FROM room_seats rs
      JOIN users u
        ON u.id = rs.user_id
      WHERE rs.room_id = ?
      ORDER BY rs.seat_number
    `)
    .bind(roomId)
    .all();

  return ok({
    seats: result.results || []
  });
}


/* =====================================================
   JOIN SEAT
===================================================== */

async function joinSeat(
  request,
  env,
  roomId,
  seatNumber
) {

  const user =
    await getUser(
      request,
      env
    );

  if (!user) {
    return fail(
      "Login required.",
      401
    );
  }

  const seat =
    Number(seatNumber);

  if (
    !Number.isInteger(seat) ||
    seat < 1 ||
    seat > 8
  ) {
    return fail(
      "Seat number 1 से 8 के बीच होना चाहिए।"
    );
  }

  const existing =
    await env.DB.prepare(`
      SELECT
        user_id
      FROM room_seats
      WHERE room_id = ?
        AND seat_number = ?
      LIMIT 1
    `)
    .bind(
      roomId,
      seat
    )
    .first();

  if (existing) {

    if (
      Number(existing.user_id) !==
      Number(user.id)
    ) {

      return fail(
        "यह seat पहले से occupied है।"
      );
    }

  } else {

    const already =
      await env.DB.prepare(`
        SELECT
          seat_number
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

      return fail(
        `आप पहले से Seat ${already.seat_number} पर हैं।`
      );
    }

    await env.DB.prepare(`
      INSERT INTO room_seats
      (
        room_id,
        seat_number,
        user_id,
        is_muted
      )
      VALUES (?, ?, ?, 1)
    `)
    .bind(
      roomId,
      seat,
      user.id
    )
    .run();
  }

  return ok({
    message: `Seat ${seat} joined.`,
    seat_number: seat
  });
}


/* =====================================================
   LEAVE SEAT
===================================================== */

async function leaveSeat(
  request,
  env,
  roomId,
  seatNumber
) {

  const user =
    await getUser(
      request,
      env
    );

  if (!user) {
    return fail(
      "Login required.",
      401
    );
  }

  await env.DB.prepare(`
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

  return ok({
    message: "Seat left."
  });
}


/* =====================================================
   MIC
===================================================== */

async function mic(
  request,
  env,
  roomId,
  seatNumber
) {

  const user =
    await getUser(
      request,
      env
    );

  if (!user) {
    return fail(
      "Login required.",
      401
    );
  }

  const data =
    await body(request);

  const micOn =
    Boolean(data.mic_on);

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

  return ok({
    mic_on: micOn
  });
}


/* =====================================================
   CHAT GET
===================================================== */

async function messages(
  request,
  env,
  roomId
) {

  const user =
    await getUser(
      request,
      env
    );

  if (!user) {
    return fail(
      "Login required.",
      401
    );
  }

  const result =
    await env.DB.prepare(`
      SELECT
        rm.id,
        rm.room_id,
        rm.user_id,
        rm.message,
        rm.created_at,
        u.name,
        u.username,
        u.avatar_url
      FROM room_messages rm
      JOIN users u
        ON u.id = rm.user_id
      WHERE rm.room_id = ?
      ORDER BY rm.id ASC
      LIMIT 100
    `)
    .bind(roomId)
    .all();

  return ok({
    messages: result.results || []
  });
}


/* =====================================================
   CHAT SEND
===================================================== */

async function sendMessage(
  request,
  env,
  roomId
) {

  const user =
    await getUser(
      request,
      env
    );

  if (!user) {
    return fail(
      "Login required.",
      401
    );
  }

  const data =
    await body(request);

  const message =
    String(data.message || "").trim();

  if (!message) {
    return fail(
      "Message खाली नहीं हो सकता।"
    );
  }

  if (message.length > 1000) {
    return fail(
      "Message बहुत लंबा है।"
    );
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
    `)
    .bind(
      roomId,
      user.id,
      message
    )
    .run();

  return ok({
    message_id:
      result.meta.last_row_id
  });
}


/* =====================================================
   REACTION
===================================================== */

async function reaction(
  request,
  env,
  roomId
) {

  const user =
    await getUser(
      request,
      env
    );

  if (!user) {
    return fail(
      "Login required.",
      401
    );
  }

  const data =
    await body(request);

  const emoji =
    String(
      data.emoji ||
      data.reaction ||
      "❤️"
    ).trim();

  if (!emoji) {
    return fail(
      "Reaction जरूरी है।"
    );
  }

  await env.DB.prepare(`
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
    user.id,
    emoji
  )
  .run();

  return ok({
    reaction: emoji
  });
}


/* =====================================================
   MUSIC
===================================================== */

async function music(
  request,
  env
) {

  const user =
    await getUser(
      request,
      env
    );

  if (!user) {
    return fail(
      "Login required.",
      401
    );
  }

  const result =
    await env.DB.prepare(`
      SELECT
        id,
        title,
        artist,
        audio_url
      FROM music_tracks
      WHERE is_active = 1
      ORDER BY id DESC
    `)
    .all();

  return ok({
    tracks:
      result.results || []
  });
}


/* =====================================================
   ROOM MUSIC
===================================================== */

async function roomMusic(
  request,
  env,
  roomId
) {

  const user =
    await getUser(
      request,
      env
    );

  if (!user) {
    return fail(
      "Login required.",
      401
    );
  }

  const data =
    await body(request);

  const trackId =
    Number(data.track_id);

  if (!trackId) {
    return fail(
      "Track ID जरूरी है।"
    );
  }

  const track =
    await env.DB.prepare(`
      SELECT
        id,
        title,
        artist,
        audio_url
      FROM music_tracks
      WHERE id = ?
        AND is_active = 1
      LIMIT 1
    `)
    .bind(trackId)
    .first();

  if (!track) {
    return fail(
      "Music track नहीं मिला।"
    );
  }

  await env.DB.prepare(`
    INSERT INTO room_music
    (
      room_id,
      track_id,
      started_by
    )
    VALUES (?, ?, ?)
  `)
  .bind(
    roomId,
    trackId,
    user.id
  )
  .run();

  return ok({
    track
  });
}


/* =====================================================
   GIFTS
===================================================== */

async function gifts(
  request,
  env
) {

  const user =
    await getUser(
      request,
      env
    );

  if (!user) {
    return fail(
      "Login required.",
      401
    );
  }

  const result =
    await env.DB.prepare(`
      SELECT
        id,
        name,
        coin_cost,
        image_url
      FROM gifts
      WHERE is_active = 1
      ORDER BY id
    `)
    .all();

  return ok({
    gifts:
      result.results || []
  });
}


/* =====================================================
   SUPPORT / PERSONAL HELP
===================================================== */

async function support(
  request,
  env
) {

  const user =
    await getUser(
      request,
      env
    );

  if (!user) {
    return fail(
      "Login required.",
      401
    );
  }

  const data =
    await body(request);

  const subject =
    String(data.subject || "").trim();

  const message =
    String(data.message || "").trim();

  if (!subject || !message) {
    return fail(
      "Subject और message दोनों जरूरी हैं।"
    );
  }

  const ticket =
    await env.DB.prepare(`
      INSERT INTO support_tickets
      (
        user_id,
        subject,
        status
      )
      VALUES (?, ?, 'open')
    `)
    .bind(
      user.id,
      subject
    )
    .run();

  const ticketId =
    ticket.meta.last_row_id;

  await env.DB.prepare(`
    INSERT INTO support_messages
    (
      ticket_id,
      user_id,
      message
    )
    VALUES (?, ?, ?)
  `)
  .bind(
    ticketId,
    user.id,
    message
  )
  .run();

  return ok({
    message:
      "Personal Help request भेज दी गई।",
    ticket_id:
      ticketId
  });
}


/* =====================================================
   DATABASE TEST
===================================================== */

async function databaseTest(env) {

  const result =
    await env.DB.prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
      ORDER BY name
    `)
    .all();

  return ok({
    database: "connected",
    tables:
      result.results || []
  });
}


/* =====================================================
   MAIN FETCH
===================================================== */

export default {

  async fetch(request, env) {

    if (
      request.method === "OPTIONS"
    ) {
      return new Response(
        null,
        {
          status: 204,
          headers: CORS
        }
      );
    }

    try {

      const url =
        new URL(request.url);

      const path =
        url.pathname;

      const method =
        request.method;


      /* =========================
         HOME
      ========================= */

      if (
        path === "/" &&
        method === "GET"
      ) {

        return ok({
          service:
            "Rahul Live API",
          status:
            "running"
        });
      }


      /* =========================
         DATABASE TEST
      ========================= */

      if (
        path === "/api/test" &&
        method === "GET"
      ) {

        return await databaseTest(
          env
        );
      }


      /* =========================
         AUTH
      ========================= */

      if (
        path === "/api/register" &&
        method === "POST"
      ) {

        return await register(
          request,
          env
        );
      }


      if (
        path === "/api/login" &&
        method === "POST"
      ) {

        return await login(
          request,
          env
        );
      }


      if (
        path === "/api/logout" &&
        method === "POST"
      ) {

        return await logout(
          request,
          env
        );
      }


      if (
        path === "/api/me" &&
        method === "GET"
      ) {

        return await me(
          request,
          env
        );
      }


      /* =========================
         ROOMS
      ========================= */

      if (
        path === "/api/rooms" &&
        method === "GET"
      ) {

        return await rooms(
          request,
          env
        );
      }


      if (
        path === "/api/rooms" &&
        method === "POST"
      ) {

        return await createRoom(
          request,
          env
        );
      }


      const roomMatch =
        path.match(
          /^\/api\/rooms\/(\d+)$/
        );


      if (
        roomMatch &&
        method === "GET"
      ) {

        return await roomDetails(
          request,
          env,
          Number(roomMatch[1])
        );
      }


      /* =========================
         ROOM ACTIONS
      ========================= */

      const joinMatch =
        path.match(
          /^\/api\/rooms\/(\d+)\/join$/
        );

      if (
        joinMatch &&
        method === "POST"
      ) {

        return await joinRoom(
          request,
          env,
          Number(joinMatch[1])
        );
      }


      const leaveRoomMatch =
        path.match(
          /^\/api\/rooms\/(\d+)\/leave$/
        );

      if (
        leaveRoomMatch &&
        method === "POST"
      ) {

        return await leaveRoom(
          request,
          env,
          Number(leaveRoomMatch[1])
        );
      }


      /* =========================
         SEATS
      ========================= */

      const seatsMatch =
        path.match(
          /^\/api\/rooms\/(\d+)\/seats$/
        );

      if (
        seatsMatch &&
        method === "GET"
      ) {

        return await getSeats(
          request,
          env,
          Number(seatsMatch[1])
        );
      }


      const seatJoinMatch =
        path.match(
          /^\/api\/rooms\/(\d+)\/seats\/(\d+)\/join$/
        );

      if (
        seatJoinMatch &&
        method === "POST"
      ) {

        return await joinSeat(
          request,
          env,
          Number(seatJoinMatch[1]),
          Number(seatJoinMatch[2])
        );
      }


      const seatLeaveMatch =
        path.match(
          /^\/api\/rooms\/(\d+)\/seats\/(\d+)\/leave$/
        );

      if (
        seatLeaveMatch &&
        method === "POST"
      ) {

        return await leaveSeat(
          request,
          env,
          Number(seatLeaveMatch[1]),
          Number(seatLeaveMatch[2])
        );
      }


      const micMatch =
        path.match(
          /^\/api\/rooms\/(\d+)\/seats\/(\d+)\/mic$/
        );

      if (
        micMatch &&
        method === "POST"
      ) {

        return await mic(
          request,
          env,
          Number(micMatch[1]),
          Number(micMatch[2])
        );
      }


      /* =========================
         CHAT
      ========================= */

      const messagesMatch =
        path.match(
          /^\/api\/rooms\/(\d+)\/messages$/
        );

      if (
        messagesMatch &&
        method === "GET"
      ) {

        return await messages(
          request,
          env,
          Number(messagesMatch[1])
        );
      }


      if (
        messagesMatch &&
        method === "POST"
      ) {

        return await sendMessage(
          request,
          env,
          Number(messagesMatch[1])
        );
      }


      /* =========================
         REACTIONS
      ========================= */

      const reactionMatch =
        path.match(
          /^\/api\/rooms\/(\d+)\/reactions$/
        );

      if (
        reactionMatch &&
        method === "POST"
      ) {

        return await reaction(
          request,
          env,
          Number(reactionMatch[1])
        );
      }


      /* =========================
         MUSIC
      ========================= */

      if (
        path === "/api/music" &&
        method === "GET"
      ) {

        return await music(
          request,
          env
        );
      }


      const roomMusicMatch =
        path.match(
          /^\/api\/rooms\/(\d+)\/music$/
        );

      if (
        roomMusicMatch &&
        method === "POST"
      ) {

        return await roomMusic(
          request,
          env,
          Number(roomMusicMatch[1])
        );
      }


      /* =========================
         GIFTS
      ========================= */

      if (
        path === "/api/gifts" &&
        method === "GET"
      ) {

        return await gifts(
          request,
          env
        );
      }


      /* =========================
         PERSONAL HELP
      ========================= */

      if (
        path === "/api/support" &&
        method === "POST"
      ) {

        return await support(
          request,
          env
        );
      }


      return fail(
        "API endpoint नहीं मिला।",
        404
      );


    } catch (error) {

      console.error(
        error
      );

      return fail(
        "Server error: " +
        (error.message || "Unknown error"),
        500
      );
    }
  }
};