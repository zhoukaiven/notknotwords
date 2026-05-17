import { useState, useRef, useCallback, useMemo } from 'react';
import Cell from './Cell.jsx';
import { computeSegments, buildCellStatusMap, isPuzzleSolved, regionLettersCorrect } from '../utils/puzzleUtils.js';

export default function GameBoard({ puzzle }) {
  const { size, regions } = puzzle;
  const blocked = useMemo(() => {
    const b = Array.from({ length: size }, () => Array(size).fill(false));
    (puzzle.blocked || []).forEach(([r, c]) => { b[r][c] = true; });
    return b;
  }, [puzzle, size]);

  // Build a map from "r,c" -> regionId for border rendering
  const regionMap = useMemo(() => {
    const map = {};
    regions.forEach((region) => {
      region.cells.forEach(([r, c]) => {
        map[`${r},${c}`] = region.id;
      });
    });
    // blocked cells get a unique id so they don't merge borders
    (puzzle.blocked || []).forEach(([r, c]) => {
      map[`${r},${c}`] = `blocked-${r}-${c}`;
    });
    return map;
  }, [puzzle, regions]);

  // grid state: 2D array of letters
  const [grid, setGrid] = useState(() =>
    Array.from({ length: size }, () => Array(size).fill(''))
  );
  const [selected, setSelected] = useState(null); // [row, col]

  // refs for each cell input
  const cellRefs = useRef({});
  const getCellRef = (r, c) => {
    const key = `${r},${c}`;
    if (!cellRefs.current[key]) cellRefs.current[key] = { current: null };
    return cellRefs.current[key];
  };

  // Compute segments and statuses
  const segments = useMemo(() => computeSegments(grid, blocked, size), [grid, blocked, size]);
  const cellStatusMap = useMemo(() => buildCellStatusMap(segments, size), [segments, size]);
  const solved = useMemo(() => isPuzzleSolved(segments), [segments]);

  // Build per-region correctness for the legend
  const regionStatuses = useMemo(() =>
    regions.map((region) => regionLettersCorrect(region, grid)),
    [regions, grid]
  );

  const focusCell = useCallback((r, c) => {
    if (r < 0 || r >= size || c < 0 || c >= size) return;
    if (blocked[r][c]) return;
    const ref = getCellRef(r, c);
    if (ref.current) ref.current.focus();
    setSelected([r, c]);
  }, [size, blocked]);

  // Find next/prev non-blocked cell (row-major order)
  const nextCell = useCallback((r, c, delta = 1) => {
    let idx = r * size + c + delta;
    while (idx >= 0 && idx < size * size) {
      const nr = Math.floor(idx / size);
      const nc = idx % size;
      if (!blocked[nr][nc]) return [nr, nc];
      idx += delta;
    }
    return null;
  }, [size, blocked]);

  const handleSelect = useCallback((r, c) => {
    setSelected([r, c]);
    const ref = getCellRef(r, c);
    if (ref.current) ref.current.focus();
  }, []);

  const handleKeyDown = useCallback((e, r, c) => {
    const letter = e.key.toUpperCase();

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        if (next[r][c] !== '') {
          next[r][c] = '';
        } else {
          // move back and clear
          const prev2 = nextCell(r, c, -1);
          if (prev2) {
            next[prev2[0]][prev2[1]] = '';
            focusCell(prev2[0], prev2[1]);
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
      // Move to next cell
      const next = nextCell(r, c, 1);
      if (next) focusCell(next[0], next[1]);
    }
  }, [nextCell, focusCell]);

  const handleReset = () => {
    setGrid(Array.from({ length: size }, () => Array(size).fill('')));
    setSelected(null);
  };

  return (
    <div className="game-board">
      {solved && (
        <div className="success-banner" role="alert">
          🎉 Congratulations! You solved it!
        </div>
      )}

      {/* Grid */}
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      >
        {Array.from({ length: size }, (_, r) =>
          Array.from({ length: size }, (_, c) => {
            const key = `${r},${c}`;
            const isBlocked = blocked[r][c];
            const isSelected = selected && selected[0] === r && selected[1] === c;
            const ref = getCellRef(r, c);
            return (
              <Cell
                key={key}
                row={r}
                col={c}
                letter={grid[r][c]}
                isBlocked={isBlocked}
                isSelected={isSelected}
                cellStatus={cellStatusMap[key] || 'empty'}
                regionMap={regionMap}
                size={size}
                onSelect={handleSelect}
                onKeyDown={handleKeyDown}
                inputRef={ref}
              />
            );
          })
        )}
      </div>

      {/* Region hints */}
      <div className="region-hints">
        <h3>Letter Groups</h3>
        <div className="region-list">
          {regions.map((region, i) => {
            const status = regionStatuses[i];
            const cls =
              status === true ? 'region-hint--correct' :
              status === false ? 'region-hint--wrong' :
              '';
            return (
              <div key={region.id} className={`region-hint ${cls}`}>
                <span className="region-hint__badge">
                  {region.letters.slice().sort().join(' ')}
                </span>
                {status === true && <span className="region-hint__check">✓</span>}
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
