import React, { useEffect, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';

export const DijkstraPanel: React.FC = () => {
  const { phase, dijkstraSnapshots, currentSnapshotIndex, nextDijkstraStep, graph } = useGameStore();

  const nodeNames = useMemo<Record<string, string>>(() => {
    if (!graph) return {};
    return Object.fromEntries(graph.nodes.map((n) => [n.id, n.name]));
  }, [graph]);

  const startName = graph ? nodeNames[graph.start] || graph.start : '';
  const endName = graph ? nodeNames[graph.end] || graph.end : '';

  useEffect(() => {
    if (phase !== 'dijkstra_running') return;

    const interval = setInterval(() => {
      nextDijkstraStep();
    }, 400);

    return () => clearInterval(interval);
  }, [phase, nextDijkstraStep]);

  if (phase !== 'dijkstra_running' && phase !== 'result') {
    return (
      <div className="dijkstra-panel">
        <h3 className="panel-title">Dijkstrův algoritmus</h3>
        <div className="panel-placeholder">
          <p>Dijkstrův algoritmus se spustí automaticky po dokončení vaší cesty.</p>
          {graph && (
            <p className="hint-text">Klikejte na uzly na mapě a najděte nejkratší cestu od <strong>{startName}</strong> do <strong>{endName}</strong>.</p>
          )}
        </div>
      </div>
    );
  }

  const snapshot = dijkstraSnapshots[currentSnapshotIndex];
  if (!snapshot) return null;

  const nodes = graph ? graph.nodes : Object.keys(snapshot.distances).map((id) => ({ id }));
  const totalSteps = dijkstraSnapshots.length;
  const progress = Math.round(((currentSnapshotIndex + 1) / totalSteps) * 100);

  return (
    <div className="dijkstra-panel">
      <h3 className="panel-title">Dijkstrův algoritmus</h3>

      {phase === 'dijkstra_running' && (
        <div className="progress-bar-wrapper">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
          <span className="progress-label">Krok {currentSnapshotIndex + 1} / {totalSteps}</span>
        </div>
      )}

      {snapshot.current && (
        <div className="current-node-badge">
          Zpracovávám: <strong>{nodeNames[snapshot.current] || snapshot.current}</strong>
        </div>
      )}

      <table className="dijkstra-table">
        <thead>
          <tr>
            <th>Uzel</th>
            <th>Vzdálenost</th>
            <th>Stav</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(snapshot.distances).map(([nodeId, dist]) => {
            const isCurrent = snapshot.current === nodeId;
            const isVisited = snapshot.visited.has(nodeId);
            const name = nodeNames[nodeId] || nodeId;

            let statusText = 'nenavštívený';
            let rowClass = 'row-unvisited';
            if (isCurrent) {
              statusText = 'aktuální';
              rowClass = 'row-current';
            } else if (isVisited) {
              statusText = 'uzavřený';
              rowClass = 'row-visited';
            }

            return (
              <tr key={nodeId} className={rowClass}>
                <td>{name}</td>
                <td className="dist-cell">
                  {dist === Infinity ? '∞' : dist}
                </td>
                <td>
                  {isCurrent ? (
                    <span className="status-current">{statusText}</span>
                  ) : isVisited ? (
                    <span className="status-visited">{statusText}</span>
                  ) : (
                    <span className="status-unvisited">{statusText}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {phase === 'result' && (
        <div className="dijkstra-done">
          Algoritmus dokončen!
        </div>
      )}
    </div>
  );
};
