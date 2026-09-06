-- =========================================
-- RAHUL SOCIAL HUB - ORDERS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,

    customer_name TEXT,
    username TEXT,

    service_id TEXT NOT NULL,
    service_name TEXT NOT NULL,

    quantity INTEGER NOT NULL,
    units INTEGER NOT NULL,

    amount INTEGER NOT NULL,

    referral INTEGER NOT NULL DEFAULT 0,
    lifetime_refill INTEGER NOT NULL DEFAULT 0,

    status TEXT NOT NULL DEFAULT 'Pending',

    created_at TEXT NOT NULL,
    updated_at TEXT
);

-- Fast order search
CREATE INDEX IF NOT EXISTS idx_orders_created_at
ON orders(created_at);

-- Fast status search
CREATE INDEX IF NOT EXISTS idx_orders_status
ON orders(status);