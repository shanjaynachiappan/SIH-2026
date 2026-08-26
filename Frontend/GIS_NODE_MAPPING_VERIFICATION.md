============================================================
GIS NODE VISUALIZATION VERIFICATION
============================================================

Node coordinates:          PASS
Node markers:              PASS
Correct map positions:     PASS
Risk styling:              PASS
Zone polygons:             PASS
Node-zone mapping:         PASS
Live updates:              PASS
No runtime mock nodes:     PASS
Frontend/backend match:    PASS

GIS VISUALIZATION STATUS: PASS

## Changes Made:
- Removed `isSimulating` barrier in `MineGISMap.tsx` so nodes and zones load immediately on mount without clicking "Start Sim".
- Removed hardcoded `mockMinePanel` geometry and its static `<Polygon>` from the map.
- Implemented a dynamic bounding box calculation in `MineGISMap.tsx` that derives its extent from the live `nodes` and `riskZones` API responses, fitting the map bounds to the exact geographic footprint of the simulated mine.
- Expanded `RiskZones.tsx` color mapping to explicitly handle backend-issued `WARNING` and `NORMAL` zone_risk statuses.
- Node rendering already perfectly converts the backend JSON keys to the `NodeMarkers` payload, successfully delegating risk categorization exclusively to the backend AI layer.
