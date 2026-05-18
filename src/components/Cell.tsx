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
  width: number,
  height: number,
): ThickBorders {
  const key = (r: number, c: number) => `${r},${c}`;
  const thisRegion = regionMap[key(row, col)];
  return {
    top:    row === 0        || regionMap[key(row - 1, col)] !== thisRegion,
    right:  col === width - 1 || regionMap[key(row, col + 1)] !== thisRegion,
    bottom: row === height - 1 || regionMap[key(row + 1, col)] !== thisRegion,
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
  groupLabel?: string;
  groupStatus?: boolean | null;
  regionMap: Record<string, number | string>;
  width: number;
  height: number;
  onSelect: (row: number, col: number) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>, row: number, col: number) => void;
  onChange: (value: string, row: number, col: number) => void;
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
  groupLabel,
  groupStatus,
  regionMap,
  width,
  height,
  onSelect,
  onKeyDown,
  onChange,
  setRef,
}: CellProps) {
  const thick = useMemo(
    () => getThickBorders(row, col, regionMap, width, height),
    [row, col, regionMap, width, height],
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

  let groupStatusClass = '';
  if (groupStatus === true) groupStatusClass = 'cell__group-badge--correct';
  if (groupStatus === false) groupStatusClass = 'cell__group-badge--wrong';

  return (
    <div
      className={`cell ${statusClass} ${isSelected ? 'cell--selected' : ''}`}
      style={borderStyle}
      onClick={() => onSelect(row, col)}
    >
      {groupLabel && (
        <span className={`cell__group-badge ${groupStatusClass}`}>{groupLabel}</span>
      )}
      <input
        ref={setRef}
        className="cell__input"
        type="text"
        pattern="[A-Za-z]"
        inputMode="text"
        autoCapitalize="characters"
        autoCorrect="off"
        autoComplete="off"
        spellCheck="false"
        value={letter}
        onKeyDown={(e) => onKeyDown(e, row, col)}
        onChange={(e) => onChange(e.target.value.toUpperCase(), row, col)}
        aria-label={`Row ${row + 1}, Column ${col + 1}`}
      />
    </div>
  );
}
