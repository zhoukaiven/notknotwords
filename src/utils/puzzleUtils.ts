import type { CellStatus, Puzzle, Region, Segment } from '../types.js';
import { isValidWord } from './wordList';

/**
 * Returns the word segments for all rows and columns in the puzzle grid.
 * A segment is a run of consecutive non-blocked cells in the same row or column.
 * Only segments of length >= 2 are validated as words.
 */
export function computeSegments(
  grid: string[][],
  blocked: boolean[][],
  width: number,
  height: number,
): Segment[] {
  const segments: Segment[] = [];

  const makeSegment = (cells: [number, number][]): Segment | null => {
    if (cells.length < 2) return null;
    const word = cells.map(([r, c]) => grid[r][c]).join('');
    const filled = cells.every(([r, c]) => grid[r][c] !== '');
    let status: CellStatus;
    if (!filled) {
      status = cells.some(([r, c]) => grid[r][c] !== '') ? 'incomplete' : 'empty';
    } else {
      status = isValidWord(word) ? 'valid' : 'invalid';
    }
    return { cells, word, status };
  };

  // rows
  for (let r = 0; r < height; r++) {
    let run: [number, number][] = [];
    for (let c = 0; c <= width; c++) {
      if (c < width && !blocked[r][c]) {
        run.push([r, c]);
      } else {
        const seg = makeSegment(run);
        if (seg) segments.push(seg);
        run = [];
      }
    }
  }

  // columns
  for (let c = 0; c < width; c++) {
    let run: [number, number][] = [];
    for (let r = 0; r <= height; r++) {
      if (r < height && !blocked[r][c]) {
        run.push([r, c]);
      } else {
        const seg = makeSegment(run);
        if (seg) segments.push(seg);
        run = [];
      }
    }
  }

  return segments;
}

/**
 * Build a per-cell status map from segments.
 * A cell gets the worst status among all segments it belongs to.
 * Priority: invalid > incomplete > empty > valid
 */
export function buildCellStatusMap(
  segments: Segment[],
  width: number,
  height: number,
): Record<string, CellStatus> {
  const priority: Record<CellStatus, number> = {
    valid: 3,
    empty: 2,
    incomplete: 1,
    invalid: 0,
  };
  const map: Record<string, CellStatus> = {};
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      map[`${r},${c}`] = 'empty';
    }
  }
  for (const seg of segments) {
    for (const [r, c] of seg.cells) {
      const key = `${r},${c}`;
      const current = map[key] ?? 'empty';
      if (priority[seg.status] > priority[current]) {
        map[key] = seg.status;
      }
    }
  }
  return map;
}

/** Returns true when every segment in the puzzle is 'valid'. */
export function isPuzzleSolved(segments: Segment[]): boolean {
  return segments.length > 0 && segments.every((s) => s.status === 'valid');
}

/**
 * Checks whether the letters placed in a region exactly match
 * the region's letter multiset.
 * Returns null when the region is not yet fully filled,
 * true when it matches, false when it doesn't.
 */
export function regionLettersCorrect(
  region: Region,
  grid: string[][],
  width: number,
  height: number,
): boolean | null {
  const placed = region.cells
    .map(([r, c]) => {
      // Check bounds to avoid accessing undefined cells
      if (r >= 0 && r < height && c >= 0 && c < width) {
        return grid[r][c];
      }
      return '';
    })
    .filter((l) => l !== '')
    .map((l) => l.toUpperCase())
    .sort();
  const expected = [...region.letters].map((l) => l.toUpperCase()).sort();
  if (placed.length !== expected.length) return null;
  return placed.join('') === expected.join('');
}

/** Build a 2-D boolean array marking blocked cells. */
export function buildBlockedMap(puzzle: Puzzle): boolean[][] {
  const b: boolean[][] = Array.from({ length: puzzle.height }, () =>
    Array(puzzle.width).fill(false),
  );
  for (const [r, c] of puzzle.blocked) {
    b[r][c] = true;
  }
  return b;
}
