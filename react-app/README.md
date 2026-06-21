# Girard Ohio Rental Location Map

An interactive Progressive Web App that maps registered rental locations in
Girard, Ohio. Built with React + TypeScript + Vite + Leaflet and deployed to
GitHub Pages.

**Live:** https://mikecostarella.github.io/GirardOhioRentalLocations/

## What it shows

- **946 rental locations** plotted across Girard
  - **838 single-unit** properties (blue markers)
  - **108 multi-tenant** properties (orange markers)
  - **1,348 total rental units** across 95 streets
- A pulsing green **"You Are Here"** marker when geolocation is enabled

## Features

- **Map / List toggle** — view locations on an interactive Leaflet map or as a
  sorted, scrollable list (sorted by street, then street number).
- **Main menu drawer** — slide-out menu (hamburger, top-left) holding the view
  toggle, unit-type filter, search, geolocation, and source link.
- **Search** — find a location by street name, street number, apartment, or
  account number; results jump to the map and open details.
- **Unit-type filter** — show all locations, single-unit only, or
  multi-tenant only.
- **Location details** — click any marker or list row to see every rental unit
  at that point, with full address, ZIP, account number (when known), and
  coordinates, plus an "Open in Google Maps" link.
- **Geolocation** — "Show my location" drops a pulsing marker and flies to your
  current position.
- **PWA** — installable, offline-capable (data and shell are precached).

## Data model

The map reads `src/data/locations.json`, a flat array of location **points**.
Each point carries a coordinate, a `multi` flag, and one or more **units**:

```jsonc
{
  "lat": 41.15086,
  "lng": -80.70129,
  "multi": true,
  "units": [
    { "wan": "10297-001", "sn": "37 1/2", "apt": "", "st": "Abbey St NE",
      "city": "Girard", "state": "OH", "zip": "44420" }
  ]
}
```

- `wan` — account ID (may be `"nan"` when unknown; hidden in the UI)
- `sn` — street number (may include fractions like `"37 1/2"`)
- `apt` — unit label (`""`, `"up"`, `"down"`, letters, or numbers)

Single-unit points render blue; multi-tenant points render orange and list
every unit in the details modal.

## Development

```bash
cd react-app
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
npm run preview  # preview the production build
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the app
in `react-app/` and publishes `react-app/dist` to GitHub Pages.

The Vite `base` is `/GirardOhioRentalLocations/` and must match the repo name
exactly (case-sensitive). `public/.nojekyll` keeps GitHub Pages from mangling
the Vite asset paths.

## Tech stack

React 19 · TypeScript · Vite 6 · React-Leaflet 5 · Leaflet 1.9 ·
vite-plugin-pwa · GitHub Pages

---

Created by Mike Costarella · Costarella Innovations
