/**
 * Part A - Step 7: Node placement algorithm.
 * Generates candidate positions, assigns a node tier per position based on
 * which risk zone it falls in, then greedily filters for minimum spacing.
 *
 * Run: node node_placement.js
 * Output: ../data/optimal_node_positions.geojson
 */
const turf = require("@turf/turf");
const fs = require("fs");

const riskZones = JSON.parse(fs.readFileSync("../data/risk_zones.geojson"));
const riskGrid = JSON.parse(
  fs.readFileSync("../data/composite_risk_classified.geojson")
);
const bufferZone = JSON.parse(fs.readFileSync("../data/buffer_zone.geojson"));

// Minimum spacing (meters) between nodes, per tier -- denser for high-risk
const MIN_SPACING = { Full: 40, Lite: 80, Crack: 30 };

// FIX: only TENSILE (positive) strain causes cracking -- compressive strain
// (negative, typically near the trough center) does not. The original bug
// used Math.abs(strain), which wrongly routed high-magnitude compressive
// points (exactly where Full nodes belong -- near the retreat line, in the
// subsidence-dominant zone) into the Crack tier instead, leaving 0 Full
// nodes. Using signed strain fixes this.
const TENSILE_STRAIN_THRESHOLD_UE = 150; // microstrain; tune against your
// panel's actual strain range (inspect composite_risk_classified.geojson)

function tierForRiskLevel(level, isTensileCracking) {
  if (level === "High") return isTensileCracking ? "Crack" : "Full";
  if (level === "Medium") return "Lite";
  return "Lite"; // sparse coverage even in Low, matches buffer-zone lite deployment
}

// Candidate positions = the risk grid points themselves (already regularly spaced)
const candidates = riskGrid.features.map((f) => {
  const isTensileCracking = f.properties.strain_ue > TENSILE_STRAIN_THRESHOLD_UE; // signed, not abs
  const tier = tierForRiskLevel(f.properties.risk_level, isTensileCracking);
  return turf.feature(f.geometry, {
    ...f.properties,
    node_tier: tier,
  });
});

// Sort by risk_score descending so highest-risk candidates get placement priority
candidates.sort((a, b) => b.properties.risk_score - a.properties.risk_score);

const placed = [];
candidates.forEach((cand) => {
  const spacing = MIN_SPACING[cand.properties.node_tier];
  const tooClose = placed.some((p) => {
    if (p.properties.node_tier !== cand.properties.node_tier) return false;
    return turf.distance(p, cand, { units: "meters" }) < spacing;
  });
  if (!tooClose) {
    placed.push(cand);
  }
});

const output = { type: "FeatureCollection", features: placed };
fs.writeFileSync("../data/optimal_node_positions.geojson", JSON.stringify(output));

const counts = placed.reduce((acc, p) => {
  acc[p.properties.node_tier] = (acc[p.properties.node_tier] || 0) + 1;
  return acc;
}, {});

console.log(
  `Placed ${placed.length} nodes (from ${candidates.length} candidates) -> ../data/optimal_node_positions.geojson`
);
console.log("Node counts by tier:", counts);
console.log(
  "Reduction vs uniform full-sensor deployment: " +
    `${candidates.length} candidates -> ${placed.length} placed nodes, only ` +
    `${counts.Full || 0} are full nodes.`
);