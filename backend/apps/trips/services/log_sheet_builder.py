"""
Splits the continuous duty-status timeline produced by hos_engine.plan_trip()
"""

from dataclasses import dataclass, field
from typing import List

from apps.trips.services.hos_engine import DutySegment, DRIVING, ON_DUTY_NOT_DRIVING, SLEEPER_BERTH, OFF_DUTY

DAY_HRS = 24.0
EPSILON = 1e-6


@dataclass
class DaySegment:
    """A duty segment clipped to a single day, with hour-of-day start/end (0-24)."""
    status: str
    start_hr: float
    end_hr: float
    remark: str = None


@dataclass
class LogSheet:
    day_number: int
    segments: List[DaySegment] = field(default_factory=list)

    @property
    def totals(self):
        totals = {OFF_DUTY: 0.0, SLEEPER_BERTH: 0.0, DRIVING: 0.0, ON_DUTY_NOT_DRIVING: 0.0}
        for seg in self.segments:
            totals[seg.status] = round(totals[seg.status] + (seg.end_hr - seg.start_hr), 2)
        return totals


def build_log_sheets(timeline: List[DutySegment], start_hour_of_day: float = 6.0) -> List[LogSheet]:
    """
    `start_hour_of_day`: what time the trip begins on Day 1 (e.g. 6.0 = 6:00 AM),
    so the very first segment doesn't have to start at midnight.
    """
    sheets: List[LogSheet] = []
    cursor = start_hour_of_day  # position within the *current* day, 0-24
    day_number = 1
    current = LogSheet(day_number=day_number)

    if start_hour_of_day > EPSILON:
        current.segments.append(DaySegment(OFF_DUTY, 0.0, start_hour_of_day, remark="Off duty"))
    sheets.append(current)

    for seg in timeline:
        remaining = seg.duration_hrs
        remark = seg.remark
        while remaining > EPSILON:
            room_left_today = DAY_HRS - cursor
            take = min(remaining, room_left_today)
            current.segments.append(DaySegment(seg.status, cursor, cursor + take, remark))
            cursor += take
            remaining -= take
            remark = None  # only label the first slice of a segment that spans midnight

            if cursor >= DAY_HRS - EPSILON:
                day_number += 1
                current = LogSheet(day_number=day_number)
                sheets.append(current)
                cursor = 0.0

    if sheets and cursor < DAY_HRS - EPSILON:
        sheets[-1].segments.append(DaySegment(OFF_DUTY, cursor, DAY_HRS, remark="Off duty"))

    # Trim a trailing empty last day (can happen if the timeline ends exactly at midnight)
    if sheets and not sheets[-1].segments:
        sheets.pop()

    return sheets
