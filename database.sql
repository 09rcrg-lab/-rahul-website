-- ==========================================
-- RAHUL SOCIAL HUB DATABASE
-- ==========================================
-- USERS
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    referral_code TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL,
    service TEXT NOT NULL,
    instagram_username TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'Pending',
    order_status TEXT NOT NULL DEFAULT 'New',
    payment_screenshot TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- INDEXES
CREATE INDEX IF NOT EXISTS idx_users_username
ON users(username);
CREATE INDEX IF NOT EXISTS idx_orders_username
ON orders(username);
CREATE INDEX IF NOT EXISTS idx_orders_order_id
ON orders(order_id);