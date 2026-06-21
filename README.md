# Girard Ohio Rental Locations

An interactive map of registered rental locations in Girard, Ohio — **946
locations** (838 single-unit and 108 multi-tenant, **1,348 units** in total) —
plotted from public records and filterable by unit type. Built as a React +
TypeScript + Vite Progressive Web App and deployed to GitHub Pages.

**Live site:** https://mikecostarella.github.io/GirardOhioRentalLocations/

## Features

- **946 rental locations on an interactive map.** Single-unit locations are
  drawn in blue and multi-tenant locations in orange, sized so the rarer
  multi-tenant markers stay visible. Click any marker for a detail dialog with
  the street, each unit's address and water-account number, coordinates, and a
  Google Maps link.
- **Filter by unit type and search.** A slide-out menu offers a text search
  (street, number, or account) and an All / Single / Multi unit-type filter,
  with live counts in the stats bar.
- **Map and list views.** Toggle between the map and a scrollable list of
  results. From the list, a **"Go To on Map"** button jumps the map to the
  selected location and marks it with a pulsing highlight ring.
- **Boundary overlays.** Trumbull County municipal (dashed orange) and township
  (indigo) outlines are shown by default and can be toggled from the Map Layers
  section of the menu. They render from static committed GeoJSON snapshots — no
  runtime GIS dependency.
- **"You are here" geolocation.** The app locates you on load (with permission),
  drops a pulsing marker, and a locate button re-centers on demand. If you're
  outside the Girard area it zooms out to keep Girard in frame. Clicking the
  marker opens a dialog with your accuracy, coordinates, and the jurisdiction
  you're standing in (computed offline by point-in-polygon against the boundary
  data).
- **Installable PWA.** Works offline after first load and can be installed to a
  phone home screen or desktop.

## Project layout

```
GirardOhioRentalLocations/
├── README.md
└── react-app/
    ├── public/
    │   └── data/
    │       ├── municipalities.geojson   # Trumbull County municipal boundaries
    │       └── townships.geojson         # Trumbull County township boundaries
    ├── src/
    │   ├── components/
    │   │   ├── RentalMap.tsx              # Leaflet map, markers, fly + highlight
    │   │   ├── RentalList.tsx             # list view
    │   │   ├── MenuDrawer.tsx             # hamburger menu: view, filters, layers
    │   │   ├── BoundaryLayers.tsx         # municipal / township overlays
    │   │   ├── DetailsModal.tsx           # rental location detail dialog
    │   │   └── LocationDialog.tsx         # "You are here" dialog
    │   ├── data/
    │   │   └── locations.json             # the 946 rental locations
    │   ├── useGeolocation.ts              # geolocation hook
    │   ├── jurisdiction.ts               # offline point-in-polygon resolver
    │   ├── lib.ts                         # formatting / filtering helpers
    │   ├── App.tsx
    │   └── App.css
    └── vite.config.ts
```

## Development

```bash
cd react-app
npm install
npm run dev        # start the local dev server
npm run build      # type-check (tsc -b) + production build
npm run preview    # preview the production build locally
```

### Tech stack

React 19, TypeScript, Vite, React-Leaflet / Leaflet, and `vite-plugin-pwa`.

## Deployment

Pushing to `main` builds the app and publishes it to GitHub Pages. The Vite
`base` is set to `/GirardOhioRentalLocations/` to match the project-site path;
the PWA scope and start URL match it as well.

After a deploy, hard-refresh the live site (Ctrl+Shift+R) so the service worker
serves the new bundle instead of the cached one.

## Notes & data sources

- Rental locations: public rental-registration records for Girard, Ohio.
- Boundary outlines: Trumbull County GIS (municipalities layer 108, townships
  layer 109), committed as static GeoJSON snapshots so the map has no runtime
  GIS dependency.
- Base map tiles: OpenStreetMap (© OpenStreetMap contributors).

---

Created by Mike Costarella.
