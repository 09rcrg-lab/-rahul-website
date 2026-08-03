/* =========================================================
   RAHUL SOCIAL HUB
   WORKER.JS — PART 1
   CORE CONFIG + RESPONSE + CORS + ROUTER
   ========================================================= */


/* =========================================================
   CORS
   ========================================================= */

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods":
        "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
        "Content-Type, Authorization",
    "Access-Control-Max-Age":
        "86400"
};


/* =========================================================
   DEFAULT HEADERS
   ========================================================= */

function jsonHeaders(extra = {}) {

    return {
        "Content-Type":
            "application/json; charset=UTF-8",

        ...CORS_HEADERS,

        ...extra
    };
}


/* =========================================================
   JSON RESPONSE
   ========================================================= */

function jsonResponse(
    data,
    status = 200,
    extraHeaders = {}
) {

    return new Response(
        JSON.stringify(data),
        {
            status,

            headers:
                jsonHeaders(
                    extraHeaders
                )
        }
    );
}


/* =========================================================
   SUCCESS RESPONSE
   ========================================================= */

function successResponse(
    data = {},
    status = 200
) {

    return jsonResponse(
        {
            success: true,
            ...data
        },
        status
    );
}


/* =========================================================
   ERROR RESPONSE
   ========================================================= */

function errorResponse(
    message = "Something went wrong.",
    status = 400,
    extra = {}
) {

    return jsonResponse(
        {
            success: false,
            message,
            ...extra
        },
        status
    );
}


/* =========================================================
   OPTIONS / PREFLIGHT
   ========================================================= */

function handleOptions(
    request
) {

    if (
        request.method !==
        "OPTIONS"
    ) {

        return null;
    }

    return new Response(
        null,
        {
            status: 204,
            headers:
                CORS_HEADERS
        }
    );
}


/* =========================================================
   REQUEST BODY
   ========================================================= */

async function readJSON(
    request
) {

    try {

        return await request.json();

    } catch {

        return null;
    }
}


/* =========================================================
   TEXT CLEANER
   ========================================================= */

function cleanText(
    value,
    maxLength = 500
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }

    return String(value)
        .trim()
        .slice(
            0,
            maxLength
        );
}


/* =========================================================
   ID VALIDATION
   ========================================================= */

function validId(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return false;
    }

    return String(value).trim().length > 0;
}


/* =========================================================
   UUID
   ========================================================= */

function createId() {

    return crypto.randomUUID();
}


/* =========================================================
   CURRENT TIME
   ========================================================= */

function nowISO() {

    return new Date()
        .toISOString();
}


/* =========================================================
   AUTH TOKEN
   ========================================================= */

function createAuthToken() {

    return `${createId()}-${createId()}`;
}


/* =========================================================
   PASSWORD HASH
   ========================================================= */

async function hashPassword(
    password
) {

    const data =
        new TextEncoder().encode(
            password
        );

    const hash =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );

    return Array.from(
        new Uint8Array(hash)
    )
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(
                        2,
                        "0"
                    )
        )
        .join("");
}


/* =========================================================
   REQUEST URL
   ========================================================= */

function getURL(
    request
) {

    return new URL(
        request.url
    );
}


/* =========================================================
   PATH PARTS
   ========================================================= */

function getPathParts(
    request
) {

    const url =
        getURL(request);

    return url.pathname
        .split("/")
        .filter(Boolean);
}


/* =========================================================
   METHOD CHECK
   ========================================================= */

function methodIs(
    request,
    method
) {

    return (
        request.method.toUpperCase() ===
        method.toUpperCase()
    );
}


/* =========================================================
   AUTH HEADER
   ========================================================= */

function getBearerToken(
    request
) {

    const header =
        request.headers.get(
            "Authorization"
        );

    if (!header) {
        return null;
    }

    const parts =
        header.split(" ");

    if (
        parts.length !== 2 ||
        parts[0].toLowerCase() !==
            "bearer"
    ) {

        return null;
    }

    return parts[1];
}


/* =========================================================
   REQUEST CONTEXT
   ========================================================= */

function createRequestContext(
    request,
    env
) {

    const url =
        getURL(request);

    const parts =
        getPathParts(request);

    return {

        request,

        env,

        url,

        pathname:
            url.pathname,

        searchParams:
            url.searchParams,

        parts,

        method:
            request.method.toUpperCase(),

        token:
            getBearerToken(
                request
            )
    };
}


/* =========================================================
   DATABASE CHECK
   ========================================================= */

function databaseAvailable(
    env
) {

    return Boolean(
        env &&
        env.DB
    );
}


/* =========================================================
   DATABASE ERROR
   ========================================================= */

function databaseError() {

    return errorResponse(
        "Database connection is not configured.",
        500
    );
}


/* =========================================================
   ROOT API
   ========================================================= */

async function handleRoot(
    context
) {

    return successResponse({

        message:
            "Rahul Social Hub API Running 🚀",

        service:
            "Rahul Social Hub",

        version:
            "1.0.0",

        time:
            nowISO()
    });
}


/* =========================================================
   API TEST
   ========================================================= */

async function handleAPITest(
    context
) {

    if (
        !databaseAvailable(
            context.env
        )
    ) {

        return databaseError();
    }

    try {

        const result =
            await context.env.DB
                .prepare(
                    `
                    SELECT
                        name
                    FROM sqlite_master
                    WHERE type = 'table'
                    ORDER BY name
                    `
                )
                .all();

        return successResponse({

            database:
                "connected",

            tables:
                result.results || []

        });

    } catch (error) {

        console.error(
            "DB TEST ERROR:",
            error
        );

        return errorResponse(
            "Database test failed.",
            500
        );
    }
}


/* =========================================================
   ROUTER
   ========================================================= */

async function router(
    context
) {

    const {
        pathname,
        method
    } = context;


    /* -----------------------------------------
       HOME
       ----------------------------------------- */

    if (
        pathname === "/" &&
        method === "GET"
    ) {

        return handleRoot(
            context
        );
    }


    /* -----------------------------------------
       API TEST
       ----------------------------------------- */

    if (
        pathname === "/api/test" &&
        method === "GET"
    ) {

        return handleAPITest(
            context
        );
    }


    /* -----------------------------------------
       UNKNOWN ROUTE
       ----------------------------------------- */

    return errorResponse(
        "API route not found.",
        404
    );
}


/* =========================================================
   MAIN FETCH
   ========================================================= */

export default {

    async fetch(
        request,
        env,
        ctx
    ) {

        try {

            const optionsResponse =
                handleOptions(
                    request
                );

            if (
                optionsResponse
            ) {

                return optionsResponse;
            }


            const context =
                createRequestContext(
                    request,
                    env
                );


            return await router(
                context
            );


        } catch (error) {

            console.error(
                "WORKER ERROR:",
                error
            );

            return errorResponse(
                "Internal server error.",
                500
            );
        }
    }
};/* =========================================================
   RAHUL SOCIAL HUB
   WORKER.JS — PART 2
   REGISTER + LOGIN + AUTHENTICATION
   ========================================================= */


/* =========================================================
   VALIDATE REGISTER DATA
   ========================================================= */

function validateRegisterData(data) {

    if (!data) {
        return "Invalid request.";
    }

    const username =
        cleanText(
            data.username,
            30
        );

    const email =
        cleanText(
            data.email,
            120
        ).toLowerCase();

    const password =
        String(
            data.password || ""
        );

    if (!username) {
        return "Username is required.";
    }

    if (
        username.length < 3
    ) {
        return "Username कम से कम 3 characters का होना चाहिए.";
    }

    if (
        !/^[a-zA-Z0-9_.]+$/.test(
            username
        )
    ) {
        return "Username में केवल letters, numbers, _ और . इस्तेमाल करें.";
    }

    if (!email) {
        return "Email is required.";
    }

    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email
        )
    ) {
        return "Valid email डालें.";
    }

    if (
        password.length < 6
    ) {
        return "Password कम से कम 6 characters का होना चाहिए.";
    }

    return null;
}


/* =========================================================
   REGISTER
   POST /api/register
   ========================================================= */

async function handleRegister(
    context
) {

    if (
        !databaseAvailable(
            context.env
        )
    ) {

        return databaseError();
    }

    const data =
        await readJSON(
            context.request
        );

    const validationError =
        validateRegisterData(
            data
        );

    if (validationError) {

        return errorResponse(
            validationError,
            400
        );
    }

    const username =
        cleanText(
            data.username,
            30
        );

    const email =
        cleanText(
            data.email,
            120
        ).toLowerCase();

    const password =
        String(
            data.password || ""
        );

    try {

        /* -----------------------------------------
           CHECK USERNAME
           ----------------------------------------- */

        const existingUsername =
            await context.env.DB
                .prepare(
                    `
                    SELECT id
                    FROM users
                    WHERE LOWER(username) = ?
                    LIMIT 1
                    `
                )
                .bind(
                    username
                )
                .first();

        if (
            existingUsername
        ) {

            return errorResponse(
                "Username already exists.",
                409
            );
        }


        /* -----------------------------------------
           CHECK EMAIL
           ----------------------------------------- */

        const existingEmail =
            await context.env.DB
                .prepare(
                    `
                    SELECT id
                    FROM users
                    WHERE LOWER(email) = ?
                    LIMIT 1
                    `
                )
                .bind(
                    email
                )
                .first();

        if (
            existingEmail
        ) {

            return errorResponse(
                "Email already registered.",
                409
            );
        }


        /* -----------------------------------------
           PASSWORD HASH
           ----------------------------------------- */

        const passwordHash =
            await hashPassword(
                password
            );


        /* -----------------------------------------
           USER ID
           ----------------------------------------- */

        const userId =
            createId();


        /* -----------------------------------------
           REFERRAL CODE
           ----------------------------------------- */

        const referralCode =
            `RH${Math.random()
                .toString(36)
                .slice(2, 10)
                .toUpperCase()}`;


        /* -----------------------------------------
           INSERT USER
           ----------------------------------------- */

        await context.env.DB
            .prepare(
                `
                INSERT INTO users
                (
                    id,
                    username,
                    email,
                    password,
                    referral_code,
                    created_at
                )
                VALUES
                (?, ?, ?, ?, ?, ?)
                `
            )
            .bind(
                userId,
                username,
                email,
                passwordHash,
                referralCode,
                nowISO()
            )
            .run();


        /* -----------------------------------------
           CREATE TOKEN
           ----------------------------------------- */

        const token =
            createAuthToken();


        /* -----------------------------------------
           SAVE TOKEN
           ----------------------------------------- */

        await saveSession(
            context.env,
            userId,
            token
        );


        /* -----------------------------------------
           RESPONSE
           ----------------------------------------- */

        return successResponse({

            message:
                "Registration successful.",

            token,

            user: {
                id:
                    userId,

                username,

                email,

                referral_code:
                    referralCode
            }

        }, 201);


    } catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );

        return errorResponse(
            "Registration failed.",
            500
        );
    }
}


/* =========================================================
   LOGIN VALIDATION
   ========================================================= */

function validateLoginData(
    data
) {

    if (!data) {
        return "Invalid request.";
    }

    const identifier =
        cleanText(
            data.identifier ||
            data.email ||
            data.username,
            120
        );

    const password =
        String(
            data.password || ""
        );

    if (!identifier) {
        return "Email या username डालें.";
    }

    if (!password) {
        return "Password डालें.";
    }

    return null;
}


