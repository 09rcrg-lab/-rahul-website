export default {

  async fetch(request, env) {

    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }


    /* =====================================================
       RESPONSE HELPERS
       ===================================================== */

    function json(data, status = 200) {

      return new Response(
        JSON.stringify(data),
        {
          status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    }


    async function body(request) {

      try {
        return await request.json();
      } catch {
        return null;
      }

    }


    /* =====================================================
       HOME
       ===================================================== */

    if (url.pathname === "/") {

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
      url.pathname === "/api/test" &&
      request.method === "GET"
    ) {

      try {

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
          database: "connected",
          tables: result.results
        });

      } catch (error) {

        return json({
          success: false,
          error: error.message
        }, 500);

      }

    }


    /* =====================================================
       REGISTER
       ===================================================== */

    if (
      url.pathname === "/api/register" &&
      request.method === "POST"
    ) {

      const data = await body(request);

      if (!data) {
        return json({
          success: false,
          message: "Invalid JSON"
        }, 400);
      }

      const name =
        String(data.name || "").trim();

      const email =
        String(data.email || "").trim().toLowerCase();

      const password =
        String(data.password || "");

      if (!name || !email || !password) {

        return json({
          success: false,
          message: "Name, email and password are required."
        }, 400);

      }

      if (password.length < 6) {

        return json({
          success: false,
          message: "Password must contain at least 6 characters."
        }, 400);

      }


      try {

        const existing = await env.DB
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
            message: "Email already registered."
          }, 409);

        }


        /*
          Password hashing will be handled securely in the
          authentication layer. Plain password is NOT stored.
        */

        const passwordHash =
          await hashPassword(password);


        const username =
          await generateUsername(env.DB, name);


        const result = await env.DB
          .prepare(`
            INSERT INTO users
            (
              name,
              email,
              password_hash,
              username
            )
            VALUES (?, ?, ?, ?)
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
          message: "Registration successful.",
          user: {
            id: result.meta.last_row_id,
            name,
            email,
            username
          }
        }, 201);


      } catch (error) {

        return json({
          success: false,
          message: "Registration failed.",
          error: error.message
        }, 500);

      }

    }


    /* =====================================================
       LOGIN
       ===================================================== */

    if (
      url.pathname === "/api/login" &&
      request.method === "POST"
    ) {

      const data = await body(request);

      if (!data) {

        return json({
          success: false,
          message: "Invalid JSON"
        }, 400);

      }

      const email =
        String(data.email || "")
          .trim()
          .toLowerCase();

      const password =
        String(data.password || "");


      if (!email || !password) {

        return json({
          success: false,
          message: "Email and password are required."
        }, 400);

      }


      try {

        const user = await env.DB
          .prepare(`
            SELECT
              id,
              name,
              email,
              password_hash,
              username,
              avatar_url,
              bio,
              coins
            FROM users
            WHERE email = ?
            LIMIT 1
          `)
          .bind(email)
          .first();


        if (!user) {

          return json({
            success: false,
            message: "Invalid email or password."
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
            message: "Invalid email or password."
          }, 401);

        }


        const token =
          crypto.randomUUID() +
          "-" +
          crypto.randomUUID();


        const tokenHash =
          await sha256(token);


        const expiresAt =
          new Date(
            Date.now() + 1000 * 60 * 60 * 24 * 30
          ).toISOString();


        await env.DB
          .prepare(`
            INSERT INTO sessions
            (
              user_id,
              token_hash,
              expires_at
            )
            VALUES (?, ?, ?)
          `)
          .bind(
            user.id,
            tokenHash,
            expiresAt
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
            coins: user.coins
          }
        });


      } catch (error) {

        return json({
          success: false,
          message: "Login failed.",
          error: error.message
        }, 500);

      }

    }


    /* =====================================================
       CURRENT USER
       ===================================================== */

    if (
      url.pathname === "/api/me" &&
      request.method === "GET"
    ) {

      const user = await authenticate(
        request,
        env.DB
      );


      if (!user) {

        return json({
          success: false,
          message: "Unauthorized."
        }, 401);

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
      url.pathname === "/api/logout" &&
      request.method === "POST"
    ) {

      const token =
        getToken(request);


      if (token) {

        const tokenHash =
          await sha256(token);

        await env.DB
          .prepare(`
            DELETE FROM sessions
            WHERE token_hash = ?
          `)
          .bind(tokenHash)
          .run();

      }


      return json({
        success: true,
        message: "Logged out."
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

        const result = await env.DB
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
              u.avatar_url AS owner_avatar
            FROM rooms r
            JOIN users u
              ON u.id = r.owner_id
            WHERE r.is_active = 1
            ORDER BY r.created_at DESC
          `)
          .all();


        return json({
          success: true,
          rooms: result.results
        });


      } catch (error) {

        return json({
          success: false,
          error: error.message
        }, 500);

      }

    }


    /* =====================================================
       CREATE ROOM
       ===================================================== */

    if (
      url.pathname === "/api/rooms" &&
      request.method === "POST"
    ) {

      const user =
        await authenticate(request, env.DB);


      if (!user) {

        return json({
          success: false,
          message: "Login required."
        }, 401);

      }


      const data =
        await body(request);


      const name =
        String(data?.name || "").trim();

      const description =
        String(data?.description || "").trim();

      const roomType =
        data?.room_type === "private"
          ? "private"
          : "public";


      if (!name) {

        return json({
          success: false,
          message: "Room name is required."
        }, 400);

      }


      try {

        const result = await env.DB
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


        const roomId =
          result.meta.last_row_id;


        /*
          Create 8 numbered voice seats.
        */

        const seatStatements = [];

        for (
          let seat = 1;
          seat <= 8;
          seat++
        ) {

          seatStatements.push(
            env.DB
              .prepare(`
                INSERT INTO room_seats
                (
                  room_id,
                  seat_number
                )
                VALUES (?, ?)
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


        /*
          Owner becomes first room member.
        */

        await env.DB
          .prepare(`
            INSERT INTO room_members
            (
              room_id,
              user_id,
              role
            )
            VALUES (?, ?, 'owner')
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


      } catch (error) {

        return json({
          success: false,
          message: "Room creation failed.",
          error: error.message
        }, 500);

      }

    }


    /* =====================================================
       JOIN ROOM
       ===================================================== */

    if (
      url.pathname.match(
        /^\/api\/rooms\/\d+\/join$/
      ) &&
      request.method === "POST"
    ) {

      const user =
        await authenticate(request, env.DB);


      if (!user) {

        return json({
          success: false,
          message: "Login required."
        }, 401);

      }


      const roomId =
        Number(
          url.pathname.split("/")[3]
        );


      try {

        const room = await env.DB
          .prepare(`
            SELECT
              id,
              owner_id,
              room_type,
              is_active
            FROM rooms
            WHERE id = ?
            LIMIT 1
          `)
          .bind(roomId)
          .first();


        if (!room || !room.is_active) {

          return json({
            success: false,
            message: "Room not found."
          }, 404);

        }


        if (room.room_type === "private") {

          const friend = await env.DB
            .prepare(`
              SELECT id
              FROM friendships
              WHERE status = 'accepted'
              AND (
                (requester_id = ? AND receiver_id = ?)
                OR
                (requester_id = ? AND receiver_id = ?)
              )
              LIMIT 1
            `)
            .bind(
              user.id,
              room.owner_id,
              room.owner_id,
              user.id
            )
            .first();


          if (
            user.id !== room.owner_id &&
            !friend
          ) {

            return json({
              success: false,
              message: "Private room access denied."
            }, 403);

          }

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
          message: "Joined room.",
          room_id: roomId
        });


      } catch (error) {

        return json({
          success: false,
          error: error.message
        }, 500);

      }

    }


    /* =====================================================
       LEAVE ROOM
       ===================================================== */

    if (
      url.pathname.match(
        /^\/api\/rooms\/\d+\/leave$/
      ) &&
      request.method === "POST"
    ) {

      const user =
        await authenticate(request, env.DB);


      if (!user) {

        return json({
          success: false,
          message: "Login required."
        }, 401);

      }


      const roomId =
        Number(
          url.pathname.split("/")[3]
        );


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


      /*
        Release voice seat if user was sitting.
      */

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
          user.id
        )
        .run();


      return json({
        success: true,
        message: "Left room."
      });

    }


    /* =====================================================
       ROOM CHAT
       ===================================================== */

    if (
      url.pathname.match(
        /^\/api\/rooms\/\d+\/messages$/
      ) &&
      request.method === "GET"
    ) {

      const roomId =
        Number(
          url.pathname.split("/")[3]
        );


      try {

        const result = await env.DB
          .prepare(`
            SELECT
              m.id,
              m.room_id,
              m.user_id,
              m.message,
              m.message_type,
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


        return json({
          success: true,
          messages: result.results.reverse()
        });


      } catch (error) {

        return json({
          success: false,
          error: error.message
        }, 500);

      }

    }


    if (
      url.pathname.match(
        /^\/api\/rooms\/\d+\/messages$/
      ) &&
      request.method === "POST"
    ) {

      const user =
        await authenticate(request, env.DB);


      if (!user) {

        return json({
          success: false,
          message: "Login required."
        }, 401);

      }


      const roomId =
        Number(
          url.pathname.split("/")[3]
        );


      const data =
        await body(request);


      const message =
        String(data?.message || "").trim();


      if (!message) {

        return json({
          success: false,
          message: "Message cannot be empty."
        }, 400);

      }


      if (message.length > 2000) {

        return json({
          success: false,
          message: "Message is too long."
        }, 400);

      }


      try {

        const member = await env.DB
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

          return json({
            success: false,
            message: "Join the room first."
          }, 403);

        }


        const result = await env.DB
          .prepare(`
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


        return json({
          success: true,
          message_id: result.meta.last_row_id
        }, 201);


      } catch (error) {

        return json({
          success: false,
          error: error.message
        }, 500);

      }

    }


    /* =====================================================
       UNKNOWN API
       ===================================================== */

    return json({
      success: false,
      message: "API endpoint not found."
    }, 404);

  }
};


