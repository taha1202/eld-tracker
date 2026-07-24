"""
Validates rolling_on_duty_totals() against the exact worked example on p.11
of FMCSA's "Interstate Truck Driver's Guide to Hours of Service" (Apr 2022):

    # Day       Hours
    1 Sunday    0
    2 Monday    10
    3 Tuesday   8.5
    4 Wednesday 12.5
    5 Thursday  9
    6 Friday    10
    7 Saturday  12
    8 Sunday    5
    9 Monday    6
    10 Tuesday  0

    8-day total (Days 1-8)  = 67
    8-day total (Days 2-9)  = 73
    8-day total (Days 3-10) = 63
"""

from apps.trips.services.rolling_window import rolling_on_duty_totals, hours_available

FMCSA_EXAMPLE_DAILY_HOURS = [0, 10, 8.5, 12.5, 9, 10, 12, 5, 6, 0]


def test_matches_fmcsa_worked_example_exactly():
    totals = rolling_on_duty_totals(FMCSA_EXAMPLE_DAILY_HOURS, window_days=8)

    assert totals[7] == 67   # Days 1-8  (index 7 = Day 8)
    assert totals[8] == 73   # Days 2-9  (index 8 = Day 9)
    assert totals[9] == 63   # Days 3-10 (index 9 = Day 10)


def test_none_before_window_fills():
    totals = rolling_on_duty_totals(FMCSA_EXAMPLE_DAILY_HOURS, window_days=8)
    assert totals[:7] == [None] * 7


def test_hours_available():
    assert hours_available(cycle_used_hrs=67, cycle_limit_hrs=70) == 3
    assert hours_available(cycle_used_hrs=73, cycle_limit_hrs=70) == 0  # never negative
    assert hours_available(cycle_used_hrs=0, cycle_limit_hrs=70) == 70