/* =========================================================
   LOGIN
   POST /api/login
   ========================================================= */

async function handleLogin(
    context
) {

    if (
        !databaseAvailable(
            context.env
        )
    ) {

        return databaseError();
    }

    const data =
        await readJSON(
            context.request
        );

    const validationError =
        validateLoginData(
            data
        );

    if (validationError) {

        return errorResponse(
            validationError,
            400
        );
    }

    const identifier =
        cleanText(
            data.identifier ||
            data.email ||
            data.username,
            120
        ).toLowerCase();

    const password =
        String(
            data.password || ""
        );

    try {

        /* -----------------------------------------
           FIND USER
           ----------------------------------------- */

        const user =
            await context.env.DB
                .prepare(
                    `
                    SELECT *
                    FROM users
                    WHERE
                        LOWER(email) = ?
                        OR
                        LOWER(username) = ?
                    LIMIT 1
                    `
                )
                .bind(
                    identifier,
                    identifier
                )
                .first();


        if (!user) {

            return errorResponse(
                "Invalid email/username or password.",
                401
            );
        }


        /* -----------------------------------------
           PASSWORD CHECK
           ----------------------------------------- */

        const passwordHash =
            await hashPassword(
                password
            );

        if (
            passwordHash !==
            user.password
        ) {

            return errorResponse(
                "Invalid email/username or password.",
                401
            );
        }


        /* -----------------------------------------
           CREATE SESSION
           ----------------------------------------- */

        const token =
            createAuthToken();


        await saveSession(
            context.env,
            user.id,
            token
        );


        /* -----------------------------------------
           UPDATE LAST LOGIN
           ----------------------------------------- */

        try {

            await context.env.DB
                .prepare(
                    `
                    UPDATE users
                    SET last_login = ?
                    WHERE id = ?
                    `
                )
                .bind(
                    nowISO(),
                    user.id
                )
                .run();

        } catch {
            /* Old database schema may not
               have last_login column. */
        }


        /* -----------------------------------------
           USER RESPONSE
           ----------------------------------------- */

        return successResponse({

            message:
                "Login successful.",

            token,

            user:
                sanitizeUser(
                    user
                )
        });


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        return errorResponse(
            "Login failed.",
            500
        );
    }
}


/* =========================================================
   SAVE SESSION
   ========================================================= */

async function saveSession(
    env,
    userId,
    token
) {

    if (
        !databaseAvailable(env)
    ) {

        throw new Error(
            "Database unavailable."
        );
    }

    /*
       Sessions table automatically create
       karne ki koshish.

       Agar table already hai to
       IF NOT EXISTS ki wajah se error nahi hoga.
    */

    await env.DB
        .prepare(
            `
            CREATE TABLE IF NOT EXISTS sessions
            (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                token TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL,
                expires_at TEXT
            )
            `
        )
        .run();


    const sessionId =
        createId();


    const expiresAt =
        new Date(
            Date.now() +
            (
                30 *
                24 *
                60 *
                60 *
                1000
            )
        ).toISOString();


    await env.DB
        .prepare(
            `
            INSERT INTO sessions
            (
                id,
                user_id,
                token,
                created_at,
                expires_at
            )
            VALUES
            (?, ?, ?, ?, ?)
            `
        )
        .bind(
            sessionId,
            userId,
            token,
            nowISO(),
            expiresAt
        )
        .run();


    return token;
}


/* =========================================================
   GET USER BY TOKEN
   ========================================================= */

async function getUserByToken(
    env,
    token
) {

    if (
        !token ||
        !databaseAvailable(env)
    ) {

        return null;
    }

    try {

        const session =
            await env.DB
                .prepare(
                    `
                    SELECT
                        s.user_id,
                        s.expires_at
                    FROM sessions s
                    WHERE s.token = ?
                    LIMIT 1
                    `
                )
                .bind(
                    token
                )
                .first();

        if (!session) {
            return null;
        }


        /* -----------------------------------------
           TOKEN EXPIRY
           ----------------------------------------- */

        if (
            session.expires_at
        ) {

            const expiry =
                new Date(
                    session.expires_at
                ).getTime();

            if (
                !Number.isNaN(expiry) &&
                expiry < Date.now()
            ) {

                try {

                    await env.DB
                        .prepare(
                            `
                            DELETE FROM sessions
                            WHERE token = ?
                            `
                        )
                        .bind(
                            token
                        )
                        .run();

                } catch {}

                return null;
            }
        }


        /* -----------------------------------------
           USER
           ----------------------------------------- */

        const user =
            await env.DB
                .prepare(
                    `
                    SELECT *
                    FROM users
                    WHERE id = ?
                    LIMIT 1
                    `
                )
                .bind(
                    session.user_id
                )
                .first();


        return user || null;


    } catch (error) {

        console.error(
            "AUTH ERROR:",
            error
        );

        return null;
    }
}


/* =========================================================
   REQUIRE AUTHENTICATION
   ========================================================= */

async function requireAuth(
    context
) {

    const token =
        context.token;

    if (!token) {

        return {
            user: null,
            response:
                errorResponse(
                    "Authentication required.",
                    401
                )
        };
    }

    const user =
        await getUserByToken(
            context.env,
            token
        );

    if (!user) {

        return {
            user: null,
            response:
                errorResponse(
                    "Invalid or expired session.",
                    401
                )
        };
    }

    return {
        user,
        response: null
    };
}


/* =========================================================
   SANITIZE USER
   ========================================================= */

function sanitizeUser(
    user
) {

    if (!user) {
        return null;
    }

    return {

        id:
            user.id,

        username:
            user.username || "",

        email:
            user.email || "",

        name:
            user.name ||
            user.display_name ||
            user.username ||
            "",

        avatar:
            user.avatar ||
            user.profile_photo ||
            "",

        profile_photo:
            user.profile_photo ||
            user.avatar ||
            "",

        bio:
            user.bio || "",

        referral_code:
            user.referral_code ||
            "",

        balance:
            Number(
                user.balance || 0
            ),

        created_at:
            user.created_at ||
            null
    };
}


/* =========================================================
   CURRENT USER API
   GET /api/me
   ========================================================= */

async function handleMe(
    context
) {

    const auth =
        await requireAuth(
            context
        );

    if (
        auth.response
    ) {

        return auth.response;
    }

    return successResponse({

        user:
            sanitizeUser(
                auth.user
            )
    });
}


/* =========================================================
   LOGOUT
   POST /api/logout
   ========================================================= */

async function handleLogout(
    context
) {

    if (
        !context.token
    ) {

        return successResponse({

            message:
                "Already logged out."
        });
    }

    if (
        databaseAvailable(
            context.env
        )
    ) {

        try {

            await context.env.DB
                .prepare(
                    `
                    DELETE FROM sessions
                    WHERE token = ?
                    `
                )
                .bind(
                    context.token
                )
                .run();

        } catch (error) {

            console.warn(
                "LOGOUT SESSION:",
                error
            );
        }
    }

    return successResponse({

        message:
            "Logout successful."
    });
}


/* =========================================================
   AUTH ROUTES
   ========================================================= */

async function handleAuthRoutes(
    context
) {

    const {
        pathname,
        method
    } = context;


    if (
        pathname === "/api/register" &&
        method === "POST"
    ) {

        return handleRegister(
            context
        );
    }


    if (
        pathname === "/api/login" &&
        method === "POST"
    ) {

        return handleLogin(
            context
        );
    }


    if (
        pathname === "/api/me" &&
        method === "GET"
    ) {

        return handleMe(
            context
        );
    }


    if (
        pathname === "/api/logout" &&
        method === "POST"
    ) {

        return handleLogout(
            context
        );
    }


    return null;
}/* =========================================================
   RAHUL SOCIAL HUB
   WORKER.JS — PART 3
   PROFILE + FOLLOW SYSTEM
   ========================================================= */


/* =========================================================
   PROFILE HELPERS
   ========================================================= */

function userTableColumns(env) {
    return env.DB.prepare(`
        PRAGMA table_info(users)
    `).all();
}


async function ensureUserProfileColumns(env) {

    if (!databaseAvailable(env)) {
        throw new Error("Database unavailable.");
    }

    const result =
        await env.DB
            .prepare(`
                PRAGMA table_info(users)
            `)
            .all();

    const columns =
        new Set(
            (result.results || [])
                .map(row => row.name)
        );

    const additions = [
        ["name", "TEXT"],
        ["display_name", "TEXT"],
        ["avatar", "TEXT"],
        ["profile_photo", "TEXT"],
        ["bio", "TEXT"],
        ["phone", "TEXT"],
        ["followers_count", "INTEGER DEFAULT 0"],
        ["following_count", "INTEGER DEFAULT 0"],
        ["last_login", "TEXT"]
    ];

    for (const [name, type] of additions) {

        if (!columns.has(name)) {

            try {

                await env.DB
                    .prepare(
                        `ALTER TABLE users ADD COLUMN ${name} ${type}`
                    )
                    .run();

            } catch (error) {

                console.warn(
                    `Could not add users.${name}:`,
                    error.message
                );
            }
        }
    }
}


/* =========================================================
   FOLLOW TABLE
   ========================================================= */

async function ensureFollowTable(env) {

    await env.DB
        .prepare(`
            CREATE TABLE IF NOT EXISTS follows
            (
                id TEXT PRIMARY KEY,
                follower_id TEXT NOT NULL,
                following_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE(follower_id, following_id)
            )
        `)
        .run();
}


/* =========================================================
   BLOCK TABLE
   ========================================================= */

async function ensureBlockTable(env) {

    await env.DB
        .prepare(`
            CREATE TABLE IF NOT EXISTS blocked_users
            (
                id TEXT PRIMARY KEY,
                blocker_id TEXT NOT NULL,
                blocked_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE(blocker_id, blocked_id)
            )
        `)
        .run();
}


/* =========================================================
   MUTE TABLE
   ========================================================= */

async function ensureMuteTable(env) {

    await env.DB
        .prepare(`
            CREATE TABLE IF NOT EXISTS muted_users
            (
                id TEXT PRIMARY KEY,
                muter_id TEXT NOT NULL,
                muted_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE(muter_id, muted_id)
            )
        `)
        .run();
}


/* =========================================================
   REPORT TABLE
   ========================================================= */

async function ensureUserReportTable(env) {

    await env.DB
        .prepare(`
            CREATE TABLE IF NOT EXISTS user_reports
            (
                id TEXT PRIMARY KEY,
                reporter_id TEXT NOT NULL,
                reported_id TEXT NOT NULL,
                reason TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TEXT NOT NULL
            )
        `)
        .run();
}


/* =========================================================
   GET PROFILE
   GET /api/profile
   ========================================================= */

async function handleGetMyProfile(
    context
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }

    try {

        await ensureUserProfileColumns(
            context.env
        );

        const user =
            await context.env.DB
                .prepare(`
                    SELECT *
                    FROM users
                    WHERE id = ?
                    LIMIT 1
                `)
                .bind(
                    auth.user.id
                )
                .first();

        if (!user) {

            return errorResponse(
                "User not found.",
                404
            );
        }

        return successResponse({
            user: sanitizeUser(user)
        });

    } catch (error) {

        console.error(
            "GET PROFILE ERROR:",
            error
        );

        return errorResponse(
            "Profile load failed.",
            500
        );
    }
}


