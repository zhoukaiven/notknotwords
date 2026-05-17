import { useMemo } from 'react';

/**
 * Determine which borders should be thick (region boundary) vs thin (same region).
 * top | right | bottom | left
 */
function getThickBorders(row, col, regionMap, size) {
  const key = (r, c) => `${r},${c}`;
  const thisRegion = regionMap[key(row, col)];
  return {
    top:    row === 0      || regionMap[key(row - 1, col)] !== thisRegion,
    right:  col === size-1 || regionMap[key(row, col + 1)] !== thisRegion,
    bottom: row === size-1 || regionMap[key(row + 1, col)] !== thisRegion,
    left:   col === 0      || regionMap[key(row, col - 1)] !== thisRegion,
  };
}

export default function Cell({
  row,
  col,
  letter,
  isBlocked,
  isSelected,
  cellStatus,   // 'empty' | 'incomplete' | 'valid' | 'invalid'
  regionMap,
  size,
  onSelect,
  onChange,
  onKeyDown,
  inputRef,
}) {
  const thick = useMemo(
    () => getThickBorders(row, col, regionMap, size),
    [row, col, regionMap, size]
  );

  if (isBlocked) {
    return <div className="cell cell--blocked" />;
  }

  const borderStyle = {
    borderTopWidth:    thick.top    ? '3px' : '1px',
    borderRightWidth:  thick.right  ? '3px' : '1px',
    borderBottomWidth: thick.bottom ? '3px' : '1px',
    borderLeftWidth:   thick.left   ? '3px' : '1px',
  };

  let statusClass = '';
  if (cellStatus === 'valid') statusClass = 'cell--valid';
  else if (cellStatus === 'invalid') statusClass = 'cell--invalid';

  return (
    <div
      className={`cell ${statusClass} ${isSelected ? 'cell--selected' : ''}`}
      style={borderStyle}
      onClick={() => onSelect(row, col)}
    >
      <input
        ref={inputRef}
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
