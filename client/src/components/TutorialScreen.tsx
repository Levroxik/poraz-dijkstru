import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';

const TOTAL_STEPS = 3;

const RelaxationMiniGraph: React.FC = () => (
  <div className="mini-graph-wrapper">
    <svg width="320" height="160" className="mini-graph-svg">
      {/* Edges */}
      <line x1="70" y1="80" x2="160" y2="35" stroke="#2d6a9f" strokeWidth="2" />
      <line x1="70" y1="80" x2="160" y2="125" stroke="#2d6a9f" strokeWidth="2" />
      <line x1="160" y1="35" x2="250" y2="80" stroke="#2d6a9f" strokeWidth="2" />
      <line x1="160" y1="125" x2="250" y2="80" stroke="#2d6a9f" strokeWidth="2" />

      {/* Edge weight backgrounds */}
      <circle cx="115" cy="52" r="11" fill="#0a1628" />
      <text x="115" y="52" textAnchor="middle" dominantBaseline="central" fontSize="10" fill="#94a3b8" fontWeight="600">3</text>

      <circle cx="115" cy="108" r="11" fill="#0a1628" />
      <text x="115" y="108" textAnchor="middle" dominantBaseline="central" fontSize="10" fill="#94a3b8" fontWeight="600">8</text>

      <circle cx="205" cy="52" r="11" fill="#0a1628" />
      <text x="205" y="52" textAnchor="middle" dominantBaseline="central" fontSize="10" fill="#94a3b8" fontWeight="600">4</text>

      <circle cx="205" cy="108" r="11" fill="#0a1628" />
      <text x="205" y="108" textAnchor="middle" dominantBaseline="central" fontSize="10" fill="#94a3b8" fontWeight="600">2</text>

      {/* Node A (start) */}
      <circle cx="70" cy="80" r="20" fill="#064e3b" stroke="#22c55e" strokeWidth="2" />
      <text x="70" y="72" textAnchor="middle" fontSize="10" fontWeight="700" fill="#22c55e">A</text>
      <text x="70" y="84" textAnchor="middle" fontSize="9" fill="#22c55e">0</text>

      {/* Node B */}
      <circle cx="160" cy="35" r="20" fill="#1a3050" stroke="#60a5fa" strokeWidth="2" />
      <text x="160" y="27" textAnchor="middle" fontSize="10" fontWeight="700" fill="#e2e8f0">B</text>
      <text x="160" y="39" textAnchor="middle" fontSize="9" fill="#60a5fa" fontWeight="700">3</text>
      {/* Struck-through ∞ */}
      <text x="145" y="27" textAnchor="middle" fontSize="8" fill="#475569" style={{ textDecoration: 'line-through' }}>∞</text>

      {/* Node C */}
      <circle cx="160" cy="125" r="20" fill="#1a3050" stroke="#94a3b8" strokeWidth="2" />
      <text x="160" y="117" textAnchor="middle" fontSize="10" fontWeight="700" fill="#e2e8f0">C</text>
      <text x="160" y="129" textAnchor="middle" fontSize="9" fill="#94a3b8">∞</text>

      {/* Node D (end) */}
      <circle cx="250" cy="80" r="20" fill="#450a0a" stroke="#ef4444" strokeWidth="2" />
      <text x="250" y="72" textAnchor="middle" fontSize="10" fontWeight="700" fill="#ef4444">D</text>
      <text x="250" y="84" textAnchor="middle" fontSize="9" fill="#94a3b8">∞</text>

      {/* Arrow showing A→B was explored */}
      <path d="M 78 60 L 150 40" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrow)" />
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M 0 0 L 6 3 L 0 6 Z" fill="#22c55e" />
        </marker>
      </defs>
    </svg>
    <p className="mini-graph-caption">
      Algoritmus prozkoumá A (vzdálenost 0), pak <strong>relaxuje</strong> sousedy:<br />
      B: ∞ → <span className="highlight-green">3</span> &nbsp;|&nbsp; C: zatím ∞ (přijde na řadu později)
    </p>
  </div>
);