/* =========================================================
   UPDATE PROFILE
   PUT /api/profile
   ========================================================= */

async function handleUpdateProfile(
    context
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }

    const data =
        await readJSON(
            context.request
        );

    if (!data) {

        return errorResponse(
            "Invalid profile data.",
            400
        );
    }

    const name =
        cleanText(
            data.name ||
            data.display_name,
            80
        );

    const bio =
        cleanText(
            data.bio,
            500
        );

    const avatar =
        cleanText(
            data.avatar ||
            data.profile_photo,
            2000
        );

    try {

        await ensureUserProfileColumns(
            context.env
        );

        await context.env.DB
            .prepare(`
                UPDATE users
                SET
                    name = ?,
                    display_name = ?,
                    bio = ?,
                    avatar = ?,
                    profile_photo = ?
                WHERE id = ?
            `)
            .bind(
                name,
                name,
                bio,
                avatar,
                avatar,
                auth.user.id
            )
            .run();

        const user =
            await context.env.DB
                .prepare(`
                    SELECT *
                    FROM users
                    WHERE id = ?
                    LIMIT 1
                `)
                .bind(
                    auth.user.id
                )
                .first();

        return successResponse({
            message:
                "Profile updated successfully.",
            user:
                sanitizeUser(user)
        });

    } catch (error) {

        console.error(
            "UPDATE PROFILE ERROR:",
            error
        );

        return errorResponse(
            "Profile update failed.",
            500
        );
    }
}


/* =========================================================
   GET USER PROFILE
   GET /api/users/:id
   ========================================================= */

async function handleGetUserProfile(
    context,
    userId
) {

    if (!validId(userId)) {

        return errorResponse(
            "User ID is required.",
            400
        );
    }

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }

    try {

        await ensureUserProfileColumns(
            context.env
        );

        await ensureFollowTable(
            context.env
        );

        const user =
            await context.env.DB
                .prepare(`
                    SELECT *
                    FROM users
                    WHERE id = ?
                    LIMIT 1
                `)
                .bind(userId)
                .first();

        if (!user) {

            return errorResponse(
                "User not found.",
                404
            );
        }

        const following =
            await context.env.DB
                .prepare(`
                    SELECT id
                    FROM follows
                    WHERE
                        follower_id = ?
                        AND
                        following_id = ?
                    LIMIT 1
                `)
                .bind(
                    auth.user.id,
                    userId
                )
                .first();

        const followerCount =
            await context.env.DB
                .prepare(`
                    SELECT COUNT(*) AS count
                    FROM follows
                    WHERE following_id = ?
                `)
                .bind(userId)
                .first();

        const followingCount =
            await context.env.DB
                .prepare(`
                    SELECT COUNT(*) AS count
                    FROM follows
                    WHERE follower_id = ?
                `)
                .bind(userId)
                .first();

        const profile =
            sanitizeUser(user);

        profile.followers_count =
            Number(
                followerCount?.count || 0
            );

        profile.following_count =
            Number(
                followingCount?.count || 0
            );

        profile.is_following =
            Boolean(following);

        profile.is_self =
            String(
                auth.user.id
            ) ===
            String(userId);

        return successResponse({
            user: profile
        });

    } catch (error) {

        console.error(
            "GET USER PROFILE ERROR:",
            error
        );

        return errorResponse(
            "User profile load failed.",
            500
        );
    }
}


/* =========================================================
   FOLLOW USER
   POST /api/users/:id/follow
   ========================================================= */

async function handleFollowUser(
    context,
    userId
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }

    if (!validId(userId)) {

        return errorResponse(
            "User ID is required.",
            400
        );
    }

    if (
        String(auth.user.id) ===
        String(userId)
    ) {

        return errorResponse(
            "You cannot follow yourself.",
            400
        );
    }

    try {

        await ensureFollowTable(
            context.env
        );

        await ensureBlockTable(
            context.env
        );

        const target =
            await context.env.DB
                .prepare(`
                    SELECT id
                    FROM users
                    WHERE id = ?
                    LIMIT 1
                `)
                .bind(userId)
                .first();

        if (!target) {

            return errorResponse(
                "User not found.",
                404
            );
        }

        const blocked =
            await context.env.DB
                .prepare(`
                    SELECT id
                    FROM blocked_users
                    WHERE
                        (
                            blocker_id = ?
                            AND
                            blocked_id = ?
                        )
                        OR
                        (
                            blocker_id = ?
                            AND
                            blocked_id = ?
                        )
                    LIMIT 1
                `)
                .bind(
                    auth.user.id,
                    userId,
                    userId,
                    auth.user.id
                )
                .first();

        if (blocked) {

            return errorResponse(
                "Follow action unavailable.",
                403
            );
        }

        const existing =
            await context.env.DB
                .prepare(`
                    SELECT id
                    FROM follows
                    WHERE
                        follower_id = ?
                        AND
                        following_id = ?
                    LIMIT 1
                `)
                .bind(
                    auth.user.id,
                    userId
                )
                .first();

        if (existing) {

            return successResponse({
                message:
                    "Already following.",
                following: true
            });
        }

        await context.env.DB
            .prepare(`
                INSERT INTO follows
                (
                    id,
                    follower_id,
                    following_id,
                    created_at
                )
                VALUES (?, ?, ?, ?)
            `)
            .bind(
                createId(),
                auth.user.id,
                userId,
                nowISO()
            )
            .run();

        return successResponse({
            message:
                "User followed.",
            following: true
        });

    } catch (error) {

        console.error(
            "FOLLOW ERROR:",
            error
        );

        return errorResponse(
            "Follow failed.",
            500
        );
    }
}


/* =========================================================
   UNFOLLOW USER
   POST /api/users/:id/unfollow
   ========================================================= */

async function handleUnfollowUser(
    context,
    userId
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }

    if (!validId(userId)) {

        return errorResponse(
            "User ID is required.",
            400
        );
    }

    try {

        await ensureFollowTable(
            context.env
        );

        await context.env.DB
            .prepare(`
                DELETE FROM follows
                WHERE
                    follower_id = ?
                    AND
                    following_id = ?
            `)
            .bind(
                auth.user.id,
                userId
            )
            .run();

        return successResponse({
            message:
                "User unfollowed.",
            following: false
        });

    } catch (error) {

        console.error(
            "UNFOLLOW ERROR:",
            error
        );

        return errorResponse(
            "Unfollow failed.",
            500
        );
    }
}


/* =========================================================
   TOGGLE FOLLOW
   POST /api/users/:id/follow-toggle
   ========================================================= */

async function handleFollowToggle(
    context,
    userId
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }

    if (!validId(userId)) {

        return errorResponse(
            "User ID is required.",
            400
        );
    }

    if (
        String(auth.user.id) ===
        String(userId)
    ) {

        return errorResponse(
            "You cannot follow yourself.",
            400
        );
    }

    try {

        await ensureFollowTable(
            context.env
        );

        const existing =
            await context.env.DB
                .prepare(`
                    SELECT id
                    FROM follows
                    WHERE
                        follower_id = ?
                        AND
                        following_id = ?
                    LIMIT 1
                `)
                .bind(
                    auth.user.id,
                    userId
                )
                .first();

        if (existing) {

            await context.env.DB
                .prepare(`
                    DELETE FROM follows
                    WHERE id = ?
                `)
                .bind(
                    existing.id
                )
                .run();

            return successResponse({
                message:
                    "User unfollowed.",
                following: false
            });
        }

        await context.env.DB
            .prepare(`
                INSERT INTO follows
                (
                    id,
                    follower_id,
                    following_id,
                    created_at
                )
                VALUES (?, ?, ?, ?)
            `)
            .bind(
                createId(),
                auth.user.id,
                userId,
                nowISO()
            )
            .run();

        return successResponse({
            message:
                "User followed.",
            following: true
        });

    } catch (error) {

        console.error(
            "FOLLOW TOGGLE ERROR:",
            error
        );

        return errorResponse(
            "Follow action failed.",
            500
        );
    }
}


/* =========================================================
   FOLLOWERS
   GET /api/users/:id/followers
   ========================================================= */

async function handleFollowers(
    context,
    userId
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }

    if (!validId(userId)) {

        return errorResponse(
            "User ID is required.",
            400
        );
    }

    try {

        await ensureFollowTable(
            context.env
        );

        await ensureUserProfileColumns(
            context.env
        );

        const result =
            await context.env.DB
                .prepare(`
                    SELECT
                        u.id,
                        u.username,
                        u.name,
                        u.display_name,
                        u.avatar,
                        u.profile_photo
                    FROM follows f
                    INNER JOIN users u
                        ON u.id = f.follower_id
                    WHERE f.following_id = ?
                    ORDER BY f.created_at DESC
                `)
                .bind(userId)
                .all();

        return successResponse({

            users:
                (result.results || [])
                    .map(
                        sanitizeUser
                    )

        });

    } catch (error) {

        console.error(
            "FOLLOWERS ERROR:",
            error
        );

        return errorResponse(
            "Followers load failed.",
            500
        );
    }
}


/* =========================================================
   FOLLOWING
   GET /api/users/:id/following
   ========================================================= */

async function handleFollowing(
    context,
    userId
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }

    if (!validId(userId)) {

        return errorResponse(
            "User ID is required.",
            400
        );
    }

    try {

        await ensureFollowTable(
            context.env
        );

        await ensureUserProfileColumns(
            context.env
        );

        const result =
            await context.env.DB
                .prepare(`
                    SELECT
                        u.id,
                        u.username,
                        u.name,
                        u.display_name,
                        u.avatar,
                        u.profile_photo
                    FROM follows f
                    INNER JOIN users u
                        ON u.id = f.following_id
                    WHERE f.follower_id = ?
                    ORDER BY f.created_at DESC
                `)
                .bind(userId)
                .all();

        return successResponse({

            users:
                (result.results || [])
                    .map(
                        sanitizeUser
                    )

        });

    } catch (error) {

        console.error(
            "FOLLOWING ERROR:",
            error
        );

        return errorResponse(
            "Following list load failed.",
            500
        );
    }
}


/* =========================================================
   PROFILE + FOLLOW ROUTES
   ========================================================= */

