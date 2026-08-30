/**
 * Part A - Step 3: IDW interpolation of sparse historical subsidence points.
 * Turf.js equivalent of QGIS's IDW interpolation tool.
 *
 * Run: node idw_interpolate.js
 * Output: ../data/idw_grid.geojson
 */
const turf = require("@turf/turf");
const fs = require("fs");

const historicalPoints = JSON.parse(
  fs.readFileSync("../data/historical_subsidence_points.geojson")
);

// Bounding box around the panel + buffer (roughly matches ncb_pfm.py's grid extent)
const bbox = [86.424, 23.760, 86.437, 23.769];
const cellSize = 0.3; // km

const interpolated = turf.interpolate(historicalPoints, cellSize, {
  gridType: "points",
  property: "measured_subsidence_mm",
  units: "kilometers",
  weight: 2, // IDW power parameter -- higher = nearer points dominate more
});

fs.writeFileSync("../data/idw_grid.geojson", JSON.stringify(interpolated));
console.log(
  `IDW interpolation complete: ${interpolated.features.length} points -> ../data/idw_grid.geojson`
);
console.log(
  "Sample:",
  interpolated.features[0].properties,
  interpolated.features[0].geometry.coordinates
);