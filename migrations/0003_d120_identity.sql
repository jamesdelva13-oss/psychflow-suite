-- 0003 — D-120 minimal identity fields.
-- Respondent-facing student identity is first name + last initial. Full name
-- can never be stored: last_initial is constrained to a single letter.
-- Nullable for pre-D-120 rows; display_initials remains as the fallback.

alter table cases
  add column if not exists first_name text
    check (first_name is null or char_length(first_name) <= 40),
  add column if not exists last_initial text
    check (last_initial is null or last_initial ~ '^[A-Za-z]$');