async function handleProfileRoutes(
    context
) {

    const {
        pathname,
        method,
        parts
    } = context;


    /* -----------------------------------------
       MY PROFILE
       ----------------------------------------- */

    if (
        pathname === "/api/profile" &&
        method === "GET"
    ) {

        return handleGetMyProfile(
            context
        );
    }


    /* -----------------------------------------
       UPDATE PROFILE
       ----------------------------------------- */

    if (
        pathname === "/api/profile" &&
        method === "PUT"
    ) {

        return handleUpdateProfile(
            context
        );
    }


    /* -----------------------------------------
       USER PROFILE
       /api/users/:id
       ----------------------------------------- */

    if (
        parts.length === 3 &&
        parts[0] === "api" &&
        parts[1] === "users" &&
        method === "GET"
    ) {

        return handleGetUserProfile(
            context,
            parts[2]
        );
    }


    /* -----------------------------------------
       FOLLOW
       ----------------------------------------- */

    if (
        parts.length === 4 &&
        parts[0] === "api" &&
        parts[1] === "users" &&
        parts[3] === "follow" &&
        method === "POST"
    ) {

        return handleFollowUser(
            context,
            parts[2]
        );
    }


    /* -----------------------------------------
       UNFOLLOW
       ----------------------------------------- */

    if (
        parts.length === 4 &&
        parts[0] === "api" &&
        parts[1] === "users" &&
        parts[3] === "unfollow" &&
        method === "POST"
    ) {

        return handleUnfollowUser(
            context,
            parts[2]
        );
    }


    /* -----------------------------------------
       FOLLOW TOGGLE
       ----------------------------------------- */

    if (
        parts.length === 4 &&
        parts[0] === "api" &&
        parts[1] === "users" &&
        parts[3] === "follow-toggle" &&
        method === "POST"
    ) {

        return handleFollowToggle(
            context,
            parts[2]
        );
    }


    /* -----------------------------------------
       FOLLOWERS
       ----------------------------------------- */

    if (
        parts.length === 4 &&
        parts[0] === "api" &&
        parts[1] === "users" &&
        parts[3] === "followers" &&
        method === "GET"
    ) {

        return handleFollowers(
            context,
            parts[2]
        );
    }


    /* -----------------------------------------
       FOLLOWING
       ----------------------------------------- */

    if (
        parts.length === 4 &&
        parts[0] === "api" &&
        parts[1] === "users" &&
        parts[3] === "following" &&
        method === "GET"
    ) {

        return handleFollowing(
            context,
            parts[2]
        );
    }


    return null;
}/* =========================================================
   RAHUL SOCIAL HUB
   WORKER.JS — PART 4
   LIVE ROOMS + VOICE SEATS + MIC STATUS
   ========================================================= */


/* =========================================================
   LIVE ROOM TABLES
   ========================================================= */

