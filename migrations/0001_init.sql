-- migrate:up
CREATE TABLE IF NOT EXISTS albums (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  reveal_at     DATETIME     NULL,
  film_preset   VARCHAR(32)  NOT NULL DEFAULT 'klasik',
  max_per_guest INT          NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS photos (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  album_id      CHAR(36)     NOT NULL,
  storage_path  VARCHAR(512) NOT NULL,
  uploader_name VARCHAR(255) NULL,
  guest_id      VARCHAR(64)  NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_photos_album (album_id),
  INDEX idx_photos_album_guest (album_id, guest_id),
  CONSTRAINT fk_photos_album FOREIGN KEY (album_id)
    REFERENCES albums(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- migrate:down
DROP TABLE IF EXISTS photos;
DROP TABLE IF EXISTS albums;
