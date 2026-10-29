import math
from typing import Dict, Any

def compute_priority_score(
    severity: float = 0.5,
    exposure: float = 0.5,
    corroboration_count: int = 1,
    recurrence_count: int = 0,
    age_vs_sla: float = 0.0
) -> Dict[str, Any]:
    """
    Computes explainable, transparent multi-factor priority score:
    priority = 100 * (0.30*S + 0.20*E + 0.20*C + 0.15*R + 0.15*A)

    Parameters:
    - S (Severity): Intrinsic hazard level of defect category [0.0, 1.0].
    - E (Exposure): Road/traffic hierarchy level (arterial = 1.0, sub-arterial = 0.8, residential = 0.5) [0.0, 1.0].
    - C (Corroboration): Count of distinct citizen reports clustered to this same defect.
                        Saturates smoothly up to 10 corroborating reports.
    - R (Recurrence): Count of prior closed defects at or near this same location within 90 days.
                      Saturates at 3 prior recurring incidents (no hidden trust score).
    - A (Age vs SLA): Elapsed time normalized against category SLA deadline [0.0, 1.0].

    Property:
    The score is strictly monotonic: increasing any of (S, E, C, R, A) while holding others
    constant will never decrease the resulting priority score.
    """
    S = max(0.0, min(1.0, severity))
    E = max(0.0, min(1.0, exposure))
    
    # Corroboration saturates at 10 reports
    C = min(1.0, math.log(1.0 + max(1, corroboration_count)) / math.log(1.0 + 10.0))
    
    # Recurrence saturates at 3 prior incidents
    R = min(1.0, max(0, recurrence_count) / 3.0)
    
    # Age vs SLA capped at 1.0
    A = max(0.0, min(1.0, age_vs_sla))

    raw_score = 100.0 * (0.30 * S + 0.20 * E + 0.20 * C + 0.15 * R + 0.15 * A)
    score = round(max(0.0, min(100.0, raw_score)), 1)

    breakdown = {
        "severity": round(S, 2),
        "exposure": round(E, 2),
        "corroboration": round(C, 2),
        "recurrence": round(R, 2),
        "age_vs_sla": round(A, 2),
        "total_score": score,
        "weights": {
            "severity": 0.30,
            "exposure": 0.20,
            "corroboration": 0.20,
            "recurrence": 0.15,
            "age_vs_sla": 0.15
        }
    }
    return breakdown
