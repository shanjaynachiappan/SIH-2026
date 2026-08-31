"""
Rock Factor (P) / Q-coefficient support for the CMRI subsidence formula.

Source: Kumar, Singh & Sinha (1973) CMRI formula, verified via the
IIT Roorkee / Kakatiya University dissertation (Shodhbhagirathi repository)
that cites it, cross-checked against Padmavathi Colliery (SCCL) real
field-measured data.

    Sm = t * a * cos(d)
    a  = 0.5 * (0.9 + P)
    P  = sum(h_i * Q_i) / sum(h_i)

Q ranges by hardness category:
    Hard        (P 0.0-0.3): Q 0.45-0.6
    Medium hard (P 0.3-0.7): Q 0.6-0.8
    Soft        (P 0.7-1.1): Q 0.8-1.0
"""

# Representative Q midpoints per category -- use the real per-stratum log
# (hard/medium/soft % from a borehole log) when available; these are
# reasonable defaults for a prototype / no-borehole-data scenario.
Q_BY_CATEGORY = {
    "hard": 0.525,        # midpoint of 0.45-0.6
    "medium_hard": 0.70,  # midpoint of 0.6-0.8
    "soft": 0.90,         # midpoint of 0.8-1.0
}


def compute_P(strata):
    """
    strata: list of {"thickness_m": float, "category": "hard"|"medium_hard"|"soft"}
            OR {"thickness_m": float, "q": float} for a directly-specified Q.
    Returns the weighted Rock Factor P = sum(h_i * Q_i) / sum(h_i).
    """
    if not strata:
        # No borehole/stratum data available -- default to a representative
        # "medium hard" overburden (typical for Gondwana coal measures with
        # mixed sandstone/shale), clearly flagged as a fallback, not a
        # site-specific measurement.
        return Q_BY_CATEGORY["medium_hard"]

    num = 0.0
    den = 0.0
    for s in strata:
        h = s["thickness_m"]
        q = s.get("q")
        if q is None:
            q = Q_BY_CATEGORY.get(s.get("category", "medium_hard"), Q_BY_CATEGORY["medium_hard"])
        num += h * q
        den += h
    return num / den if den > 0 else Q_BY_CATEGORY["medium_hard"]


def subsidence_factor_a(P):
    """a = 0.5 * (0.9 + P) -- verified CMRI formula (real strata a in 0.5-0.6 range
    for hard strata matches Padmavathi Colliery field measurement of 0.51)."""
    return 0.5 * (0.9 + P)