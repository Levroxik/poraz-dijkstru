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

// Build a spanning tree first to guarantee connectivity, then add extra edges
function buildConnectedGraph(nodeCount: number, rand: () => number): Edge[] {
  const edges: Edge[] = [];
  const edgeSet = new Set<string>();

  const addEdge = (from: string, to: string, weight: number): void => {
    const key = from < to ? `${from}-${to}` : `${to}-${from}`;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    edges.push({ from, to, weight });
  };

  // Shuffle node indices to create a random spanning tree via random insertion order
  const indices = Array.from({ length: nodeCount }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // Connect each new node to a random already-connected node (Prim-like)
  const connected = [indices[0]];
  for (let i = 1; i < indices.length; i++) {
    const newNode = indices[i];
    const existingNode = connected[Math.floor(rand() * connected.length)];
    const weight = Math.floor(rand() * 10) + 1;
    const fromId = `node_${existingNode}`;
    const toId = `node_${newNode}`;
    addEdge(fromId, toId, weight);
    connected.push(newNode);
  }

  // Add extra random edges for density (roughly 40% more edges than minimum)
  const extraEdges = Math.floor(nodeCount * 0.4);
  for (let attempt = 0; attempt < extraEdges * 3; attempt++) {
    if (edges.length - (nodeCount - 1) >= extraEdges) break;
    const a = Math.floor(rand() * nodeCount);
    const b = Math.floor(rand() * nodeCount);
    if (a === b) continue;
    const weight = Math.floor(rand() * 10) + 1;
    addEdge(`node_${a}`, `node_${b}`, weight);
  }

  return edges;
}

export function generateGraph(difficulty: Difficulty, seed: number): Graph {
  const rand = mulberry32(seed);
  const { min, max } = getNodeCountRange(difficulty);
  const nodeCount = min + Math.floor(rand() * (max - min + 1));

  // Shuffle names so every graph uses a different subset
  const shuffledNames = [...INTERSECTION_NAMES];
  for (let i = shuffledNames.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffledNames[i], shuffledNames[j]] = [shuffledNames[j], shuffledNames[i]];
  }

  // Grid-based layout: divide canvas into cells, place one node per cell with jitter.
  // Prevents clustering and ensures even spatial distribution.
  const PADDING = 70;
  const CANVAS_W = 800;
  const CANVAS_H = 580;
  const usableW = CANVAS_W - 2 * PADDING;
  const usableH = CANVAS_H - 2 * PADDING;

  const cols = Math.ceil(Math.sqrt(nodeCount * 1.4));
  const rows = Math.ceil(nodeCount / cols);

  // Build all cell centres, shuffle, pick nodeCount of them
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

  const jitterX = (usableW / cols) * 0.28;
  const jitterY = (usableH / rows) * 0.28;

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

  const edges = buildConnectedGraph(nodeCount, rand);

  // Pick start and end nodes that are different
  const startIndex = Math.floor(rand() * nodeCount);
  let endIndex = Math.floor(rand() * (nodeCount - 1));
  if (endIndex >= startIndex) endIndex += 1;

  return {
    nodes,
    edges,
    seed,
    start: `node_${startIndex}`,
    end: `node_${endIndex}`,
  };
}
