import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { FeatureCollection, Feature, Geometry } from 'geojson';

interface Props {
  showMunicipalities: boolean;
  showTownships: boolean;
}

// Boundary layers are STATIC snapshots committed to public/data/*.geojson
// (see Documents/PLAYBOOK or the convert script). The app does NOT hit the
// county GIS server at runtime — that made boundaries flaky. We load the local
// files once, build the Leaflet layers in dedicated panes UNDER the markers,
// and toggle them by adding/removing from the map.
//
// Field names differ per source layer (matches the county GIS schema):
//   townships.geojson      -> "TOWNSHIP"  (layer 109)
//   municipalities.geojson -> "NAME"      (layer 108)

const BASE = import.meta.env.BASE_URL; // e.g. "/GirardOhioRentalLocations/"

// Casing (white halo) sits below the colored line so boundaries read against
// any basemap. Panes are below the default marker pane (z 600).
const PANE_TOWNSHIP_CASE = 'twpCase';
const PANE_TOWNSHIP_LINE = 'twpLine';
const PANE_MUNI_CASE = 'muniCase';
const PANE_MUNI_LINE = 'muniLine';

async function loadGeoJSON(file: string): Promise<FeatureCollection | null> {
  try {
    const res = await fetch(`${BASE}data/${file}`);
    if (!res.ok) return null;
    const text = await res.text();
    const json = JSON.parse(text) as FeatureCollection;
    if (!json.features || !Array.isArray(json.features)) return null;
    return json;
  } catch {
    return null;
  }
}

// Guard: getBounds() throws on non-polygon features; a single bad feature must
// not abort the whole layer build. We only keep (Multi)Polygon features.
function polygonsOnly(fc: FeatureCollection): Feature<Geometry>[] {
  return fc.features.filter(
    (f) =>
      f.geometry &&
      (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
  );
}

export default function BoundaryLayers({ showMunicipalities, showTownships }: Props) {
  const map = useMap();

  // Built layers, kept across renders so toggling is just add/remove.
  const twpCaseRef = useRef<L.GeoJSON | null>(null);
  const twpLineRef = useRef<L.GeoJSON | null>(null);
  const muniCaseRef = useRef<L.GeoJSON | null>(null);
  const muniLineRef = useRef<L.GeoJSON | null>(null);

  // Flipped to true ONLY on real unmount, so the first-mount StrictMode/
  // visibility re-render cleanup can't abort an in-flight async build.
  const disposedRef = useRef(false);

  // One-time: create panes + fetch + build the layers.
  useEffect(() => {
    disposedRef.current = false;

    // Panes, all under the marker pane (600). Casing below its line.
    function ensurePane(name: string, z: number) {
      if (!map.getPane(name)) {
        const p = map.createPane(name);
        p.style.zIndex = String(z);
        // Outlines shouldn't swallow marker clicks.
        p.style.pointerEvents = 'none';
      }
    }
    ensurePane(PANE_TOWNSHIP_CASE, 340);
    ensurePane(PANE_TOWNSHIP_LINE, 350);
    ensurePane(PANE_MUNI_CASE, 360);
    ensurePane(PANE_MUNI_LINE, 370);

    (async () => {
      const [twp, muni] = await Promise.all([
        loadGeoJSON('townships.geojson'),
        loadGeoJSON('municipalities.geojson'),
      ]);
      if (disposedRef.current) return;

      if (twp) {
        const feats = polygonsOnly(twp);
        twpCaseRef.current = L.geoJSON(feats, {
          pane: PANE_TOWNSHIP_CASE,
          interactive: false,
          style: { color: '#ffffff', weight: 6, opacity: 0.9, fill: false },
        });
        twpLineRef.current = L.geoJSON(feats, {
          pane: PANE_TOWNSHIP_LINE,
          interactive: false,
          style: {
            color: '#3730a3',
            weight: 3.5,
            opacity: 0.95,
            fill: true,
            fillColor: '#3730a3',
            fillOpacity: 0.05,
          },
        });
      }

      if (muni) {
        const feats = polygonsOnly(muni);
        muniCaseRef.current = L.geoJSON(feats, {
          pane: PANE_MUNI_CASE,
          interactive: false,
          style: { color: '#ffffff', weight: 7, opacity: 0.9, fill: false },
        });
        muniLineRef.current = L.geoJSON(feats, {
          pane: PANE_MUNI_LINE,
          interactive: false,
          style: {
            color: '#c2410c',
            weight: 4,
            opacity: 0.95,
            dashArray: '10 6',
            fill: false,
          },
        });
      }

      if (disposedRef.current) return;
      // Apply current visibility now that layers exist.
      syncVisibility();
    })();

    return () => {
      disposedRef.current = true;
      for (const ref of [twpCaseRef, twpLineRef, muniCaseRef, muniLineRef]) {
        if (ref.current && map.hasLayer(ref.current)) map.removeLayer(ref.current);
        ref.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Add/remove based on the toggles, whenever they (or the built layers) change.
  function syncVisibility() {
    const set = (layer: L.GeoJSON | null, on: boolean) => {
      if (!layer) return;
      const has = map.hasLayer(layer);
      if (on && !has) map.addLayer(layer);
      else if (!on && has) map.removeLayer(layer);
    };
    set(twpCaseRef.current, showTownships);
    set(twpLineRef.current, showTownships);
    set(muniCaseRef.current, showMunicipalities);
    set(muniLineRef.current, showMunicipalities);
  }

  useEffect(() => {
    syncVisibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMunicipalities, showTownships]);

  return null;
}
