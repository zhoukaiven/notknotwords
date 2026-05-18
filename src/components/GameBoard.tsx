import {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
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
  const { width, height, regions } = puzzle;

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
    Array.from({ length: height }, () => Array<string>(width).fill('')),
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
  const segments     = useMemo(() => computeSegments(grid, blocked, width, height), [grid, blocked, width, height]);
  const cellStatusMap = useMemo(() => buildCellStatusMap(segments, width, height), [segments, width, height]);
  const solved        = useMemo(() => isPuzzleSolved(segments), [segments]);
  const regionStatuses = useMemo(
    () => regions.map((region) => regionLettersCorrect(region, grid, width, height)),
    [regions, grid, width, height],
  );
  const regionStatusById = useMemo(
    () =>
      Object.fromEntries(
        regions.map((region, i) => [region.id, regionStatuses[i] ?? null]),
      ) as Record<number, boolean | null>,
    [regions, regionStatuses],
  );
  const regionAnchorLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    regions.forEach((region) => {
      const cells = Array.from(region.cells);
      if (cells.length === 0) return;
      const [anchor] = cells.sort(([ar, ac], [br, bc]) =>
        ar === br ? ac - bc : ar - br,
      );
      map[`${anchor[0]},${anchor[1]}`] = Array.from(region.letters).sort().join('');
    });
    return map;
  }, [regions]);

  // Clear selection when puzzle is solved
  useEffect(() => {
    if (solved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(null);
    }
  }, [solved]);

  const focusCell = useCallback(
    (r: number, c: number) => {
      if (r < 0 || r >= height || c < 0 || c >= width) return;
      if (blocked[r][c]) return;
      inputRefs.current.get(`${r},${c}`)?.focus();
      setSelected([r, c]);
    },
    [width, height, blocked],
  );

  /** Find the next (or previous) non-blocked cell in row-major order. */
  const nextCell = useCallback(
    (r: number, c: number, delta: 1 | -1 = 1): [number, number] | null => {
      let idx = r * width + c + delta;
      while (idx >= 0 && idx < width * height) {
        const nr = Math.floor(idx / width);
        const nc = idx % width;
        if (!blocked[nr][nc]) return [nr, nc];
        idx += delta;
      }
      return null;
    },
    [width, height, blocked],
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
    setGrid(Array.from({ length: height }, () => Array<string>(width).fill('')));
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
        style={{ gridTemplateColumns: `repeat(${width}, 1fr)` }}
      >
        {Array.from({ length: height }, (_, r) =>
          Array.from({ length: width }, (_, c) => {
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
                groupLabel={regionAnchorLabelMap[key]}
                groupStatus={
                  typeof regionMap[key] === 'number'
                    ? regionStatusById[regionMap[key]]
                    : null
                }
                regionMap={regionMap}
                width={width}
                height={height}
                onSelect={handleSelect}
                onKeyDown={handleKeyDown}
                setRef={makeSetRef(r, c)}
              />
            );
          }),
        )}
      </div>
      <div className="board-controls">
        <button className="btn btn--reset" onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