async function ensureLiveRoomTables(env) {

    if (!databaseAvailable(env)) {
        throw new Error("Database unavailable.");
    }

    await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS live_rooms
        (
            id TEXT PRIMARY KEY,
            owner_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            status TEXT DEFAULT 'live',
            viewer_count INTEGER DEFAULT 0,
            max_seats INTEGER DEFAULT 12,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    `).run();


    await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS live_room_seats
        (
            id TEXT PRIMARY KEY,
            room_id TEXT NOT NULL,
            seat_number INTEGER NOT NULL,
            user_id TEXT,
            mic_on INTEGER DEFAULT 0,
            joined_at TEXT,
            updated_at TEXT NOT NULL,
            UNIQUE(room_id, seat_number)
        )
    `).run();


    await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS live_room_viewers
        (
            id TEXT PRIMARY KEY,
            room_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            joined_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(room_id, user_id)
        )
    `).run();
}


/* =========================================================
   CREATE SEATS
   ========================================================= */

async function createRoomSeats(
    env,
    roomId,
    maxSeats
) {

    const seats = [];

    for (
        let number = 1;
        number <= maxSeats;
        number++
    ) {

        seats.push(
            env.DB.prepare(`
                INSERT OR IGNORE INTO
                live_room_seats
                (
                    id,
                    room_id,
                    seat_number,
                    user_id,
                    mic_on,
                    joined_at,
                    updated_at
                )
                VALUES (?, ?, ?, NULL, 0, NULL, ?)
            `)
            .bind(
                createId(),
                roomId,
                number,
                nowISO()
            )
        );
    }

    if (seats.length) {

        await env.DB.batch(
            seats
        );
    }
}


/* =========================================================
   CREATE LIVE ROOM
   POST /api/live/rooms
   ========================================================= */

async function handleCreateLiveRoom(
    context
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }


    const data =
        await readJSON(
            context.request
        );


    const title =
        cleanText(
            data?.title,
            100
        );


    const description =
        cleanText(
            data?.description,
            500
        );


    let maxSeats =
        Number(
            data?.max_seats || 12
        );


    if (!title) {

        return errorResponse(
            "Room title is required.",
            400
        );
    }


    if (
        !Number.isInteger(maxSeats) ||
        maxSeats < 1 ||
        maxSeats > 20
    ) {

        maxSeats = 12;
    }


    try {

        await ensureLiveRoomTables(
            context.env
        );


        const roomId =
            createId();


        const time =
            nowISO();


        await context.env.DB
            .prepare(`
                INSERT INTO live_rooms
                (
                    id,
                    owner_id,
                    title,
                    description,
                    status,
                    viewer_count,
                    max_seats,
                    created_at,
                    updated_at
                )
                VALUES
                (?, ?, ?, ?, 'live', 0, ?, ?, ?)
            `)
            .bind(
                roomId,
                auth.user.id,
                title,
                description,
                maxSeats,
                time,
                time
            )
            .run();


        await createRoomSeats(
            context.env,
            roomId,
            maxSeats
        );


        return successResponse({

            message:
                "Live room created.",

            room: {
                id:
                    roomId,

                owner_id:
                    auth.user.id,

                title,

                description,

                status:
                    "live",

                viewer_count:
                    0,

                max_seats:
                    maxSeats
            }

        }, 201);


    } catch (error) {

        console.error(
            "CREATE LIVE ROOM ERROR:",
            error
        );

        return errorResponse(
            "Live room create failed.",
            500
        );
    }
}


/* =========================================================
   LIST LIVE ROOMS
   GET /api/live/rooms
   ========================================================= */

async function handleListLiveRooms(
    context
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }


    try {

        await ensureLiveRoomTables(
            context.env
        );


        const result =
            await context.env.DB
                .prepare(`
                    SELECT
                        r.*,
                        u.username AS owner_username,
                        u.name AS owner_name,
                        u.avatar AS owner_avatar,
                        u.profile_photo AS owner_profile_photo
                    FROM live_rooms r
                    LEFT JOIN users u
                        ON u.id = r.owner_id
                    WHERE r.status = 'live'
                    ORDER BY r.created_at DESC
                `)
                .all();


        return successResponse({

            rooms:
                result.results || []

        });


    } catch (error) {

        console.error(
            "LIST LIVE ROOMS ERROR:",
            error
        );

        return errorResponse(
            "Live rooms load failed.",
            500
        );
    }
}


/* =========================================================
   GET LIVE ROOM
   GET /api/live/rooms/:id
   ========================================================= */

async function handleGetLiveRoom(
    context,
    roomId
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }


    if (!validId(roomId)) {

        return errorResponse(
            "Room ID is required.",
            400
        );
    }


    try {

        await ensureLiveRoomTables(
            context.env
        );


        const room =
            await context.env.DB
                .prepare(`
                    SELECT
                        r.*,
                        u.username AS owner_username,
                        u.name AS owner_name,
                        u.avatar AS owner_avatar,
                        u.profile_photo AS owner_profile_photo
                    FROM live_rooms r
                    LEFT JOIN users u
                        ON u.id = r.owner_id
                    WHERE r.id = ?
                    LIMIT 1
                `)
                .bind(roomId)
                .first();


        if (!room) {

            return errorResponse(
                "Live room not found.",
                404
            );
        }


        const seats =
            await context.env.DB
                .prepare(`
                    SELECT
                        s.id,
                        s.room_id,
                        s.seat_number,
                        s.user_id,
                        s.mic_on,
                        s.joined_at,
                        u.username,
                        u.name,
                        u.avatar,
                        u.profile_photo
                    FROM live_room_seats s
                    LEFT JOIN users u
                        ON u.id = s.user_id
                    WHERE s.room_id = ?
                    ORDER BY s.seat_number ASC
                `)
                .bind(roomId)
                .all();


        return successResponse({

            room,

            seats:
                seats.results || []

        });


    } catch (error) {

        console.error(
            "GET LIVE ROOM ERROR:",
            error
        );

        return errorResponse(
            "Live room load failed.",
            500
        );
    }
}


/* =========================================================
   JOIN ROOM AS VIEWER
   POST /api/live/rooms/:id/join
   ========================================================= */

async function handleJoinLiveRoom(
    context,
    roomId
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }


    if (!validId(roomId)) {

        return errorResponse(
            "Room ID is required.",
            400
        );
    }


    try {

        await ensureLiveRoomTables(
            context.env
        );


        const room =
            await context.env.DB
                .prepare(`
                    SELECT *
                    FROM live_rooms
                    WHERE id = ?
                    LIMIT 1
                `)
                .bind(roomId)
                .first();


        if (!room) {

            return errorResponse(
                "Live room not found.",
                404
            );
        }


        if (
            room.status !== "live"
        ) {

            return errorResponse(
                "This room is not live.",
                400
            );
        }


        await context.env.DB
            .prepare(`
                INSERT OR IGNORE INTO
                live_room_viewers
                (
                    id,
                    room_id,
                    user_id,
                    joined_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?)
            `)
            .bind(
                createId(),
                roomId,
                auth.user.id,
                nowISO(),
                nowISO()
            )
            .run();


        const count =
            await context.env.DB
                .prepare(`
                    SELECT COUNT(*) AS count
                    FROM live_room_viewers
                    WHERE room_id = ?
                `)
                .bind(roomId)
                .first();


        await context.env.DB
            .prepare(`
                UPDATE live_rooms
                SET
                    viewer_count = ?,
                    updated_at = ?
                WHERE id = ?
            `)
            .bind(
                Number(
                    count?.count || 0
                ),
                nowISO(),
                roomId
            )
            .run();


        return successResponse({

            message:
                "Joined live room.",

            viewer_count:
                Number(
                    count?.count || 0
                )

        });


    } catch (error) {

        console.error(
            "JOIN LIVE ROOM ERROR:",
            error
        );

        return errorResponse(
            "Could not join live room.",
            500
        );
    }
}


/* =========================================================
   LEAVE ROOM
   POST /api/live/rooms/:id/leave
   ========================================================= */

async function handleLeaveLiveRoom(
    context,
    roomId
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }


    try {

        await ensureLiveRoomTables(
            context.env
        );


        /* Remove viewer */

        await context.env.DB
            .prepare(`
                DELETE FROM live_room_viewers
                WHERE
                    room_id = ?
                    AND
                    user_id = ?
            `)
            .bind(
                roomId,
                auth.user.id
            )
            .run();


        /* Release voice seat */

        await context.env.DB
            .prepare(`
                UPDATE live_room_seats
                SET
                    user_id = NULL,
                    mic_on = 0,
                    joined_at = NULL,
                    updated_at = ?
                WHERE
                    room_id = ?
                    AND
                    user_id = ?
            `)
            .bind(
                nowISO(),
                roomId,
                auth.user.id
            )
            .run();


        const count =
            await context.env.DB
                .prepare(`
                    SELECT COUNT(*) AS count
                    FROM live_room_viewers
                    WHERE room_id = ?
                `)
                .bind(roomId)
                .first();


        await context.env.DB
            .prepare(`
                UPDATE live_rooms
                SET
                    viewer_count = ?,
                    updated_at = ?
                WHERE id = ?
            `)
            .bind(
                Number(
                    count?.count || 0
                ),
                nowISO(),
                roomId
            )
            .run();


        return successResponse({

            message:
                "Left live room.",

            viewer_count:
                Number(
                    count?.count || 0
                )

        });


    } catch (error) {

        console.error(
            "LEAVE LIVE ROOM ERROR:",
            error
        );

        return errorResponse(
            "Could not leave live room.",
            500
        );
    }
}


/* =========================================================
   JOIN VOICE SEAT
   POST /api/live/rooms/:id/seats/:seat
   ========================================================= */

async function handleJoinVoiceSeat(
    context,
    roomId,
    seatNumber
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }


    const seat =
        Number(seatNumber);


    if (
        !Number.isInteger(seat) ||
        seat < 1
    ) {

        return errorResponse(
            "Invalid seat number.",
            400
        );
    }


    try {

        await ensureLiveRoomTables(
            context.env
        );


        const room =
            await context.env.DB
                .prepare(`
                    SELECT *
                    FROM live_rooms
                    WHERE id = ?
                    LIMIT 1
                `)
                .bind(roomId)
                .first();


        if (!room) {

            return errorResponse(
                "Live room not found.",
                404
            );
        }


        if (
            seat > Number(room.max_seats)
        ) {

            return errorResponse(
                "Seat does not exist.",
                404
            );
        }


        /* User can occupy only one seat */

        const currentSeat =
            await context.env.DB
                .prepare(`
                    SELECT *
                    FROM live_room_seats
                    WHERE
                        room_id = ?
                        AND
                        user_id = ?
                    LIMIT 1
                `)
                .bind(
                    roomId,
                    auth.user.id
                )
                .first();


        if (currentSeat) {

            if (
                Number(
                    currentSeat.seat_number
                ) === seat
            ) {

                return successResponse({

                    message:
                        "You are already on this seat.",

                    seat:
                        currentSeat

                });
            }


            return errorResponse(
                "You already occupy another seat.",
                409
            );
        }


        /* Requested seat */

        const requestedSeat =
            await context.env.DB
                .prepare(`
                    SELECT *
                    FROM live_room_seats
                    WHERE
                        room_id = ?
                        AND
                        seat_number = ?
                    LIMIT 1
                `)
                .bind(
                    roomId,
                    seat
                )
                .first();


        if (!requestedSeat) {

            return errorResponse(
                "Seat not found.",
                404
            );
        }


        if (
            requestedSeat.user_id
        ) {

            return errorResponse(
                "This seat is already occupied.",
                409
            );
        }


        /* Occupy seat */

        await context.env.DB
            .prepare(`
                UPDATE live_room_seats
                SET
                    user_id = ?,
                    mic_on = 0,
                    joined_at = ?,
                    updated_at = ?
                WHERE
                    room_id = ?
                    AND
                    seat_number = ?
                    AND
                    user_id IS NULL
            `)
            .bind(
                auth.user.id,
                nowISO(),
                nowISO(),
                roomId,
                seat
            )
            .run();


        const updatedSeat =
            await context.env.DB
                .prepare(`
                    SELECT
                        s.*,
                        u.username,
                        u.name,
                        u.avatar,
                        u.profile_photo
                    FROM live_room_seats s
                    LEFT JOIN users u
                        ON u.id = s.user_id
                    WHERE
                        s.room_id = ?
                        AND
                        s.seat_number = ?
                    LIMIT 1
                `)
                .bind(
                    roomId,
                    seat
                )
                .first();


        if (
            !updatedSeat ||
            String(
                updatedSeat.user_id
            ) !==
            String(auth.user.id)
        ) {

            return errorResponse(
                "Seat could not be occupied.",
                409
            );
        }


        return successResponse({

            message:
                "Voice seat joined.",

            seat:
                updatedSeat

        });


    } catch (error) {

        console.error(
            "JOIN VOICE SEAT ERROR:",
            error
        );

        return errorResponse(
            "Could not join voice seat.",
            500
        );
    }
}


/* =========================================================
   LEAVE VOICE SEAT
   DELETE /api/live/rooms/:id/seats/:seat
   ========================================================= */

async function handleLeaveVoiceSeat(
    context,
    roomId,
    seatNumber
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }


    const seat =
        Number(seatNumber);


    if (
        !Number.isInteger(seat) ||
        seat < 1
    ) {

        return errorResponse(
            "Invalid seat number.",
            400
        );
    }


    try {

        await ensureLiveRoomTables(
            context.env
        );


        const result =
            await context.env.DB
                .prepare(`
                    UPDATE live_room_seats
                    SET
                        user_id = NULL,
                        mic_on = 0,
                        joined_at = NULL,
                        updated_at = ?
                    WHERE
                        room_id = ?
                        AND
                        seat_number = ?
                        AND
                        user_id = ?
                `)
                .bind(
                    nowISO(),
                    roomId,
                    seat,
                    auth.user.id
                )
                .run();


        return successResponse({

            message:
                "Voice seat left.",

            changed:
                Number(
                    result.meta?.changes || 0
                ) > 0

        });


    } catch (error) {

        console.error(
            "LEAVE VOICE SEAT ERROR:",
            error
        );

        return errorResponse(
            "Could not leave voice seat.",
            500
        );
    }
}


/* =========================================================
   MIC STATUS
   PATCH /api/live/rooms/:id/seats/:seat/mic
   ========================================================= */

async function handleMicStatus(
    context,
    roomId,
    seatNumber
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }


    const data =
        await readJSON(
            context.request
        );


    const micOn =
        Boolean(
            data?.mic_on
        );


    const seat =
        Number(seatNumber);


    if (
        !Number.isInteger(seat) ||
        seat < 1
    ) {

        return errorResponse(
            "Invalid seat number.",
            400
        );
    }


    try {

        await ensureLiveRoomTables(
            context.env
        );


        const result =
            await context.env.DB
                .prepare(`
                    UPDATE live_room_seats
                    SET
                        mic_on = ?,
                        updated_at = ?
                    WHERE
                        room_id = ?
                        AND
                        seat_number = ?
                        AND
                        user_id = ?
                `)
                .bind(
                    micOn ? 1 : 0,
                    nowISO(),
                    roomId,
                    seat,
                    auth.user.id
                )
                .run();


        if (
            Number(
                result.meta?.changes || 0
            ) === 0
        ) {

            return errorResponse(
                "You are not occupying this seat.",
                403
            );
        }


        return successResponse({

            message:
                micOn
                    ? "Microphone turned on."
                    : "Microphone turned off.",

            mic_on:
                micOn

        });


    } catch (error) {

        console.error(
            "MIC STATUS ERROR:",
            error
        );

        return errorResponse(
            "Microphone status update failed.",
            500
        );
    }
}


/* =========================================================
   END LIVE ROOM
   POST /api/live/rooms/:id/end
   ========================================================= */

async function handleEndLiveRoom(
    context,
    roomId
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }


    try {

        await ensureLiveRoomTables(
            context.env
        );


        const room =
            await context.env.DB
                .prepare(`
                    SELECT *
                    FROM live_rooms
                    WHERE id = ?
                    LIMIT 1
                `)
                .bind(roomId)
                .first();


        if (!room) {

            return errorResponse(
                "Live room not found.",
                404
            );
        }


        if (
            String(room.owner_id) !==
            String(auth.user.id)
        ) {

            return errorResponse(
                "Only the room owner can end the room.",
                403
            );
        }


        await context.env.DB
            .prepare(`
                UPDATE live_rooms
                SET
                    status = 'ended',
                    updated_at = ?
                WHERE id = ?
            `)
            .bind(
                nowISO(),
                roomId
            )
            .run();


        await context.env.DB
            .prepare(`
                UPDATE live_room_seats
                SET
                    user_id = NULL,
                    mic_on = 0,
                    joined_at = NULL,
                    updated_at = ?
                WHERE room_id = ?
            `)
            .bind(
                nowISO(),
                roomId
            )
            .run();


        return successResponse({

            message:
                "Live room ended."

        });


    } catch (error) {

        console.error(
            "END LIVE ROOM ERROR:",
            error
        );

        return errorResponse(
            "Could not end live room.",
            500
        );
    }
}


/* =========================================================
   LIVE ROOM ROUTES
   ========================================================= */

async function handleLiveRoomRoutes(
    context
) {

    const {
        pathname,
        method,
        parts
    } = context;


    /* -----------------------------------------
       LIST ROOMS
       ----------------------------------------- */

    if (
        pathname === "/api/live/rooms" &&
        method === "GET"
    ) {

        return handleListLiveRooms(
            context
        );
    }


    /* -----------------------------------------
       CREATE ROOM
       ----------------------------------------- */

    if (
        pathname === "/api/live/rooms" &&
        method === "POST"
    ) {

        return handleCreateLiveRoom(
            context
        );
    }


    /* -----------------------------------------
       ROOM DETAILS
       /api/live/rooms/:id
       ----------------------------------------- */

    if (
        parts.length === 4 &&
        parts[0] === "api" &&
        parts[1] === "live" &&
        parts[2] === "rooms" &&
        method === "GET"
    ) {

        return handleGetLiveRoom(
            context,
            parts[3]
        );
    }


    /* -----------------------------------------
       JOIN ROOM
       ----------------------------------------- */

    if (
        parts.length === 5 &&
        parts[0] === "api" &&
        parts[1] === "live" &&
        parts[2] === "rooms" &&
        parts[4] === "join" &&
        method === "POST"
    ) {

        return handleJoinLiveRoom(
            context,
            parts[3]
        );
    }


    /* -----------------------------------------
       LEAVE ROOM
       ----------------------------------------- */

    if (
        parts.length === 5 &&
        parts[0] === "api" &&
        parts[1] === "live" &&
        parts[2] === "rooms" &&
        parts[4] === "leave" &&
        method === "POST"
    ) {

        return handleLeaveLiveRoom(
            context,
            parts[3]
        );
    }


    /* -----------------------------------------
       END ROOM
       ----------------------------------------- */

    if (
        parts.length === 5 &&
        parts[0] === "api" &&
        parts[1] === "live" &&
        parts[2] === "rooms" &&
        parts[4] === "end" &&
        method === "POST"
    ) {

        return handleEndLiveRoom(
            context,
            parts[3]
        );
    }


    /* -----------------------------------------
       JOIN VOICE SEAT
       ----------------------------------------- */

    if (
        parts.length === 6 &&
        parts[0] === "api" &&
        parts[1] === "live" &&
        parts[2] === "rooms" &&
        parts[4] === "seats" &&
        method === "POST"
    ) {

        return handleJoinVoiceSeat(
            context,
            parts[3],
            parts[5]
        );
    }


    /* -----------------------------------------
       LEAVE VOICE SEAT
       ----------------------------------------- */

    if (
        parts.length === 6 &&
        parts[0] === "api" &&
        parts[1] === "live" &&
        parts[2] === "rooms" &&
        parts[4] === "seats" &&
        method === "DELETE"
    ) {

        return handleLeaveVoiceSeat(
            context,
            parts[3],
            parts[5]
        );
    }


    /* -----------------------------------------
       MIC STATUS
       /api/live/rooms/:id/seats/:seat/mic
       ----------------------------------------- */

    if (
        parts.length === 7 &&
        parts[0] === "api" &&
        parts[1] === "live" &&
        parts[2] === "rooms" &&
        parts[4] === "seats" &&
        parts[6] === "mic" &&
        method === "PATCH"
    ) {

        return handleMicStatus(
            context,
            parts[3],
            parts[5]
        );
    }


    return null;
}/* =========================================================
   RAHUL SOCIAL HUB
   WORKER.JS — PART 5
   LIVE CHAT + REACTIONS
   ========================================================= */


/* =========================================================
   CHAT + REACTION TABLES
   ========================================================= */

async function ensureChatTables(env) {

    if (!databaseAvailable(env)) {
        throw new Error("Database unavailable.");
    }

    await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS live_room_messages
        (
            id TEXT PRIMARY KEY,
            room_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            message TEXT NOT NULL,
            message_type TEXT DEFAULT 'text',
            created_at TEXT NOT NULL
        )
    `).run();


    await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS live_room_reactions
        (
            id TEXT PRIMARY KEY,
            room_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            reaction TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    `).run();
}


/* =========================================================
   CHECK LIVE ROOM
   ========================================================= */

async function getLiveRoomForChat(
    env,
    roomId
) {

    const room =
        await env.DB
            .prepare(`
                SELECT *
                FROM live_rooms
                WHERE id = ?
                LIMIT 1
            `)
            .bind(roomId)
            .first();

    return room || null;
}


/* =========================================================
   SEND CHAT MESSAGE
   POST /api/live/rooms/:id/messages
   ========================================================= */

async function handleSendChatMessage(
    context,
    roomId
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }


    if (!validId(roomId)) {

        return errorResponse(
            "Room ID is required.",
            400
        );
    }


    const data =
        await readJSON(
            context.request
        );


    const message =
        cleanText(
            data?.message,
            500
        );


    if (!message) {

        return errorResponse(
            "Message cannot be empty.",
            400
        );
    }


    try {

        await ensureChatTables(
            context.env
        );


        const room =
            await getLiveRoomForChat(
                context.env,
                roomId
            );


        if (!room) {

            return errorResponse(
                "Live room not found.",
                404
            );
        }


        if (
            room.status !== "live"
        ) {

            return errorResponse(
                "This live room has ended.",
                400
            );
        }


        const messageId =
            createId();


        const createdAt =
            nowISO();


        await context.env.DB
            .prepare(`
                INSERT INTO
                live_room_messages
                (
                    id,
                    room_id,
                    user_id,
                    message,
                    message_type,
                    created_at
                )
                VALUES (?, ?, ?, ?, 'text', ?)
            `)
            .bind(
                messageId,
                roomId,
                auth.user.id,
                message,
                createdAt
            )
            .run();


        return successResponse({

            message:
                "Message sent.",

            chat: {

                id:
                    messageId,

                room_id:
                    roomId,

                user_id:
                    auth.user.id,

                username:
                    auth.user.username || "",

                name:
                    auth.user.name ||
                    auth.user.username ||
                    "",

                avatar:
                    auth.user.avatar ||
                    auth.user.profile_photo ||
                    "",

                profile_photo:
                    auth.user.profile_photo ||
                    auth.user.avatar ||
                    "",

                message,

                message_type:
                    "text",

                created_at:
                    createdAt
            }

        }, 201);


    } catch (error) {

        console.error(
            "SEND CHAT MESSAGE ERROR:",
            error
        );

        return errorResponse(
            "Message could not be sent.",
            500
        );
    }
}


/* =========================================================
   GET CHAT MESSAGES
   GET /api/live/rooms/:id/messages
   ========================================================= */

async function handleGetChatMessages(
    context,
    roomId
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }


    if (!validId(roomId)) {

        return errorResponse(
            "Room ID is required.",
            400
        );
    }


    try {

        await ensureChatTables(
            context.env
        );


        const limitParam =
            Number(
                context.url.searchParams.get(
                    "limit"
                ) || 50
            );


        const limit =
            Math.min(
                Math.max(
                    Number.isInteger(
                        limitParam
                    )
                        ? limitParam
                        : 50,
                    1
                ),
                100
            );


        const result =
            await context.env.DB
                .prepare(`
                    SELECT
                        m.id,
                        m.room_id,
                        m.user_id,
                        m.message,
                        m.message_type,
                        m.created_at,
                        u.username,
                        u.name,
                        u.display_name,
                        u.avatar,
                        u.profile_photo
                    FROM live_room_messages m
                    LEFT JOIN users u
                        ON u.id = m.user_id
                    WHERE m.room_id = ?
                    ORDER BY m.created_at DESC
                    LIMIT ?
                `)
                .bind(
                    roomId,
                    limit
                )
                .all();


        const messages =
            (result.results || [])
                .reverse();


        return successResponse({

            messages

        });


    } catch (error) {

        console.error(
            "GET CHAT MESSAGES ERROR:",
            error
        );

        return errorResponse(
            "Chat messages load failed.",
            500
        );
    }
}


/* =========================================================
   DELETE OWN CHAT MESSAGE
   DELETE /api/live/rooms/:id/messages/:messageId
   ========================================================= */

async function handleDeleteChatMessage(
    context,
    roomId,
    messageId
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }


    if (
        !validId(roomId) ||
        !validId(messageId)
    ) {

        return errorResponse(
            "Room ID and message ID are required.",
            400
        );
    }


    try {

        await ensureChatTables(
            context.env
        );


        const message =
            await context.env.DB
                .prepare(`
                    SELECT *
                    FROM live_room_messages
                    WHERE
                        id = ?
                        AND
                        room_id = ?
                    LIMIT 1
                `)
                .bind(
                    messageId,
                    roomId
                )
                .first();


        if (!message) {

            return errorResponse(
                "Message not found.",
                404
            );
        }


        if (
            String(message.user_id) !==
            String(auth.user.id)
        ) {

            return errorResponse(
                "You can delete only your own message.",
                403
            );
        }


        await context.env.DB
            .prepare(`
                DELETE FROM live_room_messages
                WHERE
                    id = ?
                    AND
                    room_id = ?
            `)
            .bind(
                messageId,
                roomId
            )
            .run();


        return successResponse({

            message:
                "Message deleted."

        });


    } catch (error) {

        console.error(
            "DELETE CHAT MESSAGE ERROR:",
            error
        );

        return errorResponse(
            "Message could not be deleted.",
            500
        );
    }
}


/* =========================================================
   SEND REACTION
   POST /api/live/rooms/:id/reactions
   ========================================================= */

async function handleSendReaction(
    context,
    roomId
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }


    if (!validId(roomId)) {

        return errorResponse(
            "Room ID is required.",
            400
        );
    }


    const data =
        await readJSON(
            context.request
        );


    const reaction =
        cleanText(
            data?.reaction ||
            data?.emoji,
            20
        );


    const allowedReactions = [
        "❤️",
        "👍",
        "😂",
        "😍",
        "👏",
        "🔥",
        "😮",
        "😢",
        "😡",
        "🎉",
        "💯",
        "🥰",
        "😘",
        "🤣",
        "🙏"
    ];


    if (
        !allowedReactions.includes(
            reaction
        )
    ) {

        return errorResponse(
            "Invalid reaction.",
            400
        );
    }


    try {

        await ensureChatTables(
            context.env
        );


        const room =
            await getLiveRoomForChat(
                context.env,
                roomId
            );


        if (!room) {

            return errorResponse(
                "Live room not found.",
                404
            );
        }


        if (
            room.status !== "live"
        ) {

            return errorResponse(
                "This live room has ended.",
                400
            );
        }


        const reactionId =
            createId();


        const createdAt =
            nowISO();


        await context.env.DB
            .prepare(`
                INSERT INTO
                live_room_reactions
                (
                    id,
                    room_id,
                    user_id,
                    reaction,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?)
            `)
            .bind(
                reactionId,
                roomId,
                auth.user.id,
                reaction,
                createdAt
            )
            .run();


        return successResponse({

            message:
                "Reaction sent.",

            reaction: {

                id:
                    reactionId,

                room_id:
                    roomId,

                user_id:
                    auth.user.id,

                username:
                    auth.user.username || "",

                reaction,

                created_at:
                    createdAt
            }

        }, 201);


    } catch (error) {

        console.error(
            "SEND REACTION ERROR:",
            error
        );

        return errorResponse(
            "Reaction could not be sent.",
            500
        );
    }
}


/* =========================================================
   GET RECENT REACTIONS
   GET /api/live/rooms/:id/reactions
   ========================================================= */

async function handleGetReactions(
    context,
    roomId
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }


    if (!validId(roomId)) {

        return errorResponse(
            "Room ID is required.",
            400
        );
    }


    try {

        await ensureChatTables(
            context.env
        );


        const limitParam =
            Number(
                context.url.searchParams.get(
                    "limit"
                ) || 50
            );


        const limit =
            Math.min(
                Math.max(
                    Number.isInteger(
                        limitParam
                    )
                        ? limitParam
                        : 50,
                    1
                ),
                100
            );


        const result =
            await context.env.DB
                .prepare(`
                    SELECT
                        r.id,
                        r.room_id,
                        r.user_id,
                        r.reaction,
                        r.created_at,
                        u.username,
                        u.name,
                        u.avatar,
                        u.profile_photo
                    FROM live_room_reactions r
                    LEFT JOIN users u
                        ON u.id = r.user_id
                    WHERE r.room_id = ?
                    ORDER BY r.created_at DESC
                    LIMIT ?
                `)
                .bind(
                    roomId,
                    limit
                )
                .all();


        return successResponse({

            reactions:
                (result.results || [])
                    .reverse()

        });


    } catch (error) {

        console.error(
            "GET REACTIONS ERROR:",
            error
        );

        return errorResponse(
            "Reactions load failed.",
            500
        );
    }
}


/* =========================================================
   REACTION SUMMARY
   GET /api/live/rooms/:id/reactions/summary
   ========================================================= */

async function handleReactionSummary(
    context,
    roomId
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }


    if (!validId(roomId)) {

        return errorResponse(
            "Room ID is required.",
            400
        );
    }


    try {

        await ensureChatTables(
            context.env
        );


        const result =
            await context.env.DB
                .prepare(`
                    SELECT
                        reaction,
                        COUNT(*) AS count
                    FROM live_room_reactions
                    WHERE room_id = ?
                    GROUP BY reaction
                    ORDER BY count DESC
                `)
                .bind(
                    roomId
                )
                .all();


        return successResponse({

            summary:
                result.results || []

        });


    } catch (error) {

        console.error(
            "REACTION SUMMARY ERROR:",
            error
        );

        return errorResponse(
            "Reaction summary failed.",
            500
        );
    }
}


/* =========================================================
   LIVE CHAT ROUTES
   ========================================================= */

async function handleLiveChatRoutes(
    context
) {

    const {
        pathname,
        method,
        parts
    } = context;


    /* -----------------------------------------
       SEND MESSAGE
       ----------------------------------------- */

    if (
        parts.length === 5 &&
        parts[0] === "api" &&
        parts[1] === "live" &&
        parts[2] === "rooms" &&
        parts[4] === "messages" &&
        method === "POST"
    ) {

        return handleSendChatMessage(
            context,
            parts[3]
        );
    }


    /* -----------------------------------------
       GET MESSAGES
       ----------------------------------------- */

    if (
        parts.length === 5 &&
        parts[0] === "api" &&
        parts[1] === "live" &&
        parts[2] === "rooms" &&
        parts[4] === "messages" &&
        method === "GET"
    ) {

        return handleGetChatMessages(
            context,
            parts[3]
        );
    }


    /* -----------------------------------------
       DELETE MESSAGE
       ----------------------------------------- */

    if (
        parts.length === 6 &&
        parts[0] === "api" &&
        parts[1] === "live" &&
        parts[2] === "rooms" &&
        parts[4] === "messages" &&
        method === "DELETE"
    ) {

        return handleDeleteChatMessage(
            context,
            parts[3],
            parts[5]
        );
    }


    /* -----------------------------------------
       SEND REACTION
       ----------------------------------------- */

    if (
        parts.length === 5 &&
        parts[0] === "api" &&
        parts[1] === "live" &&
        parts[2] === "rooms" &&
        parts[4] === "reactions" &&
        method === "POST"
    ) {

        return handleSendReaction(
            context,
            parts[3]
        );
    }


    /* -----------------------------------------
       GET REACTIONS
       ----------------------------------------- */

    if (
        parts.length === 5 &&
        parts[0] === "api" &&
        parts[1] === "live" &&
        parts[2] === "rooms" &&
        parts[4] === "reactions" &&
        method === "GET"
    ) {

        return handleGetReactions(
            context,
            parts[3]
        );
    }


    /* -----------------------------------------
       REACTION SUMMARY
       ----------------------------------------- */

    if (
        parts.length === 6 &&
        parts[0] === "api" &&
        parts[1] === "live" &&
        parts[2] === "rooms" &&
        parts[4] === "reactions" &&
        parts[5] === "summary" &&
        method === "GET"
    ) {

        return handleReactionSummary(
            context,
            parts[3]
        );
    }


    return null;
}/* =========================================================
   RAHUL SOCIAL HUB
   WORKER.JS — PART 6
   GIFTS + COINS + LIVE ROOM GIFTING
   ========================================================= */


/* =========================================================
   GIFT + WALLET TABLES
   ========================================================= */

async function ensureGiftTables(env) {

    if (!databaseAvailable(env)) {
        throw new Error("Database unavailable.");
    }

    await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS gift_catalog
        (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            emoji TEXT NOT NULL,
            coins INTEGER NOT NULL,
            active INTEGER DEFAULT 1,
            created_at TEXT NOT NULL
        )
    `).run();


    await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS user_wallets
        (
            user_id TEXT PRIMARY KEY,
            coins INTEGER DEFAULT 0,
            updated_at TEXT NOT NULL
        )
    `).run();


    await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS live_room_gifts
        (
            id TEXT PRIMARY KEY,
            room_id TEXT NOT NULL,
            sender_id TEXT NOT NULL,
            receiver_id TEXT NOT NULL,
            gift_id TEXT NOT NULL,
            gift_name TEXT NOT NULL,
            gift_emoji TEXT NOT NULL,
            coins INTEGER NOT NULL,
            created_at TEXT NOT NULL
        )
    `).run();
}


