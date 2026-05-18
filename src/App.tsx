import { useReducer, useEffect } from 'react';
import GameBoard from './components/GameBoard.js';
import type { Puzzle } from './types.js';
import './App.css';

interface PuzzleEntry {
  id: number;
  file: string;
  label: string;
}

const PUZZLES: PuzzleEntry[] = [
  { id: 1, file: 'puzzle1.json', label: 'Puzzle #1' },
  { id: 2, file: 'puzzle2.json', label: 'Puzzle #2' },
  { id: 3, file: 'puzzle3.json', label: 'Puzzle #3' },
  { id: 4, file: 'puzzle4.json', label: 'Puzzle #4' },
];

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; puzzle: Puzzle };

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; puzzle: Puzzle }
  | { type: 'FETCH_ERROR'; message: string };

function reducer(_state: LoadState, action: Action): LoadState {
  switch (action.type) {
    case 'FETCH_START':   return { status: 'loading' };
    case 'FETCH_SUCCESS': return { status: 'ready', puzzle: action.puzzle };
    case 'FETCH_ERROR':   return { status: 'error', message: action.message };
  }
}

export default function App() {
  const [puzzleIndex, dispatchPuzzleIndex] = useReducer(
    (_: number, next: number) => next,
    0,
  );
  const [loadState, dispatch] = useReducer(reducer, { status: 'loading' });

  useEffect(() => {
    dispatch({ type: 'FETCH_START' });
    const base = import.meta.env.BASE_URL as string;
    let cancelled = false;
    fetch(`${base}puzzles/${PUZZLES[puzzleIndex].file}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Puzzle>;
      })
      .then((puzzle) => {
        if (!cancelled) dispatch({ type: 'FETCH_SUCCESS', puzzle });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          dispatch({
            type: 'FETCH_ERROR',
            message: err instanceof Error ? err.message : String(err),
          });
      });
    return () => { cancelled = true; };
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
            className={`puzzle-nav__btn${i === puzzleIndex ? ' puzzle-nav__btn--active' : ''}`}
            onClick={() => dispatchPuzzleIndex(i)}
          >
            {p.label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {loadState.status === 'loading' && (
          <div className="status-message">Loading puzzle…</div>
        )}
        {loadState.status === 'error' && (
          <div className="status-message status-message--error">
            Error: {loadState.message}
          </div>
        )}
        {loadState.status === 'ready' && (
          <>
            <h2 className="puzzle-title">{loadState.puzzle.title}</h2>
            <GameBoard key={puzzleIndex} puzzle={loadState.puzzle} />
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
