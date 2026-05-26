import React, { useEffect } from 'react';
import './App.css';
import { GameBoard } from './components/GameBoard';
import { DijkstraPanel } from './components/DijkstraPanel';
import { GameControls } from './components/GameControls';
import { ResultScreen } from './components/ResultScreen';
import { TutorialScreen } from './components/TutorialScreen';
import { useGameStore } from './store/gameStore';

function App() {
  const { phase, playerPath, graph, runDijkstra, tutorialOpen } = useGameStore();

  useEffect(() => {
    if (
      phase === 'playing' &&
      graph &&
      playerPath.length > 0 &&
      playerPath[playerPath.length - 1] === graph.end
    ) {
      runDijkstra([], [], 0);
    }
  }, [playerPath, phase, graph, runDijkstra]);

  return (
    <div className="app-container">
      {tutorialOpen && <TutorialScreen />}

      <header className="app-header">
        <h1 className="app-title">Poraz Dijkstru</h1>
        <div className="phase-indicator">
          {phase === 'idle' && <span className="phase-badge phase-idle">Lobby</span>}
          {phase === 'playing' && <span className="phase-badge phase-playing">Hraješ</span>}
          {phase === 'dijkstra_running' && <span className="phase-badge phase-running">Dijkstra běží</span>}
          {phase === 'result' && <span className="phase-badge phase-result">Výsledek</span>}
        </div>
      </header>

      <main className="app-main">
        <aside className="app-sidebar-left">
          <GameControls />
        </aside>

        <section className="app-center">
          <GameBoard />
          {phase === 'result' && <ResultScreen />}
        </section>

        <aside className="app-sidebar-right">
          <DijkstraPanel />
        </aside>
      </main>
    </div>
  );
}

export default App;
