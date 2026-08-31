#!/bin/bash
# Part A - full pipeline runner (Python physics step + turf.js GIS steps)
# Run from the placement/ directory: bash run_pipeline.sh

set -e

echo "== Step 2: NCB + PFM physics risk grid =="
(cd ../backend && python ncb_pfm.py)

echo ""
echo "== Step 3: IDW interpolation of historical points =="
node idw_interpolate.js

echo ""
echo "== Step 4: Angle-of-draw buffer + consequence weighting =="
node buffer_zone.js

echo ""
echo "== Step 5: Composite risk scoring =="
node composite_risk.js

echo ""
echo "== Step 5.5: Confidence scoring =="
node confidence_score.js

echo ""
echo "== Step 6: Risk zone polygons =="
node zone_polygons.js

echo ""
echo "== Step 7: Node placement + tier assignment =="
node node_placement.js

echo ""
echo "Pipeline complete. Final output: ../data/optimal_node_positions.geojson"
echo "Load this directly into React/Leaflet -- no format conversion needed."