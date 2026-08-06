-- migrate:up
ALTER TABLE settings ADD COLUMN logo_text VARCHAR(12) NULL;

-- Tema hitam-putih elegan (hanya kalau warna masih default emas lama).
UPDATE settings SET accent = '#f4f4f5', accent_dark = '#d4d4d7' WHERE accent = '#e8b04b';

-- Logo teks acara.
UPDATE settings SET logo_text = 'E & C' WHERE id = 1 AND (logo_text IS NULL OR logo_text = '');

-- migrate:down
UPDATE settings SET accent = '#e8b04b', accent_dark = '#c8912f' WHERE accent = '#f4f4f5';
ALTER TABLE settings DROP COLUMN logo_text;
