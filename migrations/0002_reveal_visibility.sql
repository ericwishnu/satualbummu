-- migrate:up
ALTER TABLE albums ADD COLUMN event_end DATETIME NULL;
ALTER TABLE albums ADD COLUMN reveal_mode VARCHAR(16) NOT NULL DEFAULT 'during';
ALTER TABLE albums ADD COLUMN visibility VARCHAR(16) NOT NULL DEFAULT 'public';
ALTER TABLE albums ADD COLUMN download_style VARCHAR(16) NOT NULL DEFAULT 'raw';

-- Pindahkan album lama yang punya reveal_at ke model baru:
-- perlakukan sebagai "dibuka saat acara berakhir".
UPDATE albums SET event_end = reveal_at, reveal_mode = 'end' WHERE reveal_at IS NOT NULL;

-- migrate:down
ALTER TABLE albums DROP COLUMN download_style;
ALTER TABLE albums DROP COLUMN visibility;
ALTER TABLE albums DROP COLUMN reveal_mode;
ALTER TABLE albums DROP COLUMN event_end;
