import { Graph, DijkstraSnapshot, LeaderboardEntry } from '../store/gameStore';

export const mockGraph: Graph = {
  seed: 42,
  start: 'node_0',
  end: 'node_9',
  nodes: [
    { id: 'node_0', name: 'Náměstí',     x: 100, y: 300 },
    { id: 'node_1', name: 'Radnice',     x: 220, y: 160 },
    { id: 'node_2', name: 'Nádraží',     x: 220, y: 440 },
    { id: 'node_3', name: 'Muzeum',      x: 360, y: 100 },
    { id: 'node_4', name: 'Tržiště',     x: 360, y: 280 },
    { id: 'node_5', name: 'Nemocnice',   x: 360, y: 460 },
    { id: 'node_6', name: 'Univerzita',  x: 500, y: 160 },
    { id: 'node_7', name: 'Park',        x: 500, y: 360 },
    { id: 'node_8', name: 'Letiště',     x: 630, y: 240 },
    { id: 'node_9', name: 'Stadion',     x: 700, y: 420 },
  ],
  edges: [
    { from: 'node_0', to: 'node_1', weight: 4 },
    { from: 'node_0', to: 'node_2', weight: 3 },
    { from: 'node_1', to: 'node_3', weight: 2 },
    { from: 'node_1', to: 'node_4', weight: 5 },
    { from: 'node_2', to: 'node_4', weight: 6 },
    { from: 'node_2', to: 'node_5', weight: 4 },
    { from: 'node_3', to: 'node_6', weight: 3 },
    { from: 'node_3', to: 'node_4', weight: 7 },
    { from: 'node_4', to: 'node_6', weight: 4 },
    { from: 'node_4', to: 'node_7', weight: 3 },
    { from: 'node_5', to: 'node_7', weight: 5 },
    { from: 'node_6', to: 'node_8', weight: 2 },
    { from: 'node_7', to: 'node_8', weight: 4 },
    { from: 'node_7', to: 'node_9', weight: 5 },
    { from: 'node_8', to: 'node_9', weight: 3 },
  ],
};

// Dijkstra run from node_0 to node_9
// Optimal path: node_0 → node_1 → node_3 → node_6 → node_8 → node_9  (4+2+3+2+3 = 14)
const INF = Infinity;

