/**
 * Part A - Step 5: Composite risk scoring.
 * risk_score = w1*NCB_PFM_norm + w2*IDW_norm + w3*consequence_norm
 *
 * Run: node composite_risk.js
 * Output: ../data/composite_risk.geojson
 */
const turf = require("@turf/turf");
const fs = require("fs");

const consequenceGrid = JSON.parse(
  fs.readFileSync("../data/consequence_weights.geojson")
); // has subsidence_mm, strain_ue, consequence_weight per point
const idwGrid = JSON.parse(fs.readFileSync("../data/idw_grid.geojson"));

const W1 = 0.5; // NCB/PFM theoretical weight
const W2 = 0.3; // IDW historical-measurement weight
const W3 = 0.2; // consequence weight

function normalize(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return values.map((v) => (max === min ? 0 : (v - min) / (max - min)));
}

const strainAbs = consequenceGrid.features.map((f) =>
  Math.abs(f.properties.strain_ue)
);
const strainNorm = normalize(strainAbs);

const consequenceVals = consequenceGrid.features.map(
  (f) => f.properties.consequence_weight
);
const consequenceNorm = normalize(consequenceVals);

// For each NCB/PFM grid point, find nearest IDW-interpolated value (nearest neighbor,
// since IDW grid resolution differs from the NCB/PFM grid resolution)
function nearestIdwValue(point) {
  let minDist = Infinity;
  let val = 0;
  idwGrid.features.forEach((idwPt) => {
    const d = turf.distance(point, idwPt, { units: "meters" });
    if (d < minDist) {
      minDist = d;
      val = idwPt.properties.measured_subsidence_mm || 0;
    }
  });
  return val;
}

const idwVals = consequenceGrid.features.map((f) => nearestIdwValue(f));
const idwNorm = normalize(idwVals);

const result = {
  type: "FeatureCollection",
  features: consequenceGrid.features.map((f, i) => {
    const riskScore =
      W1 * strainNorm[i] + W2 * idwNorm[i] + W3 * consequenceNorm[i];
    return turf.feature(f.geometry, {
      ...f.properties,
      idw_subsidence_mm: Math.round(idwVals[i] * 100) / 100,
      risk_score: Math.round(riskScore * 1000) / 1000,
    });
  }),
};

fs.writeFileSync("../data/composite_risk.geojson", JSON.stringify(result));
console.log(
  `Composite risk scored for ${result.features.length} points -> ../data/composite_risk.geojson`
);
const scores = result.features.map((f) => f.properties.risk_score);
console.log(
  `risk_score range: ${Math.min(...scores).toFixed(3)} - ${Math.max(...scores).toFixed(3)}`
);