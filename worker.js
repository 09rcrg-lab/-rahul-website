export default {

    async fetch(request, env) {

        const url = new URL(request.url);

        /* =====================================================
           CORS
        ===================================================== */

        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        };


        if (request.method === "OPTIONS") {

            return new Response(null, {
                status: 204,
                headers: corsHeaders
            });

        }


        /* =====================================================
           RESPONSE HELPER
        ===================================================== */

        function json(data, status = 200) {

            return new Response(
                JSON.stringify(data),
                {
                    status: status,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders
                    }
                }
            );

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
                message: "Rahul Live API Running 🚀",
                app: "Rahul Live",
                features: [
                    "Short Videos",
                    "LIVE Streaming",
                    "Login",
                    "Register",
                    "Comments",
                    "Likes",
                    "Follow"
                ]
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

                const result =
                    await env.DB
                        .prepare(
                            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
                        )
                        .all();


                return json({
                    success: true,
                    database: "connected",
                    tables: result.results || []
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

            try {

                const body =
                    await request.json();


                const username =
                    String(body.username || "").trim();

                const email =
                    String(body.email || "").trim().toLowerCase();

                const password =
                    String(body.password || "");


                if (
                    !username ||
                    !email ||
                    !password
                ) {

                    return json({
                        success: false,
                        error: "All fields are required."
                    }, 400);

                }


                if (username.length < 3) {

                    return json({
                        success: false,
                        error: "Username must contain at least 3 characters."
                    }, 400);

                }


                if (password.length < 6) {

                    return json({
                        success: false,
                        error: "Password must contain at least 6 characters."
                    }, 400);

                }


                /* Check existing username */

                const existingUsername =
                    await env.DB
                        .prepare(
                            "SELECT id FROM users WHERE username = ? LIMIT 1"
                        )
                        .bind(username)
                        .first();


                if (existingUsername) {

                    return json({
                        success: false,
                        error: "Username already exists."
                    }, 409);

                }


                /* Check existing email */

                const existingEmail =
                    await env.DB
                        .prepare(
                            "SELECT id FROM users WHERE email = ? LIMIT 1"
                        )
                        .bind(email)
                        .first();


                if (existingEmail) {

                    return json({
                        success: false,
                        error: "Email already exists."
                    }, 409);

                }


                /*
                   Current database structure is kept compatible
                   with the existing Rahul Social Hub users table.
                */

                const result =
                    await env.DB
                        .prepare(
                            `
                            INSERT INTO users
                            (username, email, password)
                            VALUES (?, ?, ?)
                            `
                        )
                        .bind(
                            username,
                            email,
                            password
                        )
                        .run();


                return json({
                    success: true,
                    message: "Account created successfully.",
                    user: {
                        id: result.meta?.last_row_id || null,
                        username: username,
                        email: email
                    }
                }, 201);


            } catch (error) {

                return json({
                    success: false,
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

            try {

                const body =
                    await request.json();


                const username =
                    String(body.username || "").trim();

                const email =
                    String(body.email || "").trim().toLowerCase();

                const password =
                    String(body.password || "");


                const loginValue =
                    username || email;


                if (
                    !loginValue ||
                    !password
                ) {

                    return json({
                        success: false,
                        error: "Username/email and password are required."
                    }, 400);

                }


                const user =
                    await env.DB
                        .prepare(
                            `
                            SELECT
                                id,
                                username,
                                email,
                                password
                            FROM users
                            WHERE username = ?
                               OR email = ?
                            LIMIT 1
                            `
                        )
                        .bind(
                            loginValue,
                            loginValue.toLowerCase()
                        )
                        .first();


                if (!user) {

                    return json({
                        success: false,
                        error: "Account not found."
                    }, 401);

                }


                if (user.password !== password) {

                    return json({
                        success: false,
                        error: "Invalid password."
                    }, 401);

                }


                return json({
                    success: true,
                    message: "Login successful.",
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email
                    }
                });

            } catch (error) {

                return json({
                    success: false,
                    error: error.message
                }, 500);

            }

        }


        /* =====================================================
           GET USER PROFILE
        ===================================================== */

        if (
            url.pathname === "/api/profile" &&
            request.method === "GET"
        ) {

            try {

                const username =
                    url.searchParams.get("username");


                if (!username) {

                    return json({
                        success: false,
                        error: "Username is required."
                    }, 400);

                }


                const user =
                    await env.DB
                        .prepare(
                            `
                            SELECT
                                id,
                                username,
                                email
                            FROM users
                            WHERE username = ?
                            LIMIT 1
                            `
                        )
                        .bind(username)
                        .first();


                if (!user) {

                    return json({
                        success: false,
                        error: "User not found."
                    }, 404);

                }


                return json({
                    success: true,
                    user: user
                });

            } catch (error) {

                return json({
                    success: false,
                    error: error.message
                }, 500);

            }

        }


        /* =====================================================
           HEALTH CHECK
        ===================================================== */

        if (
            url.pathname === "/api/health" &&
            request.method === "GET"
        ) {

            return json({
                success: true,
                status: "online",
                service: "Rahul Live API",
                timestamp: new Date().toISOString()
            });

        }


        /* =====================================================
           404
        ===================================================== */

        return json({
            success: false,
            error: "API endpoint not found."
        }, 404);

    }

};