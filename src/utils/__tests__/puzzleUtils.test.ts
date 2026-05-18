import { describe, expect, test } from '@jest/globals';
import type { Segment } from '../../types';
import {
  computeSegments,
  buildCellStatusMap,
  isPuzzleSolved,
  regionLettersCorrect,
  buildBlockedMap,
} from '../puzzleUtils';

describe('puzzleUtils', () => {
  describe('computeSegments', () => {
    test('computes segments for a simple grid', () => {
      const grid = [
        ['C', 'A', 'T', ''],
        ['', '', '', ''],
        ['', '', '', ''],
      ];
      const blocked: boolean[][] = [
        [false, false, false, true],
        [true, true, true, true],
        [true, true, true, true],
      ];
      const width = 4;
      const height = 3;
      const segments = computeSegments(grid, blocked, width, height);
      expect(segments).toHaveLength(1);
      expect(segments[0].word).toBe('CAT');
    });
  });

  describe('buildCellStatusMap', () => {
    test('builds a cell status map', () => {
      const segments: Segment[] = [
        {
          cells: [
            [0, 0] as [number, number],
            [0, 1] as [number, number],
            [0, 2] as [number, number],
          ],
          word: 'CAT',
          status: 'valid',
        },
      ];
      const width = 4;
      const height = 3;
      const map = buildCellStatusMap(segments, width, height);
      expect(map['0,0']).toBe('valid');
      expect(map['0,1']).toBe('valid');
      expect(map['0,2']).toBe('valid');
    });
  });

  describe('isPuzzleSolved', () => {
    test('returns true when all segments are valid', () => {
      const segments: Segment[] = [
        { cells: [[0, 0] as [number, number]], word: 'CAT', status: 'valid' },
        { cells: [[0, 1] as [number, number]], word: 'DOG', status: 'valid' },
      ];
      expect(isPuzzleSolved(segments)).toBe(true);
    });

    test('returns false when any segment is invalid', () => {
      const segments: Segment[] = [
        { cells: [[0, 0] as [number, number]], word: 'CAT', status: 'valid' },
        { cells: [[0, 1] as [number, number]], word: 'XYZ', status: 'invalid' },
      ];
      expect(isPuzzleSolved(segments)).toBe(false);
    });
  });

  describe('regionLettersCorrect', () => {
    test('returns true when letters match', () => {
      const region = {
        id: 1,
        cells: [
          [1, 0] as [number, number],
          [2, 0] as [number, number],
        ],
        letters: ['A', 'E'],
      };
      const grid = [
        ['', '', '', ''],
        ['A', '', '', ''],
        ['E', '', '', ''],
      ];
      const width = 4;
      const height = 3;
      expect(regionLettersCorrect(region, grid, width, height)).toBe(true);
    });

    test('returns false when letters do not match', () => {
      const region = {
        id: 1,
        cells: [
          [1, 0] as [number, number],
          [2, 0] as [number, number],
        ],
        letters: ['A', 'E'],
      };
      const grid = [
        ['', '', '', ''],
        ['A', '', '', ''],
        ['B', '', '', ''],
      ];
      const width = 4;
      const height = 3;
      expect(regionLettersCorrect(region, grid, width, height)).toBe(false);
    });

    test('returns null when region is not fully filled', () => {
      const region = {
        id: 1,
        cells: [
          [1, 0] as [number, number],
          [2, 0] as [number, number],
        ],
        letters: ['A', 'E'],
      };
      const grid = [
        ['', '', '', ''],
        ['A', '', '', ''],
        ['', '', '', ''],
      ];
      const width = 4;
      const height = 3;
      expect(regionLettersCorrect(region, grid, width, height)).toBeNull();
    });
  });

  describe('buildBlockedMap', () => {
    test('builds a blocked map from puzzle blocked cells', () => {
      const puzzle = {
        title: 'Test Puzzle',
        width: 4,
        height: 3,
        blocked: [
          [1, 1] as [number, number],
          [1, 2] as [number, number],
          [2, 1] as [number, number],
          [2, 2] as [number, number],
        ],
        regions: [],
      };
      const blockedMap = buildBlockedMap(puzzle);
      expect(blockedMap[1][1]).toBe(true);
      expect(blockedMap[1][2]).toBe(true);
      expect(blockedMap[2][1]).toBe(true);
      expect(blockedMap[2][2]).toBe(true);
    });
  });
});