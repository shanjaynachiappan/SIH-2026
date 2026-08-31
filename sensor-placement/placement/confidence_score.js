/**
 * Part A - Step 5.5 (NEW): Confidence scoring.
 *
 * Every risk-scored point gets a confidence_tier (Low/Medium/High) based on
 * how much the prediction should be trusted -- not every point in
 * composite_risk.geojson is equally reliable. This is what makes the
 * "reasonable estimate, not guaranteed accurate" claim demonstrable on a
 * map instead of just asserted in prose, and it's the signal
 * node_placement.js uses to compensate low-confidence zones with denser
 * Lite coverage.
 *
 * Inputs combined into one tier:
 *   1. W/H extremity        -- outside the ~0.5-3 validated range -> penalize
 *   2. Local IDW point density -- few real historical points nearby -> penalize
 *   3. Unmodeled-factor flags -- water/fault/old-workings present -> penalize
 *   4. Regional benchmark deviation -- if provided, how far off a known
 *      measured rate (e.g. Raniganj -21.18mm/yr) the prediction tracks
 *
 * Run: node confidence_score.js
 * Overwrites: ../data/composite_risk.geojson (adds confidence_tier in place,
 * so zone_polygons.js and node_placement.js pick it up automatically via
 * their existing property spread/pass-through -- no changes needed there
 * beyond node_placement.js's spacing use, which IS updated separately).
 */
const turf = require("@turf/turf");
const fs = require("fs");

const riskGrid = JSON.parse(fs.readFileSync("../data/composite_risk.geojson"));
const idwPoints = JSON.parse(
  fs.readFileSync("../data/historical_subsidence_points.geojson")
);
const panel = JSON.parse(fs.readFileSync("../data/panel_boundary.geojson"));

const panelProps = panel.features[0].properties;
const W = panelProps.width_m;
const H = panelProps.depth_m;
const whRatio = W / H;

// Optional flags -- read from panel properties if present, default false
const hasWaterRisk = !!panelProps.water_risk_flag;
const hasFaultRisk = !!panelProps.fault_risk_flag;
const hasOldWorkings = !!panelProps.old_workings_flag;
const unmodeledFactorCount =
  (hasWaterRisk ? 1 : 0) + (hasFaultRisk ? 1 : 0) + (hasOldWorkings ? 1 : 0);

// Optional regional benchmark deviation -- e.g. 0.0-1.0, 0 = perfect match.
// If not provided, this input is neutral (doesn't penalize or boost).
const benchmarkDeviation =
  panelProps.benchmark_deviation !== undefined ? panelProps.benchmark_deviation : null;

const DENSITY_RADIUS_M = 300; // "nearby" = within this radius for point-density check

function localIdwDensity(point) {
  let count = 0;
  idwPoints.features.forEach((p) => {
    const d = turf.distance(point, p, { units: "meters" });
    if (d <= DENSITY_RADIUS_M) count++;
  });
  return count;
}

function scoreConfidence(point) {
  let penalty = 0;

  // 1. W/H extremity
  if (whRatio < 0.5 || whRatio > 3.0) penalty += 2;
  else if (whRatio < 0.8 || whRatio > 2.0) penalty += 1;

  // 2. Local IDW point density
  const density = localIdwDensity(point);
  if (density === 0) penalty += 2;
  else if (density <= 2) penalty += 1;

  // 3. Unmodeled-factor flags
  penalty += unmodeledFactorCount;

  // 4. Regional benchmark deviation (only if provided)
  if (benchmarkDeviation !== null) {
    if (benchmarkDeviation > 0.5) penalty += 2;
    else if (benchmarkDeviation > 0.2) penalty += 1;
  }

  if (penalty >= 4) return "Low";
  if (penalty >= 2) return "Medium";
  return "High";
}

riskGrid.features.forEach((f) => {
  f.properties.confidence_tier = scoreConfidence(f);
});

fs.writeFileSync("../data/composite_risk.geojson", JSON.stringify(riskGrid));

const tally = riskGrid.features.reduce((acc, f) => {
  acc[f.properties.confidence_tier] = (acc[f.properties.confidence_tier] || 0) + 1;
  return acc;
}, {});
console.log(`Confidence scoring complete for ${riskGrid.features.length} points.`);
console.log("Confidence tier distribution:", tally);
console.log(
  `Inputs: W/H=${whRatio.toFixed(2)}, unmodeled factors=${unmodeledFactorCount}` +
    (benchmarkDeviation !== null ? `, benchmark_deviation=${benchmarkDeviation}` : "")
);