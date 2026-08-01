export default {
    async fetch(request, env) {

        const url = new URL(request.url);

        /* =====================================================
           CORS
        ===================================================== */

        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods":
                "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers":
                "Content-Type, Authorization"
        };

        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: corsHeaders
            });
        }


        /* =====================================================
           RESPONSE
        ===================================================== */

        function json(data, status = 200) {

            return new Response(
                JSON.stringify(data),
                {
                    status,
                    headers: {
                        "Content-Type": "application/json; charset=UTF-8",
                        ...corsHeaders
                    }
                }
            );
        }


        /* =====================================================
           REQUEST BODY
        ===================================================== */

        async function body() {

            try {
                return await request.json();
            } catch {
                return null;
            }

        }


        /* =====================================================
           BASIC VALIDATION
        ===================================================== */

        function required(value) {
            return (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
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
                app: "Rahul Live",
                status: "online",
                message: "Rahul Live API Running 🚀"
            });

        }


        /* =====================================================
           HEALTH
        ===================================================== */

        if (
            url.pathname === "/api/health" &&
            request.method === "GET"
        ) {

            return json({
                success: true,
                status: "online",
                service: "Rahul Live API",
                time: new Date().toISOString()
            });

        }


        /* =====================================================
           DATABASE TEST
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

            const data = await body();

            if (!data) {
                return json({
                    success: false,
                    error: "Invalid JSON."
                }, 400);
            }


            const username =
                String(data.username || "").trim();

            const email =
                String(data.email || "")
                    .trim()
                    .toLowerCase();

            const password =
                String(data.password || "");


            if (
                !required(username) ||
                !required(email) ||
                !required(password)
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


            try {

                const existing =
                    await env.DB
                        .prepare(`
                            SELECT id
                            FROM users
                            WHERE username = ?
                               OR email = ?
                            LIMIT 1
                        `)
                        .bind(
                            username,
                            email
                        )
                        .first();


                if (existing) {

                    return json({
                        success: false,
                        error: "Username or email already exists."
                    }, 409);

                }


                /*
                 * This keeps compatibility with the existing
                 * users table.
                 *
                 * Password hashing should be added before
                 * production deployment.
                 */

                const result =
                    await env.DB
                        .prepare(`
                            INSERT INTO users
                            (
                                username,
                                email,
                                password
                            )
                            VALUES (?, ?, ?)
                        `)
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
                        id:
                            result.meta?.last_row_id || null,
                        username,
                        email
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

            const data = await body();

            if (!data) {
                return json({
                    success: false,
                    error: "Invalid JSON."
                }, 400);
            }


            const login =
                String(
                    data.username ||
                    data.email ||
                    ""
                )
                .trim()
                .toLowerCase();

            const password =
                String(data.password || "");


            if (
                !required(login) ||
                !required(password)
            ) {

                return json({
                    success: false,
                    error: "Username/email and password are required."
                }, 400);

            }


            try {

                const user =
                    await env.DB
                        .prepare(`
                            SELECT
                                id,
                                username,
                                email,
                                password,
                                profile_photo,
                                bio,
                                followers_count,
                                following_count,
                                videos_count
                            FROM users
                            WHERE LOWER(username) = ?
                               OR LOWER(email) = ?
                            LIMIT 1
                        `)
                        .bind(
                            login,
                            login
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
                        email: user.email,
                        profile_photo:
                            user.profile_photo,
                        bio:
                            user.bio,
                        followers:
                            user.followers_count || 0,
                        following:
                            user.following_count || 0,
                        videos:
                            user.videos_count || 0
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
           PROFILE
        ===================================================== */

        if (
            url.pathname === "/api/profile" &&
            request.method === "GET"
        ) {

            const username =
                url.searchParams.get("username");


            if (!required(username)) {

                return json({
                    success: false,
                    error: "Username is required."
                }, 400);

            }


            try {

                const user =
                    await env.DB
                        .prepare(`
                            SELECT
                                id,
                                username,
                                email,
                                profile_photo,
                                bio,
                                followers_count,
                                following_count,
                                videos_count,
                                created_at
                            FROM users
                            WHERE username = ?
                            LIMIT 1
                        `)
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
                    user
                });

            } catch (error) {

                return json({
                    success: false,
                    error: error.message
                }, 500);

            }

        }


        /* =====================================================
           SHORT VIDEOS FEED
        ===================================================== */

        if (
            url.pathname === "/api/videos" &&
            request.method === "GET"
        ) {

            const limit =
                Math.min(
                    Math.max(
                        Number(
                            url.searchParams.get("limit") || 20
                        ),
                        1
                    ),
                    50
                );


            const offset =
                Math.max(
                    Number(
                        url.searchParams.get("offset") || 0
                    ),
                    0
                );


            try {

                const result =
                    await env.DB
                        .prepare(`
                            SELECT
                                videos.id,
                                videos.video_url,
                                videos.thumbnail_url,
                                videos.caption,
                                videos.duration,
                                videos.views_count,
                                videos.likes_count,
                                videos.comments_count,
                                videos.shares_count,
                                videos.created_at,
                                users.id AS user_id,
                                users.username,
                                users.profile_photo
                            FROM videos
                            INNER JOIN users
                                ON users.id = videos.user_id
                            WHERE videos.status = 'published'
                            ORDER BY videos.created_at DESC
                            LIMIT ? OFFSET ?
                        `)
                        .bind(
                            limit,
                            offset
                        )
                        .all();


                return json({
                    success: true,
                    videos:
                        result.results || []
                });

            } catch (error) {

                return json({
                    success: false,
                    error: error.message
                }, 500);

            }

        }


        /* =====================================================
           CREATE VIDEO RECORD
        ===================================================== */

        if (
            url.pathname === "/api/videos" &&
            request.method === "POST"
        ) {

            const data = await body();

            if (!data) {
                return json({
                    success: false,
                    error: "Invalid JSON."
                }, 400);
            }


            const userId =
                Number(data.user_id);

            const videoUrl =
                String(data.video_url || "").trim();

            const thumbnail =
                String(data.thumbnail_url || "").trim();

            const caption =
                String(data.caption || "").trim();

            const duration =
                Math.max(
                    Number(data.duration || 0),
                    0
                );


            if (
                !userId ||
                !videoUrl
            ) {

                return json({
                    success: false,
                    error: "user_id and video_url are required."
                }, 400);

            }


            try {

                const user =
                    await env.DB
                        .prepare(`
                            SELECT id
                            FROM users
                            WHERE id = ?
                        `)
                        .bind(userId)
                        .first();


                if (!user) {

                    return json({
                        success: false,
                        error: "User not found."
                    }, 404);

                }


                const result =
                    await env.DB
                        .prepare(`
                            INSERT INTO videos
                            (
                                user_id,
                                video_url,
                                thumbnail_url,
                                caption,
                                duration
                            )
                            VALUES (?, ?, ?, ?, ?)
                        `)
                        .bind(
                            userId,
                            videoUrl,
                            thumbnail || null,
                            caption || null,
                            duration
                        )
                        .run();


                await env.DB
                    .prepare(`
                        UPDATE users
                        SET videos_count =
                            videos_count + 1
                        WHERE id = ?
                    `)
                    .bind(userId)
                    .run();


                return json({
                    success: true,
                    message: "Video created successfully.",
                    video_id:
                        result.meta?.last_row_id || null
                }, 201);

            } catch (error) {

                return json({
                    success: false,
                    error: error.message
                }, 500);

            }

        }


        /* =====================================================
           VIDEO VIEW
        ===================================================== */

        if (
            url.pathname === "/api/videos/view" &&
            request.method === "POST"
        ) {

            const data = await body();

            if (!data) {
                return json({
                    success: false,
                    error: "Invalid JSON."
                }, 400);
            }


            const videoId =
                Number(data.video_id);

            const userId =
                data.user_id
                    ? Number(data.user_id)
                    : null;


            if (!videoId) {

                return json({
                    success: false,
                    error: "video_id is required."
                }, 400);

            }


            try {

                await env.DB
                    .prepare(`
                        INSERT INTO video_views
                        (
                            video_id,
                            user_id
                        )
                        VALUES (?, ?)
                    `)
                    .bind(
                        videoId,
                        userId
                    )
                    .run();


                await env.DB
                    .prepare(`
                        UPDATE videos
                        SET views_count =
                            views_count + 1
                        WHERE id = ?
                    `)
                    .bind(videoId)
                    .run();


                return json({
                    success: true,
                    message: "View recorded."
                });

            } catch (error) {

                return json({
                    success: false,
                    error: error.message
                }, 500);

            }

        }


        /* =====================================================
           VIDEO LIKE
        ===================================================== */

        if (
            url.pathname === "/api/videos/like" &&
            request.method === "POST"
        ) {

            const data = await body();

            if (!data) {
                return json({
                    success: false,
                    error: "Invalid JSON."
                }, 400);
            }


            const videoId =
                Number(data.video_id);

            const userId =
                Number(data.user_id);


            if (!videoId || !userId) {

                return json({
                    success: false,
                    error: "video_id and user_id are required."
                }, 400);

            }


            try {

                const existing =
                    await env.DB
                        .prepare(`
                            SELECT id
                            FROM video_likes
                            WHERE video_id = ?
                              AND user_id = ?
                            LIMIT 1
                        `)
                        .bind(
                            videoId,
                            userId
                        )
                        .first();


                if (existing) {

                    await env.DB
                        .prepare(`
                            DELETE FROM video_likes
                            WHERE video_id = ?
                              AND user_id = ?
                        `)
                        .bind(
                            videoId,
                            userId
                        )
                        .run();


                    await env.DB
                        .prepare(`
                            UPDATE videos
                            SET likes_count =
                                CASE
                                    WHEN likes_count > 0
                                    THEN likes_count - 1
                                    ELSE 0
                                END
                            WHERE id = ?
                        `)
                        .bind(videoId)
                        .run();


                    return json({
                        success: true,
                        liked: false
                    });

                }


                await env.DB
                    .prepare(`
                        INSERT INTO video_likes
                        (
                            video_id,
                            user_id
                        )
                        VALUES (?, ?)
                    `)
                    .bind(
                        videoId,
                        userId
                    )
                    .run();


                await env.DB
                    .prepare(`
                        UPDATE videos
                        SET likes_count =
                            likes_count + 1
                        WHERE id = ?
                    `)
                    .bind(videoId)
                    .run();


                return json({
                    success: true,
                    liked: true
                });

            } catch (error) {

                return json({
                    success: false,
                    error: error.message
                }, 500);

            }

        }


        /* =====================================================
           VIDEO COMMENT
        ===================================================== */

        if (
            url.pathname === "/api/videos/comment" &&
            request.method === "POST"
        ) {

            const data = await body();

            if (!data) {
                return json({
                    success: false,
                    error: "Invalid JSON."
                }, 400);
            }


            const videoId =
                Number(data.video_id);

            const userId =
                Number(data.user_id);

            const comment =
                String(data.comment || "").trim();


            if (
                !videoId ||
                !userId ||
                !comment
            ) {

                return json({
                    success: false,
                    error:
                        "video_id, user_id and comment are required."
                }, 400);

            }


            if (comment.length > 1000) {

                return json({
                    success: false,
                    error:
                        "Comment is too long."
                }, 400);

            }


            try {

                const result =
                    await env.DB
                        .prepare(`
                            INSERT INTO video_comments
                            (
                                video_id,
                                user_id,
                                comment
                            )
                            VALUES (?, ?, ?)
                        `)
                        .bind(
                            videoId,
                            userId,
                            comment
                        )
                        .run();


                await env.DB
                    .prepare(`
                        UPDATE videos
                        SET comments_count =
                            comments_count + 1
                        WHERE id = ?
                    `)
                    .bind(videoId)
                    .run();


                return json({
                    success: true,
                    comment_id:
                        result.meta?.last_row_id || null
                }, 201);

            } catch (error) {

                return json({
                    success: false,
                    error: error.message
                }, 500);

            }

        }


        /* =====================================================
           GET VIDEO COMMENTS
        ===================================================== */

        if (
            url.pathname === "/api/videos/comments" &&
            request.method === "GET"
        ) {

            const videoId =
                Number(
                    url.searchParams.get("video_id")
                );


            if (!videoId) {

                return json({
                    success: false,
                    error: "video_id is required."
                }, 400);

            }


            try {

                const result =
                    await env.DB
                        .prepare(`
                            SELECT
                                video_comments.id,
                                video_comments.comment,
                                video_comments.created_at,
                                users.id AS user_id,
                                users.username,
                                users.profile_photo
                            FROM video_comments
                            INNER JOIN users
                                ON users.id =
                                   video_comments.user_id
                            WHERE video_comments.video_id = ?
                            ORDER BY video_comments.created_at DESC
                        `)
                        .bind(videoId)
                        .all();


                return json({
                    success: true,
                    comments:
                        result.results || []
                });

            } catch (error) {

                return json({
                    success: false,
                    error: error.message
                }, 500);

            }

        }


        /* =====================================================
           FOLLOW / UNFOLLOW
        ===================================================== */

        if (
            url.pathname === "/api/follow" &&
            request.method === "POST"
        ) {

            const data = await body();

            if (!data) {
                return json({
                    success: false,
                    error: "Invalid JSON."
                }, 400);
            }


            const followerId =
                Number(data.follower_id);

            const followingId =
                Number(data.following_id);


            if (
                !followerId ||
                !followingId
            ) {

                return json({
                    success: false,
                    error:
                        "follower_id and following_id are required."
                }, 400);

            }


            if (
                followerId === followingId
            ) {

                return json({
                    success: false,
                    error:
                        "You cannot follow yourself."
                }, 400);

            }


            try {

                const existing =
                    await env.DB
                        .prepare(`
                            SELECT id
                            FROM follows
                            WHERE follower_id = ?
                              AND following_id = ?
                            LIMIT 1
                        `)
                        .bind(
                            followerId,
                            followingId
                        )
                        .first();


                if (existing) {

                    await env.DB
                        .prepare(`
                            DELETE FROM follows
                            WHERE follower_id = ?
                              AND following_id = ?
                        `)
                        .bind(
                            followerId,
                            followingId
                        )
                        .run();


                    await env.DB
                        .prepare(`
                            UPDATE users
                            SET following_count =
                                CASE
                                    WHEN following_count > 0
                                    THEN following_count - 1
                                    ELSE 0
                                END
                            WHERE id = ?
                        `)
                        .bind(followerId)
                        .run();


                    await env.DB
                        .prepare(`
                            UPDATE users
                            SET followers_count =
                                CASE
                                    WHEN followers_count > 0
                                    THEN followers_count - 1
                                    ELSE 0
                                END
                            WHERE id = ?
                        `)
                        .bind(followingId)
                        .run();


                    return json({
                        success: true,
                        following: false
                    });

                }


                await env.DB
                    .prepare(`
                        INSERT INTO follows
                        (
                            follower_id,
                            following_id
                        )
                        VALUES (?, ?)
                    `)
                    .bind(
                        followerId,
                        followingId
                    )
                    .run();


                await env.DB
                    .prepare(`
                        UPDATE users
                        SET following_count =
                            following_count + 1
                        WHERE id = ?
                    `)
                    .bind(followerId)
                    .run();


                await env.DB
                    .prepare(`
                        UPDATE users
                        SET followers_count =
                            followers_count + 1
                        WHERE id = ?
                    `)
                    .bind(followingId)
                    .run();


                return json({
                    success: true,
                    following: true
                });

            } catch (error) {

                return json({
                    success: false,
                    error: error.message
                }, 500);

            }

        }


        /* =====================================================
           LIVE STREAM LIST
        ===================================================== */

        if (
            url.pathname === "/api/live" &&
            request.method === "GET"
        ) {

            try {

                const result =
                    await env.DB
                        .prepare(`
                            SELECT
                                live_streams.id,
                                live_streams.title,
                                live_streams.playback_url,
                                live_streams.thumbnail_url,
                                live_streams.status,
                                live_streams.viewer_count,
                                live_streams.likes_count,
                                live_streams.started_at,
                                users.id AS user_id,
                                users.username,
                                users.profile_photo
                            FROM live_streams
                            INNER JOIN users
                                ON users.id =
                                   live_streams.user_id
                            WHERE live_streams.status = 'live'
                            ORDER BY live_streams.started_at DESC
                        `)
                        .all();


                return json({
                    success: true,
                    live_streams:
                        result.results || []
                });

            } catch (error) {

                return json({
                    success: false,
                    error: error.message
                }, 500);

            }

        }


        /* =====================================================
           CREATE LIVE STREAM
        ===================================================== */

        if (
            url.pathname === "/api/live/start" &&
            request.method === "POST"
        ) {

            const data = await body();

            if (!data) {
                return json({
                    success: false,
                    error: "Invalid JSON."
                }, 400);
            }


            const userId =
                Number(data.user_id);

            const title =
                String(data.title || "Rahul Live")
                    .trim();


            if (!userId) {

                return json({
                    success: false,
                    error: "user_id is required."
                }, 400);

            }


            try {

                const user =
                    await env.DB
                        .prepare(`
                            SELECT id
                            FROM users
                            WHERE id = ?
                        `)
                        .bind(userId)
                        .first();


                if (!user) {

                    return json({
                        success: false,
                        error: "User not found."
                    }, 404);

                }


                /*
                 * The real stream key should ultimately be
                 * generated by the streaming provider.
                 */

                const streamKey =
                    crypto.randomUUID();


                const result =
                    await env.DB
                        .prepare(`
                            INSERT INTO live_streams
                            (
                                user_id,
                                title,
                                stream_key,
                                status,
                                started_at
                            )
                            VALUES (?, ?, ?, 'live', CURRENT_TIMESTAMP)
                        `)
                        .bind(
                            userId,
                            title || "Rahul Live",
                            streamKey
                        )
                        .run();


                return json({
                    success: true,
                    message: "LIVE session created.",
                    live_id:
                        result.meta?.last_row_id || null,
                    stream_key: streamKey,
                    status: "live"
                }, 201);

            } catch (error) {

                return json({
                    success: false,
                    error: error.message
                }, 500);

            }

        }


        /* =====================================================
           END LIVE
        ===================================================== */

        if (
            url.pathname === "/api/live/end" &&
            request.method === "POST"
        ) {

            const data = await body();

            if (!data) {
                return json({
                    success: false,
                    error: "Invalid JSON."
                }, 400);
            }


            const liveId =
                Number(data.live_id);


            if (!liveId) {

                return json({
                    success: false,
                    error: "live_id is required."
                }, 400);

            }


            try {

                await env.DB
                    .prepare(`
                        UPDATE live_streams
                        SET
                            status = 'ended',
                            ended_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `)
                    .bind(liveId)
                    .run();


                return json({
                    success: true,
                    message: "LIVE ended."
                });

            } catch (error) {

                return json({
                    success: false,
                    error: error.message
                }, 500);

            }

        }


        /* =====================================================
           LIVE CHAT MESSAGE
        ===================================================== */

        if (
            url.pathname === "/api/live/chat" &&
            request.method === "POST"
        ) {

            const data = await body();

            if (!data) {
                return json({
                    success: false,
                    error: "Invalid JSON."
                }, 400);
            }


            const liveId =
                Number(data.live_id);

            const userId =
                Number(data.user_id);

            const message =
                String(data.message || "").trim();


            if (
                !liveId ||
                !userId ||
                !message
            ) {

                return json({
                    success: false,
                    error:
                        "live_id, user_id and message are required."
                }, 400);

            }


            if (message.length > 500) {

                return json({
                    success: false,
                    error:
                        "Message is too long."
                }, 400);

            }


            try {

                const live =
                    await env.DB
                        .prepare(`
                            SELECT id
                            FROM live_streams
                            WHERE id = ?
                              AND status = 'live'
                            LIMIT 1
                        `)
                        .bind(liveId)
                        .first();


                if (!live) {

                    return json({
                        success: false,
                        error: "LIVE stream is not active."
                    }, 404);

                }


                const result =
                    await env.DB
                        .prepare(`
                            INSERT INTO live_messages
                            (
                                live_id,
                                user_id,
                                message
                            )
                            VALUES (?, ?, ?)
                        `)
                        .bind(
                            liveId,
                            userId,
                            message
                        )
                        .run();


                return json({
                    success: true,
                    message_id:
                        result.meta?.last_row_id || null
                }, 201);

            } catch (error) {

                return json({
                    success: false,
                    error: error.message
                }, 500);

            }

        }


        /* =====================================================
           GET LIVE CHAT
        ===================================================== */

        if (
            url.pathname === "/api/live/chat" &&
            request.method === "GET"
        ) {

            const liveId =
                Number(
                    url.searchParams.get("live_id")
                );


            if (!liveId) {

                return json({
                    success: false,
                    error: "live_id is required."
                }, 400);

            }


            try {

                const result =
                    await env.DB
                        .prepare(`
                            SELECT
                                live_messages.id,
                                live_messages.message,
                                live_messages.created_at,
                                users.id AS user_id,
                                users.username,
                                users.profile_photo
                            FROM live_messages
                            INNER JOIN users
                                ON users.id =
                                   live_messages.user_id
                            WHERE live_messages.live_id = ?
                            ORDER BY live_messages.created_at ASC
                            LIMIT 200
                        `)
                        .bind(liveId)
                        .all();


                return json({
                    success: true,
                    messages:
                        result.results || []
                });

            } catch (error) {

                return json({
                    success: false,
                    error: error.message
                }, 500);

            }

        }


        /* =====================================================
           REPORT
        ===================================================== */

        if (
            url.pathname === "/api/report" &&
            request.method === "POST"
        ) {

            const data = await body();

            if (!data) {
                return json({
                    success: false,
                    error: "Invalid JSON."
                }, 400);
            }


            const reporterId =
                Number(data.reporter_id);

            const targetType =
                String(data.target_type || "").trim();

            const targetId =
                Number(data.target_id);

            const reason =
                String(data.reason || "").trim();

            const description =
                String(data.description || "").trim();


            if (
                !reporterId ||
                !targetType ||
                !targetId ||
                !reason
            ) {

                return json({
                    success: false,
                    error:
                        "reporter_id, target_type, target_id and reason are required."
                }, 400);

            }


            try {

                const result =
                    await env.DB
                        .prepare(`
                            INSERT INTO reports
                            (
                                reporter_id,
                                target_type,
                                target_id,
                                reason,
                                description
                            )
                            VALUES (?, ?, ?, ?, ?)
                        `)
                        .bind(
                            reporterId,
                            targetType,
                            targetId,
                            reason,
                            description || null
                        )
                        .run();


                return json({
                    success: true,
                    message: "Report submitted.",
                    report_id:
                        result.meta?.last_row_id || null
                }, 201);

            } catch (error) {

                return json({
                    success: false,
                    error: error.message
                }, 500);

            }

        }


        /* =====================================================
           404
        ===================================================== */

        return json({
            success: false,
            error: "API endpoint not found.",
            path: url.pathname
        }, 404);

    }
};