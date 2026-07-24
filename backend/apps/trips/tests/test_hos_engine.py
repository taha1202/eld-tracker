"""
These tests don't hand-check one narrative example — they check that the
engine's *output* never violates any FMCSA rule, for a range of trip
lengths. That's a stronger guarantee than replaying one worked example,
since a scheduling bug could easily pass a single scenario by luck.
"""

import pytest

from apps.trips.services.hos_engine import (
    plan_trip, RouteLeg, HosConfig,
    DRIVING, ON_DUTY_NOT_DRIVING, OFF_DUTY, SLEEPER_BERTH,
)


def driving_periods_between_resets(timeline, cfg):
    """Split the timeline into duty periods separated by 10-hr+ rests, and
    return, for each period: (total_driving_hrs, total_window_hrs, max_cumulative_driving_before_any_break)."""
    periods = []
    driving = 0.0
    window = 0.0
    since_break = 0.0
    max_since_break = 0.0

    for seg in timeline:
        is_reset = seg.status in (OFF_DUTY, SLEEPER_BERTH) and seg.duration_hrs >= cfg.off_duty_reset_hrs - 1e-6
        if is_reset:
            periods.append((driving, window, max_since_break))
            driving, window, since_break, max_since_break = 0.0, 0.0, 0.0, 0.0
            continue

        window += seg.duration_hrs
        if seg.status == DRIVING:
            driving += seg.duration_hrs
            since_break += seg.duration_hrs
            max_since_break = max(max_since_break, since_break)
        elif seg.status in (OFF_DUTY,) and seg.duration_hrs < cfg.off_duty_reset_hrs:
            since_break = 0.0  # a short off-duty period is the 30-min break
        # ON_DUTY_NOT_DRIVING doesn't reset the break counter but also isn't driving

    periods.append((driving, window, max_since_break))
    return periods


@pytest.mark.parametrize("miles", [50, 190, 500, 941, 1500, 2600, 4200])
def test_never_exceeds_11_hour_driving_or_14_hour_window(miles):
    cfg = HosConfig()
    legs = [RouteLeg("current->pickup", miles * 0.2), RouteLeg("pickup->dropoff", miles * 0.8)]
    timeline = plan_trip(legs, current_cycle_used_hrs=0, config=cfg)

    for driving_hrs, window_hrs, _ in driving_periods_between_resets(timeline, cfg):
        assert driving_hrs <= cfg.daily_driving_limit_hrs + 1e-6, f"{driving_hrs} > 11-hr limit"
        assert window_hrs <= cfg.daily_window_hrs + 1e-6, f"{window_hrs} > 14-hr window"


@pytest.mark.parametrize("miles", [500, 941, 2600])
def test_never_drives_more_than_8_hours_without_a_break(miles):
    cfg = HosConfig()
    legs = [RouteLeg("current->pickup", miles * 0.2), RouteLeg("pickup->dropoff", miles * 0.8)]
    timeline = plan_trip(legs, current_cycle_used_hrs=0, config=cfg)

    for _, _, max_since_break in driving_periods_between_resets(timeline, cfg):
        assert max_since_break <= cfg.break_required_after_hrs + 1e-6


def test_fuel_stop_every_1000_miles():
    cfg = HosConfig()
    legs = [RouteLeg("current->pickup", 400), RouteLeg("pickup->dropoff", 2600)]
    timeline = plan_trip(legs, current_cycle_used_hrs=0, config=cfg)

    miles_since_fuel = 0.0
    for seg in timeline:
        if seg.status == DRIVING:
            miles_since_fuel += seg.distance_miles
            assert miles_since_fuel <= cfg.fuel_interval_miles + 1e-3
        elif seg.remark == "Fuel stop":
            miles_since_fuel = 0.0


def test_short_trip_needs_no_unnecessary_stops():
    """A 100-mile trip is well within one duty day — should be just
    drive / pickup / drive / dropoff, no rests, breaks, or fuel stops."""
    cfg = HosConfig()
    legs = [RouteLeg("current->pickup", 40), RouteLeg("pickup->dropoff", 60)]
    timeline = plan_trip(legs, current_cycle_used_hrs=0, config=cfg)

    statuses = [s.status for s in timeline]
    assert statuses.count(DRIVING) == 2
    assert statuses.count(ON_DUTY_NOT_DRIVING) == 2  # pickup + dropoff only
    assert OFF_DUTY not in statuses
    assert SLEEPER_BERTH not in statuses


def test_pickup_and_dropoff_are_exactly_one_hour_each():
    cfg = HosConfig()
    legs = [RouteLeg("current->pickup", 190), RouteLeg("pickup->dropoff", 751)]
    timeline = plan_trip(legs, current_cycle_used_hrs=0, config=cfg)

    pickup = [s for s in timeline if s.remark == "Pickup"]
    dropoff = [s for s in timeline if s.remark == "Dropoff"]
    assert len(pickup) == 1 and pickup[0].duration_hrs == 1.0
    assert len(dropoff) == 1 and dropoff[0].duration_hrs == 1.0


def test_70_hour_cycle_triggers_restart_before_exceeding_limit():
    cfg = HosConfig()
    # Start already at 65 hrs used — a long trip must force a 34-hr restart.
    legs = [RouteLeg("current->pickup", 100), RouteLeg("pickup->dropoff", 900)]
    timeline = plan_trip(legs, current_cycle_used_hrs=65.0, config=cfg)

    restart_segments = [s for s in timeline if s.remark and "34-hour restart" in s.remark]
    assert len(restart_segments) >= 1
    for s in restart_segments:
        assert s.duration_hrs == cfg.restart_hrs


def test_on_time_trip_with_zero_starting_cycle_never_touches_70_hour_limit():
    cfg = HosConfig()
    legs = [RouteLeg("current->pickup", 190), RouteLeg("pickup->dropoff", 751)]  # ~941 mi total
    timeline = plan_trip(legs, current_cycle_used_hrs=0, config=cfg)

    restart_segments = [s for s in timeline if s.remark and "34-hour restart" in s.remark]
    assert restart_segments == []


def test_total_distance_is_conserved():
    cfg = HosConfig()
    legs = [RouteLeg("current->pickup", 190), RouteLeg("pickup->dropoff", 751)]
    timeline = plan_trip(legs, current_cycle_used_hrs=0, config=cfg)

    driven = sum(s.distance_miles for s in timeline if s.status == DRIVING)
    assert driven == pytest.approx(941, abs=0.5)
