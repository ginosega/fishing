-- Source-only proposal for the simple direct-save Gear slice.
-- Do not apply to a live D1 database without separate owner approval.
-- Seed a verified Gear record before testing an existing-record edit.
CREATE TABLE IF NOT EXISTS d6_gear_records (
  id TEXT PRIMARY KEY NOT NULL,
  revision INTEGER NOT NULL CHECK(revision >= 1),
  record_json TEXT NOT NULL,
  notes_text TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL
);
