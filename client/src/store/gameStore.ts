import { create } from 'zustand';
import { fetchGraph, fetchLeaderboard, submitResult } from '../api/game';

export type GamePhase = 'idle' | 'playing' | 'dijkstra_running' | 'result';

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

export interface DijkstraSnapshot {
  distances: Record<string, number>;
  visited: Set<string>;
  current: string | null;
}

export interface LeaderboardEntry {
  player_name: string;
  player_distance: number;
  dijkstra_distance: number;
  score_diff: number;
}

interface GameState {
  phase: GamePhase;
  graph: Graph | null;
  playerPath: string[];
  playerDistance: number;
  dijkstraPath: string[];
  dijkstraDistance: number;
  dijkstraSnapshots: DijkstraSnapshot[];
  currentSnapshotIndex: number;
  playerName: string;
  difficulty: 'beginner' | 'intermediate' | 'genius';
  leaderboard: LeaderboardEntry[];
  rank: number | null;
  isLoading: boolean;
  error: string | null;
  tutorialOpen: boolean;

  // actions
  startGame: (graph: Graph) => void;
  initGame: () => Promise<void>;
  finishGame: () => Promise<void>;
  selectNode: (nodeId: string) => void;
  runDijkstra: (snapshots: DijkstraSnapshot[], path: string[], distance: number) => void;
  nextDijkstraStep: () => void;
  setResult: (rank: number, leaderboard: LeaderboardEntry[]) => void;
  resetGame: () => void;
  setPlayerName: (name: string) => void;
  setDifficulty: (d: 'beginner' | 'intermediate' | 'genius') => void;
  openTutorial: () => void;
  closeTutorial: () => void;
}

function getEdgeWeight(graph: Graph, a: string, b: string): number {
  const edge = graph.edges.find(
    (e) => (e.from === a && e.to === b) || (e.from === b && e.to === a)
  );
  return edge ? edge.weight : Infinity;
}

function areNeighbors(graph: Graph, a: string, b: string): boolean {
  return graph.edges.some(
    (e) => (e.from === a && e.to === b) || (e.from === b && e.to === a)
  );
}

function calcPathDistance(graph: Graph, path: string[]): number {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    total += getEdgeWeight(graph, path[i], path[i + 1]);
  }
  return total;
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'idle',
  graph: null,
  playerPath: [],
  playerDistance: 0,
  dijkstraPath: [],
  dijkstraDistance: 0,
  dijkstraSnapshots: [],
  currentSnapshotIndex: 0,
  playerName: '',
  difficulty: 'beginner',
  leaderboard: [],
  rank: null,
  isLoading: false,
  error: null,
  tutorialOpen: true,

  startGame: (graph: Graph) => {
    set({
      phase: 'playing',
      graph,
      playerPath: [graph.start],
      playerDistance: 0,
      dijkstraPath: [],
      dijkstraDistance: 0,
      dijkstraSnapshots: [],
      currentSnapshotIndex: 0,
      leaderboard: [],
      rank: null,
      error: null,
    });
  },

  initGame: async () => {
    const { difficulty, startGame } = get();
    set({ isLoading: true, error: null });
    try {
      const graph = await fetchGraph(difficulty);
      startGame(graph);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nepodařilo se načíst graf';
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  finishGame: async () => {
    const { playerName, playerPath, graph, dijkstraDistance, playerDistance, difficulty } = get();
    if (!graph) return;

    try {
      const response = await submitResult({
        player_name: playerName || 'Anonymní',
        player_path: playerPath,
        graph_seed: graph.seed,
        difficulty,
      });

      const leaderboard = await fetchLeaderboard(difficulty);

      set({
        rank: response.rank,
        leaderboard,
        dijkstraDistance: response.dijkstra_distance,
        phase: 'result',
      });
    } catch (err) {
      // Fall back to local result display even if API fails
      set({
        rank: null,
        leaderboard: [],
        phase: 'result',
      });
    }
  },

  selectNode: (nodeId: string) => {
    const state = get();
    if (state.phase !== 'playing' || !state.graph) return;

    const path = state.playerPath;
    const lastNode = path[path.length - 1];

    if (lastNode === nodeId) return;

    if (path.length === 0) {
      return;
    }

    if (!areNeighbors(state.graph, lastNode, nodeId)) return;

    const newPath = [...path, nodeId];

    if (nodeId === state.graph.end) {
      const distance = calcPathDistance(state.graph, newPath);
      set({ playerPath: newPath, playerDistance: distance, phase: 'playing' });
    } else {
      set({ playerPath: newPath });
    }
  },

  runDijkstra: (snapshots: DijkstraSnapshot[], path: string[], distance: number) => {
    set({
      dijkstraSnapshots: snapshots,
      dijkstraPath: path,
      dijkstraDistance: distance,
      currentSnapshotIndex: 0,
      phase: 'dijkstra_running',
    });
  },

  nextDijkstraStep: () => {
    const state = get();
    const next = state.currentSnapshotIndex + 1;
    if (next >= state.dijkstraSnapshots.length) {
      // All Dijkstra steps shown — submit result and fetch leaderboard
      get().finishGame();
    } else {
      set({ currentSnapshotIndex: next });
    }
  },

  setResult: (rank: number, leaderboard: LeaderboardEntry[]) => {
    set({ rank, leaderboard, phase: 'result' });
  },

  resetGame: () => {
    set({
      phase: 'idle',
      graph: null,
      playerPath: [],
      playerDistance: 0,
      dijkstraPath: [],
      dijkstraDistance: 0,
      dijkstraSnapshots: [],
      currentSnapshotIndex: 0,
      leaderboard: [],
      rank: null,
      isLoading: false,
      error: null,
    });
  },

  setPlayerName: (name: string) => set({ playerName: name }),
  setDifficulty: (d) => set({ difficulty: d }),
  openTutorial: () => set({ tutorialOpen: true }),
  closeTutorial: () => set({ tutorialOpen: false }),
}));
