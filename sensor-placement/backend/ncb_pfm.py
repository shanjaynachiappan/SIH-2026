"""
Part A - Step 2: CMRI subsidence risk grid generator.

CHANGED from the earlier NCB/tanh-PFM placeholder version:
  - Now implements the VERIFIED CMRI formula (Kumar, Singh & Sinha, 1973),
    confirmed via the IIT Roorkee/Kakatiya University dissertation citing it,
    cross-checked against real Padmavathi Colliery (SCCL) field data
    (measured subsidence factor 0.51, matching predicted 0.5-0.6 for hard
    strata).
        Sm = t * a * cos(d)
        a  = 0.5 * (0.9 + P)          [P = rock_factor.compute_P(...)]
        Y(x)  = Sm * (1 - x^2/l^2)^2   [subsidence profile]
        I(x)  = 4*(Sm/l) * (x/l - (x/l)^3)   [tilt]
        strain(x) = d(I)/dx            [derived]
  - Reads REAL panel geometry from ../data/panel_boundary.geojson instead of
    hardcoded constants -- this file is written dynamically by api_server.py
    per mine/panel before this script runs, so the same script works for any
    real panel without editing source.

Run:
    python ncb_pfm.py [--panel path/to/panel_boundary.geojson] [--out path/to/output.geojson]
Output:
    ../data/ncb_pfm_grid.geojson  (default)
"""
import json
import argparse
import numpy as np

from rock_factor import compute_P, subsidence_factor_a

METERS_PER_DEG_LAT = 111_320.0


def meters_per_deg_lon(lat_deg):
    return 111_320.0 * np.cos(np.radians(lat_deg))


def load_panel(panel_path):
    with open(panel_path) as f:
        panel = json.load(f)
    feature = panel["features"][0]
    props = feature["properties"]
    coords = feature["geometry"]["coordinates"][0]

    lons = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    center_lon = sum(lons) / len(lons)
    center_lat = sum(lats) / len(lats)

    W = float(props.get("width_m", 150.0))
    H = float(props.get("depth_m", 100.0))
    t = float(props.get("extraction_thickness_m", 2.5))
    d_deg = float(props.get("seam_dip_deg", 0.0))
    strata = props.get("strata")  # optional: [{"thickness_m":.., "category":".."}, ...]

    return {
        "center_lon": center_lon, "center_lat": center_lat,
        "W": W, "H": H, "t": t, "d_deg": d_deg, "strata": strata,
    }


def cmri_profile(x, Sm, l):
    """Y(x) = Sm * (1 - x^2/l^2)^2 -- verified CMRI subsidence trough profile."""
    ratio = np.clip(x / l, -1.0, 1.0)
    return Sm * (1 - ratio ** 2) ** 2


def cmri_tilt(x, Sm, l):
    """I(x) = 4*(Sm/l) * (x/l - (x/l)^3) -- verified CMRI tilt/slope."""
    ratio = x / l
    return 4 * (Sm / l) * (ratio - ratio ** 3)


def build_grid(panel_path="../data/panel_boundary.geojson",
                grid_half_extent_m=300.0, grid_step_m=15.0):
    panel = load_panel(panel_path)
    W, H, t, d_deg = panel["W"], panel["H"], panel["t"], panel["d_deg"]
    center_lon, center_lat = panel["center_lon"], panel["center_lat"]

    # --- Verified CMRI formula ---
    P = compute_P(panel["strata"])
    a = subsidence_factor_a(P)
    d_rad = np.radians(d_deg)
    Sm = t * a * np.cos(d_rad)   # max subsidence (meters)
    l = W / 2.0                  # distance to zero-subsidence point (half panel width)

    xs = np.arange(-grid_half_extent_m, grid_half_extent_m + grid_step_m, grid_step_m)
    ys = np.arange(-grid_half_extent_m, grid_half_extent_m + grid_step_m, grid_step_m)

    S_x = cmri_profile(xs, Sm, l)
    tilt_x = cmri_tilt(xs, Sm, l)
    strain_x = np.gradient(tilt_x, xs)  # signed -- positive = tensile, negative = compressive

    m_per_lon = meters_per_deg_lon(center_lat)

    features = []
    for xi, x in enumerate(xs):
        for y in ys:
            lon = center_lon + (x / m_per_lon)
            lat = center_lat + (y / METERS_PER_DEG_LAT)
            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [round(lon, 6), round(lat, 6)]},
                "properties": {
                    "subsidence_mm": round(float(S_x[xi]) * 1000, 2),
                    "tilt_deg": round(float(np.degrees(tilt_x[xi])), 5),
                    "strain_ue": round(float(strain_x[xi]) * 1e6, 2),
                    "x_offset_m": float(x),
                    "y_offset_m": float(y),
                    "source": "CMRI_1973",
                    "rock_factor_P": round(float(P), 3),
                    "subsidence_factor_a": round(float(a), 3),
                }
            })

    meta = {"W": W, "H": H, "t": t, "d_deg": d_deg, "P": P, "a": a,
            "Sm_mm": round(Sm * 1000, 2), "l": l}
    return {"type": "FeatureCollection", "features": features}, meta


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--panel", default="../data/panel_boundary.geojson")
    parser.add_argument("--out", default="../data/ncb_pfm_grid.geojson")
    args = parser.parse_args()

    grid, meta = build_grid(panel_path=args.panel)
    with open(args.out, "w") as f:
        json.dump(grid, f)

    print(f"Generated {len(grid['features'])} grid points -> {args.out}")
    print(f"Panel: W={meta['W']}m H={meta['H']}m t={meta['t']}m dip={meta['d_deg']}deg "
          f"(W/H={meta['W']/meta['H']:.2f})")
    print(f"CMRI: Rock Factor P={meta['P']:.3f}, subsidence factor a={meta['a']:.3f}, "
          f"Sm={meta['Sm_mm']}mm")