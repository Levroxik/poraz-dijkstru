import { Router, Request, Response } from 'express';
import { generateGraph, Difficulty } from '../lib/graphGenerator';

const router = Router();

const VALID_DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'genius'];

router.post('/graph', (req: Request, res: Response): void => {
  const { difficulty, seed } = req.body as { difficulty?: unknown; seed?: unknown };

  if (!difficulty || !VALID_DIFFICULTIES.includes(difficulty as Difficulty)) {
    res.status(400).json({
      error: `Invalid difficulty. Must be one of: ${VALID_DIFFICULTIES.join(', ')}`,
    });
    return;
  }

  // Use provided seed or generate a random one (32-bit unsigned integer)
  let resolvedSeed: number;
  if (seed !== undefined && seed !== null) {
    const parsedSeed = Number(seed);
    if (!Number.isInteger(parsedSeed) || parsedSeed < 0) {
      res.status(400).json({ error: 'seed must be a non-negative integer' });
      return;
    }
    resolvedSeed = parsedSeed >>> 0;
  } else {
    resolvedSeed = (Math.random() * 0xffffffff) >>> 0;
  }

  try {
    const graph = generateGraph(difficulty as Difficulty, resolvedSeed);
    res.status(200).json(graph);
  } catch (err) {
    console.error('Graph generation error:', err);
    res.status(500).json({ error: 'Internal server error during graph generation' });
  }
});

export default router;
