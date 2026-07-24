import pytest

from apps.trips.services.hos_engine import plan_trip, RouteLeg, HosConfig, DRIVING
from apps.trips.services.log_sheet_builder import build_log_sheets


def test_every_day_totals_exactly_24_hours():
    cfg = HosConfig()
    legs = [RouteLeg("current->pickup", 190), RouteLeg("pickup->dropoff", 751)]
    timeline = plan_trip(legs, current_cycle_used_hrs=0, config=cfg)
    sheets = build_log_sheets(timeline, start_hour_of_day=6.0)

    for sheet in sheets:
        total = sum(seg.end_hr - seg.start_hr for seg in sheet.segments)
        assert total == pytest.approx(24.0, abs=1e-3), f"Day {sheet.day_number} totals {total}, not 24"


def test_totals_dict_matches_segment_sums():
    cfg = HosConfig()
    legs = [RouteLeg("current->pickup", 190), RouteLeg("pickup->dropoff", 751)]
    timeline = plan_trip(legs, current_cycle_used_hrs=0, config=cfg)
    sheets = build_log_sheets(timeline, start_hour_of_day=6.0)

    for sheet in sheets:
        assert sum(sheet.totals.values()) == pytest.approx(24.0, abs=1e-3)


def test_matches_941_mile_trip_spans_two_days():
    """Mirrors the trip used in the frontend mockups: Dallas -> Shreveport
    (pickup) -> Savannah (dropoff), ~941 miles, should span 2 daily logs."""
    cfg = HosConfig()
    legs = [RouteLeg("current->pickup", 190), RouteLeg("pickup->dropoff", 751)]
    timeline = plan_trip(legs, current_cycle_used_hrs=18.5, config=cfg)
    sheets = build_log_sheets(timeline, start_hour_of_day=6.0)

    assert len(sheets) == 2
    total_driving = sum(
        seg.end_hr - seg.start_hr
        for sheet in sheets for seg in sheet.segments if seg.status == DRIVING
    )
    assert total_driving == pytest.approx(941 / cfg.avg_speed_mph, abs=0.05)


def test_no_segment_crosses_midnight():
    cfg = HosConfig()
    legs = [RouteLeg("current->pickup", 190), RouteLeg("pickup->dropoff", 2600)]
    timeline = plan_trip(legs, current_cycle_used_hrs=0, config=cfg)
    sheets = build_log_sheets(timeline, start_hour_of_day=6.0)

    for sheet in sheets:
        for seg in sheet.segments:
            assert 0.0 <= seg.start_hr < seg.end_hr <= 24.0 + 1e-6