/* =========================================================
   DEFAULT GIFTS
   ========================================================= */

async function seedDefaultGifts(env) {

    const gifts = [
        ["rose", "Rose", "🌹", 10],
        ["heart", "Heart", "❤️", 25],
        ["like", "Like", "👍", 50],
        ["love", "Love", "💖", 100],
        ["fire", "Fire", "🔥", 250],
        ["star", "Star", "⭐", 500],
        ["diamond", "Diamond", "💎", 1000],
        ["crown", "Crown", "👑", 2500]
    ];


    for (const gift of gifts) {

        await env.DB.prepare(`
            INSERT OR IGNORE INTO gift_catalog
            (
                id,
                name,
                emoji,
                coins,
                active,
                created_at
            )
            VALUES (?, ?, ?, ?, 1, ?)
        `)
        .bind(
            gift[0],
            gift[1],
            gift[2],
            gift[3],
            nowISO()
        )
        .run();
    }
}


/* =========================================================
   ENSURE USER WALLET
   ========================================================= */

async function ensureUserWallet(
    env,
    userId
) {

    await env.DB.prepare(`
        INSERT OR IGNORE INTO user_wallets
        (
            user_id,
            coins,
            updated_at
        )
        VALUES (?, 0, ?)
    `)
    .bind(
        userId,
        nowISO()
    )
    .run();
}


