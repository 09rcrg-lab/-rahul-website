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

);-- ===========================
-- LIVE ROOMS
-- ===========================

CREATE TABLE IF NOT EXISTS rooms (

id INTEGER PRIMARY KEY AUTOINCREMENT,

host_id INTEGER NOT NULL,

room_uid TEXT UNIQUE NOT NULL,

room_name TEXT NOT NULL,

room_type TEXT DEFAULT 'public',

room_password TEXT,

background TEXT,

category TEXT,

language TEXT,

country TEXT,

announcement TEXT,

is_locked INTEGER DEFAULT 0,

is_live INTEGER DEFAULT 1,

max_seats INTEGER DEFAULT 8,

viewer_count INTEGER DEFAULT 0,

created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY(host_id) REFERENCES users(id)

);

-- ===========================
-- ROOM MEMBERS
-- ===========================

CREATE TABLE IF NOT EXISTS room_members (

id INTEGER PRIMARY KEY AUTOINCREMENT,

room_id INTEGER NOT NULL,

user_id INTEGER NOT NULL,

role TEXT DEFAULT 'member',

mic INTEGER DEFAULT 0,

speaker INTEGER DEFAULT 0,

joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY(room_id) REFERENCES rooms(id),

FOREIGN KEY(user_id) REFERENCES users(id)

);

-- ===========================
-- VOICE SEATS
-- ===========================

CREATE TABLE IF NOT EXISTS room_seats (

id INTEGER PRIMARY KEY AUTOINCREMENT,

room_id INTEGER NOT NULL,

seat_number INTEGER NOT NULL,

user_id INTEGER,

mic_on INTEGER DEFAULT 1,

locked INTEGER DEFAULT 0,

FOREIGN KEY(room_id) REFERENCES rooms(id),

FOREIGN KEY(user_id) REFERENCES users(id)

);

-- ===========================
-- FRIENDS
-- ===========================

CREATE TABLE IF NOT EXISTS friends (

id INTEGER PRIMARY KEY AUTOINCREMENT,

user1 INTEGER NOT NULL,

user2 INTEGER NOT NULL,

status TEXT DEFAULT 'pending',

created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY(user1) REFERENCES users(id),

FOREIGN KEY(user2) REFERENCES users(id)

);

-- ===========================
-- FOLLOWS
-- ===========================

CREATE TABLE IF NOT EXISTS follows (

id INTEGER PRIMARY KEY AUTOINCREMENT,

follower_id INTEGER NOT NULL,

following_id INTEGER NOT NULL,

created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY(follower_id) REFERENCES users(id),

FOREIGN KEY(following_id) REFERENCES users(id)

);

-- ===========================
-- PERSONAL CHAT
-- ===========================

CREATE TABLE IF NOT EXISTS chats (

id INTEGER PRIMARY KEY AUTOINCREMENT,

user1 INTEGER NOT NULL,

user2 INTEGER NOT NULL,

created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY(user1) REFERENCES users(id),

FOREIGN KEY(user2) REFERENCES users(id)

);

-- ===========================
-- CHAT MESSAGES
-- ===========================

CREATE TABLE IF NOT EXISTS messages (

id INTEGER PRIMARY KEY AUTOINCREMENT,

chat_id INTEGER NOT NULL,

sender_id INTEGER NOT NULL,

message TEXT,

image TEXT,

voice TEXT,

video TEXT,

file TEXT,

status TEXT DEFAULT 'sent',

created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY(chat_id) REFERENCES chats(id),

FOREIGN KEY(sender_id) REFERENCES users(id)

);