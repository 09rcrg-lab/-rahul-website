PRAGMA foreign_keys = ON;

-- =====================================================
-- USERS
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    username TEXT UNIQUE,
    avatar_url TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    coins INTEGER NOT NULL DEFAULT 0,
    is_online INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- SESSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_token
ON sessions(token);

CREATE INDEX IF NOT EXISTS idx_sessions_user
ON sessions(user_id);


-- =====================================================
-- ROOMS
-- =====================================================

CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    room_type TEXT NOT NULL DEFAULT 'public',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rooms_owner
ON rooms(owner_id);

CREATE INDEX IF NOT EXISTS idx_rooms_created
ON rooms(created_at);


-- =====================================================
-- ROOM MEMBERS
-- =====================================================

CREATE TABLE IF NOT EXISTS room_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_members_room
ON room_members(room_id);

CREATE INDEX IF NOT EXISTS idx_room_members_user
ON room_members(user_id);


-- =====================================================
-- ROOM VIEWERS
-- =====================================================

CREATE TABLE IF NOT EXISTS room_viewers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_viewers_room
ON room_viewers(room_id);

CREATE INDEX IF NOT EXISTS idx_room_viewers_user
ON room_viewers(user_id);


-- =====================================================
-- 8 VOICE SEATS
-- =====================================================

CREATE TABLE IF NOT EXISTS room_seats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    seat_number INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    is_muted INTEGER NOT NULL DEFAULT 0,
    joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(room_id, seat_number),
    UNIQUE(room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_seats_room
ON room_seats(room_id);

CREATE INDEX IF NOT EXISTS idx_room_seats_user
ON room_seats(user_id);


-- =====================================================
-- ROOM CHAT
-- =====================================================

CREATE TABLE IF NOT EXISTS room_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_room_messages_room
ON room_messages(room_id, id);

CREATE INDEX IF NOT EXISTS idx_room_messages_user
ON room_messages(user_id);


-- =====================================================
-- ROOM REACTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS room_reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    reaction TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_room_reactions_room
ON room_reactions(room_id);


-- =====================================================
-- MUSIC
-- =====================================================

CREATE TABLE IF NOT EXISTS music_tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT DEFAULT '',
    audio_url TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_music_active
ON music_tracks(is_active);


-- =====================================================
-- ROOM MUSIC
-- =====================================================

CREATE TABLE IF NOT EXISTS room_music (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    track_id INTEGER NOT NULL,
    started_by INTEGER NOT NULL,
    started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_room_music_room
ON room_music(room_id);


-- =====================================================
-- GIFTS
-- =====================================================

CREATE TABLE IF NOT EXISTS gifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    coin_cost INTEGER NOT NULL DEFAULT 0,
    image_url TEXT DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_gifts_active
ON gifts(is_active);


-- =====================================================
-- GIFT TRANSACTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS gift_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    gift_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    coins INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gift_transactions_room
ON gift_transactions(room_id);

CREATE INDEX IF NOT EXISTS idx_gift_transactions_sender
ON gift_transactions(sender_id);

CREATE INDEX IF NOT EXISTS idx_gift_transactions_receiver
ON gift_transactions(receiver_id);


-- =====================================================
-- WALLET
-- =====================================================

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0,
    transaction_type TEXT NOT NULL,
    reference_id INTEGER,
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_user
ON wallet_transactions(user_id);


-- =====================================================
-- SUPPORT / PERSONAL HELP
-- =====================================================

CREATE TABLE IF NOT EXISTS support_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user
ON support_tickets(user_id);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status
ON support_tickets(status);


CREATE TABLE IF NOT EXISTS support_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket
ON support_messages(ticket_id);


-- =====================================================
-- FRIENDSHIPS
-- =====================================================

CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user
ON friendships(user_id);

CREATE INDEX IF NOT EXISTS idx_friendships_friend
ON friendships(friend_id);


-- =====================================================
-- ROOM INVITATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS room_invitations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_room_invites_receiver
ON room_invitations(receiver_id);

CREATE INDEX IF NOT EXISTS idx_room_invites_room
ON room_invitations(room_id);


-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT DEFAULT '',
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
ON notifications(user_id, is_read);


-- =====================================================
-- BLOCKED USERS
-- =====================================================

CREATE TABLE IF NOT EXISTS blocked_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    blocked_user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, blocked_user_id)
);


-- =====================================================
-- REPORTS
-- =====================================================

CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_id INTEGER NOT NULL,
    reported_user_id INTEGER,
    room_id INTEGER,
    reason TEXT NOT NULL,
    details TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- USER IDENTITY
-- =====================================================

CREATE TABLE IF NOT EXISTS user_identity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    identity_type TEXT,
    identity_value TEXT,
    verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- LIVE ROOM SETTINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS live_room_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL UNIQUE,
    max_seats INTEGER NOT NULL DEFAULT 8,
    chat_enabled INTEGER NOT NULL DEFAULT 1,
    reactions_enabled INTEGER NOT NULL DEFAULT 1,
    music_enabled INTEGER NOT NULL DEFAULT 1,
    gifts_enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- LIVE ROOMS
-- =====================================================

CREATE TABLE IF NOT EXISTS live_rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'live',
    started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TEXT
);


-- =====================================================
-- LIVE VIEWERS
-- =====================================================

CREATE TABLE IF NOT EXISTS live_viewers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    left_at TEXT
);


-- =====================================================
-- LIVE MESSAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS live_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- LIVE MODERATION
-- =====================================================

CREATE TABLE IF NOT EXISTS live_moderation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    moderator_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- DONE
-- =====================================================

PRAGMA foreign_keys = ON;