/* =========================================================
   GET WALLET
   GET /api/wallet
   ========================================================= */

async function handleGetWallet(
    context
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }


    try {

        await ensureGiftTables(
            context.env
        );


        await ensureUserWallet(
            context.env,
            auth.user.id
        );


        const wallet =
            await context.env.DB
                .prepare(`
                    SELECT
                        user_id,
                        coins,
                        updated_at
                    FROM user_wallets
                    WHERE user_id = ?
                    LIMIT 1
                `)
                .bind(
                    auth.user.id
                )
                .first();


        return successResponse({

            wallet: {
                user_id:
                    wallet.user_id,

                coins:
                    Number(
                        wallet.coins || 0
                    ),

                updated_at:
                    wallet.updated_at
            }

        });


    } catch (error) {

        console.error(
            "GET WALLET ERROR:",
            error
        );

        return errorResponse(
            "Wallet load failed.",
            500
        );
    }
}


/* =========================================================
   GET GIFT CATALOG
   GET /api/gifts
   ========================================================= */

async function handleGetGiftCatalog(
    context
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }


    try {

        await ensureGiftTables(
            context.env
        );


        await seedDefaultGifts(
            context.env
        );


        const result =
            await context.env.DB
                .prepare(`
                    SELECT
                        id,
                        name,
                        emoji,
                        coins
                    FROM gift_catalog
                    WHERE active = 1
                    ORDER BY coins ASC
                `)
                .all();


        return successResponse({

            gifts:
                result.results || []

        });


    } catch (error) {

        console.error(
            "GET GIFT CATALOG ERROR:",
            error
        );

        return errorResponse(
            "Gift catalog load failed.",
            500
        );
    }
}


/* =========================================================
   ADD COINS
   POST /api/wallet/coins
   ========================================================= */

async function handleAddCoins(
    context
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }


    const data =
        await readJSON(
            context.request
        );


    const amount =
        Number(
            data?.coins
        );


    if (
        !Number.isInteger(amount) ||
        amount <= 0 ||
        amount > 1000000
    ) {

        return errorResponse(
            "Invalid coin amount.",
            400
        );
    }


    /*
       This endpoint only updates the wallet
       after a trusted server-side payment/
       admin flow.

       Client-side requests are therefore
       blocked from directly creating coins.
    */

    return errorResponse(
        "Coins can only be added through an approved payment flow.",
        403
    );
}


/* =========================================================
   SEND GIFT IN LIVE ROOM
   POST /api/live/rooms/:id/gifts
   ========================================================= */

async function handleSendLiveGift(
    context,
    roomId
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }


    if (!validId(roomId)) {

        return errorResponse(
            "Room ID is required.",
            400
        );
    }


    const data =
        await readJSON(
            context.request
        );


    const giftId =
        cleanText(
            data?.gift_id ||
            data?.giftId,
            100
        );


    const receiverId =
        cleanText(
            data?.receiver_id ||
            data?.receiverId,
            100
        );


    if (
        !giftId ||
        !receiverId
    ) {

        return errorResponse(
            "Gift and receiver are required.",
            400
        );
    }


    if (
        String(auth.user.id) ===
        String(receiverId)
    ) {

        return errorResponse(
            "You cannot send a gift to yourself.",
            400
        );
    }


    try {

        await ensureGiftTables(
            context.env
        );


        await ensureLiveRoomTables(
            context.env
        );


        await ensureUserWallet(
            context.env,
            auth.user.id
        );


        const room =
            await context.env.DB
                .prepare(`
                    SELECT *
                    FROM live_rooms
                    WHERE id = ?
                    LIMIT 1
                `)
                .bind(
                    roomId
                )
                .first();


        if (!room) {

            return errorResponse(
                "Live room not found.",
                404
            );
        }


        if (
            room.status !== "live"
        ) {

            return errorResponse(
                "This room is not live.",
                400
            );
        }


        const receiver =
            await context.env.DB
                .prepare(`
                    SELECT id
                    FROM users
                    WHERE id = ?
                    LIMIT 1
                `)
                .bind(
                    receiverId
                )
                .first();


        if (!receiver) {

            return errorResponse(
                "Receiver not found.",
                404
            );
        }


        const gift =
            await context.env.DB
                .prepare(`
                    SELECT
                        id,
                        name,
                        emoji,
                        coins
                    FROM gift_catalog
                    WHERE
                        id = ?
                        AND
                        active = 1
                    LIMIT 1
                `)
                .bind(
                    giftId
                )
                .first();


        if (!gift) {

            return errorResponse(
                "Gift not found.",
                404
            );
        }


        const wallet =
            await context.env.DB
                .prepare(`
                    SELECT
                        coins
                    FROM user_wallets
                    WHERE user_id = ?
                    LIMIT 1
                `)
                .bind(
                    auth.user.id
                )
                .first();


        const balance =
            Number(
                wallet?.coins || 0
            );


        const giftCoins =
            Number(
                gift.coins || 0
            );


        if (
            balance < giftCoins
        ) {

            return errorResponse(
                "Insufficient coins.",
                400
            );
        }


        /*
           Deduct coins first.
        */

        const debit =
            await context.env.DB
                .prepare(`
                    UPDATE user_wallets
                    SET
                        coins = coins - ?,
                        updated_at = ?
                    WHERE
                        user_id = ?
                        AND
                        coins >= ?
                `)
                .bind(
                    giftCoins,
                    nowISO(),
                    auth.user.id,
                    giftCoins
                )
                .run();


        if (
            Number(
                debit.meta?.changes || 0
            ) !== 1
        ) {

            return errorResponse(
                "Gift payment failed.",
                400
            );
        }


        const giftIdRecord =
            createId();


        const createdAt =
            nowISO();


        try {

            await context.env.DB
                .prepare(`
                    INSERT INTO
                    live_room_gifts
                    (
                        id,
                        room_id,
                        sender_id,
                        receiver_id,
                        gift_id,
                        gift_name,
                        gift_emoji,
                        coins,
                        created_at
                    )
                    VALUES
                    (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `)
                .bind(
                    giftIdRecord,
                    roomId,
                    auth.user.id,
                    receiverId,
                    gift.id,
                    gift.name,
                    gift.emoji,
                    giftCoins,
                    createdAt
                )
                .run();

        } catch (giftError) {

            /*
               If gift record fails,
               refund the deducted coins.
            */

            await context.env.DB
                .prepare(`
                    UPDATE user_wallets
                    SET
                        coins = coins + ?,
                        updated_at = ?
                    WHERE user_id = ?
                `)
                .bind(
                    giftCoins,
                    nowISO(),
                    auth.user.id
                )
                .run();

            throw giftError;
        }


        const newWallet =
            await context.env.DB
                .prepare(`
                    SELECT coins
                    FROM user_wallets
                    WHERE user_id = ?
                    LIMIT 1
                `)
                .bind(
                    auth.user.id
                )
                .first();


        return successResponse({

            message:
                "Gift sent successfully.",

            gift: {

                id:
                    giftIdRecord,

                room_id:
                    roomId,

                sender_id:
                    auth.user.id,

                receiver_id:
                    receiverId,

                gift_id:
                    gift.id,

                name:
                    gift.name,

                emoji:
                    gift.emoji,

                coins:
                    giftCoins,

                created_at:
                    createdAt
            },

            wallet: {

                coins:
                    Number(
                        newWallet?.coins || 0
                    )

            }

        }, 201);


    } catch (error) {

        console.error(
            "SEND LIVE GIFT ERROR:",
            error
        );

        return errorResponse(
            "Gift could not be sent.",
            500
        );
    }
}


