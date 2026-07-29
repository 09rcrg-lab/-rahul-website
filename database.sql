CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    coins INTEGER DEFAULT 0,
    referral_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_type TEXT NOT NULL,
    task_value TEXT NOT NULL,
    reward INTEGER DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    service TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);ALTER TABLE users
ADD COLUMN instagram_username TEXT;

ALTER TABLE users
ADD COLUMN followers_requested INTEGER DEFAULT 0;

ALTER TABLE users
ADD COLUMN followers_completed INTEGER DEFAULT 0;

ALTER TABLE users
ADD COLUMN request_status TEXT DEFAULT 'none';CREATE TABLE follow_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    instagram_username TEXT NOT NULL,
    followers INTEGER NOT NULL,
    completed INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);