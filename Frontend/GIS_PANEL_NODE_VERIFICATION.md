============================================================
GIS PANEL + NODE HOVER VERIFICATION
============================================================

Single panel:             PASS
10–15 nodes:              PASS
All nodes inside panel:   PASS
Node distribution:        PASS
Backend coordinates:      PASS
Frontend markers:         PASS
Risk styling:             PASS
Zone polygons:            PASS
Node-zone mapping:        PASS
Hover tooltip:            PASS
Tooltip information:      PASS
Click popup:              PASS
Live updates:             PASS
No runtime mock data:     PASS
Cross-layer trace:        PASS

============================================================
FINAL GIS STATUS: PASS
============================================================

## Resolution Notes:
- Moved the deterministic coordinate mapping logic completely back into `backend/simulator.py`. The backend is now the 100% authoritative source of node locations.
- The 12 generated nodes are mathematically constrained to fit perfectly inside the singular white dashed panel boundaries.
- Hover tooltips rely natively on Leaflet's built-in `<Tooltip>` component to seamlessly display node risk status (LSTM, RF, Final) without requiring manual click events, while preserving the detailed popup on click.
- Frontend pseudo-random coordinate overrides have been entirely removed.
