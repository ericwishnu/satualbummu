-- =====================================================================
-- SatuAlbumMu — snapshot skema MySQL (opsional / sekali-jalan).
-- Sumber kebenaran struktur ada di folder migrations/ (npm run migrate).
-- File ini hanya berguna kalau ingin membuat semua tabel sekaligus.
--   mysql -u USER -p NAMA_DATABASE < db/schema.sql
-- =====================================================================

CREATE TABLE IF NOT EXISTS albums (
  id             CHAR(36)     NOT NULL PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  film_preset    VARCHAR(32)  NOT NULL DEFAULT 'klasik',
  max_per_guest  INT          NULL,
  event_end      DATETIME     NULL,
  reveal_mode    VARCHAR(16)  NOT NULL DEFAULT 'during',
  visibility     VARCHAR(16)  NOT NULL DEFAULT 'public',
  download_style VARCHAR(16)  NOT NULL DEFAULT 'raw',
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
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