/* =========================================================
   GET LIVE ROOM GIFTS
   GET /api/live/rooms/:id/gifts
   ========================================================= */

async function handleGetLiveGifts(
    context,
    roomId
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }


    if (!validId(roomId)) {

        return errorResponse(
            "Room ID is required.",
            400
        );
    }


    try {

        await ensureGiftTables(
            context.env
        );


        const limitParam =
            Number(
                context.url.searchParams.get(
                    "limit"
                ) || 50
            );


        const limit =
            Math.min(
                Math.max(
                    Number.isInteger(
                        limitParam
                    )
                        ? limitParam
                        : 50,
                    1
                ),
                100
            );


        const result =
            await context.env.DB
                .prepare(`
                    SELECT
                        g.id,
                        g.room_id,
                        g.sender_id,
                        g.receiver_id,
                        g.gift_id,
                        g.gift_name,
                        g.gift_emoji,
                        g.coins,
                        g.created_at,

                        sender.username
                            AS sender_username,

                        sender.name
                            AS sender_name,

                        sender.avatar
                            AS sender_avatar,

                        sender.profile_photo
                            AS sender_profile_photo,

                        receiver.username
                            AS receiver_username,

                        receiver.name
                            AS receiver_name,

                        receiver.avatar
                            AS receiver_avatar,

                        receiver.profile_photo
                            AS receiver_profile_photo

                    FROM live_room_gifts g

                    LEFT JOIN users sender
                        ON sender.id = g.sender_id

                    LEFT JOIN users receiver
                        ON receiver.id = g.receiver_id

                    WHERE g.room_id = ?

                    ORDER BY
                        g.created_at DESC

                    LIMIT ?
                `)
                .bind(
                    roomId,
                    limit
                )
                .all();


        return successResponse({

            gifts:
                (result.results || [])
                    .reverse()

        });


    } catch (error) {

        console.error(
            "GET LIVE GIFTS ERROR:",
            error
        );

        return errorResponse(
            "Live gifts load failed.",
            500
        );
    }
}


/* =========================================================
   GIFT SUMMARY
   GET /api/live/rooms/:id/gifts/summary
   ========================================================= */

async function handleGiftSummary(
    context,
    roomId
) {

    const auth =
        await requireAuth(context);

    if (auth.response) {
        return auth.response;
    }


    if (!validId(roomId)) {

        return errorResponse(
            "Room ID is required.",
            400
        );
    }


    try {

        await ensureGiftTables(
            context.env
        );


        const result =
            await context.env.DB
                .prepare(`
                    SELECT
                        gift_id,
                        gift_name,
                        gift_emoji,
                        COUNT(*) AS gift_count,
                        SUM(coins) AS total_coins
                    FROM live_room_gifts
                    WHERE room_id = ?
                    GROUP BY
                        gift_id,
                        gift_name,
                        gift_emoji
                    ORDER BY total_coins DESC
                `)
                .bind(
                    roomId
                )
                .all();


        return successResponse({

            summary:
                result.results || []

        });


    } catch (error) {

        console.error(
            "GIFT SUMMARY ERROR:",
            error
        );

        return errorResponse(
            "Gift summary failed.",
            500
        );
    }
}


/* =========================================================
   GIFT ROUTES
   ========================================================= */

async function handleGiftRoutes(
    context
) {

    const {
        pathname,
        method,
        parts
    } = context;


    /* -----------------------------------------
       WALLET
       ----------------------------------------- */

    if (
        pathname === "/api/wallet" &&
        method === "GET"
    ) {

        return handleGetWallet(
            context
        );
    }


    /* -----------------------------------------
       GIFT CATALOG
       ----------------------------------------- */

    if (
        pathname === "/api/gifts" &&
        method === "GET"
    ) {

        return handleGetGiftCatalog(
            context
        );
    }


    /* -----------------------------------------
       ADD COINS
       ----------------------------------------- */

    if (
        pathname === "/api/wallet/coins" &&
        method === "POST"
    ) {

        return handleAddCoins(
            context
        );
    }


    /* -----------------------------------------
       SEND LIVE GIFT
       ----------------------------------------- */

    if (
        parts.length === 6 &&
        parts[0] === "api" &&
        parts[1] === "live" &&
        parts[2] === "rooms" &&
        parts[4] === "gifts" &&
        method === "POST"
    ) {

        return handleSendLiveGift(
            context,
            parts[3]
        );
    }


    /* -----------------------------------------
       GET LIVE GIFTS
       ----------------------------------------- */

    if (
        parts.length === 6 &&
        parts[0] === "api" &&
        parts[1] === "live" &&
        parts[2] === "rooms" &&
        parts[4] === "gifts" &&
        method === "GET"
    ) {

        return handleGetLiveGifts(
            context,
            parts[3]
        );
    }


    /* -----------------------------------------
       GIFT SUMMARY
       ----------------------------------------- */

    if (
        parts.length === 7 &&
        parts[0] === "api" &&
        parts[1] === "live" &&
        parts[2] === "rooms" &&
        parts[4] === "gifts" &&
        parts[5] === "summary" &&
        method === "GET"
    ) {

        return handleGiftSummary(
            context,
            parts[3]
        );
    }


    return null;
}/* =========================================================
   RAHUL SOCIAL HUB
   WORKER.JS — PART 7
   MAIN API ROUTER + CORS + ERROR HANDLING
   ========================================================= */


/* =========================================================
   CORS HEADERS
   ========================================================= */

function corsHeaders() {

    return {

        "Access-Control-Allow-Origin": "*",

        "Access-Control-Allow-Methods":
            "GET, POST, PUT, PATCH, DELETE, OPTIONS",

        "Access-Control-Allow-Headers":
            "Content-Type, Authorization",

        "Access-Control-Max-Age":
            "86400"
    };
}


/* =========================================================
   ADD CORS TO RESPONSE
   ========================================================= */

function withCors(
    response
) {

    const headers =
        new Headers(
            response.headers
        );


    const cors =
        corsHeaders();


    for (
        const [key, value]
        of Object.entries(cors)
    ) {

        headers.set(
            key,
            value
        );
    }


    return new Response(
        response.body,
        {
            status:
                response.status,

            statusText:
                response.statusText,

            headers
        }
    );
}


/* =========================================================
   REQUEST CONTEXT
   ========================================================= */

function createRequestContext(
    request,
    env,
    ctx
) {

    const url =
        new URL(
            request.url
        );


    const pathname =
        url.pathname;


    const method =
        request.method.toUpperCase();


    const cleanPath =
        pathname
            .replace(
                /^\/+|\/+$/g,
                ""
            );


    const parts =
        cleanPath
            ? cleanPath.split("/")
            : [];


    return {

        request,

        env,

        ctx,

        url,

        pathname,

        method,

        parts
    };
}


/* =========================================================
   HEALTH CHECK
   GET /
   ========================================================= */

async function handleHealthCheck(
    context
) {

    return successResponse({

        success:
            true,

        status:
            "online",

        message:
            "Rahul Social Hub API Running 🚀",

        time:
            nowISO()

    });
}


/* =========================================================
   API TEST
   GET /api/test
   ========================================================= */

async function handleApiTest(
    context
) {

    try {

        if (
            !databaseAvailable(
                context.env
            )
        ) {

            return errorResponse(
                "Database binding DB is unavailable.",
                500
            );
        }


        const result =
            await context.env.DB
                .prepare(`
                    SELECT name
                    FROM sqlite_master
                    WHERE type = 'table'
                    ORDER BY name
                `)
                .all();


        return successResponse({

            success:
                true,

            message:
                "Database connection successful.",

            tables:
                result.results || []

        });


    } catch (error) {

        console.error(
            "API TEST ERROR:",
            error
        );


        return errorResponse(
            "Database test failed.",
            500
        );
    }
}


/* =========================================================
   OPTIONS / PREFLIGHT
   ========================================================= */

async function handleOptions() {

    return new Response(
        null,
        {
            status: 204,

            headers:
                corsHeaders()
        }
    );
}


/* =========================================================
   API ROUTER
   ========================================================= */

async function routeRequest(
    context
) {

    const {
        pathname,
        method
    } = context;


    /* -----------------------------------------
       OPTIONS
       ----------------------------------------- */

    if (
        method === "OPTIONS"
    ) {

        return handleOptions();
    }


    /* -----------------------------------------
       HOME
       ----------------------------------------- */

    if (
        pathname === "/"
        &&
        method === "GET"
    ) {

        return handleHealthCheck(
            context
        );
    }


    /* -----------------------------------------
       API TEST
       ----------------------------------------- */

    if (
        pathname === "/api/test"
        &&
        method === "GET"
    ) {

        return handleApiTest(
            context
        );
    }


    /* -----------------------------------------
       PROFILE ROUTES
       ----------------------------------------- */

    const profileResponse =
        await handleProfileRoutes(
            context
        );


    if (
        profileResponse
    ) {

        return profileResponse;
    }


    /* -----------------------------------------
       LIVE ROOM ROUTES
       ----------------------------------------- */

    const liveRoomResponse =
        await handleLiveRoomRoutes(
            context
        );


    if (
        liveRoomResponse
    ) {

        return liveRoomResponse;
    }


    /* -----------------------------------------
       LIVE CHAT ROUTES
       ----------------------------------------- */

    const chatResponse =
        await handleLiveChatRoutes(
            context
        );


    if (
        chatResponse
    ) {

        return chatResponse;
    }


    /* -----------------------------------------
       GIFT + WALLET ROUTES
       ----------------------------------------- */

    const giftResponse =
        await handleGiftRoutes(
            context
        );


    if (
        giftResponse
    ) {

        return giftResponse;
    }


    /* -----------------------------------------
       404
       ----------------------------------------- */

    return errorResponse(
        "API route not found.",
        404,
        {
            path:
                pathname,

            method
        }
    );
}


/* =========================================================
   GLOBAL WORKER FETCH
   ========================================================= */

async function handleWorkerRequest(
    request,
    env,
    ctx
) {

    const context =
        createRequestContext(
            request,
            env,
            ctx
        );


    try {

        const response =
            await routeRequest(
                context
            );


        return withCors(
            response
        );


    } catch (error) {

        console.error(
            "WORKER ERROR:",
            error
        );


        return withCors(

            errorResponse(
                "Internal server error.",
                500
            )

        );
    }
}


/* =========================================================
   WORKER EXPORT
   ========================================================= */

export default {

    async fetch(
        request,
        env,
        ctx
    ) {

        return handleWorkerRequest(
            request,
            env,
            ctx
        );

    }

};