export const mockDijkstraSnapshots: DijkstraSnapshot[] = [
  // Step 0: Init — all INF except start = 0
  {
    distances: { 'node_0': 0, 'node_1': INF, 'node_2': INF, 'node_3': INF, 'node_4': INF, 'node_5': INF, 'node_6': INF, 'node_7': INF, 'node_8': INF, 'node_9': INF },
    visited: new Set([]),
    current: 'node_0',
  },
  // Step 1: Process node_0 → update neighbors node_1(4), node_2(3)
  {
    distances: { 'node_0': 0, 'node_1': 4, 'node_2': 3, 'node_3': INF, 'node_4': INF, 'node_5': INF, 'node_6': INF, 'node_7': INF, 'node_8': INF, 'node_9': INF },
    visited: new Set(['node_0']),
    current: 'node_2',
  },
  // Step 2: Process node_2 (dist=3) → update node_4(9), node_5(7)
  {
    distances: { 'node_0': 0, 'node_1': 4, 'node_2': 3, 'node_3': INF, 'node_4': 9, 'node_5': 7, 'node_6': INF, 'node_7': INF, 'node_8': INF, 'node_9': INF },
    visited: new Set(['node_0', 'node_2']),
    current: 'node_1',
  },
  // Step 3: Process node_1 (dist=4) → update node_3(6), node_4(9→same)
  {
    distances: { 'node_0': 0, 'node_1': 4, 'node_2': 3, 'node_3': 6, 'node_4': 9, 'node_5': 7, 'node_6': INF, 'node_7': INF, 'node_8': INF, 'node_9': INF },
    visited: new Set(['node_0', 'node_2', 'node_1']),
    current: 'node_3',
  },
  // Step 4: Process node_3 (dist=6) → update node_6(9)
  {
    distances: { 'node_0': 0, 'node_1': 4, 'node_2': 3, 'node_3': 6, 'node_4': 9, 'node_5': 7, 'node_6': 9, 'node_7': INF, 'node_8': INF, 'node_9': INF },
    visited: new Set(['node_0', 'node_2', 'node_1', 'node_3']),
    current: 'node_5',
  },
  // Step 5: Process node_5 (dist=7) → update node_7(12)
  {
    distances: { 'node_0': 0, 'node_1': 4, 'node_2': 3, 'node_3': 6, 'node_4': 9, 'node_5': 7, 'node_6': 9, 'node_7': 12, 'node_8': INF, 'node_9': INF },
    visited: new Set(['node_0', 'node_2', 'node_1', 'node_3', 'node_5']),
    current: 'node_6',
  },
  // Step 6: Process node_6 (dist=9) → update node_8(11)
  {
    distances: { 'node_0': 0, 'node_1': 4, 'node_2': 3, 'node_3': 6, 'node_4': 9, 'node_5': 7, 'node_6': 9, 'node_7': 12, 'node_8': 11, 'node_9': INF },
    visited: new Set(['node_0', 'node_2', 'node_1', 'node_3', 'node_5', 'node_6']),
    current: 'node_4',
  },
  // Step 7: Process node_4 (dist=9) → update node_7(12→same)
  {
    distances: { 'node_0': 0, 'node_1': 4, 'node_2': 3, 'node_3': 6, 'node_4': 9, 'node_5': 7, 'node_6': 9, 'node_7': 12, 'node_8': 11, 'node_9': INF },
    visited: new Set(['node_0', 'node_2', 'node_1', 'node_3', 'node_5', 'node_6', 'node_4']),
    current: 'node_8',
  },
  // Step 8: Process node_8 (dist=11) → update node_9(14)
  {
    distances: { 'node_0': 0, 'node_1': 4, 'node_2': 3, 'node_3': 6, 'node_4': 9, 'node_5': 7, 'node_6': 9, 'node_7': 12, 'node_8': 11, 'node_9': 14 },
    visited: new Set(['node_0', 'node_2', 'node_1', 'node_3', 'node_5', 'node_6', 'node_4', 'node_8']),
    current: 'node_7',
  },
  // Step 9: Process node_7 (dist=12) → node_9 stays 14
  {
    distances: { 'node_0': 0, 'node_1': 4, 'node_2': 3, 'node_3': 6, 'node_4': 9, 'node_5': 7, 'node_6': 9, 'node_7': 12, 'node_8': 11, 'node_9': 14 },
    visited: new Set(['node_0', 'node_2', 'node_1', 'node_3', 'node_5', 'node_6', 'node_4', 'node_8', 'node_7']),
    current: 'node_9',
  },
  // Step 10: Reached destination — done
  {
    distances: { 'node_0': 0, 'node_1': 4, 'node_2': 3, 'node_3': 6, 'node_4': 9, 'node_5': 7, 'node_6': 9, 'node_7': 12, 'node_8': 11, 'node_9': 14 },
    visited: new Set(['node_0', 'node_2', 'node_1', 'node_3', 'node_5', 'node_6', 'node_4', 'node_8', 'node_7', 'node_9']),
    current: null,
  },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  { player_name: 'Honza',   player_distance: 14, dijkstra_distance: 14, score_diff: 0 },
  { player_name: 'Tereza',  player_distance: 15, dijkstra_distance: 14, score_diff: 1 },
  { player_name: 'Lucie',   player_distance: 16, dijkstra_distance: 14, score_diff: 2 },
  { player_name: 'Marek',   player_distance: 17, dijkstra_distance: 14, score_diff: 3 },
  { player_name: 'Anna',    player_distance: 18, dijkstra_distance: 14, score_diff: 4 },
  { player_name: 'Pavel',   player_distance: 20, dijkstra_distance: 14, score_diff: 6 },
  { player_name: 'Jakub',   player_distance: 22, dijkstra_distance: 14, score_diff: 8 },
  { player_name: 'Klára',   player_distance: 24, dijkstra_distance: 14, score_diff: 10 },
  { player_name: 'Pepa',    player_distance: 26, dijkstra_distance: 14, score_diff: 12 },
  { player_name: 'Radek',   player_distance: 30, dijkstra_distance: 14, score_diff: 16 },
];
