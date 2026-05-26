import { Graph, DijkstraSnapshot } from '../store/gameStore';

export interface DijkstraResult {
  path: string[];
  distance: number;
  snapshots: DijkstraSnapshot[];
  reachable: boolean;
}

interface AdjEntry {
  to: string;
  weight: number;
}

function buildAdjacency(graph: Graph): Map<string, AdjEntry[]> {
  const adj = new Map<string, AdjEntry[]>();
  for (const node of graph.nodes) {
    adj.set(node.id, []);
  }
  for (const edge of graph.edges) {
    adj.get(edge.from)!.push({ to: edge.to, weight: edge.weight });
    adj.get(edge.to)!.push({ to: edge.from, weight: edge.weight });
  }
  return adj;
}

/**
 * Run Dijkstra and emit a snapshot at every meaningful step:
 *   - initial state (all ∞ except start = 0)
 *   - each time a node is picked as `current` (extract-min)
 *   - after relaxation of all its neighbours
 *   - final state with no current node
 */
export function runDijkstraWithSnapshots(
  graph: Graph,
  startId: string,
  endId: string,
): DijkstraResult {
  const adj = buildAdjacency(graph);

  const distances: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const visited = new Set<string>();

  for (const node of graph.nodes) {
    distances[node.id] = Infinity;
    prev[node.id] = null;
  }
  distances[startId] = 0;

  const snapshots: DijkstraSnapshot[] = [];

  // Snapshot 0 — initial state
  snapshots.push({
    distances: { ...distances },
    visited: new Set(visited),
    current: null,
  });

  while (visited.size < graph.nodes.length) {
    // Extract-min from unvisited
    let current: string | null = null;
    let minDist = Infinity;
    for (const node of graph.nodes) {
      if (!visited.has(node.id) && distances[node.id] < minDist) {
        minDist = distances[node.id];
        current = node.id;
      }
    }
    if (current === null || minDist === Infinity) break;

    // Snapshot: selecting current
    snapshots.push({
      distances: { ...distances },
      visited: new Set(visited),
      current,
    });

    // Relax neighbours
    const neighbours = adj.get(current) ?? [];
    for (const { to, weight } of neighbours) {
      if (visited.has(to)) continue;
      const alt = distances[current] + weight;
      if (alt < distances[to]) {
        distances[to] = alt;
        prev[to] = current;
      }
    }

    visited.add(current);

    // Snapshot: after relaxation
    snapshots.push({
      distances: { ...distances },
      visited: new Set(visited),
      current,
    });

    if (current === endId) break;
  }

  // Final snapshot — no current node, everything settled
  snapshots.push({
    distances: { ...distances },
    visited: new Set(visited),
    current: null,
  });

  // Reconstruct path from end to start
  const path: string[] = [];
  const reachable = distances[endId] !== Infinity;
  if (reachable) {
    let cursor: string | null = endId;
    while (cursor !== null) {
      path.unshift(cursor);
      if (cursor === startId) break;
      cursor = prev[cursor];
    }
  }

  return {
    path: reachable ? path : [],
    distance: reachable ? distances[endId] : 0,
    snapshots,
    reachable,
  };
}
