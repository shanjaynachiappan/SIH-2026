/**
 * Part A - Step 6: Turn scattered risk-scored points into zone polygons.
 * Turf.js equivalent of QGIS's "generate polygons from points" workflow.
 *
 * Run: node zone_polygons.js
 * Output: ../data/risk_zones.geojson
 */
const turf = require("@turf/turf");
const fs = require("fs");

const riskGrid = JSON.parse(fs.readFileSync("../data/composite_risk.geojson"));

function classify(score) {
  if (score >= 0.6) return "High";
  if (score >= 0.35) return "Medium";
  return "Low";
}

riskGrid.features.forEach((f) => {
  f.properties.risk_level = classify(f.properties.risk_score);
});

const levels = ["High", "Medium", "Low"];
const zonePolygons = [];

levels.forEach((level) => {
  const pointsInLevel = turf.featureCollection(
    riskGrid.features.filter((f) => f.properties.risk_level === level)
  );
  if (pointsInLevel.features.length < 4) return; // concave hull needs enough points

  try {
    const hull = turf.concave(pointsInLevel, { maxEdge: 60, units: "meters" });
    if (hull) {
      hull.properties = { risk_level: level, point_count: pointsInLevel.features.length };
      zonePolygons.push(hull);
    }
  } catch (e) {
    console.log(`  (concave hull failed for ${level}, falling back to convex hull)`);
    const hull = turf.convex(pointsInLevel);
    if (hull) {
      hull.properties = { risk_level: level, point_count: pointsInLevel.features.length };
      zonePolygons.push(hull);
    }
  }
});

const output = { type: "FeatureCollection", features: zonePolygons };
fs.writeFileSync("../data/risk_zones.geojson", JSON.stringify(output));
fs.writeFileSync("../data/composite_risk_classified.geojson", JSON.stringify(riskGrid));

console.log(`Generated ${zonePolygons.length} risk zone polygons -> ../data/risk_zones.geojson`);
zonePolygons.forEach((z) =>
  console.log(`  ${z.properties.risk_level}: ${z.properties.point_count} points`)
);