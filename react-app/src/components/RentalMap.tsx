import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { RentalLocation } from '../types';
import { locationLabel } from '../lib';
import BoundaryLayers from './BoundaryLayers';

interface Props {
  locations: RentalLocation[];
  hidden: boolean;
  userPos: { lat: number; lon: number } | null;
  flyTo: { lat: number; lng: number; key: number; fit?: boolean } | null;
  onSelect: (loc: RentalLocation) => void;
  onUserClick: () => void;
  highlight: { lat: number; lng: number } | null;
  onClearHighlight: () => void;
  showMunicipalities: boolean;
  showTownships: boolean;
}

const GIRARD_CENTER: [number, number] = [41.1554, -80.6936];

// Pulsing green "you are here" marker, matching the prototype.
const userIcon = L.divIcon({
  className: '',
  html: '<div class="user-loc-marker"><div class="pulse"></div><div class="dot"></div></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Pulsing amber hollow ring dropped on the location the user jumped to via
// "Go To on Map", so it stands out among the markers.
const highlightIcon = L.divIcon({
  className: '',
  html: '<div class="loc-highlight"><div class="ring"></div></div>',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

// Drops the amber ring on the jumped-to location and clears it when the user
// pans/zooms. The pan-to-clear listener is armed only AFTER the programmatic
// flyTo from "Go To on Map" settles (moveend), so the arrival fly itself
// doesn't immediately clear the highlight; a fallback timer arms it in case no
// moveend fires (target already in view).
function SelectedHighlight({
  location,
  onClear,
}: {
  location: { lat: number; lng: number } | null;
  onClear: () => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (!location) return;
    let armed = false;
    const arm = () => {
      armed = true;
    };
    const clearOnInteract = () => {
      if (armed) onClear();
    };
    const onMoveEnd = () => {
      window.setTimeout(arm, 250);
      map.off('moveend', onMoveEnd);
    };
    map.on('moveend', onMoveEnd);
    map.on('dragstart', clearOnInteract);
    map.on('zoomstart', clearOnInteract);
    // Fallback: if the target is already in view, no moveend fires — arm anyway.
    const fallback = window.setTimeout(arm, 1600);
    return () => {
      window.clearTimeout(fallback);
      map.off('moveend', onMoveEnd);
      map.off('dragstart', clearOnInteract);
      map.off('zoomstart', clearOnInteract);
    };
  }, [location, map, onClear]);

  if (!location) return null;
  return (
    <Marker
      position={[location.lat, location.lng]}
      icon={highlightIcon}
      interactive={false}
      keyboard={false}
      zIndexOffset={900}
    />
  );
}

// Imperatively move the map when a search result / list row is chosen, or when
// the user is located. If `fit` is set (user is outside the Girard area) we fit
// a view that includes both the user and Girard so Girard stays visible;
// otherwise we fly to the point at street zoom.
function FlyController({ flyTo }: { flyTo: Props['flyTo'] }) {
  const map = useMap();
  const lastKey = useRef<number>(-1);
  useEffect(() => {
    if (flyTo && flyTo.key !== lastKey.current) {
      lastKey.current = flyTo.key;
      if (flyTo.fit) {
        // Include both the user's position and Girard, padded, and cap the zoom
        // so we never zoom in past a useful overview.
        const bounds = L.latLngBounds(
          [flyTo.lat, flyTo.lng],
          GIRARD_CENTER
        );
        map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 13, duration: 0.6 });
      } else {
        map.flyTo([flyTo.lat, flyTo.lng], 18, { duration: 0.6 });
      }
    }
  }, [flyTo, map]);
  return null;
}

// Keep Leaflet sized correctly after the map is unhidden (list -> map).
function ResizeOnShow({ hidden }: { hidden: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!hidden) {
      // next tick so the container has its size back
      const t = setTimeout(() => map.invalidateSize(), 50);
      return () => clearTimeout(t);
    }
  }, [hidden, map]);
  return null;
}

export default function RentalMap({ locations, hidden, userPos, flyTo, onSelect, onUserClick, highlight, onClearHighlight, showMunicipalities, showTownships }: Props) {
  // Render order: multi on top of single so the rarer markers stay visible.
  const ordered = useMemo(
    () => [...locations].sort((a, b) => Number(a.multi) - Number(b.multi)),
    [locations]
  );

  return (
    <div id="map" className={hidden ? 'hidden' : ''}>
      <MapContainer center={GIRARD_CENTER} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ResizeOnShow hidden={hidden} />
        <FlyController flyTo={flyTo} />

        <BoundaryLayers
          showMunicipalities={showMunicipalities}
          showTownships={showTownships}
        />

        {ordered.map((loc, i) => (
          <CircleMarker
            key={i}
            center={[loc.lat, loc.lng]}
            radius={loc.multi ? 7 : 5}
            pathOptions={{
              color: '#fff',
              weight: 1.5,
              fillColor: loc.multi ? '#e8420a' : '#2b7de9',
              fillOpacity: 0.95,
            }}
            eventHandlers={{ click: () => onSelect(loc) }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              {locationLabel(loc)}
            </Tooltip>
          </CircleMarker>
        ))}

        {userPos && (
          <Marker
            position={[userPos.lat, userPos.lon]}
            icon={userIcon}
            eventHandlers={{ click: onUserClick }}
          >
            <Tooltip direction="top" offset={[0, -10]} permanent>
              You are here
            </Tooltip>
          </Marker>
        )}

        <SelectedHighlight location={highlight} onClear={onClearHighlight} />
      </MapContainer>
    </div>
  );
}
