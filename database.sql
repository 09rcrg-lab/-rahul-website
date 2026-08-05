PRAGMA foreign_keys = ON;

-- =========================================================
-- RAHUL LIVE DATABASE
-- =========================================================

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- LIVE ROOMS
CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    host_id INTEGER NOT NULL,
    cover TEXT DEFAULT '',
    announcement TEXT DEFAULT 'Welcome to Rahul Live!',
    is_live INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 12 VOICE SEATS PER ROOM
CREATE TABLE IF NOT EXISTS room_seats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    seat_number INTEGER NOT NULL,
    user_id INTEGER,
    mic_on INTEGER NOT NULL DEFAULT 0,
    joined_at INTEGER,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(room_id, seat_number),
    UNIQUE(room_id, user_id)
);

-- ROOM VIEWERS
CREATE TABLE IF NOT EXISTS room_viewers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    joined_at INTEGER NOT NULL DEFAULT (unixepoch()),
    last_seen INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(room_id, user_id)
);

-- CHAT MESSAGES
CREATE TABLE IF NOT EXISTS room_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    user_id INTEGER,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'chat',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- REACTIONS
CREATE TABLE IF NOT EXISTS room_reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    user_id INTEGER,
    emoji TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- GIFTS
CREATE TABLE IF NOT EXISTS room_gifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    sender_id INTEGER,
    gift TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_rooms_live
ON rooms(is_live);

CREATE INDEX IF NOT EXISTS idx_rooms_host
ON rooms(host_id);

CREATE INDEX IF NOT EXISTS idx_seats_room
ON room_seats(room_id);

CREATE INDEX IF NOT EXISTS idx_viewers_room
ON room_viewers(room_id);

CREATE INDEX IF NOT EXISTS idx_messages_room
ON room_messages(room_id, created_at);

CREATE INDEX IF NOT EXISTS idx_reactions_room
ON room_reactions(room_id, created_at);

CREATE INDEX IF NOT EXISTS idx_gifts_room
ON room_gifts(room_id, created_at);

-- =========================================================
-- CREATE 12 EMPTY SEATS AUTOMATICALLY
-- =========================================================

CREATE TRIGGER IF NOT EXISTS create_room_seats
AFTER INSERT ON rooms
BEGIN

    INSERT INTO room_seats
        (room_id, seat_number)
    VALUES
        (NEW.id, 1);

    INSERT INTO room_seats
        (room_id, seat_number)
    VALUES
        (NEW.id, 2);

    INSERT INTO room_seats
        (room_id, seat_number)
    VALUES
        (NEW.id, 3);

    INSERT INTO room_seats
        (room_id, seat_number)
    VALUES
        (NEW.id, 4);

    INSERT INTO room_seats
        (room_id, seat_number)
    VALUES
        (NEW.id, 5);

    INSERT INTO room_seats
        (room_id, seat_number)
    VALUES
        (NEW.id, 6);

    INSERT INTO room_seats
        (room_id, seat_number)
    VALUES
        (NEW.id, 7);

    INSERT INTO room_seats
        (room_id, seat_number)
    VALUES
        (NEW.id, 8);

    INSERT INTO room_seats
        (room_id, seat_number)
    VALUES
        (NEW.id, 9);

    INSERT INTO room_seats
        (room_id, seat_number)
    VALUES
        (NEW.id, 10);

    INSERT INTO room_seats
        (room_id, seat_number)
    VALUES
        (NEW.id, 11);

    INSERT INTO room_seats
        (room_id, seat_number)
    VALUES
        (NEW.id, 12);

END;