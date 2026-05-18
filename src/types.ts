export interface Region {
  id: number;
  cells: [number, number][];
  letters: string[];
}

export interface Puzzle {
  title: string;
  width: number;
  height: number;
  blocked: [number, number][];
  regions: Region[];
}

export type CellStatus = 'empty' | 'incomplete' | 'valid' | 'invalid';

export interface Segment {
  cells: [number, number][];
  word: string;
  status: CellStatus;
}

/** Map from "row,col" string key to value */
export type CellKey = `${number},${number}`;
