/**
 * Part A - Step 4: Angle-of-draw buffer zone + consequence weighting.
 * Turf.js equivalent of QGIS's buffer tool + a distance-based weighting pass.
 *
 * Run: node buffer_zone.js
 * Output: ../data/buffer_zone.geojson, ../data/consequence_weights.geojson
 */
const turf = require("@turf/turf");
const fs = require("fs");

const panel = JSON.parse(fs.readFileSync("../data/panel_boundary.geojson"));
const assets = JSON.parse(fs.readFileSync("../data/surface_assets.geojson"));
const ncbGrid = JSON.parse(fs.readFileSync("../data/ncb_pfm_grid.geojson"));

const panelFeature = panel.features[0];
const depth_m = panelFeature.properties.depth_m;

// Angle of draw buffer: ~1.4-2x depth (using 1.7x as a middle estimate)
const drawAngleMultiplier = 1.7;
const bufferDistanceM = depth_m * drawAngleMultiplier;

const bufferZone = turf.buffer(panelFeature, bufferDistanceM, { units: "meters" });
fs.writeFileSync("../data/buffer_zone.geojson", JSON.stringify(bufferZone));
console.log(
  `Buffer zone generated: depth=${depth_m}m, buffer=${bufferDistanceM}m -> ../data/buffer_zone.geojson`
);

// Consequence weighting: for each NCB/PFM grid point, find distance to
// nearest surface asset and derive a consequence weight (closer = higher).
const weighted = {
  type: "FeatureCollection",
  features: ncbGrid.features.map((pt) => {
    let minDist = Infinity;
    let nearestWeight = 0;
    assets.features.forEach((asset) => {
      const d = turf.distance(pt, asset, { units: "meters" });
      if (d < minDist) {
        minDist = d;
        nearestWeight = asset.properties.weight;
      }
    });
    // consequence decays with distance, capped at asset's base weight
    const consequence_weight = Math.max(
      0,
      nearestWeight * (1 - minDist / 500) // influence fades out by 500m
    );
    return turf.feature(pt.geometry, {
      ...pt.properties,
      nearest_asset_distance_m: Math.round(minDist),
      consequence_weight: Math.round(consequence_weight * 100) / 100,
    });
  }),
};

fs.writeFileSync("../data/consequence_weights.geojson", JSON.stringify(weighted));
console.log(
  `Consequence weighting complete -> ../data/consequence_weights.geojson`
);