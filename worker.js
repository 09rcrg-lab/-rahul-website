export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors
      });
    }
    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: {
          "Content-Type": "application/json",
          ...cors
        }
      });
    const fail = (message, status = 400) =>
      json({
        success: false,
        message
      }, status);
    const url = new URL(request.url);
    const path = url.pathname;
    async function readBody() {
      try {
        return await request.json();
      } catch {
        return {};
      }
    }
    const enc = new TextEncoder();
    function hex(buffer) {
      return [...new Uint8Array(buffer)]
        .map(x => x.toString(16).padStart(2, "0"))
        .join("");
    }
    async function sha256(value) {
      const hash = await crypto.subtle.digest(
        "SHA-256",
        enc.encode(value)
      );
      return hex(hash);
    }
    async function passwordHash(password) {
      const salt = crypto.randomUUID();
      const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
      );
      const bits = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: enc.encode(salt),
          iterations: 100000,
          hash: "SHA-256"
        },
        key,
        256
      );
      return salt + ":" + hex(bits);
    }
    async function passwordVerify(password, stored) {
      if (!stored || !stored.includes(":")) {
        return false;
      }
      const [salt, original] = stored.split(":");
      const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
      );
      const bits = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: enc.encode(salt),
          iterations: 100000,
          hash: "SHA-256"
        },
        key,
        256
      );
      return hex(bits) === original;
    }
    async function newToken() {
      return hex(
        crypto.getRandomValues(
          new Uint8Array(32)
        )
      );
    }
    async function authUser() {
      const header =
        request.headers.get("Authorization");
      if (!header ||
          !header.toLowerCase().startsWith("bearer ")) {
        return null;
      }
      const token =
        header.substring(7).trim();
      if (!token) {
        return null;
      }
      const tokenHash =
        await sha256(token);
      return await env.DB.prepare(`
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
        JOIN users u
          ON u.id = s.user_id
        WHERE s.token_hash = ?
          AND s.expires_at > CURRENT_TIMESTAMP
        LIMIT 1
      `)
      .bind(tokenHash)
      .first();
    }
    async function requireUser() {
      const user = await authUser();
      if (!user) {
        throw new Error("AUTH_REQUIRED");
      }
      return user;
    }
    async function roomExists(roomId) {
      return await env.DB.prepare(`
        SELECT *
        FROM rooms
        WHERE id = ?
          AND is_active = 1
        LIMIT 1
      `)
      .bind(roomId)
      .first();
    }
    async function isMember(roomId, userId) {
      return await env.DB.prepare(`
        SELECT *
        FROM room_members
        WHERE room_id = ?
          AND user_id = ?
          AND is_inside = 1
        LIMIT 1
      `)
      .bind(roomId, userId)
      .first();
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
       DATABASE TEST
       ===================================================== */
    if (
      path === "/api/test" &&
      request.method === "GET"
    ) {
      const tables = await env.DB.prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        ORDER BY name
      `).all();
      return json({
        success: true,
        database: "connected",
        tables: tables.results || []
      });
    }
    /* =====================================================
       REGISTER
       ===================================================== */
    if (
      path === "/api/register" &&
      request.method === "POST"
    ) {
      const data = await readBody();
      const name =
        String(data.name || "").trim();
      const email =
        String(data.email || "")
          .trim()
          .toLowerCase();
      const password =
        String(data.password || "");
      if (!name) {
        return fail("Name जरूरी है।");
      }
      if (!email) {
        return fail("Email जरूरी है।");
      }
      if (password.length < 6) {
        return fail(
          "Password कम से कम 6 characters का होना चाहिए।"
        );
      }
      const exists =
        await env.DB.prepare(`
          SELECT id
          FROM users
          WHERE email = ?
          LIMIT 1
        `)
        .bind(email)
        .first();
      if (exists) {
        return fail(
          "यह email पहले से registered है।",
          409
        );
      }
      const base =
        email
          .split("@")[0]
          .replace(/[^a-zA-Z0-9_]/g, "")
          .slice(0, 25) ||
        "user";
      let username = base;
      let number = 1;
      while (true) {
        const found =
          await env.DB.prepare(`
            SELECT id
            FROM users
            WHERE username = ?
            LIMIT 1
          `)
          .bind(username)
          .first();
        if (!found) break;
        username = base + number;
        number++;
      }
      const hash =
        await passwordHash(password);
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
          hash,
          username
        )
        .run();
      if (!result.success) {
        return fail(
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
      const data = await readBody();
      const email =
        String(data.email || "")
          .trim()
          .toLowerCase();
      const password =
        String(data.password || "");
      const user =
        await env.DB.prepare(`
          SELECT *
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
      const valid =
        await passwordVerify(
          password,
          user.password_hash
        );
      if (!valid) {
        return fail(
          "Email या password गलत है।",
          401
        );
      }
      const token =
        await newToken();
      const tokenHash =
        await sha256(token);
      await env.DB.prepare(`
        INSERT INTO sessions
        (
          user_id,
          token_hash,
          expires_at
        )
        VALUES
        (
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
       ME
       ===================================================== */
    if (
      path === "/api/me" &&
      request.method === "GET"
    ) {
      const user = await authUser();
      if (!user) {
        return fail(
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
      const user = await authUser();
      const header =
        request.headers.get("Authorization");
      if (header) {
        const token =
          header.substring(7).trim();
        if (token) {
          const tokenHash =
            await sha256(token);
          await env.DB.prepare(`
            DELETE FROM sessions
            WHERE token_hash = ?
          `)
          .bind(tokenHash)
          .run();
        }
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
        message: "Logout successful."
      });
    }
    /* =====================================================
       ROOMS LIST
       ===================================================== */
    if (
      path === "/api/rooms" &&
      request.method === "GET"
    ) {
      const result =
        await env.DB.prepare(`
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
            u.avatar_url AS owner_avatar,
            (
              SELECT COUNT(*)
              FROM room_viewers rv
              WHERE rv.room_id = r.id
                AND rv.is_inside = 1
            ) AS viewer_count
          FROM rooms r
          JOIN users u
            ON u.id = r.owner_id
          WHERE r.is_active = 1
          ORDER BY r.id DESC
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
      const user = await authUser();
      if (!user) {
        return fail(
          "Login required.",
          401
        );
      }
      const data = await readBody();
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
            room_type,
            is_active
          )
          VALUES (?, ?, ?, ?, 1)
        `)
        .bind(
          user.id,
          name,
          description,
          roomType
        )
        .run();
      const roomId =
        result.meta?.last_row_id;
      await env.DB.prepare(`
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
      await env.DB.prepare(`
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
        room_id: roomId,
        message: "Room created."
      }, 201);
    }
    /* =====================================================
       ROOM DETAILS
       ===================================================== */
    const roomDetails =
      path.match(
        /^\/api\/rooms\/(\d+)$/
      );
    if (
      roomDetails &&
      request.method === "GET"
    ) {
      const roomId =
        Number(roomDetails[1]);
      const room =
        await roomExists(roomId);
      if (!room) {
        return fail(
          "Room नहीं मिला।",
          404
        );
      }
      const members =
        await env.DB.prepare(`
          SELECT
            rm.user_id,
            rm.role,
            rm.is_inside,
            u.name,
            u.username,
            u.avatar_url,
            u.is_online
          FROM room_members rm
          JOIN users u
            ON u.id = rm.user_id
          WHERE rm.room_id = ?
            AND rm.is_inside = 1
          ORDER BY rm.id ASC
        `)
        .bind(roomId)
        .all();
      const seats =
        await env.DB.prepare(`
          SELECT
            rs.id,
            rs.seat_number,
            rs.user_id,
            rs.is_occupied,
            u.name,
            u.username,
            u.avatar_url,
            u.is_online
          FROM room_seats rs
          LEFT JOIN users u
            ON u.id = rs.user_id
          WHERE rs.room_id = ?
          ORDER BY rs.seat_number ASC
        `)
        .bind(roomId)
        .all();
      const viewers =
        await env.DB.prepare(`
          SELECT
            rv.user_id,
            u.name,
            u.username,
            u.avatar_url
          FROM room_viewers rv
          JOIN users u
            ON u.id = rv.user_id
          WHERE rv.room_id = ?
            AND rv.is_inside = 1
          ORDER BY rv.id ASC
        `)
        .bind(roomId)
        .all();
      return json({
        success: true,
        room,
        members: members.results || [],
        seats: seats.results || [],
        viewers: viewers.results || []
      });
    }
    /* =====================================================
       JOIN ROOM
       ===================================================== */
    const join =
      path.match(
        /^\/api\/rooms\/(\d+)\/join$/
      );
    if (
      join &&
      request.method === "POST"
    ) {
      const user = await authUser();
      if (!user) {
        return fail(
          "Login required.",
          401
        );
      }
      const roomId =
        Number(join[1]);
      const room =
        await roomExists(roomId);
      if (!room) {
        return fail(
          "Room नहीं मिला।",
          404
        );
      }
      if (
        room.room_type === "private" &&
        Number(room.owner_id) !== Number(user.id)
      ) {
        const invitation =
          await env.DB.prepare(`
            SELECT id
            FROM room_invitations
            WHERE room_id = ?
              AND invited_user_id = ?
              AND status = 'accepted'
            LIMIT 1
          `)
          .bind(
            roomId,
            user.id
          )
          .first();
        if (!invitation) {
          return fail(
            "यह private room है। Invitation जरूरी है।",
            403
          );
        }
      }
      await env.DB.prepare(`
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
      await env.DB.prepare(`
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
        room
      });
    }
    /* =====================================================
       LEAVE ROOM
       ===================================================== */
    const leave =
      path.match(
        /^\/api\/rooms\/(\d+)\/leave$/
      );
    if (
      leave &&
      request.method === "POST"
    ) {
      const user = await authUser();
      if (!user) {
        return fail(
          "Login required.",
          401
        );
      }
      const roomId =
        Number(leave[1]);
      await env.DB.prepare(`
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
      await env.DB.prepare(`
        UPDATE room_viewers
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
      await env.DB.prepare(`
        UPDATE room_seats
        SET
          user_id = NULL,
          is_occupied = 0,
          mic_on = 0
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
       SEAT LIST
       ===================================================== */
    const seatsGet =
      path.match(
        /^\/api\/rooms\/(\d+)\/seats$/
      );
    if (
      seatsGet &&
      request.method === "GET"
    ) {
      const roomId =
        Number(seatsGet[1]);
      const result =
        await env.DB.prepare(`
          SELECT
            rs.id,
            rs.seat_number,
            rs.user_id,
            rs.is_occupied,
            rs.mic_on,
            u.name,
            u.username,
            u.avatar_url
          FROM room_seats rs
          LEFT JOIN users u
            ON u.id = rs.user_id
          WHERE rs.room_id = ?
          ORDER BY rs.seat_number ASC
        `)
        .bind(roomId)
        .all();
      return json({
        success: true,
        seats: result.results || []
      });
    }
    /* =====================================================
       JOIN SEAT
       ===================================================== */
    const seatJoin =
      path.match(
        /^\/api\/rooms\/(\d+)\/seats\/(\d+)\/join$/
      );
    if (
      seatJoin &&
      request.method === "POST"
    ) {
      const user = await authUser();
      if (!user) {
        return fail(
          "Login required.",
          401
        );
      }
      const roomId =
        Number(seatJoin[1]);
      const seatNumber =
        Number(seatJoin[2]);
      const member =
        await isMember(
          roomId,
          user.id
        );
      if (!member) {
        return fail(
          "पहले room join करें।",
          403
        );
      }
      if (
        seatNumber < 1 ||
        seatNumber > 8
      ) {
        return fail(
          "Invalid seat."
        );
      }
      const occupied =
        await env.DB.prepare(`
          SELECT *
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
      if (
        occupied &&
        Number(occupied.is_occupied) === 1
      ) {
        return fail(
          "यह seat पहले से occupied है।",
          409
        );
      }
      await env.DB.prepare(`
        UPDATE room_seats
        SET
          user_id = NULL,
          is_occupied = 0,
          mic_on = 0
        WHERE room_id = ?
          AND user_id = ?
      `)
      .bind(
        roomId,
        user.id
      )
      .run();
      await env.DB.prepare(`
        INSERT INTO room_seats
        (
          room_id,
          seat_number,
          user_id,
          is_occupied,
          mic_on
        )
        VALUES (?, ?, ?, 1, 0)
        ON CONFLICT(room_id, seat_number)
        DO UPDATE SET
          user_id = excluded.user_id,
          is_occupied = 1,
          mic_on = 0
      `)
      .bind(
        roomId,
        seatNumber,
        user.id
      )
      .run();
      return json({
        success: true,
        seat_number: seatNumber
      });
    }
    /* =====================================================
       LEAVE SEAT
       ===================================================== */
    const seatLeave =
      path.match(
        /^\/api\/rooms\/(\d+)\/seats\/(\d+)\/leave$/
      );
    if (
      seatLeave &&
      request.method === "POST"
    ) {
      const user = await authUser();
      if (!user) {
        return fail(
          "Login required.",
          401
        );
      }
      const roomId =
        Number(seatLeave[1]);
      const seatNumber =
        Number(seatLeave[2]);
      await env.DB.prepare(`
        UPDATE room_seats
        SET
          user_id = NULL,
          is_occupied = 0,
          mic_on = 0
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
        success: true
      });
    }
    /* =====================================================
       MIC STATUS
       ===================================================== */
    const mic =
      path.match(
        /^\/api\/rooms\/(\d+)\/seats\/(\d+)\/mic$/
      );
    if (
      mic &&
      request.method === "POST"
    ) {
      const user = await authUser();
      if (!user) {
        return fail(
          "Login required.",
          401
        );
      }
      const roomId =
        Number(mic[1]);
      const seatNumber =
        Number(mic[2]);
      const data =
        await readBody();
      const micOn =
        data.mic_on ? 1 : 0;
      await env.DB.prepare(`
        UPDATE room_seats
        SET mic_on = ?
        WHERE room_id = ?
          AND seat_number = ?
          AND user_id = ?
          AND is_occupied = 1
      `)
      .bind(
        micOn,
        roomId,
        seatNumber,
        user.id
      )
      .run();
      return json({
        success: true,
        mic_on: Boolean(micOn)
      });
    }
    /* =====================================================
       ROOM MESSAGES
       ===================================================== */
    const messages =
      path.match(
        /^\/api\/rooms\/(\d+)\/messages$/
      );
    if (
      messages &&
      request.method === "GET"
    ) {
      const roomId =
        Number(messages[1]);
      const result =
        await env.DB.prepare(`
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
          JOIN users u
            ON u.id = rm.user_id
          WHERE rm.room_id = ?
          ORDER BY rm.id DESC
          LIMIT 200
        `)
        .bind(roomId)
        .all();
      const rows =
        result.results || [];
      rows.reverse();
      return json({
        success: true,
        messages: rows
      });
    }
    if (
      messages &&
      request.method === "POST"
    ) {
      const user = await authUser();
      if (!user) {
        return fail(
          "Login required.",
          401
        );
      }
      const roomId =
        Number(messages[1]);
      const member =
        await isMember(
          roomId,
          user.id
        );
      if (!member) {
        return fail(
          "पहले room join करें।",
          403
        );
      }
      const data =
        await readBody();
      const message =
        String(data.message || "")
          .trim();
      if (!message) {
        return fail(
          "Message खाली है।"
        );
      }
      if (message.length > 2000) {
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
       REACTION
       ===================================================== */
    const reaction =
      path.match(
        /^\/api\/rooms\/(\d+)\/reactions$/
      );
    if (
      reaction &&
      request.method === "POST"
    ) {
      const user = await authUser();
      if (!user) {
        return fail(
          "Login required.",
          401
        );
      }
      const roomId =
        Number(reaction[1]);
      const data =
        await readBody();
      const emoji =
        String(data.emoji || "")
          .trim();
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
      return json({
        success: true
      });
    }
    /* =====================================================
       ROOM MUSIC
       ===================================================== */
    const roomMusic =
      path.match(
        /^\/api\/rooms\/(\d+)\/music$/
      );
    if (
      roomMusic &&
      request.method === "GET"
    ) {
      const roomId =
        Number(roomMusic[1]);
      const result =
        await env.DB.prepare(`
          SELECT
            rm.id,
            rm.room_id,
            rm.track_id,
            rm.is_playing,
            rm.started_at,
            mt.title,
            mt.artist,
            mt.audio_url,
            mt.cover_url
          FROM room_music rm
          LEFT JOIN music_tracks mt
            ON mt.id = rm.track_id
          WHERE rm.room_id = ?
          ORDER BY rm.id DESC
          LIMIT 1
        `)
        .bind(roomId)
        .first();
      return json({
        success: true,
        music: result || null
      });
    }
    /* =====================================================
       ROOM MUSIC CHANGE
       ===================================================== */
    if (
      roomMusic &&
      request.method === "POST"
    ) {
      const user = await authUser();
      if (!user) {
        return fail(
          "Login required.",
          401
        );
      }
      const roomId =
        Number(roomMusic[1]);
      const data =
        await readBody();
      const trackId =
        Number(data.track_id || 0);
      if (!trackId) {
        return fail(
          "Track ID जरूरी है।"
        );
      }
      const room =
        await roomExists(roomId);
      if (!room) {
        return fail(
          "Room नहीं मिला।",
          404
        );
      }
      if (
        Number(room.owner_id) !==
        Number(user.id)
      ) {
        return fail(
          "केवल room owner music बदल सकता है।",
          403
        );
      }
      await env.DB.prepare(`
        UPDATE room_music
        SET is_playing = 0
        WHERE room_id = ?
      `)
      .bind(roomId)
      .run();
      await env.DB.prepare(`
        INSERT INTO room_music
        (
          room_id,
          track_id,
          is_playing,
          started_at
        )
        VALUES (?, ?, 1, CURRENT_TIMESTAMP)
      `)
      .bind(
        roomId,
        trackId
      )
      .run();
      return json({
        success: true
      });
    }
    /* =====================================================
       NOT FOUND
       ===================================================== */
    return fail(
      "API endpoint नहीं मिला।",
      404
    );
  }
};