import { Router, Request, Response } from 'express';
import { generateGraph, Difficulty } from '../lib/graphGenerator';
import { dijkstra, validatePlayerPath } from '../lib/dijkstra';
import { supabase } from '../lib/supabase';

const router = Router();

const VALID_DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'genius'];

interface ResultRequestBody {
  player_name?: unknown;
  player_path?: unknown;
  graph_seed?: unknown;
  difficulty?: unknown;
}

router.post('/result', async (req: Request, res: Response): Promise<void> => {
  const { player_name, player_path, graph_seed, difficulty } =
    req.body as ResultRequestBody;

  // --- Input validation ---
  if (!player_name || typeof player_name !== 'string' || player_name.trim().length === 0) {
    res.status(400).json({ error: 'player_name is required and must be a non-empty string' });
    return;
  }
  if (player_name.trim().length > 50) {
    res.status(400).json({ error: 'player_name must not exceed 50 characters' });
    return;
  }

  if (!Array.isArray(player_path) || player_path.length < 2) {
    res.status(400).json({ error: 'player_path must be an array with at least 2 node ids' });
    return;
  }
  if (!player_path.every((p) => typeof p === 'string')) {
    res.status(400).json({ error: 'player_path must contain only string node ids' });
    return;
  }

  const seedNumber = Number(graph_seed);
  if (!Number.isInteger(seedNumber) || seedNumber < 0) {
    res.status(400).json({ error: 'graph_seed must be a non-negative integer' });
    return;
  }

  if (!difficulty || !VALID_DIFFICULTIES.includes(difficulty as Difficulty)) {
    res.status(400).json({
      error: `Invalid difficulty. Must be one of: ${VALID_DIFFICULTIES.join(', ')}`,
    });
    return;
  }

  try {
    // Regenerate the same graph from seed + difficulty
    const graph = generateGraph(difficulty as Difficulty, seedNumber >>> 0);

    // Validate that player_path starts at the graph's start and ends at the graph's end
    const typedPlayerPath = player_path as string[];
    const allNodeIds = new Set(graph.nodes.map((n) => n.id));

    for (const nodeId of typedPlayerPath) {
      if (!allNodeIds.has(nodeId)) {
        res.status(400).json({ error: `player_path contains unknown node id: ${nodeId}` });
        return;
      }
    }

    if (typedPlayerPath[0] !== graph.start) {
      res.status(400).json({
        error: `player_path must start at the graph's start node: ${graph.start}`,
      });
      return;
    }
    if (typedPlayerPath[typedPlayerPath.length - 1] !== graph.end) {
      res.status(400).json({
        error: `player_path must end at the graph's end node: ${graph.end}`,
      });
      return;
    }

    // Run Dijkstra on the generated graph
    const dijkstraResult = dijkstra(graph.edges, graph.start, graph.end);

    // Validate player path (check every consecutive pair is a real edge)
    const { isValid, distance: playerDistance } = validatePlayerPath(
      graph.edges,
      typedPlayerPath,
    );

    const dijkstraDistance = dijkstraResult.reachable ? dijkstraResult.distance : 0;

    // Persist to Supabase
    const { error: insertError } = await supabase.from('games').insert({
      player_name: player_name.trim(),
      player_distance: isValid ? playerDistance : 0,
      dijkstra_distance: dijkstraDistance,
      player_path: typedPlayerPath,
      graph_seed: seedNumber,
      difficulty: difficulty as string,
      is_valid: isValid,
    });

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      res.status(500).json({ error: 'Failed to save game result' });
      return;
    }

    // Calculate rank for this player among valid games for the same difficulty.
    // Fetch all valid games in-memory and sort by score_diff ascending (lower is better).
    // score_diff = player_distance - dijkstra_distance
    // Rank is 1-indexed: position of the newly saved game after sorting.
    let rank: number | null = null;
    if (isValid) {
      const { data: insertedRow } = await supabase
        .from('games')
        .select('id')
        .eq('player_name', player_name.trim())
        .eq('graph_seed', seedNumber)
        .eq('difficulty', difficulty as string)
        .eq('player_distance', playerDistance)
        .eq('dijkstra_distance', dijkstraDistance)
        .order('id', { ascending: false })
        .limit(1)
        .single();

      const { data: allGames, error: rankError } = await supabase
        .from('games')
        .select('id, player_distance, dijkstra_distance')
        .eq('difficulty', difficulty as string)
        .eq('is_valid', true);

      if (rankError || !allGames) {
        console.error('Rank query error:', rankError);
        // Non-fatal — return null rank
      } else {
        const sorted = [...allGames].sort(
          (a, b) =>
            (a.player_distance - a.dijkstra_distance) -
            (b.player_distance - b.dijkstra_distance),
        );
        const savedId = insertedRow?.id;
        const position = sorted.findIndex((g) => g.id === savedId);
        rank = position >= 0 ? position + 1 : null;
      }
    }

    res.status(200).json({
      dijkstra_distance: dijkstraDistance,
      player_distance: isValid ? playerDistance : 0,
      is_valid: isValid,
      rank,
    });
  } catch (err) {
    console.error('Result endpoint error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
