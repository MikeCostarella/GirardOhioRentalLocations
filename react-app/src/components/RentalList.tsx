import { useMemo } from 'react';
import type { RentalLocation } from '../types';
import { compareLocations, locationLabel, locationStreet } from '../lib';

interface Props {
  locations: RentalLocation[];
  onSelect: (loc: RentalLocation) => void;
}

export default function RentalList({ locations, onSelect }: Props) {
  const sorted = useMemo(
    () => [...locations].sort(compareLocations),
    [locations]
  );

  if (sorted.length === 0) {
    return (
      <div id="list">
        <div className="list-empty">No locations match your filters.</div>
      </div>
    );
  }

  return (
    <div id="list">
      {sorted.map((loc, i) => (
        <div key={i} className="list-row" onClick={() => onSelect(loc)}>
          <span className={`list-dot ${loc.multi ? 'm' : 's'}`} />
          <div className="list-main">
            <div className="list-addr">{locationLabel(loc)}</div>
            <div className="list-meta">
              {locationStreet(loc)} ·{' '}
              {loc.multi ? `${loc.units.length} units` : 'Single unit'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
