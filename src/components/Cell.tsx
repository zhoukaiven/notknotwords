import { useMemo, type CSSProperties, type KeyboardEvent } from 'react';
import type { CellStatus } from '../types.js';

interface ThickBorders {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

function getThickBorders(
  row: number,
  col: number,
  regionMap: Record<string, number | string>,
  size: number,
): ThickBorders {
  const key = (r: number, c: number) => `${r},${c}`;
  const thisRegion = regionMap[key(row, col)];
  return {
    top:    row === 0        || regionMap[key(row - 1, col)] !== thisRegion,
    right:  col === size - 1 || regionMap[key(row, col + 1)] !== thisRegion,
    bottom: row === size - 1 || regionMap[key(row + 1, col)] !== thisRegion,
    left:   col === 0        || regionMap[key(row, col - 1)] !== thisRegion,
  };
}

interface CellProps {
  row: number;
  col: number;
  letter: string;
  isBlocked: boolean;
  isSelected: boolean;
  cellStatus: CellStatus;
  regionMap: Record<string, number | string>;
  size: number;
  onSelect: (row: number, col: number) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>, row: number, col: number) => void;
  /** Callback ref — called with the DOM element when mounted/unmounted. */
  setRef: (el: HTMLInputElement | null) => void;
}

export default function Cell({
  row,
  col,
  letter,
  isBlocked,
  isSelected,
  cellStatus,
  regionMap,
  size,
  onSelect,
  onKeyDown,
  setRef,
}: CellProps) {
  const thick = useMemo(
    () => getThickBorders(row, col, regionMap, size),
    [row, col, regionMap, size],
  );

  if (isBlocked) {
    return <div className="cell cell--blocked" />;
  }

  const borderStyle: CSSProperties = {
    borderTopWidth:    thick.top    ? '3px' : '1px',
    borderRightWidth:  thick.right  ? '3px' : '1px',
    borderBottomWidth: thick.bottom ? '3px' : '1px',
    borderLeftWidth:   thick.left   ? '3px' : '1px',
  };

  let statusClass = '';
  if (cellStatus === 'valid')   statusClass = 'cell--valid';
  if (cellStatus === 'invalid') statusClass = 'cell--invalid';

  return (
    <div
      className={`cell ${statusClass} ${isSelected ? 'cell--selected' : ''}`}
      style={borderStyle}
      onClick={() => onSelect(row, col)}
    >
      <input
        ref={setRef}
        className="cell__input"
        type="text"
        maxLength={1}
        value={letter}
        readOnly
        onKeyDown={(e) => onKeyDown(e, row, col)}
        onFocus={() => onSelect(row, col)}
        aria-label={`Row ${row + 1}, Column ${col + 1}`}
      />
    </div>
  );
}
