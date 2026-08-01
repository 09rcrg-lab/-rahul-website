-- =========================================================
-- RAHUL LIVE
-- database.sql
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

    bio TEXT DEFAULT '',

    avatar_url TEXT DEFAULT '',

    followers_count INTEGER DEFAULT 0,

    following_count INTEGER DEFAULT 0,

    videos_count INTEGER DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP

);


-- =========================================================
-- SHORT VIDEOS
-- =========================================================

CREATE TABLE IF NOT EXISTS videos (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    video_url TEXT NOT NULL,

    thumbnail_url TEXT DEFAULT '',

    caption TEXT DEFAULT '',

    likes_count INTEGER DEFAULT 0,

    comments_count INTEGER DEFAULT 0,

    shares_count INTEGER DEFAULT 0,

    views_count INTEGER DEFAULT 0,

    status TEXT DEFAULT 'published',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

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

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

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

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (video_id)
        REFERENCES videos(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);


-- =========================================================
-- FOLLOW SYSTEM
-- =========================================================

CREATE TABLE IF NOT EXISTS follows (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    follower_id INTEGER NOT NULL,

    following_id INTEGER NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

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
-- VIDEO VIEWS
-- =========================================================

CREATE TABLE IF NOT EXISTS video_views (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    video_id INTEGER NOT NULL,

    user_id INTEGER,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (video_id)
        REFERENCES videos(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL

);


-- =========================================================
-- LIVE STREAMS
-- =========================================================

CREATE TABLE IF NOT EXISTS live_streams (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    title TEXT DEFAULT 'Rahul Live',

    stream_url TEXT DEFAULT '',

    playback_url TEXT DEFAULT '',

    thumbnail_url TEXT DEFAULT '',

    status TEXT DEFAULT 'live',

    viewers_count INTEGER DEFAULT 0,

    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    ended_at DATETIME,

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

    user_id INTEGER NOT NULL,

    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    left_at DATETIME,

    FOREIGN KEY (live_id)
        REFERENCES live_streams(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);


-- =========================================================
-- LIVE COMMENTS / CHAT
-- =========================================================

CREATE TABLE IF NOT EXISTS live_comments (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    live_id INTEGER NOT NULL,

    user_id INTEGER NOT NULL,

    message TEXT NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (live_id)
        REFERENCES live_streams(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);


-- =========================================================
-- VIDEO REPORTS
-- =========================================================

CREATE TABLE IF NOT EXISTS video_reports (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    video_id INTEGER NOT NULL,

    user_id INTEGER NOT NULL,

    reason TEXT NOT NULL,

    status TEXT DEFAULT 'pending',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (video_id)
        REFERENCES videos(id)
        ON DELETE CASCADE,

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
ON videos(created_at DESC);


CREATE INDEX IF NOT EXISTS idx_video_likes_video
ON video_likes(video_id);


CREATE INDEX IF NOT EXISTS idx_video_comments_video
ON video_comments(video_id);


CREATE INDEX IF NOT EXISTS idx_follows_follower
ON follows(follower_id);


CREATE INDEX IF NOT EXISTS idx_follows_following
ON follows(following_id);


CREATE INDEX IF NOT EXISTS idx_video_views_video
ON video_views(video_id);


CREATE INDEX IF NOT EXISTS idx_live_status
ON live_streams(status);


CREATE INDEX IF NOT EXISTS idx_live_user
ON live_streams(user_id);


CREATE INDEX IF NOT EXISTS idx_live_comments
ON live_comments(live_id);


-- =========================================================
-- DONE
-- =========================================================