"""
Rolling on-duty window utility (60-hr/7-day and 70-hr/8-day).

Used by the dashboard's "cycle status" view to show a driver's current
rolling total from their recent daily hours. Validated directly against the
worked example on p.11 of FMCSA's Interstate Truck Driver's Guide to Hours
of Service (April 2022) — see apps/trips/tests/test_rolling_window.py.
"""

from typing import List, Optional


def rolling_on_duty_totals(daily_hours: List[float], window_days: int = 8) -> List[Optional[float]]:
    """
    For each day, return the sum of on-duty hours over the trailing
    `window_days` (inclusive of that day), or None if fewer than
    `window_days` of history exist yet.

    Matches FMCSA's example table exactly:
        daily_hours = [0, 10, 8.5, 12.5, 9, 10, 12, 5, 6, 0]  (Sun..Tue, 10 days)
        -> Days 1-8 total = 67, Days 2-9 total = 73, Days 3-10 total = 63
    """
    totals: List[Optional[float]] = []
    for i in range(len(daily_hours)):
        if i + 1 < window_days:
            totals.append(None)
        else:
            window = daily_hours[i - window_days + 1: i + 1]
            totals.append(round(sum(window), 2))
    return totals


def hours_available(cycle_used_hrs: float, cycle_limit_hrs: float = 70.0) -> float:
    return round(max(0.0, cycle_limit_hrs - cycle_used_hrs), 2)