/* =========================================================
   AUTHENTICATION
   ========================================================= */

async function authenticate(request, db) {

  const token =
    getToken(request);

  if (!token) {
    return null;
  }


  const tokenHash =
    await sha256(token);


  const row = await db
    .prepare(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.username,
        u.avatar_url,
        u.bio,
        u.coins,
        s.expires_at
      FROM sessions s
      JOIN users u
        ON u.id = s.user_id
      WHERE s.token_hash = ?
      LIMIT 1
    `)
    .bind(tokenHash)
    .first();


  if (!row) {
    return null;
  }


  if (
    new Date(row.expires_at).getTime()
    <= Date.now()
  ) {

    await db
      .prepare(`
        DELETE FROM sessions
        WHERE token_hash = ?
      `)
      .bind(tokenHash)
      .run();

    return null;
  }


  return {
    id: row.id,
    name: row.name,
    email: row.email,
    username: row.username,
    avatar_url: row.avatar_url,
    bio: row.bio,
    coins: row.coins
  };

}


/* =========================================================
   TOKEN
   ========================================================= */

function getToken(request) {

  const header =
    request.headers.get("Authorization");

  if (!header) {
    return null;
  }

  if (
    !header.startsWith("Bearer ")
  ) {
    return null;
  }

  return header.slice(7).trim();
}


/* =========================================================
   PASSWORD HASH
   ========================================================= */

async function hashPassword(password) {

  const salt =
    crypto.randomUUID();

  const hash =
    await sha256(
      `${salt}:${password}`
    );

  return `${salt}:${hash}`;
}


async function verifyPassword(
  password,
  stored
) {

  const separator =
    stored.indexOf(":");

  if (separator === -1) {
    return false;
  }

  const salt =
    stored.slice(0, separator);

  const originalHash =
    stored.slice(separator + 1);

  const checkHash =
    await sha256(
      `${salt}:${password}`
    );

  return checkHash === originalHash;
}


/* =========================================================
   SHA-256
   ========================================================= */

async function sha256(value) {

  const data =
    new TextEncoder().encode(value);

  const hashBuffer =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );

  const hashArray =
    Array.from(
      new Uint8Array(hashBuffer)
    );

  return hashArray
    .map(
      byte =>
        byte
          .toString(16)
          .padStart(2, "0")
    )
    .join("");
}


/* =========================================================
   USERNAME
   ========================================================= */

async function generateUsername(
  db,
  name
) {

  let base =
    name
      .toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        ""
      )
      .slice(0, 15);


  if (!base) {
    base = "user";
  }


  let username = base;


  for (let i = 0; i < 100; i++) {

    const existing =
      await db
        .prepare(`
          SELECT id
          FROM users
          WHERE username = ?
          LIMIT 1
        `)
        .bind(username)
        .first();


    if (!existing) {
      return username;
    }


    username =
      `${base}${Math.floor(
        1000 + Math.random() * 9000
      )}`;

  }


  return (
    `user${Date.now()}`
  );

}