const steps = [
  {
    title: 'Co je Dijkstrův algoritmus?',
    content: (
      <div className="tutorial-step-content">
        <p>
          Dijkstrův algoritmus je způsob, jak počítač <strong>hledá nejkratší cestu</strong> v síti bodů (uzlů) propojených cestami s různými délkami.
        </p>
        <p>
          Funguje systematicky — začne v počátečním uzlu a postupně prozkoumává okolí.
          Vždy si vybere uzel, ke kterému <strong>zná nejkratší dosud nalezenou vzdálenost</strong>,
          a z něj zkusí zkrátit cestu k sousedům.
        </p>
        <div className="tutorial-concept-box">
          <div className="concept-item">
            <span className="concept-icon">🔍</span>
            <span>Prozkoumává uzly od nejbližšího k nejdálnějšímu</span>
          </div>
          <div className="concept-item">
            <span className="concept-icon">✅</span>
            <span>Uzly označené jako "navštívené" už se nemění</span>
          </div>
          <div className="concept-item">
            <span className="concept-icon">🎯</span>
            <span>Garantuje nalezení skutečně nejkratší cesty</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Jak funguje relaxace?',
    content: (
      <div className="tutorial-step-content">
        <p>
          <strong>Relaxace</strong> je klíčový krok: když algoritmus zkouší jít přes uzel, podívá se
          jestli by cesta přes něj byla kratší než ta, co už zná.
        </p>
        <p>
          Na začátku je vzdálenost do všech uzlů nastavena na <strong>∞ (nekonečno)</strong>.
          Algoritmus pak tato čísla postupně aktualizuje na reálné hodnoty.
        </p>
        <RelaxationMiniGraph />
        <p className="tutorial-note">
          Prozkoumáme A (dist=0) → B dostane 0+3=<strong>3</strong>, C dostane 0+8=8.
          Poté prozkoumáme B (dist=3) → D dostane 3+4=7.
          Nakonec C (dist=8) → D by bylo 8+2=10, ale 10 {'>'} 7, takže se D <em>neaktualizuje</em>.
        </p>
      </div>
    ),
  },
  {
    title: 'Pravidla duelu',
    content: (
      <div className="tutorial-step-content">
        <p>
          Závodíš přímo s Dijkstrovým algoritmem na stejné mapě města.
          Tvůj cíl je najít cestu od <span className="color-green">startu</span> do{' '}
          <span className="color-red">cíle</span> s co nejnižší celkovou vzdáleností.
        </p>
        <div className="tutorial-rules">
          <div className="rule-item">
            <span className="rule-num">1</span>
            <span>Klikej na uzly (křižovatky) — přesouvat se lze pouze po sousedních hranách</span>
          </div>
          <div className="rule-item">
            <span className="rule-num">2</span>
            <span>Čísla na hranách jsou vzdálenosti (váhy) — čím menší, tím lépe</span>
          </div>
          <div className="rule-item">
            <span className="rule-num">3</span>
            <span>Jakmile dosáhneš <span className="color-red">cíle</span>, Dijkstra ukáže svoji optimální cestu</span>
          </div>
          <div className="rule-item">
            <span className="rule-num">4</span>
            <span>Skóre 100% = nalezl jsi nejkratší cestu, stejnou jako algoritmus</span>
          </div>
        </div>
        <div className="tutorial-legend">
          <div className="legend-row">
            <svg width="16" height="16"><circle cx="8" cy="8" r="7" fill="#064e3b" stroke="#22c55e" strokeWidth="1.5"/></svg>
            <span>Startovní uzel</span>
          </div>
          <div className="legend-row">
            <svg width="16" height="16"><circle cx="8" cy="8" r="7" fill="#450a0a" stroke="#ef4444" strokeWidth="1.5"/></svg>
            <span>Cílový uzel</span>
          </div>
          <div className="legend-row">
            <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#3b82f6" strokeWidth="3"/></svg>
            <span>Tvoje cesta</span>
          </div>
          <div className="legend-row">
            <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#a855f7" strokeWidth="3"/></svg>
            <span>Dijkstrova cesta</span>
          </div>
        </div>
      </div>
    ),
  },
];

export const TutorialScreen: React.FC = () => {
  const [step, setStep] = useState(0);
  const { closeTutorial } = useGameStore();

  const isLast = step === TOTAL_STEPS - 1;

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-card">
        <div className="tutorial-progress">
          {steps.map((_, i) => (
            <button
              key={i}
              className={`tutorial-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}
              onClick={() => setStep(i)}
              aria-label={`Krok ${i + 1}`}
            />
          ))}
        </div>

        <div className="tutorial-step-label">Krok {step + 1} / {TOTAL_STEPS}</div>
        <h2 className="tutorial-title">{steps[step].title}</h2>

        <div className="tutorial-body">{steps[step].content}</div>

        <div className="tutorial-nav">
          {step > 0 ? (
            <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)}>
              ← Zpět
            </button>
          ) : (
            <div />
          )}
          {isLast ? (
            <button className="btn btn-primary btn-cta" onClick={closeTutorial}>
              Jdeme na to! →
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>
              Další →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
