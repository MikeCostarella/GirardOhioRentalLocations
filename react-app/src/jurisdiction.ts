import type { FeatureCollection, Feature, Geometry, Position } from 'geojson';

// Resolve which jurisdiction a lat/lon falls in, offline, by point-in-polygon
// against the SAME committed boundary GeoJSON the map already uses
// (public/data/townships.geojson, public/data/municipalities.geojson).
//
// No runtime GIS fetch — the files are static snapshots served from the app.
// Municipalities take precedence over townships: an incorporated place (e.g.
// "Girard") sits inside a township's extent in the county data, and the city
// name is the more specific/useful answer.
//
// Field names match the county GIS schema (see BoundaryLayers.tsx):
//   townships.geojson      -> "TOWNSHIP"  (layer 109)
//   municipalities.geojson -> "NAME"      (layer 108)

const BASE = import.meta.env.BASE_URL;

interface NamedFeature {
  name: string;
  geometry: Geometry;
}

let muniCache: NamedFeature[] | null = null;
let twpCache: NamedFeature[] | null = null;
let loadPromise: Promise<void> | null = null;

async function fetchNamed(file: string, field: string): Promise<NamedFeature[]> {
  try {
    const res = await fetch(`${BASE}data/${file}`);
    if (!res.ok) return [];
    const fc = (await res.json()) as FeatureCollection;
    if (!fc.features || !Array.isArray(fc.features)) return [];
    return fc.features
      .filter(
        (f: Feature) =>
          f.geometry &&
          (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
      )
      .map((f: Feature) => ({
        name: String(f.properties?.[field] ?? '').trim(),
        geometry: f.geometry as Geometry,
      }))
      .filter((nf) => nf.name.length > 0);
  } catch {
    return [];
  }
}

// Load both boundary files once and cache them for the session.
function ensureLoaded(): Promise<void> {
  if (!loadPromise) {
    loadPromise = (async () => {
      [muniCache, twpCache] = await Promise.all([
        fetchNamed('municipalities.geojson', 'NAME'),
        fetchNamed('townships.geojson', 'TOWNSHIP'),
      ]);
    })();
  }
  return loadPromise;
}

// Ray-casting point-in-polygon for a single linear ring.
// point is [lng, lat] to match GeoJSON coordinate order.
function pointInRing(lng: number, lat: number, ring: Position[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// A polygon is an array of rings: [outer, hole1, hole2, ...]. A point is in the
// polygon if it's in the outer ring and not in any hole.
function pointInPolygon(lng: number, lat: number, rings: Position[][]): boolean {
  if (rings.length === 0) return false;
  if (!pointInRing(lng, lat, rings[0])) return false;
  for (let h = 1; h < rings.length; h++) {
    if (pointInRing(lng, lat, rings[h])) return false; // inside a hole
  }
  return true;
}

function pointInGeometry(lng: number, lat: number, geom: Geometry): boolean {
  if (geom.type === 'Polygon') {
    return pointInPolygon(lng, lat, geom.coordinates as Position[][]);
  }
  if (geom.type === 'MultiPolygon') {
    return (geom.coordinates as Position[][][]).some((poly) =>
      pointInPolygon(lng, lat, poly)
    );
  }
  return false;
}

function findName(lat: number, lon: number, features: NamedFeature[]): string | null {
  for (const f of features) {
    if (pointInGeometry(lon, lat, f.geometry)) return f.name;
  }
  return null;
}

// County GIS names are ALL CAPS (e.g. "GIRARD CITY", "LIBERTY"). Title-case
// them for display: "Girard City", "Liberty".
function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Resolve the jurisdiction label for a coordinate, e.g. "Girard City" or
 * "Liberty Township". Municipality takes precedence over township. Returns
 * null if the point falls outside every mapped boundary (or the data failed
 * to load).
 */
export async function resolveJurisdiction(
  lat: number,
  lon: number
): Promise<string | null> {
  await ensureLoaded();
  // Municipalities already carry their type ("GIRARD CITY", "MCDONALD VILLAGE").
  const muni = findName(lat, lon, muniCache ?? []);
  if (muni) return titleCase(muni);
  // Township field is a bare name ("LIBERTY") — add the "Township" suffix.
  const twp = findName(lat, lon, twpCache ?? []);
  if (twp) {
    const name = titleCase(twp);
    return /township$/i.test(name) ? name : `${name} Township`;
  }
  return null;
}
