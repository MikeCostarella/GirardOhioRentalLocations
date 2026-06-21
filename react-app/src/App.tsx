import { useEffect, useMemo, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import './App.css';
import type { RentalLocation, ViewMode } from './types';
import type { UnitFilter } from './lib';
import { filterLocations } from './lib';
import { useGeolocation } from './useGeolocation';
import RentalMap from './components/RentalMap';
import RentalList from './components/RentalList';
import MenuDrawer from './components/MenuDrawer';
import DetailsModal from './components/DetailsModal';
import rawLocations from './data/locations.json';

const ALL_LOCATIONS = rawLocations as RentalLocation[];

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [view, setView] = useState<ViewMode>('map');
  const [filter, setFilter] = useState<UnitFilter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<RentalLocation | null>(null);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; key: number } | null>(null);

  // Boundary overlays default ON.
  const [showMunicipalities, setShowMunicipalities] = useState(true);
  const [showTownships, setShowTownships] = useState(true);

  const geo = useGeolocation();

  // Filtered set drives both the map markers and the list.
  const visible = useMemo(
    () => filterLocations(ALL_LOCATIONS, filter, query),
    [filter, query]
  );

  // Whole-dataset stats for the stats bar (not affected by filters).
  const stats = useMemo(() => {
    let single = 0;
    let multi = 0;
    for (const l of ALL_LOCATIONS) {
      if (l.multi) multi++;
      else single++;
    }
    return { total: ALL_LOCATIONS.length, single, multi };
  }, []);

  // When a marker / list row / search result is chosen, open its details and
  // (if we're on the map) fly to it.
  function selectLocation(loc: RentalLocation, fly = false) {
    setSelected(loc);
    if (fly && view === 'map') {
      setFlyTo({ lat: loc.lat, lng: loc.lng, key: Date.now() });
    }
  }

  // Picking from the drawer search closes the drawer, switches to map, flies.
  function pickFromSearch(loc: RentalLocation) {
    setDrawerOpen(false);
    setView('map');
    setSelected(loc);
    setFlyTo({ lat: loc.lat, lng: loc.lng, key: Date.now() });
  }

  function handleLocate() {
    geo.locate();
  }

  // When a position is acquired, fly to it on the map.
  useEffect(() => {
    if (geo.status === 'located' && geo.position) {
      setView('map');
      setFlyTo({ lat: geo.position.lat, lng: geo.position.lon, key: Date.now() });
    }
  }, [geo.status, geo.position]);

  const userPos = geo.position;

  return (
    <div id="wrapper">
      <div id="header">
        <div className="title-wrap">
          <button
            className="burger"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1>&#128205; Girard Ohio Rental Location Map</h1>
        </div>
        <div className="credit">Created by Mike Costarella</div>
      </div>

      <div id="statsbar">
        <span>Locations: <b>{stats.total.toLocaleString()}</b></span>
        <span>Single-Unit: <b>{stats.single.toLocaleString()}</b></span>
        <span>Multi-Tenant: <b>{stats.multi.toLocaleString()}</b></span>
        <div className="leg">
          <span className="legdot s" /> Single-Unit&nbsp;
          <span className="legdot m" /> Multi-Tenant&nbsp;
          <span className="legdot u" /> You Are Here
        </div>
        <span id="updated">Updated {__BUILD_DATE__}</span>
      </div>

      <div id="content">
        {/* Map stays mounted (hidden in list view) so tiles/state persist. */}
        <RentalMap
          locations={visible}
          hidden={view === 'list'}
          userPos={userPos}
          flyTo={flyTo}
          onSelect={(loc) => selectLocation(loc, false)}
          showMunicipalities={showMunicipalities}
          showTownships={showTownships}
        />
        {view === 'list' && (
          <RentalList
            locations={visible}
            onSelect={(loc) => selectLocation(loc, false)}
          />
        )}
      </div>

      <MenuDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        locations={ALL_LOCATIONS}
        view={view}
        setView={setView}
        filter={filter}
        setFilter={setFilter}
        query={query}
        setQuery={setQuery}
        onPick={pickFromSearch}
        onLocate={handleLocate}
        locateStatus={geo.status}
        showMunicipalities={showMunicipalities}
        setShowMunicipalities={setShowMunicipalities}
        showTownships={showTownships}
        setShowTownships={setShowTownships}
      />

      <DetailsModal location={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
