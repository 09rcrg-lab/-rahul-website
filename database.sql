-- ===========================================
-- InstaBoost Hub Database
-- Cloudflare D1 (SQLite)
-- Version 1.0
-- ===========================================

PRAGMA foreign_keys = ON;

-- ===========================================
-- USERS
-- ===========================================

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,

    wallet REAL DEFAULT 0,
    coins INTEGER DEFAULT 0,

    referral_code TEXT UNIQUE,
    referred_by TEXT,

    is_admin INTEGER DEFAULT 0,
    account_status TEXT DEFAULT 'Active',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_username
ON users(username);

-- ===========================================
-- INSTAGRAM SERVICES
-- ===========================================

CREATE TABLE IF NOT EXISTS services (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    service_name TEXT NOT NULL,

    category TEXT NOT NULL,

    description TEXT,

    price REAL NOT NULL,

    min_quantity INTEGER NOT NULL,

    max_quantity INTEGER NOT NULL,

    status TEXT DEFAULT 'Active',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_services_status
ON services(status);-- ===========================================
-- ORDERS
-- ===========================================

CREATE TABLE IF NOT EXISTS orders (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    instagram_username TEXT NOT NULL,

    service_id INTEGER NOT NULL,

    quantity INTEGER NOT NULL,

    amount REAL NOT NULL,

    status TEXT DEFAULT 'Pending',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(service_id) REFERENCES services(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_user
ON orders(user_id);

CREATE INDEX IF NOT EXISTS idx_orders_status
ON orders(status);

-- ===========================================
-- WALLET TRANSACTIONS
-- ===========================================

CREATE TABLE IF NOT EXISTS wallet_transactions (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    type TEXT NOT NULL,

    amount REAL NOT NULL,

    payment_method TEXT,

    transaction_id TEXT,

    status TEXT DEFAULT 'Pending',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_wallet_user
ON wallet_transactions(user_id);

-- ===========================================
-- REFERRALS
-- ===========================================

CREATE TABLE IF NOT EXISTS referrals (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    referrer_id INTEGER NOT NULL,

    referred_id INTEGER NOT NULL,

    reward REAL DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(referrer_id) REFERENCES users(id),
    FOREIGN KEY(referred_id) REFERENCES users(id)
);-- ===========================================
-- DAILY REWARDS
-- ===========================================

CREATE TABLE IF NOT EXISTS daily_rewards (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    reward_coins INTEGER DEFAULT 0,

    reward_date DATE NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_daily_rewards_user
ON daily_rewards(user_id);

-- ===========================================
-- COUPONS
-- ===========================================

CREATE TABLE IF NOT EXISTS coupons (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    code TEXT NOT NULL UNIQUE,

    discount_type TEXT DEFAULT 'PERCENT',

    discount_value REAL NOT NULL,

    max_uses INTEGER DEFAULT 1,

    used_count INTEGER DEFAULT 0,

    expiry_date DATE,

    status TEXT DEFAULT 'Active',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- NOTIFICATIONS
-- ===========================================

CREATE TABLE IF NOT EXISTS notifications (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    title TEXT NOT NULL,

    message TEXT NOT NULL,

    is_read INTEGER DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
ON notifications(user_id);

-- ===========================================
-- SUPPORT TICKETS
-- ===========================================

CREATE TABLE IF NOT EXISTS support_tickets (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    subject TEXT NOT NULL,

    message TEXT NOT NULL,

    status TEXT DEFAULT 'Open',

    admin_reply TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_support_user
ON support_tickets(user_id);-- ===========================================
-- SITE SETTINGS
-- ===========================================

CREATE TABLE IF NOT EXISTS settings (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    setting_key TEXT UNIQUE NOT NULL,

    setting_value TEXT,

    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- INSERT DEFAULT SETTINGS
-- ===========================================

INSERT OR IGNORE INTO settings (setting_key, setting_value)
VALUES
('site_name', 'InstaBoost Hub'),
('maintenance_mode', 'OFF'),
('whatsapp_link', ''),
('upi_qr', ''),
('currency', 'INR');

-- ===========================================
-- DEFAULT INSTAGRAM SERVICES
-- ===========================================

INSERT OR IGNORE INTO services
(service_name, category, description, price, min_quantity, max_quantity)
VALUES
('Instagram Followers', 'Followers', 'High Quality Followers', 0.25, 100, 100000),
('Instagram Likes', 'Likes', 'Fast Likes', 0.10, 50, 50000),
('Instagram Views', 'Views', 'Fast Video Views', 0.02, 100, 1000000),
('Instagram Comments', 'Comments', 'Real Looking Comments', 1.00, 10, 5000);

-- ===========================================
-- END OF DATABASE
-- ===========================================