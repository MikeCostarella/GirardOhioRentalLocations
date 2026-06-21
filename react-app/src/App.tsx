import { useEffect, useMemo, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import './App.css';
import type { RentalLocation, ViewMode } from './types';
import type { UnitFilter } from './lib';
import { filterLocations } from './lib';
import { useGeolocation, isNearGirard } from './useGeolocation';
import RentalMap from './components/RentalMap';
import RentalList from './components/RentalList';
import MenuDrawer from './components/MenuDrawer';
import DetailsModal from './components/DetailsModal';
import LocationDialog from './components/LocationDialog';
import rawLocations from './data/locations.json';

const ALL_LOCATIONS = rawLocations as RentalLocation[];

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [view, setView] = useState<ViewMode>('map');
  const [filter, setFilter] = useState<UnitFilter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<RentalLocation | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; key: number; fit?: boolean } | null>(null);

  // Boundary overlays default ON.
  const [showMunicipalities, setShowMunicipalities] = useState(true);
  const [showTownships, setShowTownships] = useState(true);

  const geo = useGeolocation();

  // Only auto-fly to the user once (on the first fix). After that the marker
  // updates silently and the locate button re-centers on demand. Without this
  // guard the map re-centers on every geo state change, fighting the user.
  const hasFlownToUser = useRef(false);
  // When the locate button is pressed we want to force a re-center even after
  // the first fix.
  const forceFlyNext = useRef(false);

  // Try to locate once on mount so the "You are here" marker drops on load.
  useEffect(() => {
    geo.locate({ auto: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // From the list view's details dialog: close the dialog, switch to the map,
  // and fly to the location. A short delay lets the map container become
  // visible and re-measure (it's hidden in list view) before the flyTo runs.
  function goToOnMap(loc: RentalLocation) {
    setSelected(null);
    setView('map');
    window.setTimeout(() => {
      setFlyTo({ lat: loc.lat, lng: loc.lng, key: Date.now() });
    }, 120);
  }

  function handleLocate() {
    forceFlyNext.current = true;
    geo.locate();
  }

  // Fly to the user's position only on the first fix, or when the locate button
  // explicitly requested it (forceFlyNext). Guarding the flyTo itself — not just
  // the locate trigger — prevents a double/repeated re-center.
  useEffect(() => {
    if (geo.status === 'located' && geo.position) {
      const requested = forceFlyNext.current;
      const shouldFly = !hasFlownToUser.current || requested;
      if (shouldFly) {
        hasFlownToUser.current = true;
        forceFlyNext.current = false;
        // Only yank to the map view when the user explicitly asked to locate.
        if (requested) setView('map');
        // If the user is outside the Girard area, fit a view that keeps Girard
        // visible rather than zooming all the way in on them.
        const fit = !isNearGirard(geo.position.lat, geo.position.lon);
        setFlyTo({
          lat: geo.position.lat,
          lng: geo.position.lon,
          key: Date.now(),
          fit,
        });
      }
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
          onUserClick={() => {
            setSelected(null);
            setUserDialogOpen(true);
          }}
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

      <DetailsModal
        location={selected}
        onClose={() => setSelected(null)}
        onGoToMap={view === 'list' ? goToOnMap : undefined}
      />

      <LocationDialog
        position={userPos}
        accuracy={geo.accuracy}
        open={userDialogOpen}
        onClose={() => setUserDialogOpen(false)}
      />
    </div>
  );
}
