import React from 'react';
import { useGameStore } from '../store/gameStore';

export const GameControls: React.FC = () => {
  const {
    phase,
    playerName,
    difficulty,
    leaderboard,
    playerDistance,
    isLoading,
    setPlayerName,
    setDifficulty,
    initGame,
    openTutorial,
    playerPath,
    graph,
  } = useGameStore();

  if (phase === 'idle') {
    return (
      <div className="game-controls">
        <h2 className="controls-title">Poraz Dijkstru</h2>
        <p className="controls-subtitle">
          Najdi nejkratší cestu na mapě a porovnej se s algoritmem!
        </p>

        <div className="form-group">
          <label className="form-label" htmlFor="player-name">
            Jméno hráče
          </label>
          <input
            id="player-name"
            type="text"
            className="form-input"
            placeholder="Zadejte jméno..."
            maxLength={50}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="difficulty">
            Obtížnost
          </label>
          <select
            id="difficulty"
            className="form-select"
            value={difficulty}
            onChange={(e) =>
              setDifficulty(e.target.value as 'beginner' | 'intermediate' | 'genius')
            }
          >
            <option value="beginner">Začátečník</option>
            <option value="intermediate">Pokročilý</option>
            <option value="genius">Génius</option>
          </select>
        </div>

        <div className="button-group">
          <button
            className="btn btn-primary btn-full"
            onClick={() => initGame()}
            disabled={isLoading}
          >
            {isLoading ? 'Načítám...' : 'Start'}
          </button>
          <button
            className="btn btn-secondary btn-full"
            onClick={openTutorial}
          >
            Jak hrát?
          </button>
        </div>

        <div className="rules-box">
          <h4>Rychlý přehled</h4>
          <ol>
            <li>Klikej na uzly (křižovatky) na mapě</li>
            <li>Vybírat lze pouze sousední uzly</li>
            <li>Dojdi od zeleného uzlu k červenému</li>
            <li>Dijkstrův algoritmus ukáže optimální cestu</li>
          </ol>
        </div>
      </div>
    );
  }

  if (phase === 'playing') {
    const lastNode = playerPath[playerPath.length - 1];
    const currentNodeName = graph?.nodes.find((n) => n.id === lastNode)?.name || lastNode;

    return (
      <div className="game-controls">
        <h2 className="controls-title">Hledej cestu</h2>
        <div className="playing-info">
          <div className="info-row">
            <span className="info-label">Aktuální uzel:</span>
            <span className="info-value highlight">{currentNodeName}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Kroků:</span>
            <span className="info-value">{playerPath.length}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Cíl:</span>
            <span className="info-value end-node">
              {graph?.nodes.find((n) => n.id === graph.end)?.name}
            </span>
          </div>
        </div>

        <div className="path-display">
          <div className="path-label">Vaše cesta:</div>
          <div className="path-nodes">
            {playerPath.map((nodeId, i) => {
              const name = graph?.nodes.find((n) => n.id === nodeId)?.name || nodeId;
              return (
                <span key={nodeId}>
                  <span className="path-node">{name}</span>
                  {i < playerPath.length - 1 && <span className="path-arrow"> → </span>}
                </span>
              );
            })}
          </div>
        </div>

        <p className="playing-hint">
          Klikej na sousední uzly na mapě pro pohyb.
        </p>
      </div>
    );
  }

  if (phase === 'dijkstra_running') {
    return (
      <div className="game-controls">
        <h2 className="controls-title">Dijkstra běží...</h2>
        <div className="running-animation">
          <div className="spinner" />
          <p>Algoritmus hledá nejkratší cestu</p>
        </div>
        <div className="player-result-preview">
          <div className="info-row">
            <span className="info-label">Vaše vzdálenost:</span>
            <span className="info-value">{playerDistance} km</span>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="game-controls">
        <h2 className="controls-title">Žebříček</h2>
        {leaderboard.length > 0 ? (
          <div className="leaderboard">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Hráč</th>
                  <th>Cesta</th>
                  <th>Opt.</th>
                  <th>+/-</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.slice(0, 10).map((entry, i) => (
                  <tr
                    key={i}
                    className={
                      entry.player_name === playerName ? 'leaderboard-me' : ''
                    }
                  >
                    <td>{i + 1}</td>
                    <td>{entry.player_name}</td>
                    <td>{entry.player_distance}</td>
                    <td>{entry.dijkstra_distance}</td>
                    <td className={entry.score_diff === 0 ? 'score-diff-optimal' : 'score-diff-suboptimal'}>
                      +{entry.score_diff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="leaderboard-empty">
            Buď první na žebříčku!<br />Zatím žádné záznamy.
          </p>
        )}
      </div>
    );
  }

  return null;
};
