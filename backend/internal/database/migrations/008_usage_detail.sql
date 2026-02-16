-- 008_usage_detail.sql: Add detail column to api_key_usage for MCP tool names

ALTER TABLE api_key_usage ADD COLUMN IF NOT EXISTS detail VARCHAR(200) NOT NULL DEFAULT '';
