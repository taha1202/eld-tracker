"""
Hours-of-Service rules engine.

Pure Python — no Django/HTTP dependencies on purpose. This is the highest-risk
part of the assessment ("accuracy must be up to standards"), so it is isolated
and unit tested directly against the worked examples in FMCSA's own
"Interstate Truck Driver's Guide to Hours of Service" (April 2022), rather
than against our own assumptions about what's correct.

Scope, per the assessment's stated assumptions:
    - Property-carrying driver, 70-hr / 8-day cycle
    - No adverse driving conditions (so the 2-hr adverse-conditions extension
      is intentionally NOT modelled)
    - Fueling at least once every 1,000 miles
    - 1 hour each for pickup and dropoff

Deliberately NOT modelled (out of scope for this assessment):
    - Sleeper-berth split-pairing (§395.1(g)) — multi-driver / split-rest
      scheduling is an optional exception, not a baseline rule. A driver can
      always satisfy HOS with a single 10-consecutive-hour off-duty period,
      which is what this engine schedules.
    - The adverse driving conditions 2-hour extension (excluded by the brief).
    - Short-haul exceptions (this is an interstate multi-day trip planner).
"""

from dataclasses import dataclass, field
from typing import List, Optional


# ---- Duty status codes, matching the FMCSA "Driver's Daily Log" grid rows ----
OFF_DUTY = "OFF"
SLEEPER_BERTH = "SB"
DRIVING = "D"
ON_DUTY_NOT_DRIVING = "ON"

EPSILON = 1e-6


@dataclass
class RouteLeg:
    """One drive segment of the trip, e.g. current->pickup or pickup->dropoff."""
    label: str
    distance_miles: float


@dataclass
class DutySegment:
    """One block of time in the duty-status timeline (not yet clipped to a calendar day)."""
    status: str
    duration_hrs: float
    remark: Optional[str] = None
    distance_miles: Optional[float] = None


@dataclass
class HosConfig:
    avg_speed_mph: float = 55.0
    daily_driving_limit_hrs: float = 11.0
    daily_window_hrs: float = 14.0
    break_required_after_hrs: float = 8.0
    break_duration_hrs: float = 0.5
    off_duty_reset_hrs: float = 10.0
    cycle_limit_hrs: float = 70.0
    restart_hrs: float = 34.0
    fuel_interval_miles: float = 1000.0
    pickup_dropoff_hrs: float = 1.0
    fuel_stop_duration_hrs: float = 0.5
    use_sleeper_berth_for_rests: bool = True  # cosmetic: SB vs OFF for 10/34-hr rests


class HosLimitError(Exception):
    """Raised if the engine would produce a physically impossible schedule
    (e.g. a single leg longer than the vehicle could ever legally drive)."""


def _rest_status(cfg: HosConfig) -> str:
    return SLEEPER_BERTH if cfg.use_sleeper_berth_for_rests else OFF_DUTY


class DutyClock:
    """Tracks the four HOS counters that gate how much driving can happen next."""

    def __init__(self, starting_cycle_used_hrs: float):
        self.driving_today = 0.0
        self.window_elapsed = 0.0
        self.since_last_break = 0.0
        self.cycle_used = starting_cycle_used_hrs
        self.miles_since_fuel = 0.0

    def reset_daily(self):
        self.driving_today = 0.0
        self.window_elapsed = 0.0
        self.since_last_break = 0.0
        # NOTE: a plain 10-hr reset does not reduce cycle_used — only the
        # 34-hr restart (or the rolling 8-day drop-off, out of scope for a
        # single forward-looking plan) reduces the 70-hr total.

    def reset_cycle(self):
        self.reset_daily()
        self.cycle_used = 0.0


