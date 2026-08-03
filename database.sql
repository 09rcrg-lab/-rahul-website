-- =========================================================
-- RAHUL LIVE DATABASE
-- =========================================================

PRAGMA foreign_keys = ON;


-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL,

    email TEXT NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    username TEXT UNIQUE,

    avatar_url TEXT,

    bio TEXT DEFAULT '',

    coins INTEGER NOT NULL DEFAULT 0,

    is_online INTEGER NOT NULL DEFAULT 0,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- LOGIN SESSIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    token_hash TEXT NOT NULL UNIQUE,

    expires_at TEXT NOT NULL,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE INDEX IF NOT EXISTS idx_sessions_token
ON sessions(token_hash);


CREATE INDEX IF NOT EXISTS idx_sessions_user
ON sessions(user_id);


-- =========================================================
-- ROOMS
-- =========================================================

CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    owner_id INTEGER NOT NULL,

    name TEXT NOT NULL,

    description TEXT DEFAULT '',

    room_type TEXT NOT NULL DEFAULT 'public',

    cover_url TEXT,

    is_active INTEGER NOT NULL DEFAULT 1,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (owner_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE INDEX IF NOT EXISTS idx_rooms_owner
ON rooms(owner_id);


CREATE INDEX IF NOT EXISTS idx_rooms_active
ON rooms(is_active);


-- =========================================================
-- ROOM MEMBERS
-- =========================================================

CREATE TABLE IF NOT EXISTS room_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    room_id INTEGER NOT NULL,

    user_id INTEGER NOT NULL,

    role TEXT NOT NULL DEFAULT 'member',

    joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    left_at TEXT,

    is_inside INTEGER NOT NULL DEFAULT 1,

    FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    UNIQUE(room_id, user_id)
);


CREATE INDEX IF NOT EXISTS idx_room_members_room
ON room_members(room_id);


CREATE INDEX IF NOT EXISTS idx_room_members_user
ON room_members(user_id);


-- =========================================================
-- VOICE SEATS
-- =========================================================

CREATE TABLE IF NOT EXISTS room_seats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    room_id INTEGER NOT NULL,

    seat_number INTEGER NOT NULL,

    user_id INTEGER,

    is_muted INTEGER NOT NULL DEFAULT 0,

    joined_at TEXT,

    FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    UNIQUE(room_id, seat_number)
);


CREATE INDEX IF NOT EXISTS idx_room_seats_room
ON room_seats(room_id);


-- =========================================================
-- FRIENDS
-- =========================================================

CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    requester_id INTEGER NOT NULL,

    receiver_id INTEGER NOT NULL,

    status TEXT NOT NULL DEFAULT 'pending',

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (requester_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (receiver_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    UNIQUE(requester_id, receiver_id)
);


CREATE INDEX IF NOT EXISTS idx_friendships_requester
ON friendships(requester_id);


CREATE INDEX IF NOT EXISTS idx_friendships_receiver
ON friendships(receiver_id);


-- =========================================================
-- PRIVATE ROOM INVITATIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS room_invitations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    room_id INTEGER NOT NULL,

    sender_id INTEGER NOT NULL,

    receiver_id INTEGER NOT NULL,

    status TEXT NOT NULL DEFAULT 'pending',

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE CASCADE,

    FOREIGN KEY (sender_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (receiver_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE INDEX IF NOT EXISTS idx_room_invitations_receiver
ON room_invitations(receiver_id);


-- =========================================================
-- ROOM CHAT
-- =========================================================

CREATE TABLE IF NOT EXISTS room_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    room_id INTEGER NOT NULL,

    user_id INTEGER NOT NULL,

    message TEXT NOT NULL,

    message_type TEXT NOT NULL DEFAULT 'text',

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE INDEX IF NOT EXISTS idx_room_messages_room
ON room_messages(room_id);


CREATE INDEX IF NOT EXISTS idx_room_messages_created
ON room_messages(created_at);


-- =========================================================
-- ROOM REACTIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS room_reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    room_id INTEGER NOT NULL,

    user_id INTEGER NOT NULL,

    reaction TEXT NOT NULL,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- GIFTS
-- =========================================================

CREATE TABLE IF NOT EXISTS gifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL,

    icon_url TEXT,

    coin_cost INTEGER NOT NULL,

    is_active INTEGER NOT NULL DEFAULT 1,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- SENT GIFTS
-- =========================================================

CREATE TABLE IF NOT EXISTS gift_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    room_id INTEGER NOT NULL,

    sender_id INTEGER NOT NULL,

    receiver_id INTEGER NOT NULL,

    gift_id INTEGER NOT NULL,

    quantity INTEGER NOT NULL DEFAULT 1,

    total_coins INTEGER NOT NULL,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE CASCADE,

    FOREIGN KEY (sender_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (receiver_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (gift_id)
        REFERENCES gifts(id)
        ON DELETE RESTRICT
);


CREATE INDEX IF NOT EXISTS idx_gift_transactions_room
ON gift_transactions(room_id);


-- =========================================================
-- WALLET TRANSACTIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    transaction_type TEXT NOT NULL,

    amount INTEGER NOT NULL,

    balance_after INTEGER NOT NULL,

    reference_id INTEGER,

    description TEXT DEFAULT '',

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user
ON wallet_transactions(user_id);


-- =========================================================
-- MUSIC PLAYLISTS
-- =========================================================

CREATE TABLE IF NOT EXISTS playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    name TEXT NOT NULL,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- MUSIC TRACKS
-- =========================================================

CREATE TABLE IF NOT EXISTS music_tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    title TEXT NOT NULL,

    artist TEXT DEFAULT '',

    audio_url TEXT NOT NULL,

    cover_url TEXT,

    is_active INTEGER NOT NULL DEFAULT 1,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- PLAYLIST TRACKS
-- =========================================================

CREATE TABLE IF NOT EXISTS playlist_tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    playlist_id INTEGER NOT NULL,

    track_id INTEGER NOT NULL,

    position INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY (playlist_id)
        REFERENCES playlists(id)
        ON DELETE CASCADE,

    FOREIGN KEY (track_id)
        REFERENCES music_tracks(id)
        ON DELETE CASCADE,

    UNIQUE(playlist_id, track_id)
);


-- =========================================================
-- ROOM MUSIC
-- =========================================================

CREATE TABLE IF NOT EXISTS room_music (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    room_id INTEGER NOT NULL,

    track_id INTEGER NOT NULL,

    started_by INTEGER NOT NULL,

    is_playing INTEGER NOT NULL DEFAULT 1,

    started_at TEXT,

    stopped_at TEXT,

    FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE CASCADE,

    FOREIGN KEY (track_id)
        REFERENCES music_tracks(id)
        ON DELETE CASCADE,

    FOREIGN KEY (started_by)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- SUPPORT TICKETS
-- =========================================================

CREATE TABLE IF NOT EXISTS support_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    subject TEXT NOT NULL,

    message TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'open',

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE INDEX IF NOT EXISTS idx_support_user
ON support_tickets(user_id);


-- =========================================================
-- SUPPORT MESSAGES
-- =========================================================

CREATE TABLE IF NOT EXISTS support_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    ticket_id INTEGER NOT NULL,

    sender_id INTEGER,

    message TEXT NOT NULL,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (ticket_id)
        REFERENCES support_tickets(id)
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

    reported_user_id INTEGER,

    room_id INTEGER,

    reason TEXT NOT NULL,

    details TEXT DEFAULT '',

    status TEXT NOT NULL DEFAULT 'open',

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (reporter_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (reported_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE SET NULL
);


-- =========================================================
-- BLOCKED USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS blocked_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    blocker_id INTEGER NOT NULL,

    blocked_id INTEGER NOT NULL,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (blocker_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (blocked_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    UNIQUE(blocker_id, blocked_id)
);


-- =========================================================
-- NOTIFICATIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    type TEXT NOT NULL,

    title TEXT NOT NULL,

    message TEXT NOT NULL,

    reference_id INTEGER,

    is_read INTEGER NOT NULL DEFAULT 0,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE INDEX IF NOT EXISTS idx_notifications_user
ON notifications(user_id);


-- =========================================================
-- ROOM VIEWERS
-- =========================================================

CREATE TABLE IF NOT EXISTS room_viewers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    room_id INTEGER NOT NULL,

    user_id INTEGER NOT NULL,

    joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    left_at TEXT,

    is_inside INTEGER NOT NULL DEFAULT 1,

    FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- BASIC GIFT DATA
-- =========================================================

INSERT OR IGNORE INTO gifts
(id, name, icon_url, coin_cost)
VALUES
(1, 'Heart', '❤️', 10);

INSERT OR IGNORE INTO gifts
(id, name, icon_url, coin_cost)
VALUES
(2, 'Rose', '🌹', 50);

INSERT OR IGNORE INTO gifts
(id, name, icon_url, coin_cost)
VALUES
(3, 'Diamond', '💎', 100);

INSERT OR IGNORE INTO gifts
(id, name, icon_url, coin_cost)
VALUES
(4, 'Crown', '👑', 500);


-- =========================================================
-- DONE
-- =========================================================