CREATE TABLE games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name VARCHAR(50) NOT NULL,
  player_distance INTEGER NOT NULL,
  dijkstra_distance INTEGER NOT NULL,
  player_path JSONB NOT NULL,
  graph_seed BIGINT NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  is_valid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_games_difficulty_created ON games(difficulty, created_at DESC);
CREATE INDEX idx_games_leaderboard ON games(difficulty, is_valid, (player_distance - dijkstra_distance));
