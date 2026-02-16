-- 009_ai_views.sql: Add source/user_agent to post_views and ai_view_count to post_stats

ALTER TABLE post_views ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'web';
ALTER TABLE post_views ADD COLUMN IF NOT EXISTS user_agent TEXT NOT NULL DEFAULT '';

ALTER TABLE post_stats ADD COLUMN IF NOT EXISTS ai_view_count INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_post_views_source ON post_views(source);
