import type { Edge } from './graphGenerator';

interface AdjacencyEntry {
  neighbor: string;
  weight: number;
}

function buildAdjacency(edges: Edge[]): Map<string, AdjacencyEntry[]> {
  const adj = new Map<string, AdjacencyEntry[]>();

  for (const edge of edges) {
    if (!adj.has(edge.from)) adj.set(edge.from, []);
    if (!adj.has(edge.to)) adj.set(edge.to, []);

    adj.get(edge.from)!.push({ neighbor: edge.to, weight: edge.weight });
    adj.get(edge.to)!.push({ neighbor: edge.from, weight: edge.weight });
  }

  return adj;
}

export interface DijkstraResult {
  distance: number;
  path: string[];
  reachable: boolean;
}

// Simple min-heap priority queue
class MinHeap {
  private data: Array<{ node: string; dist: number }> = [];

  push(node: string, dist: number): void {
    this.data.push({ node, dist });
    this.bubbleUp(this.data.length - 1);
  }

  pop(): { node: string; dist: number } | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  get size(): number {
    return this.data.length;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[parent].dist <= this.data[i].dist) break;
      [this.data[parent], this.data[i]] = [this.data[i], this.data[parent]];
      i = parent;
    }
  }

  private sinkDown(i: number): void {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.data[left].dist < this.data[smallest].dist) smallest = left;
      if (right < n && this.data[right].dist < this.data[smallest].dist) smallest = right;
      if (smallest === i) break;
      [this.data[smallest], this.data[i]] = [this.data[i], this.data[smallest]];
      i = smallest;
    }
  }
}

export function dijkstra(edges: Edge[], startId: string, endId: string): DijkstraResult {
  const adj = buildAdjacency(edges);
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const heap = new MinHeap();

  dist.set(startId, 0);
  heap.push(startId, 0);

  while (heap.size > 0) {
    const current = heap.pop()!;
    const { node, dist: currentDist } = current;

    if (currentDist > (dist.get(node) ?? Infinity)) continue;
    if (node === endId) break;

    const neighbors = adj.get(node) ?? [];
    for (const { neighbor, weight } of neighbors) {
      const newDist = currentDist + weight;
      if (newDist < (dist.get(neighbor) ?? Infinity)) {
        dist.set(neighbor, newDist);
        prev.set(neighbor, node);
        heap.push(neighbor, newDist);
      }
    }
  }

  const distance = dist.get(endId);
  if (distance === undefined) {
    return { distance: Infinity, path: [], reachable: false };
  }

  // Reconstruct path
  const path: string[] = [];
  let current: string | null | undefined = endId;
  while (current !== null && current !== undefined) {
    path.unshift(current);
    current = prev.get(current);
    if (current === startId) {
      path.unshift(startId);
      break;
    }
  }

  return { distance, path, reachable: true };
}

// Validate a player's path and calculate its total distance
export function validatePlayerPath(
  edges: Edge[],
  playerPath: string[],
): { isValid: boolean; distance: number } {
  if (playerPath.length < 2) {
    return { isValid: false, distance: 0 };
  }

  // Build a quick edge-weight lookup (undirected)
  const edgeMap = new Map<string, number>();
  for (const edge of edges) {
    const key1 = `${edge.from}|${edge.to}`;
    const key2 = `${edge.to}|${edge.from}`;
    edgeMap.set(key1, edge.weight);
    edgeMap.set(key2, edge.weight);
  }

  let totalDistance = 0;
  for (let i = 0; i < playerPath.length - 1; i++) {
    const from = playerPath[i];
    const to = playerPath[i + 1];
    const key = `${from}|${to}`;
    const weight = edgeMap.get(key);

    if (weight === undefined) {
      return { isValid: false, distance: 0 };
    }
    totalDistance += weight;
  }

  return { isValid: true, distance: totalDistance };
}
