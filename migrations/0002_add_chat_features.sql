
-- Enhanced chat tables with P2P features

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  contact_wey_id TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, contact_wey_id)
);

-- Private chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL REFERENCES users(id),
  to_wey_id TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TEXT NOT NULL
);

-- Global chat messages
CREATE TABLE IF NOT EXISTS global_chat (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' NOT NULL,
  created_at TEXT NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_to_wey_id ON chat_messages(to_wey_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_from_user_id ON chat_messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_global_chat_created_at ON global_chat(created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
