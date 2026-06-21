// A single rental unit (one account / one tenant space).
export interface RentalUnit {
  wan: string; // account ID; may be "nan" when unknown
  sn: string; // street number; may include fractions like "37 1/2"
  apt: string; // apartment / unit label; may be "", "up", "down", letters, numbers
  st: string; // street name
  city: string;
  state: string;
  zip: string;
}

// A geographic point. One coordinate may carry one or many units.
// `multi` is true for multi-unit / multi-tenant points.
export interface RentalLocation {
  lat: number;
  lng: number;
  multi: boolean;
  units: RentalUnit[];
}

// View modes for the map/list toggle.
export type ViewMode = 'map' | 'list';
