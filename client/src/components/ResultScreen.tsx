import React from 'react';
import { useGameStore } from '../store/gameStore';

function getScoreClass(score: number): string {
  if (score >= 100) return 'score-perfect';
  if (score >= 85) return 'score-good';
  if (score >= 65) return 'score-okay';
  return 'score-poor';
}

function getScoreHint(score: number): string {
  if (score >= 100) return 'Perfektní! Našel jsi nejkratší cestu.';
  if (score >= 85) return 'Výborně! Byl jsi velmi blízko optimu.';
  if (score >= 65) return 'Dobrá práce! Zkus to znovu pro lepší výsledek.';
  return 'Neboj, příště to půjde lépe!';
}

export const ResultScreen: React.FC = () => {
  const {
    phase,
    playerDistance,
    dijkstraDistance,
    playerPath,
    dijkstraPath,
    leaderboard,
    rank,
    playerName,
    resetGame,
  } = useGameStore();

  if (phase !== 'result') return null;

  const score =
    playerDistance > 0
      ? Math.round((dijkstraDistance / playerDistance) * 100)
      : 0;

  const isOptimal = playerDistance === dijkstraDistance;

  const handleShare = () => {
    const text =
      `Poraz Dijkstru!\n` +
      `Hráč: ${playerName || 'Anonymní'}\n` +
      `Moje cesta: ${playerPath.join(' → ')} (${playerDistance} km)\n` +
      `Dijkstra: ${dijkstraPath.join(' → ')} (${dijkstraDistance} km)\n` +
      `Skóre: ${score}%\n` +
      (rank !== null ? `Pořadí: #${rank}` : '');

    navigator.clipboard
      .writeText(text)
      .then(() => alert('Výsledek zkopírován do schránky!'))
      .catch(() => alert('Kopírování selhalo.'));
  };

  return (
    <div className="result-screen">
      <h2 className="result-title">
        {isOptimal ? 'Porazil jsi Dijkstru! 🏆' : 'Výsledek hry'}
      </h2>

      {isOptimal && (
        <div className="optimal-banner">
          Nalezl jsi nejkratší cestu — stejnou jako Dijkstrův algoritmus!
        </div>
      )}

      <div className="result-comparison">
        <div className="result-card player-card">
          <div className="result-card-label">Vaše cesta</div>
          <div className="result-card-distance">{playerDistance}</div>
          <div className="result-card-unit">km</div>
          <div className="result-card-path">{playerPath.join(' → ')}</div>
        </div>

        <div className="result-vs">VS</div>

        <div className="result-card dijkstra-card">
          <div className="result-card-label">Dijkstra (optimum)</div>
          <div className="result-card-distance">{dijkstraDistance}</div>
          <div className="result-card-unit">km</div>
          <div className="result-card-path">{dijkstraPath.join(' → ')}</div>
        </div>
      </div>

      <div className="score-section">
        <div className="score-label">Vaše skóre</div>
        <div className={`score-value ${getScoreClass(score)}`}>
          {score}%
        </div>
        <div className="score-hint">{getScoreHint(score)}</div>
      </div>

      {rank !== null && (
        <div className="rank-section">
          Vaše pořadí: <strong>#{rank}</strong>
          {leaderboard.length > 0 && ` z ${leaderboard.length} hráčů`}
        </div>
      )}

      <div className="result-actions">
        <button className="btn btn-primary" onClick={resetGame}>
          Hrát znovu
        </button>
        <button className="btn btn-secondary" onClick={handleShare}>
          Sdílet výsledek
        </button>
      </div>
    </div>
  );
};
