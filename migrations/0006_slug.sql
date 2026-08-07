-- migrate:up
ALTER TABLE albums ADD COLUMN slug VARCHAR(80) NULL;
ALTER TABLE albums ADD UNIQUE INDEX uq_albums_slug (slug);

-- migrate:down
ALTER TABLE albums DROP INDEX uq_albums_slug;
ALTER TABLE albums DROP COLUMN slug;
