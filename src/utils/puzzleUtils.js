import { isValidWord } from './wordList.js';

/**
 * Returns the word segments for all rows and columns in the puzzle grid.
 * A segment is a run of consecutive non-blocked cells in the same row or column.
 * Only segments of length >= 2 are validated as words.
 *
 * @param {string[][]} grid - 2D array of letters ('' = empty)
 * @param {boolean[][]} blocked - 2D boolean array
 * @param {number} size - grid size
 * @returns {{ segments: Array<{cells: [number,number][], word: string, status: 'empty'|'incomplete'|'valid'|'invalid'}> }}
 */
export function computeSegments(grid, blocked, size) {
  const segments = [];

  const makeSegment = (cells) => {
    if (cells.length < 2) return null;
    const word = cells.map(([r, c]) => grid[r][c]).join('');
    const filled = cells.every(([r, c]) => grid[r][c] !== '');
    let status;
    if (!filled) {
      status = cells.some(([r, c]) => grid[r][c] !== '') ? 'incomplete' : 'empty';
    } else {
      status = isValidWord(word) ? 'valid' : 'invalid';
    }
    return { cells, word, status };
  };

  // rows
  for (let r = 0; r < size; r++) {
    let run = [];
    for (let c = 0; c <= size; c++) {
      if (c < size && !blocked[r][c]) {
        run.push([r, c]);
      } else {
        const seg = makeSegment(run);
        if (seg) segments.push(seg);
        run = [];
      }
    }
  }

  // columns
  for (let c = 0; c < size; c++) {
    let run = [];
    for (let r = 0; r <= size; r++) {
      if (r < size && !blocked[r][c]) {
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
 * A cell gets the worst status among its segments.
 * Priority: invalid > incomplete > empty > valid
 */
export function buildCellStatusMap(segments, size) {
  const priority = { valid: 0, empty: 1, incomplete: 2, invalid: 3 };
  const map = {};
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      map[`${r},${c}`] = 'empty';
    }
  }
  for (const seg of segments) {
    for (const [r, c] of seg.cells) {
      const key = `${r},${c}`;
      if (priority[seg.status] > priority[map[key]]) {
        map[key] = seg.status;
      }
    }
  }
  return map;
}

/**
 * Returns true when every segment in the puzzle is valid.
 */
export function isPuzzleSolved(segments) {
  return segments.length > 0 && segments.every((s) => s.status === 'valid');
}

/**
 * Checks whether the letters placed in a region exactly match
 * the region's letter multiset.
 */
export function regionLettersCorrect(region, grid) {
  const placed = region.cells
    .map(([r, c]) => grid[r][c])
    .filter((l) => l !== '')
    .map((l) => l.toUpperCase())
    .sort();
  const expected = [...region.letters].map((l) => l.toUpperCase()).sort();
  if (placed.length !== expected.length) return null; // incomplete
  return placed.join('') === expected.join('');
}
