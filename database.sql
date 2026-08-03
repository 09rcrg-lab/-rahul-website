PRAGMA foreign_keys = ON;

-- ===========================
-- USERS
-- ===========================

CREATE TABLE IF NOT EXISTS users (

id INTEGER PRIMARY KEY AUTOINCREMENT,

username TEXT UNIQUE NOT NULL,

email TEXT UNIQUE,

phone TEXT UNIQUE,

password TEXT NOT NULL,

name TEXT,

bio TEXT,

gender TEXT,

country TEXT,

avatar TEXT,

cover TEXT,

level INTEGER DEFAULT 1,

coins INTEGER DEFAULT 0,

diamonds INTEGER DEFAULT 0,

followers INTEGER DEFAULT 0,

following INTEGER DEFAULT 0,

friends INTEGER DEFAULT 0,

verified INTEGER DEFAULT 0,

vip INTEGER DEFAULT 0,

status TEXT DEFAULT 'offline',

created_at DATETIME DEFAULT CURRENT_TIMESTAMP

);

-- ===========================
-- LOGIN SESSIONS
-- ===========================

CREATE TABLE IF NOT EXISTS sessions (

id INTEGER PRIMARY KEY AUTOINCREMENT,

user_id INTEGER,

token TEXT UNIQUE,

device TEXT,

ip TEXT,

created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

expires_at DATETIME,

FOREIGN KEY(user_id) REFERENCES users(id)

);

-- ===========================
-- USER SETTINGS
-- ===========================

CREATE TABLE IF NOT EXISTS settings (

id INTEGER PRIMARY KEY AUTOINCREMENT,

user_id INTEGER UNIQUE,

theme TEXT DEFAULT 'dark',

language TEXT DEFAULT 'en',

notifications INTEGER DEFAULT 1,

privacy INTEGER DEFAULT 0,

FOREIGN KEY(user_id) REFERENCES users(id)

);