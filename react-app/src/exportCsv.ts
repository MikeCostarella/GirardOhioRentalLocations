import type { RentalLocation } from './types';
import { hasAccount } from './lib';

/**
 * Build and download the rental locations as a .csv, with NO external
 * dependency (RFC-4180 text + a client-side Blob download).
 *
 * Exports whatever set of locations it's handed — App passes the currently
 * filtered list, so the download matches what's shown on the map/list.
 *
 * Output is ONE ROW PER UNIT: each unit carries its own account number and
 * address, and the location's coordinates and single/multi flag are repeated
 * on each of its unit rows. Column order is human-first (account, address…)
 * with coordinates last.
 */

// Quote a single CSV field per RFC 4180: wrap in quotes if it contains a comma,
// quote, or newline; double any embedded quotes.
function csvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// Collapse the doubled spaces present in some source street names.
function clean(s: string): string {
  return (s ?? '').replace(/\s+/g, ' ').trim();
}

/** Build the CSV text (header + one row per unit) for a set of locations. */
export function locationsToCsv(locations: RentalLocation[]): string {
  const header = [
    'Account',
    'Street Number',
    'Unit',
    'Street',
    'City',
    'State',
    'ZIP',
    'Type',
    'Latitude',
    'Longitude',
  ];

  const rows: string[] = [];
  for (const loc of locations) {
    const type = loc.multi ? 'Multi-tenant' : 'Single unit';
    for (const u of loc.units) {
      rows.push(
        [
          hasAccount(u.wan) ? u.wan : '',
          clean(u.sn),
          clean(u.apt),
          clean(u.st),
          clean(u.city),
          clean(u.state),
          clean(u.zip),
          type,
          loc.lat,
          loc.lng,
        ]
          .map(csvField)
          .join(',')
      );
    }
  }

  // Lead with a BOM so Excel detects UTF-8.
  return '\uFEFF' + [header.map(csvField).join(','), ...rows].join('\r\n');
}

/** Count how many unit rows an export of these locations would produce. */
export function unitCount(locations: RentalLocation[]): number {
  return locations.reduce((n, loc) => n + loc.units.length, 0);
}

/** Trigger a browser download of the given locations as a .csv file. */
export function downloadLocationsCsv(
  locations: RentalLocation[],
  filenameBase = 'girard-rental-locations'
): void {
  const csv = locationsToCsv(locations);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const stamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenameBase}-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
