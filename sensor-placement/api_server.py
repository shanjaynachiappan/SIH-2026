"""
Sensor Placement API — wraps the existing physics (CMRI) + turf.js pipeline
behind an HTTP API so BOTH dashboards can trigger/read it.

This is the missing piece both frontends were already built expecting:
  - Frontend/src/services/apiService.ts -> fetchNodePlacement() / runNodePlacement()
    already call VITE_SENSOR_PLACEMENT_API_URL (default http://localhost:8001/api)
  - frontend-2 (central) gets wired to the SAME endpoints via centralApiService.ts

Flow:
  1. Central dashboard's "Generate Placement" button -> POST /api/node-placement/run
  2. This endpoint writes a real panel_boundary.geojson from the request body,
     runs the existing pipeline (ncb_pfm.py -> idw -> buffer -> composite_risk
     -> confidence_score -> zone_polygons -> node_placement) via subprocess,
     reads the final GeoJSON outputs, caches the result keyed by mineId/panelId
     (and as "latest"), and returns it.
  3. Local dashboard's NodePlacementPage calls GET /api/node-placement on load
     -> returns the cached "latest" result -> same map renders there too,
     with ZERO changes needed to the local frontend (field names already match:
     node_tier, risk_level, risk_score, strain_ue, node_id, confidence_tier).

Run:
    pip install -r ../requirements-api.txt
    uvicorn api_server:app --host 0.0.0.0 --port 8001 --reload
"""
import json
import subprocess
import sys
from pathlib import Path
from typing import Optional, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend"
PLACEMENT_DIR = BASE_DIR / "placement"
DATA_DIR = BASE_DIR / "data"
CACHE_DIR = DATA_DIR / "cache"
CACHE_DIR.mkdir(exist_ok=True)

app = FastAPI(title="MineGuard Sensor Placement API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # hackathon/dev: both frontends' dev ports allowed
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- request/response models ----------
class LatLng(BaseModel):
    lat: float
    lng: float


class PanelInput(BaseModel):
    mineId: str = "MINE-01"
    panelId: str = "P-03"
    # Accept either [lat,lng] pairs (matches frontend MinePanel.geometry.coordinates)
    coordinates: List[List[float]]
    depthMeters: float = 100.0
    extractionThicknessM: float = 2.5
    seamDipDeg: float = 0.0
    waterRiskFlag: bool = False
    faultRiskFlag: bool = False
    oldWorkingsFlag: bool = False


class RunRequest(BaseModel):
    panel: PanelInput


# ---------- helpers ----------
def polygon_width_m(coords_latlng):
    """Rough width/height in meters from a lat/lng polygon bounding box."""
    lats = [c[0] for c in coords_latlng]
    lngs = [c[1] for c in coords_latlng]
    lat_span = max(lats) - min(lats)
    lng_span = max(lngs) - min(lngs)
    center_lat = sum(lats) / len(lats)
    import math
    height_m = lat_span * 111_320.0
    width_m = lng_span * 111_320.0 * math.cos(math.radians(center_lat))
    return max(width_m, 10.0), max(height_m, 10.0)


def write_panel_geojson(panel: PanelInput):
    width_m, _ = polygon_width_m(panel.coordinates)
    # GeoJSON polygon needs [lon, lat] order and a closed ring
    ring = [[c[1], c[0]] for c in panel.coordinates]
    if ring[0] != ring[-1]:
        ring.append(ring[0])

    geojson = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {
                "name": "panel_boundary",
                "width_m": round(width_m, 1),
                "depth_m": panel.depthMeters,
                "extraction_thickness_m": panel.extractionThicknessM,
                "seam_dip_deg": panel.seamDipDeg,
                "water_risk_flag": panel.waterRiskFlag,
                "fault_risk_flag": panel.faultRiskFlag,
                "old_workings_flag": panel.oldWorkingsFlag,
            },
            "geometry": {"type": "Polygon", "coordinates": [ring]},
        }],
    }
    with open(DATA_DIR / "panel_boundary.geojson", "w") as f:
        json.dump(geojson, f)
    return width_m


def run_pipeline():
    """Runs the physics + turf.js pipeline steps in order via subprocess,
    same sequence as run_pipeline.sh, so the tested/working scripts are
    reused unchanged rather than reimplemented."""
    py = sys.executable
    steps = [
        ([py, "ncb_pfm.py"], BACKEND_DIR),
        (["node", "idw_interpolate.js"], PLACEMENT_DIR),
        (["node", "buffer_zone.js"], PLACEMENT_DIR),
        (["node", "composite_risk.js"], PLACEMENT_DIR),
        (["node", "confidence_score.js"], PLACEMENT_DIR),
        (["node", "zone_polygons.js"], PLACEMENT_DIR),
        (["node", "node_placement.js"], PLACEMENT_DIR),
    ]
    for cmd, cwd in steps:
        result = subprocess.run(cmd, cwd=str(cwd), capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(
                f"Pipeline step failed: {' '.join(cmd)}\n{result.stderr}"
            )


def load_geojson(name):
    path = DATA_DIR / name
    with open(path) as f:
        return json.load(f)


def build_response(panel: PanelInput, width_m: float):
    nodes = load_geojson("optimal_node_positions.geojson")
    risk_zones = load_geojson("risk_zones.geojson")
    buffer_zone = load_geojson("buffer_zone.geojson")

    return {
        "mineId": panel.mineId,
        "panelId": panel.panelId,
        "panel_geometry": {
            "width_m": round(width_m, 1),
            "length_m": panel.depthMeters,  # kept for the field name the
            # local NodePlacementPage already reads (geojsonData.panel_geometry.length_m)
            "coordinates": [panel.coordinates],
        },
        "candidate_count": None,  # filled below if available
        "features": nodes["features"],
        "risk_zones": risk_zones["features"],
        "influence_zone": buffer_zone,
    }


# ---------- endpoints ----------
@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/node-placement/run")
def run_node_placement(req: RunRequest):
    panel = req.panel
    try:
        width_m = write_panel_geojson(panel)
        run_pipeline()
        response = build_response(panel, width_m)
        response["candidate_count"] = len(load_geojson("composite_risk.geojson")["features"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # cache per mine/panel AND as "latest" (local dashboard's GET reads latest)
    key = f"{panel.mineId}_{panel.panelId}"
    with open(CACHE_DIR / f"{key}.json", "w") as f:
        json.dump(response, f)
    with open(CACHE_DIR / "latest.json", "w") as f:
        json.dump(response, f)

    return response


@app.get("/api/node-placement")
def get_node_placement(mineId: Optional[str] = None, panelId: Optional[str] = None):
    if mineId and panelId:
        path = CACHE_DIR / f"{mineId}_{panelId}.json"
    else:
        path = CACHE_DIR / "latest.json"

    if not path.exists():
        raise HTTPException(status_code=404, detail="No placement generated yet")

    with open(path) as f:
        return json.load(f)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)