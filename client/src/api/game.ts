import { Graph, LeaderboardEntry } from '../store/gameStore';
import { apiCall } from './client';

export interface SubmitResultPayload {
  player_name: string;
  player_path: string[];
  graph_seed: number;
  difficulty: string;
}

export interface SubmitResultResponse {
  dijkstra_distance: number;
  player_distance: number;
  is_valid: boolean;
  rank: number | null;
}

export async function fetchGraph(difficulty: string, seed?: number): Promise<Graph> {
  return apiCall<Graph>('/api/graph', {
    method: 'POST',
    body: JSON.stringify({ difficulty, seed }),
  });
}

export async function submitResult(payload: SubmitResultPayload): Promise<SubmitResultResponse> {
  return apiCall<SubmitResultResponse>('/api/result', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchLeaderboard(difficulty: string): Promise<LeaderboardEntry[]> {
  return apiCall<LeaderboardEntry[]>(`/api/leaderboard?difficulty=${encodeURIComponent(difficulty)}`);
}
