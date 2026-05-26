import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import type { Difficulty } from '../lib/graphGenerator';

const router = Router();

const VALID_DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'genius'];

router.get('/leaderboard', async (req: Request, res: Response): Promise<void> => {
  const { difficulty } = req.query as { difficulty?: string };

  if (!difficulty || !VALID_DIFFICULTIES.includes(difficulty as Difficulty)) {
    res.status(400).json({
      error: `Invalid or missing difficulty query param. Must be one of: ${VALID_DIFFICULTIES.join(', ')}`,
    });
    return;
  }

  try {
    // Fetch top 10 valid games for this difficulty
    // Ordered by (player_distance - dijkstra_distance) ASC — Supabase doesn't support
    // computed column ordering directly, so we fetch a reasonable set and sort in memory.
    const { data, error } = await supabase
      .from('games')
      .select('player_name, player_distance, dijkstra_distance, created_at')
      .eq('difficulty', difficulty)
      .eq('is_valid', true)
      .order('player_distance', { ascending: true })  // approximate pre-sort
      .limit(100);

    if (error) {
      console.error('Leaderboard query error:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
      return;
    }

    type GameRow = {
      player_name: string;
      player_distance: number;
      dijkstra_distance: number;
      created_at: string;
    };

    const sorted = ((data ?? []) as GameRow[])
      .map((row) => ({
        player_name: row.player_name,
        player_distance: row.player_distance,
        dijkstra_distance: row.dijkstra_distance,
        score_diff: row.player_distance - row.dijkstra_distance,
        created_at: row.created_at,
      }))
      .sort((a, b) => a.score_diff - b.score_diff)
      .slice(0, 10);

    res.status(200).json(sorted);
  } catch (err) {
    console.error('Leaderboard endpoint error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
