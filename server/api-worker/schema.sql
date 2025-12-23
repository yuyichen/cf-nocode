-- Metadata table for Models
CREATE TABLE IF NOT EXISTS models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    label TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Metadata table for Fields
CREATE TABLE IF NOT EXISTS fields (
    id TEXT PRIMARY KEY,
    model_id TEXT NOT NULL,
    name TEXT NOT NULL,
    label TEXT,
    type TEXT NOT NULL, -- text, number, boolean, date, relation, etc.
    required INTEGER DEFAULT 0,
    unique_key INTEGER DEFAULT 0,
    default_value TEXT,
    validation_rules TEXT, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
);

-- Metadata table for UI Pages
CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    config TEXT, -- JSON string for UI layout
    device_type TEXT, -- pc, mobile
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
