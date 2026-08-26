"""
Part A - Step 2: NCB + Profile Function Method (PFM) risk grid generator.

Takes panel geometry (W, H, m) and a center coordinate, computes the
theoretical subsidence/tilt/strain profile, and outputs a GeoJSON point
grid across the surface -- this is the bridge into the turf.js pipeline
(placement/*.js), which expects GeoJSON as input.

Run:
    python ncb_pfm.py
Output:
    ../data/ncb_pfm_grid.geojson
"""
import json
import numpy as np

# ---- Panel geometry (edit to match your target mine) ----
PANEL_CENTER_LON = 86.4304   # example: Jharia coalfield area
PANEL_CENTER_LAT = 23.7644
W = 150.0   # panel width (m)
H = 100.0   # depth (m)
M = 2.5     # extraction thickness (m)
A_FACTOR = 0.75  # NCB subsidence factor

GRID_HALF_EXTENT_M = 300.0   # how far out the grid extends from panel center
GRID_STEP_M = 15.0           # grid resolution

METERS_PER_DEG_LAT = 111_320.0


def meters_per_deg_lon(lat_deg):
    return 111_320.0 * np.cos(np.radians(lat_deg))


def subsidence_profile(x, W, H, m, a=A_FACTOR, k=None):
    """Profile Function Method (tanh-based)."""
    S_max = a * m
    if k is None:
        wh_ratio = W / H
        k = 4.0 / W if wh_ratio >= 1.4 else 3.0 / W
    return (S_max / 2) * (np.tanh(k * (x + W / 2)) - np.tanh(k * (x - W / 2)))


def derive_tilt_strain(x, S):
    tilt = np.gradient(S, x)
    strain = np.gradient(tilt, x)
    return tilt, strain


def build_grid():
    xs = np.arange(-GRID_HALF_EXTENT_M, GRID_HALF_EXTENT_M + GRID_STEP_M, GRID_STEP_M)
    ys = np.arange(-GRID_HALF_EXTENT_M, GRID_HALF_EXTENT_M + GRID_STEP_M, GRID_STEP_M)

    # 1D profile along x (panel long-axis), reused across all y for a simple
    # 2D approximation (fine for a prototype -- real 2D influence-function
    # modelling would vary this along y too).
    S_x = subsidence_profile(xs, W, H, M)
    tilt_x, strain_x = derive_tilt_strain(xs, S_x)

    m_per_lon = meters_per_deg_lon(PANEL_CENTER_LAT)

    features = []
    for xi, x in enumerate(xs):
        for y in ys:
            lon = PANEL_CENTER_LON + (x / m_per_lon)
            lat = PANEL_CENTER_LAT + (y / METERS_PER_DEG_LAT)
            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [round(lon, 6), round(lat, 6)]},
                "properties": {
                    "subsidence_mm": round(float(S_x[xi]) * 1000, 2),
                    "tilt_deg": round(float(np.degrees(tilt_x[xi])), 5),
                    "strain_ue": round(float(strain_x[xi]) * 1e6, 2),
                    "x_offset_m": float(x),
                    "y_offset_m": float(y),
                    "source": "NCB_PFM"
                }
            })

    return {"type": "FeatureCollection", "features": features}


if __name__ == "__main__":
    grid = build_grid()
    out_path = "../data/ncb_pfm_grid.geojson"
    with open(out_path, "w") as f:
        json.dump(grid, f)
    print(f"Generated {len(grid['features'])} grid points -> {out_path}")
    print(f"Panel: W={W}m H={H}m m={M}m  (W/H={W/H:.2f})")