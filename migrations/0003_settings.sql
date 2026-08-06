-- migrate:up
CREATE TABLE IF NOT EXISTS settings (
  id          INT          NOT NULL PRIMARY KEY,
  brand_name  VARCHAR(80)  NOT NULL DEFAULT 'SatuAlbumMu',
  accent      VARCHAR(16)  NOT NULL DEFAULT '#e8b04b',
  accent_dark VARCHAR(16)  NOT NULL DEFAULT '#c8912f',
  logo_path   VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO settings (id) VALUES (1) ON DUPLICATE KEY UPDATE id = id;

-- migrate:down
DROP TABLE IF EXISTS settings;
