import {
  useState,
  useRef,
  useCallback,
  useMemo,
  type KeyboardEvent,
} from 'react';
import Cell from './Cell.js';
import {
  computeSegments,
  buildCellStatusMap,
  isPuzzleSolved,
  regionLettersCorrect,
  buildBlockedMap,
} from '../utils/puzzleUtils.js';
import type { Puzzle } from '../types.js';

interface GameBoardProps {
  puzzle: Puzzle;
}

export default function GameBoard({ puzzle }: GameBoardProps) {
  const { size, regions } = puzzle;

  const blocked = useMemo(() => buildBlockedMap(puzzle), [puzzle]);

  // Map from "r,c" -> regionId for border rendering
  const regionMap = useMemo(() => {
    const map: Record<string, number | string> = {};
    regions.forEach((region) => {
      region.cells.forEach(([r, c]) => {
        map[`${r},${c}`] = region.id;
      });
    });
    puzzle.blocked.forEach(([r, c]) => {
      map[`${r},${c}`] = `blocked-${r}-${c}`;
    });
    return map;
  }, [puzzle, regions]);

  // Grid: 2-D array of letters ('' = empty)
  const [grid, setGrid] = useState<string[][]>(() =>
    Array.from({ length: size }, () => Array<string>(size).fill('')),
  );
  const [selected, setSelected] = useState<[number, number] | null>(null);

  // Stable ref-store: inputRefs.current is a plain Map, never read during render
  const inputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());

  /** Callback-ref factory — stores the DOM element outside of render */
  const makeSetRef = useCallback(
    (r: number, c: number) => (el: HTMLInputElement | null) => {
      inputRefs.current.set(`${r},${c}`, el);
    },
    [],
  );

  // Derived validation state
  const segments     = useMemo(() => computeSegments(grid, blocked, size), [grid, blocked, size]);
  const cellStatusMap = useMemo(() => buildCellStatusMap(segments, size), [segments, size]);
  const solved        = useMemo(() => isPuzzleSolved(segments), [segments]);
  const regionStatuses = useMemo(
    () => regions.map((region) => regionLettersCorrect(region, grid)),
    [regions, grid],
  );

  const focusCell = useCallback(
    (r: number, c: number) => {
      if (r < 0 || r >= size || c < 0 || c >= size) return;
      if (blocked[r][c]) return;
      inputRefs.current.get(`${r},${c}`)?.focus();
      setSelected([r, c]);
    },
    [size, blocked],
  );

  /** Find the next (or previous) non-blocked cell in row-major order. */
  const nextCell = useCallback(
    (r: number, c: number, delta: 1 | -1 = 1): [number, number] | null => {
      let idx = r * size + c + delta;
      while (idx >= 0 && idx < size * size) {
        const nr = Math.floor(idx / size);
        const nc = idx % size;
        if (!blocked[nr][nc]) return [nr, nc];
        idx += delta;
      }
      return null;
    },
    [size, blocked],
  );

  const handleSelect = useCallback((r: number, c: number) => {
    setSelected([r, c]);
    inputRefs.current.get(`${r},${c}`)?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>, r: number, c: number) => {
      const letter = e.key.toUpperCase();

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        setGrid((prev) => {
          const next = prev.map((row) => [...row]);
          if (next[r][c] !== '') {
            next[r][c] = '';
          } else {
            const prevCell = nextCell(r, c, -1);
            if (prevCell) {
              next[prevCell[0]][prevCell[1]] = '';
              focusCell(prevCell[0], prevCell[1]);
            }
          }
          return next;
        });
        return;
      }

      if (e.key === 'ArrowRight') { e.preventDefault(); focusCell(r, c + 1); return; }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); focusCell(r, c - 1); return; }
      if (e.key === 'ArrowDown')  { e.preventDefault(); focusCell(r + 1, c); return; }
      if (e.key === 'ArrowUp')    { e.preventDefault(); focusCell(r - 1, c); return; }

      if (/^[A-Z]$/.test(letter)) {
        e.preventDefault();
        setGrid((prev) => {
          const next = prev.map((row) => [...row]);
          next[r][c] = letter;
          return next;
        });
        const nc = nextCell(r, c, 1);
        if (nc) focusCell(nc[0], nc[1]);
      }
    },
    [nextCell, focusCell],
  );

  const handleReset = () => {
    setGrid(Array.from({ length: size }, () => Array<string>(size).fill('')));
    setSelected(null);
  };

  return (
    <div className="game-board">
      {solved && (
        <div className="success-banner" role="alert">
          🎉 Congratulations! You solved it!
        </div>
      )}

      {/* Crossword grid */}
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      >
        {Array.from({ length: size }, (_, r) =>
          Array.from({ length: size }, (_, c) => {
            const key = `${r},${c}`;
            return (
              <Cell
                key={key}
                row={r}
                col={c}
                letter={grid[r][c]}
                isBlocked={blocked[r][c]}
                isSelected={selected !== null && selected[0] === r && selected[1] === c}
                cellStatus={cellStatusMap[key] ?? 'empty'}
                regionMap={regionMap}
                size={size}
                onSelect={handleSelect}
                onKeyDown={handleKeyDown}
                setRef={makeSetRef(r, c)}
              />
            );
          }),
        )}
      </div>

      {/* Letter-group hints */}
      <div className="region-hints">
        <h3>Letter Groups</h3>
        <div className="region-list">
          {regions.map((region, i) => {
            const status = regionStatuses[i];
            const cls =
              status === true  ? 'region-hint--correct' :
              status === false ? 'region-hint--wrong'   : '';
            return (
              <div key={region.id} className={`region-hint ${cls}`}>
                <span className="region-hint__badge">
                  {[...region.letters].sort().join(' ')}
                </span>
                {status === true  && <span className="region-hint__check">✓</span>}
                {status === false && <span className="region-hint__x">✗</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="board-controls">
        <button className="btn btn--reset" onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
