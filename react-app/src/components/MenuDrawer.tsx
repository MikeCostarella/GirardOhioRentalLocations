import { useMemo } from 'react';
import type { RentalLocation, ViewMode } from '../types';
import type { UnitFilter } from '../lib';
import { filterLocations, locationLabel, locationStreet } from '../lib';
import type { LocateStatus } from '../useGeolocation';

interface Props {
  open: boolean;
  onClose: () => void;
  locations: RentalLocation[];
  view: ViewMode;
  setView: (v: ViewMode) => void;
  filter: UnitFilter;
  setFilter: (f: UnitFilter) => void;
  query: string;
  setQuery: (q: string) => void;
  onPick: (loc: RentalLocation) => void;
  onLocate: () => void;
  locateStatus: LocateStatus;
}

const STATUS_TEXT: Record<LocateStatus, string> = {
  idle: '',
  locating: 'Locating…',
  located: 'Location found.',
  denied: 'Location permission denied.',
  error: 'Location unavailable.',
};

export default function MenuDrawer({
  open,
  onClose,
  locations,
  view,
  setView,
  filter,
  setFilter,
  query,
  setQuery,
  onPick,
  onLocate,
  locateStatus,
}: Props) {
  // Live search results (capped) for the search box inside the drawer.
  const results = useMemo(() => {
    if (!query.trim()) return [];
    return filterLocations(locations, 'all', query).slice(0, 40);
  }, [locations, query]);

  return (
    <>
      <div
        id="drawer-overlay"
        className={open ? 'show' : ''}
        onClick={onClose}
      />
      <div id="drawer" className={open ? 'open' : ''}>
        <div className="drawer-head">
          <h2>MENU</h2>
          <button className="drawer-close" onClick={onClose} aria-label="Close menu">
            &#x2715;
          </button>
        </div>
        <div className="drawer-body">
          {/* View toggle */}
          <div className="drawer-section">View</div>
          <div className="seg">
            <button
              className={view === 'map' ? 'active' : ''}
              onClick={() => setView('map')}
            >
              Map
            </button>
            <button
              className={view === 'list' ? 'active' : ''}
              onClick={() => setView('list')}
            >
              List
            </button>
          </div>

          {/* Filter */}
          <div className="drawer-section">Show</div>
          <div className="seg">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={filter === 'single' ? 'active' : ''}
              onClick={() => setFilter('single')}
            >
              Single
            </button>
            <button
              className={filter === 'multi' ? 'active' : ''}
              onClick={() => setFilter('multi')}
            >
              Multi
            </button>
          </div>

          {/* Search */}
          <div className="drawer-section">Search</div>
          <div className="drawer-search">
            <input
              type="text"
              value={query}
              placeholder="Street, number, or account…"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {query.trim() && (
            <div className="search-results">
              {results.length === 0 ? (
                <div className="search-empty">No matches</div>
              ) : (
                results.map((loc, i) => (
                  <div
                    key={i}
                    className="search-result"
                    onClick={() => onPick(loc)}
                  >
                    <div className="sr-addr">{locationLabel(loc)}</div>
                    <div className="sr-meta">
                      {locationStreet(loc)} ·{' '}
                      {loc.multi ? `${loc.units.length} units` : 'Single unit'}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Locate */}
          <div className="drawer-section">Location</div>
          <button className="locate-btn" onClick={onLocate}>
            Show my location
          </button>
          {locateStatus !== 'idle' && (
            <div className="locate-status">{STATUS_TEXT[locateStatus]}</div>
          )}

          {/* Source */}
          <div className="drawer-section">Source</div>
          <a
            className="drawer-link"
            href="https://github.com/MikeCostarella/GirardOhioRentalLocations"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub repository
            <small>View the source for this map</small>
          </a>
        </div>
      </div>
    </>
  );
}