def plan_trip(
    legs: List[RouteLeg],
    current_cycle_used_hrs: float,
    config: HosConfig = None,
) -> List[DutySegment]:
    """
    Turn an ordered list of drive legs into a full duty-status timeline,
    inserting every rest break, daily reset, cycle restart, fuel stop, and
    the 1-hr pickup/dropoff events required by the brief.

    `legs` must be ordered [current->pickup, pickup->dropoff, ...] — the
    engine inserts a 1-hr pickup event after the first leg and a 1-hr
    dropoff event after the last leg.
    """
    cfg = config or HosConfig()
    if not legs:
        return []

    clock = DutyClock(current_cycle_used_hrs)
    timeline: List[DutySegment] = []
    rest_status = _rest_status(cfg)

    def add(status, duration, remark=None, distance=None):
        if duration <= EPSILON:
            return
        timeline.append(DutySegment(status, round(duration, 4), remark, distance))

    def do_daily_reset(reason: str):
        add(rest_status, cfg.off_duty_reset_hrs, remark=reason)
        clock.reset_daily()

    def do_cycle_restart():
        add(rest_status, cfg.restart_hrs, remark="34-hour restart (70-hr cycle reset)")
        clock.reset_cycle()

    def do_break():
        add(OFF_DUTY, cfg.break_duration_hrs, remark="Required 30-minute break")
        clock.since_last_break = 0.0
        clock.window_elapsed += cfg.break_duration_hrs

    def do_fuel():
        add(ON_DUTY_NOT_DRIVING, cfg.fuel_stop_duration_hrs, remark="Fuel stop")
        clock.miles_since_fuel = 0.0
        clock.window_elapsed += cfg.fuel_stop_duration_hrs
        clock.cycle_used += cfg.fuel_stop_duration_hrs

    def do_on_duty_event(remark: str):
        add(ON_DUTY_NOT_DRIVING, cfg.pickup_dropoff_hrs, remark=remark)
        clock.window_elapsed += cfg.pickup_dropoff_hrs
        clock.cycle_used += cfg.pickup_dropoff_hrs

    for i, leg in enumerate(legs):
        remaining_hrs = leg.distance_miles / cfg.avg_speed_mph
        guard = 0
        while remaining_hrs > EPSILON:
            guard += 1
            if guard > 10_000:
                raise HosLimitError(f"Could not schedule leg '{leg.label}' — possible infinite loop.")

            if clock.cycle_used >= cfg.cycle_limit_hrs - EPSILON:
                do_cycle_restart()
            if (clock.driving_today >= cfg.daily_driving_limit_hrs - EPSILON
                    or clock.window_elapsed >= cfg.daily_window_hrs - EPSILON):
                do_daily_reset("Required 10-hour rest (11-hr driving / 14-hr window reached)")
            if clock.since_last_break >= cfg.break_required_after_hrs - EPSILON:
                do_break()

            miles_left_until_fuel = cfg.fuel_interval_miles - clock.miles_since_fuel
            hrs_left_until_fuel = (
                miles_left_until_fuel / cfg.avg_speed_mph if miles_left_until_fuel > EPSILON else float("inf")
            )

            chunk_hrs = min(
                remaining_hrs,
                cfg.daily_driving_limit_hrs - clock.driving_today,
                cfg.daily_window_hrs - clock.window_elapsed,
                cfg.break_required_after_hrs - clock.since_last_break,
                hrs_left_until_fuel,
                cfg.cycle_limit_hrs - clock.cycle_used,
            )
            if chunk_hrs <= EPSILON:
                # Nothing can advance — force whichever limit is tightest to
                # resolve on the next loop iteration rather than spin forever.
                chunk_hrs = EPSILON
            chunk_miles = chunk_hrs * cfg.avg_speed_mph

            add(DRIVING, chunk_hrs, remark=leg.label, distance=chunk_miles)
            clock.driving_today += chunk_hrs
            clock.window_elapsed += chunk_hrs
            clock.since_last_break += chunk_hrs
            clock.cycle_used += chunk_hrs
            clock.miles_since_fuel += chunk_miles

            remaining_hrs -= chunk_hrs

            if clock.miles_since_fuel >= cfg.fuel_interval_miles - EPSILON and remaining_hrs > EPSILON:
                do_fuel()

        if i == 0 and len(legs) > 1:
            do_on_duty_event("Pickup")
        if i == len(legs) - 1:
            do_on_duty_event("Dropoff")

    return timeline


def total_distance(legs: List[RouteLeg]) -> float:
    return sum(l.distance_miles for l in legs)


def total_driving_hours(timeline: List[DutySegment]) -> float:
    return round(sum(s.duration_hrs for s in timeline if s.status == DRIVING), 2)


def duty_day_count(timeline: List[DutySegment]) -> int:
    """Number of 24-hr log sheets the timeline will span (see log_sheet_builder)."""
    total_hrs = sum(s.duration_hrs for s in timeline)
    return max(1, int(total_hrs // 24) + (1 if total_hrs % 24 > EPSILON else 0))
