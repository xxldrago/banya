---
phase: 01-infrastructure-catalog-auth
plan: 03
subsystem: catalog
tags: [filters, sorting, map, leaflet, catalog-ui, nextjs]

requires:
  - 01-01
  - 01-02
provides:
  - Filter by type, guests, price range, amenities, district/address
  - Sort by price (asc/desc), newest (default)
  - Map view with Leaflet markers
  - List/map view toggle
  - GET /api/v1/catalog/venues (extended with filters)
  - GET /api/v1/catalog/venues/map (coordinates endpoint)
affects:
  - Phase 2 bookings (filtered catalog selection)
  - Phase 3 partner dashboard (map for partner venues)

actuals:
  tokens: 82000
  tasks: 3
  commits: 1

tech-stack:
  added:
    - leaflet
    - react-leaflet
    - leaflet.markercluster
  patterns:
    - Server-side filtering via Prisma where clauses
    - Client-side filter state with URL sync
    - Dynamic map component (SSR-safe with Next.js dynamic)
    - FitBounds for auto-centering map on venues

verification:
  - npx vitest run tests/catalog/: 34/34 pass
  - npm run build: success (all pages + API routes compile)
  - npx tsc --noEmit: 0 errors

must_haves_met:
  - "User can filter by type (bath/sauna)"
  - "User can filter by min guests (maxGuests >= N)"
  - "User can filter by price range (minPrice/maxPrice)"
  - "User can filter by amenities (ALL specified must match)"
  - "User can filter by district/address (case-insensitive contains)"
  - "User can sort by price_asc, price_desc, newest (default)"
  - "User can switch between list and map view"
  - "Map shows markers for all published+approved venues with lat/lng"
  - "Map auto-centers and fits bounds to visible venues"
  - "Empty state shown when no venues match filters"
  - "GET /api/v1/catalog/venues accepts filter query params"
  - "GET /api/v1/catalog/venues/map returns [{id, title, slug, lat, lng, priceFrom, type}]"
  - "Map endpoint returns 400 without cityId, 404 for unknown city"

key_links:
  - from: "src/app/(catalog)/catalog/page.tsx"
    to: "src/modules/catalog/catalog.service.ts"
    via: "getVenuesByCity(filters)"
  - from: "src/components/catalog/filter-bar.tsx"
    to: "src/app/(catalog)/catalog/page.tsx"
    via: "URLSearchParams sync"
  - from: "src/components/catalog/venue-map.tsx"
    to: "src/app/api/v1/catalog/venues/map/route.ts"
    via: "fetch /api/v1/catalog/venues/map?cityId=..."
  - from: "src/modules/catalog/map.service.ts"
    to: "prisma/schema.prisma"
    via: "prisma.venue.findMany(lat, lng not null)"
