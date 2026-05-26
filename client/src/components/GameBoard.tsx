import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Node, Edge } from '../store/gameStore';

function getPathEdges(path: string[]): Array<{ a: string; b: string }> {
  const result: Array<{ a: string; b: string }> = [];
  for (let i = 0; i < path.length - 1; i++) {
    result.push({ a: path[i], b: path[i + 1] });
  }
  return result;
}

function isEdgeInPath(
  edge: Edge,
  pathEdges: Array<{ a: string; b: string }>
): boolean {
  return pathEdges.some(
    (pe) =>
      (pe.a === edge.from && pe.b === edge.to) ||
      (pe.a === edge.to && pe.b === edge.from)
  );
}

export const GameBoard: React.FC = () => {
  const { graph, phase, playerPath, dijkstraPath, selectNode } = useGameStore();

  if (!graph) {
    return (
      <div className="gameboard-placeholder">
        <p>Zadejte jméno a stiskněte Start pro zahájení hry.</p>
      </div>
    );
  }

  const playerEdges = getPathEdges(playerPath);
  const dijkstraEdges = phase === 'result' ? getPathEdges(dijkstraPath) : [];

  const nodeMap: Record<string, Node> = {};
  graph.nodes.forEach((n) => (nodeMap[n.id] = n));

  const handleNodeClick = (nodeId: string) => {
    if (phase !== 'playing') return;
    selectNode(nodeId);
  };

  return (
    <svg
      width={800}
      height={600}
      className="gameboard-svg"
      style={{ background: '#080e1a' }}
    >
      {/* Edges */}
      {graph.edges.map((edge, i) => {
        const from = nodeMap[edge.from];
        const to = nodeMap[edge.to];
        if (!from || !to) return null;

        const isPlayerEdge = isEdgeInPath(edge, playerEdges);
        const isDijkstraEdge = phase === 'result' && isEdgeInPath(edge, dijkstraEdges);

        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;

        let strokeColor = '#1e3a5f';
        let strokeWidth = 2;
        if (isDijkstraEdge) { strokeColor = '#a855f7'; strokeWidth = 4; }
        else if (isPlayerEdge) { strokeColor = '#3b82f6'; strokeWidth = 4; }

        return (
          <g key={`edge-${i}`}>
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className={isPlayerEdge && !isDijkstraEdge ? 'edge-player-path' : undefined}
            />
            <circle cx={midX} cy={midY} r={12} fill="#0d1f2d" stroke="#1e3a5f" strokeWidth={1} />
            <text
              x={midX}
              y={midY}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={11}
              fill="#7dd3fc"
              fontWeight="700"
              fontFamily="Inter, sans-serif"
            >
              {edge.weight}
            </text>
          </g>
        );
      })}

      {/* Nodes */}
      {graph.nodes.map((node) => {
        const isStart = node.id === graph.start;
        const isEnd = node.id === graph.end;
        const isInPlayerPath = playerPath.includes(node.id);
        const isPlayable = phase === 'playing';

        let fill = '#0d1f2d';
        let stroke = '#1e3a5f';
        let strokeWidth = 1.5;
        let labelColor = '#64748b';

        if (isStart) {
          fill = '#064e3b';
          stroke = '#22c55e';
          strokeWidth = 2;
          labelColor = '#22c55e';
        } else if (isEnd) {
          fill = '#450a0a';
          stroke = '#ef4444';
          strokeWidth = 2;
          labelColor = '#ef4444';
        } else if (isInPlayerPath) {
          fill = '#1e3a8a';
          stroke = '#60a5fa';
          strokeWidth = 2;
          labelColor = '#93c5fd';
        }

        return (
          <g
            key={node.id}
            onClick={() => handleNodeClick(node.id)}
            className={isPlayable ? 'node-playable' : undefined}
            style={{ cursor: isPlayable ? 'pointer' : 'default' }}
          >
            {isPlayable && (
              <circle
                cx={node.x}
                cy={node.y}
                r={30}
                className="node-hover-ring"
              />
            )}
            <circle
              cx={node.x}
              cy={node.y}
              r={22}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={11}
              fontWeight="bold"
              fill={labelColor}
              fontFamily="Inter, sans-serif"
            >
              {node.name.slice(0, 3)}
            </text>
            <text
              x={node.x}
              y={node.y + 36}
              textAnchor="middle"
              fontSize={11}
              fontWeight="500"
              fill="#94a3b8"
              fontFamily="Inter, sans-serif"
            >
              {node.name}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <g transform="translate(20, 564)">
        <circle cx={6} cy={0} r={5} fill="#064e3b" stroke="#22c55e" strokeWidth={1.5} />
        <text x={16} y={0} dominantBaseline="central" fontSize={10} fill="#475569" fontFamily="Inter, sans-serif">Start</text>
        <circle cx={62} cy={0} r={5} fill="#450a0a" stroke="#ef4444" strokeWidth={1.5} />
        <text x={72} y={0} dominantBaseline="central" fontSize={10} fill="#475569" fontFamily="Inter, sans-serif">Cíl</text>
        <line x1={114} y1={0} x2={130} y2={0} stroke="#3b82f6" strokeWidth={3} />
        <text x={136} y={0} dominantBaseline="central" fontSize={10} fill="#475569" fontFamily="Inter, sans-serif">Vaše cesta</text>
        {phase === 'result' && (
          <>
            <line x1={218} y1={0} x2={234} y2={0} stroke="#a855f7" strokeWidth={3} />
            <text x={240} y={0} dominantBaseline="central" fontSize={10} fill="#475569" fontFamily="Inter, sans-serif">Dijkstra</text>
          </>
        )}
      </g>
    </svg>
  );
};
