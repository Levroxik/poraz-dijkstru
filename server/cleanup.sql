-- One-time cleanup: removes all demo/seed data added during development
-- Safe to run multiple times (idempotent)
-- Run via Supabase SQL editor or psql

DELETE FROM games
WHERE player_name IN (
  'Honza', 'Pepa', 'Karel', 'Jana', 'Eva', 'Tomáš', 'Lucie', 'Martin',
  'Test', 'Demo', 'Player', 'User', 'Admin', 'Seed',
  'test', 'demo', 'player', 'user', 'admin', 'seed',
  'Anonymní'
);

-- Verify: should return 0 after cleanup
SELECT COUNT(*) AS remaining_demo_rows
FROM games
WHERE player_name IN (
  'Honza', 'Pepa', 'Karel', 'Jana', 'Eva', 'Tomáš', 'Lucie', 'Martin',
  'Test', 'Demo', 'Player', 'User', 'Admin', 'Seed',
  'test', 'demo', 'player', 'user', 'admin', 'seed',
  'Anonymní'
);

-- Total rows remaining (valid games from real players):
SELECT COUNT(*) AS total_real_games FROM games;
