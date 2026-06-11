export type Difficulty = 'beginner' | 'intermediate' | 'genius';

export interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface Edge {
  from: string;
  to: string;
  weight: number;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
  seed: number;
  start: string;
  end: string;
}

// Mulberry32 seeded PRNG — same seed always produces the same sequence
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const INTERSECTION_NAMES = [
  'Náměstí', 'Radnice', 'Kostel', 'Tržiště', 'Nádraží',
  'Park', 'Muzeum', 'Divadlo', 'Knihovna', 'Nemocnice',
  'Škola', 'Pošta', 'Banka', 'Hřbitov', 'Stadion',
  'Plovárna', 'Pivovar', 'Zámek', 'Věž', 'Brána',
  'Lékárna', 'Trafika', 'Hospoda', 'Kaple', 'Mýto',
];

function getNodeCountRange(difficulty: Difficulty): { min: number; max: number } {
  switch (difficulty) {
    case 'beginner':
      return { min: 8, max: 10 };
    case 'intermediate':
      return { min: 12, max: 15 };
    case 'genius':
      return { min: 18, max: 22 };
  }
}

function distance(a: Node, b: Node): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// Check if two segments AB and CD intersect (excluding shared endpoints)
function segmentsCross(a: Node, b: Node, c: Node, d: Node): boolean {
  if (a.id === c.id || a.id === d.id || b.id === c.id || b.id === d.id) return false;
  const ccw = (p1: Node, p2: Node, p3: Node): number =>
    (p3.y - p1.y) * (p2.x - p1.x) - (p2.y - p1.y) * (p3.x - p1.x);
  const d1 = ccw(c, d, a);
  const d2 = ccw(c, d, b);
  const d3 = ccw(a, b, c);
  const d4 = ccw(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
         ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

// Build graph using positions: spanning tree via nearest neighbor, extras prefer short edges
function buildConnectedGraph(nodes: Node[], rand: () => number): Edge[] {
  const nodeCount = nodes.length;
  const edges: Edge[] = [];
  const edgeList: Array<{ a: Node; b: Node }> = [];
  const edgeSet = new Set<string>();

  // Compute distance range for weight normalization
  let minD = Infinity;
  let maxD = 0;
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      const d = distance(nodes[i], nodes[j]);
      if (d < minD) minD = d;
      if (d > maxD) maxD = d;
    }
  }
  const range = maxD - minD || 1;

  // Weight 1–10, correlated with distance (closer = smaller, with mild jitter)
  const weightFor = (a: Node, b: Node): number => {
    const norm = (distance(a, b) - minD) / range;
    const base = 1 + norm * 9;
    const jitter = (rand() - 0.5) * 1.5;
    return Math.max(1, Math.min(10, Math.round(base + jitter)));
  };

  const addEdge = (i: number, j: number): boolean => {
    const lo = Math.min(i, j);
    const hi = Math.max(i, j);
    const key = `${lo}-${hi}`;
    if (edgeSet.has(key)) return false;
    edgeSet.add(key);
    const w = weightFor(nodes[lo], nodes[hi]);
    edges.push({ from: `node_${lo}`, to: `node_${hi}`, weight: w });
    edgeList.push({ a: nodes[lo], b: nodes[hi] });
    return true;
  };

  // Would adding this edge cross too many existing edges? Limit visual clutter.
  const crossingCount = (i: number, j: number): number => {
    const a = nodes[i];
    const b = nodes[j];
    let count = 0;
    for (const e of edgeList) {
      if (segmentsCross(a, b, e.a, e.b)) count++;
    }
    return count;
  };

  // Spanning tree: connect each new node to its NEAREST already-connected node
  const indices = Array.from({ length: nodeCount }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const connected: number[] = [indices[0]];
  for (let i = 1; i < indices.length; i++) {
    const newIdx = indices[i];
    let nearest = connected[0];
    let nearestDist = distance(nodes[newIdx], nodes[nearest]);
    for (const c of connected) {
      const d = distance(nodes[newIdx], nodes[c]);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = c;
      }
    }
    addEdge(newIdx, nearest);
    connected.push(newIdx);
  }

  // Extra edges: candidate pool of all unconnected pairs sorted by distance.
  // Pick short ones, reject those that would create excessive edge crossings.
  const candidates: { i: number; j: number; d: number }[] = [];
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      const key = `${i}-${j}`;
      if (edgeSet.has(key)) continue;
      candidates.push({ i, j, d: distance(nodes[i], nodes[j]) });
    }
  }
  candidates.sort((a, b) => a.d - b.d);

  const targetExtras = Math.ceil(nodeCount * 0.7);
  let added = 0;
  for (const c of candidates) {
    if (added >= targetExtras) break;
    // Skip edges that would cross 2+ existing edges (keeps graph readable)
    if (crossingCount(c.i, c.j) >= 2) continue;
    // Small random rejection to add variety in seed-driven output
    if (rand() < 0.1) continue;
    if (addEdge(c.i, c.j)) added++;
  }

  return edges;
}

export function generateGraph(difficulty: Difficulty, seed: number): Graph {
  const rand = mulberry32(seed);
  const { min, max } = getNodeCountRange(difficulty);
  const nodeCount = min + Math.floor(rand() * (max - min + 1));

  const shuffledNames = [...INTERSECTION_NAMES];
  for (let i = shuffledNames.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffledNames[i], shuffledNames[j]] = [shuffledNames[j], shuffledNames[i]];
  }

  // Grid-based layout: divide canvas into cells, one node per cell with jitter.
  const PADDING = 80;
  const CANVAS_W = 800;
  const CANVAS_H = 580;
  const usableW = CANVAS_W - 2 * PADDING;
  const usableH = CANVAS_H - 2 * PADDING;

  const cols = Math.ceil(Math.sqrt(nodeCount * 1.4));
  const rows = Math.ceil(nodeCount / cols);

  const cells: { cx: number; cy: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        cx: PADDING + (c + 0.5) * (usableW / cols),
        cy: PADDING + (r + 0.5) * (usableH / rows),
      });
    }
  }
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  // Smaller jitter to keep nodes well within their cells — reduces label overlap
  const jitterX = (usableW / cols) * 0.18;
  const jitterY = (usableH / rows) * 0.18;

  const nodes: Node[] = Array.from({ length: nodeCount }, (_, i) => {
    const cell = cells[i];
    const rawX = cell.cx + (rand() - 0.5) * 2 * jitterX;
    const rawY = cell.cy + (rand() - 0.5) * 2 * jitterY;
    return {
      id: `node_${i}`,
      name: shuffledNames[i % shuffledNames.length],
      x: Math.round(Math.max(PADDING, Math.min(CANVAS_W - PADDING, rawX))),
      y: Math.round(Math.max(PADDING, Math.min(CANVAS_H - PADDING, rawY))),
    };
  });

  const edges = buildConnectedGraph(nodes, rand);

  // Pick start/end to be FAR APART so the gameplay has meaningful path-finding
  const allPairs: { i: number; j: number; d: number }[] = [];
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      allPairs.push({ i, j, d: distance(nodes[i], nodes[j]) });
    }
  }
  allPairs.sort((a, b) => b.d - a.d);
  // Pick randomly from the top-5 most-distant pairs for variety
  const topK = Math.min(5, allPairs.length);
  const picked = allPairs[Math.floor(rand() * topK)];

  return {
    nodes,
    edges,
    seed,
    start: `node_${picked.i}`,
    end: `node_${picked.j}`,
  };
}
