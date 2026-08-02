PRAGMA foreign_keys = ON;
-- =========================================================
-- RAHUL LIVE DATABASE
-- =========================================================
-- =========================
-- USERS
-- =========================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer'
        CHECK (role IN ('viewer', 'host', 'admin')),
    is_blocked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- =========================
-- LIVE ROOMS
-- =========================
CREATE TABLE IF NOT EXISTS live_rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    host_id INTEGER NOT NULL,
    title TEXT NOT NULL DEFAULT 'Chat LIVE Room',
    status TEXT NOT NULL DEFAULT 'live'
        CHECK (status IN ('live', 'ended')),
    started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TEXT,
    FOREIGN KEY (host_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
-- =========================
-- LIVE VIEWERS
-- =========================
CREATE TABLE IF NOT EXISTS live_viewers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    live_room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    left_at TEXT,
    UNIQUE (live_room_id, user_id),
    FOREIGN KEY (live_room_id)
        REFERENCES live_rooms(id)
        ON DELETE CASCADE,
    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
-- =========================
-- LIVE CHAT MESSAGES
-- =========================
CREATE TABLE IF NOT EXISTS live_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    live_room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text'
        CHECK (
            message_type IN (
                'text',
                'emoji',
                'reaction',
                'system'
            )
        ),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (live_room_id)
        REFERENCES live_rooms(id)
        ON DELETE CASCADE,
    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
-- =========================
-- LIVE MODERATION
-- =========================
CREATE TABLE IF NOT EXISTS live_moderation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    live_room_id INTEGER NOT NULL,
    host_id INTEGER NOT NULL,
    target_user_id INTEGER NOT NULL,
    action TEXT NOT NULL
        CHECK (
            action IN (
                'mute',
                'unmute',
                'kick',
                'block',
                'unblock'
            )
        ),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (live_room_id)
        REFERENCES live_rooms(id)
        ON DELETE CASCADE,
    FOREIGN KEY (host_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    FOREIGN KEY (target_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
-- =========================
-- LIVE ROOM SETTINGS
-- =========================
CREATE TABLE IF NOT EXISTS live_room_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    live_room_id INTEGER NOT NULL UNIQUE,
    chat_enabled INTEGER NOT NULL DEFAULT 1,
    emoji_enabled INTEGER NOT NULL DEFAULT 1,
    reactions_enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (live_room_id)
        REFERENCES live_rooms(id)
        ON DELETE CASCADE
);
-- =========================
-- INDEXES
-- =========================
CREATE INDEX IF NOT EXISTS idx_live_rooms_status
ON live_rooms(status);
CREATE INDEX IF NOT EXISTS idx_live_rooms_host
ON live_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_live_viewers_room
ON live_viewers(live_room_id);
CREATE INDEX IF NOT EXISTS idx_live_viewers_user
ON live_viewers(user_id);
CREATE INDEX IF NOT EXISTS idx_live_messages_room
ON live_messages(live_room_id);
CREATE INDEX IF NOT EXISTS idx_live_messages_created
ON live_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_live_moderation_room
ON live_moderation(live_room_id);
CREATE INDEX IF NOT EXISTS idx_users_username
ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);