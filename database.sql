-- =========================================================
-- RAHUL LIVE DATABASE
-- Short Video + LIVE Streaming Application
-- =========================================================


PRAGMA foreign_keys = ON;


-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS users (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    username TEXT NOT NULL UNIQUE,

    email TEXT NOT NULL UNIQUE,

    password TEXT NOT NULL,

    profile_photo TEXT,

    bio TEXT,

    followers_count INTEGER NOT NULL DEFAULT 0,

    following_count INTEGER NOT NULL DEFAULT 0,

    videos_count INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

);


-- =========================================================
-- VIDEOS
-- =========================================================

CREATE TABLE IF NOT EXISTS videos (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    video_url TEXT NOT NULL,

    thumbnail_url TEXT,

    caption TEXT,

    duration INTEGER DEFAULT 0,

    views_count INTEGER NOT NULL DEFAULT 0,

    likes_count INTEGER NOT NULL DEFAULT 0,

    comments_count INTEGER NOT NULL DEFAULT 0,

    shares_count INTEGER NOT NULL DEFAULT 0,

    status TEXT NOT NULL DEFAULT 'published',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);


-- =========================================================
-- VIDEO LIKES
-- =========================================================

CREATE TABLE IF NOT EXISTS video_likes (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    video_id INTEGER NOT NULL,

    user_id INTEGER NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(video_id, user_id),

    FOREIGN KEY (video_id)
        REFERENCES videos(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);


-- =========================================================
-- VIDEO COMMENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS video_comments (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    video_id INTEGER NOT NULL,

    user_id INTEGER NOT NULL,

    comment TEXT NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (video_id)
        REFERENCES videos(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);


-- =========================================================
-- VIDEO VIEWS
-- =========================================================

CREATE TABLE IF NOT EXISTS video_views (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    video_id INTEGER NOT NULL,

    user_id INTEGER,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (video_id)
        REFERENCES videos(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL

);


-- =========================================================
-- VIDEO SHARES
-- =========================================================

CREATE TABLE IF NOT EXISTS video_shares (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    video_id INTEGER NOT NULL,

    user_id INTEGER,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (video_id)
        REFERENCES videos(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL

);


-- =========================================================
-- FOLLOW SYSTEM
-- =========================================================

CREATE TABLE IF NOT EXISTS follows (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    follower_id INTEGER NOT NULL,

    following_id INTEGER NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(follower_id, following_id),

    CHECK(follower_id != following_id),

    FOREIGN KEY (follower_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (following_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);


-- =========================================================
-- LIVE STREAMS
-- =========================================================

CREATE TABLE IF NOT EXISTS live_streams (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    title TEXT,

    stream_key TEXT UNIQUE,

    playback_url TEXT,

    thumbnail_url TEXT,

    status TEXT NOT NULL DEFAULT 'scheduled',

    viewer_count INTEGER NOT NULL DEFAULT 0,

    likes_count INTEGER NOT NULL DEFAULT 0,

    started_at DATETIME,

    ended_at DATETIME,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);


-- =========================================================
-- LIVE VIEWERS
-- =========================================================

CREATE TABLE IF NOT EXISTS live_viewers (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    live_id INTEGER NOT NULL,

    user_id INTEGER,

    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    left_at DATETIME,

    FOREIGN KEY (live_id)
        REFERENCES live_streams(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL

);


-- =========================================================
-- LIVE LIKES / REACTIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS live_likes (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    live_id INTEGER NOT NULL,

    user_id INTEGER NOT NULL,

    reaction TEXT NOT NULL DEFAULT '❤️',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (live_id)
        REFERENCES live_streams(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);


-- =========================================================
-- LIVE CHAT
-- =========================================================

CREATE TABLE IF NOT EXISTS live_messages (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    live_id INTEGER NOT NULL,

    user_id INTEGER NOT NULL,

    message TEXT NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (live_id)
        REFERENCES live_streams(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);


-- =========================================================
-- LIVE MODERATION / BLOCKED USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS live_blocks (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    live_id INTEGER NOT NULL,

    user_id INTEGER NOT NULL,

    blocked_by INTEGER NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(live_id, user_id),

    FOREIGN KEY (live_id)
        REFERENCES live_streams(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (blocked_by)
        REFERENCES users(id)
        ON DELETE CASCADE

);


-- =========================================================
-- NOTIFICATIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS notifications (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    sender_id INTEGER,

    type TEXT NOT NULL,

    title TEXT,

    message TEXT,

    reference_id INTEGER,

    is_read INTEGER NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (sender_id)
        REFERENCES users(id)
        ON DELETE SET NULL

);


-- =========================================================
-- REPORTS
-- =========================================================

CREATE TABLE IF NOT EXISTS reports (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    reporter_id INTEGER NOT NULL,

    target_type TEXT NOT NULL,

    target_id INTEGER NOT NULL,

    reason TEXT NOT NULL,

    description TEXT,

    status TEXT NOT NULL DEFAULT 'pending',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (reporter_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);


-- =========================================================
-- ADMIN USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS admins (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL UNIQUE,

    role TEXT NOT NULL DEFAULT 'admin',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);


-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_videos_user
ON videos(user_id);


CREATE INDEX IF NOT EXISTS idx_videos_created
ON videos(created_at);


CREATE INDEX IF NOT EXISTS idx_video_likes_video
ON video_likes(video_id);


CREATE INDEX IF NOT EXISTS idx_video_comments_video
ON video_comments(video_id);


CREATE INDEX IF NOT EXISTS idx_follows_follower
ON follows(follower_id);


CREATE INDEX IF NOT EXISTS idx_follows_following
ON follows(following_id);


CREATE INDEX IF NOT EXISTS idx_live_status
ON live_streams(status);


CREATE INDEX IF NOT EXISTS idx_live_user
ON live_streams(user_id);


CREATE INDEX IF NOT EXISTS idx_live_messages_live
ON live_messages(live_id);


CREATE INDEX IF NOT EXISTS idx_notifications_user
ON notifications(user_id);


CREATE INDEX IF NOT EXISTS idx_reports_status
ON reports(status);


-- =========================================================
-- DATABASE READY
-- =========================================================