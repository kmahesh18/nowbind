-- 010_tiptap_content.sql: TipTap block editor support + media uploads

ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_json JSONB;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_format VARCHAR(20) NOT NULL DEFAULT 'markdown';

CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    original_name VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    url TEXT NOT NULL,
    r2_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_user_id ON media(user_id);
