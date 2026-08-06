-- migrate:up
ALTER TABLE albums ADD COLUMN polaroid_title VARCHAR(80) NULL;
ALTER TABLE albums ADD COLUMN polaroid_subtitle VARCHAR(80) NULL;
ALTER TABLE albums ADD COLUMN bg_path VARCHAR(255) NULL;

-- migrate:down
ALTER TABLE albums DROP COLUMN bg_path;
ALTER TABLE albums DROP COLUMN polaroid_subtitle;
ALTER TABLE albums DROP COLUMN polaroid_title;
