-- Backfill legacy chats created before the is_private column was populated
-- Ensures existing history shows up in the sidebar

UPDATE chats
SET is_private = false
WHERE is_private IS NULL;
