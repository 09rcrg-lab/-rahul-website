-- Rahul Social Hub Database

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    referral_code TEXT,
    balance REAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    reward REAL DEFAULT 0,
    status TEXT DEFAULT 'active'
);


CREATE TABLE user_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    task_id INTEGER,
    completed BOOLEAN DEFAULT 0
);


CREATE TABLE referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    referred_user INTEGER,
    reward REAL DEFAULT 0
);


CREATE TABLE withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount REAL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);