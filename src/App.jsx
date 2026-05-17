import { useState, useEffect } from 'react';
import GameBoard from './components/GameBoard.jsx';
import './App.css';

const PUZZLES = [
  { id: 1, file: 'puzzle1.json', label: 'Puzzle #1' },
  { id: 2, file: 'puzzle2.json', label: 'Puzzle #2' },
  { id: 3, file: 'puzzle3.json', label: 'Puzzle #3' },
];

export default function App() {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [puzzle, setPuzzle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setPuzzle(null);
    const base = import.meta.env.BASE_URL;
    fetch(`${base}puzzles/${PUZZLES[puzzleIndex].file}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setPuzzle(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [puzzleIndex]);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <span className="title-not">Not</span>Knotwords
        </h1>
        <p className="app-subtitle">
          Fill each cell so every row and column forms a valid English word.
          Use the letter groups as hints — each group&apos;s letters belong in those cells.
        </p>
      </header>

      <nav className="puzzle-nav">
        {PUZZLES.map((p, i) => (
          <button
            key={p.id}
            className={`puzzle-nav__btn ${i === puzzleIndex ? 'puzzle-nav__btn--active' : ''}`}
            onClick={() => setPuzzleIndex(i)}
          >
            {p.label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {loading && <div className="status-message">Loading puzzle…</div>}
        {error && <div className="status-message status-message--error">Error: {error}</div>}
        {puzzle && !loading && (
          <>
            <h2 className="puzzle-title">{puzzle.title}</h2>
            <GameBoard key={puzzleIndex} puzzle={puzzle} />
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Inspired by{' '}
          <a href="https://www.knotwords.com" target="_blank" rel="noreferrer">
            Knotwords
          </a>{' '}
          by Zach Gage &amp; Jack Schlesinger.
        </p>
      </footer>
    </div>
  );
}
