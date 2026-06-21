import type { RentalLocation, RentalUnit } from './types';

// Format a single unit into a one-line address.
// e.g. { sn: "37 1/2", apt: "up", st: "Abbey St NE" } -> "37 1/2 Abbey St NE (up)"
export function formatUnitAddress(u: RentalUnit): string {
  const base = `${u.sn} ${u.st}`.replace(/\s+/g, ' ').trim();
  const apt = u.apt.trim();
  return apt ? `${base} (${apt})` : base;
}

// A short label for a whole location point, used in markers/list rows.
// Single-unit points read as their one address; multi points read as a
// street-number summary, e.g. "241 Churchill Rd (9 units)".
export function locationLabel(loc: RentalLocation): string {
  if (loc.units.length === 0) return 'Unknown';
  const first = loc.units[0];
  if (!loc.multi || loc.units.length === 1) {
    return formatUnitAddress(first);
  }
  const base = `${first.sn} ${first.st}`.replace(/\s+/g, ' ').trim();
  return `${base} (${loc.units.length} units)`;
}

// The street name for a location (taken from its first unit).
export function locationStreet(loc: RentalLocation): string {
  return loc.units[0]?.st.trim() ?? '';
}

// Whether the WAN/account looks present (the source uses "nan" for unknown).
export function hasAccount(wan: string): boolean {
  return !!wan && wan.toLowerCase() !== 'nan';
}

// Does this location match a free-text query? Matches on street, number,
// apartment, or account across any of its units.
export function locationMatches(loc: RentalLocation, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return loc.units.some((u) => {
    const hay = `${u.sn} ${u.apt} ${u.st} ${u.zip} ${u.wan}`.toLowerCase();
    return hay.includes(needle);
  });
}

export type UnitFilter = 'all' | 'single' | 'multi';

// Apply the unit-type filter plus an optional text query.
export function filterLocations(
  locations: RentalLocation[],
  filter: UnitFilter,
  query: string
): RentalLocation[] {
  return locations.filter((loc) => {
    if (filter === 'single' && loc.multi) return false;
    if (filter === 'multi' && !loc.multi) return false;
    return locationMatches(loc, query);
  });
}

// Stable sort key: street name, then numeric street number, then apt.
export function compareLocations(a: RentalLocation, b: RentalLocation): number {
  const sa = locationStreet(a);
  const sb = locationStreet(b);
  if (sa !== sb) return sa.localeCompare(sb);
  const na = parseInt(a.units[0]?.sn ?? '0', 10) || 0;
  const nb = parseInt(b.units[0]?.sn ?? '0', 10) || 0;
  return na - nb;
}
