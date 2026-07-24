from django.db import transaction

from apps.trips.models import Trip, Stop, LogSheet, DutySegment


class TripRepository:
    """The only place in the codebase that writes trip data to the DB.
    Services and views never touch the ORM directly for trips — this keeps
    persistence swappable and makes the planning logic trivially testable
    without a database (see apps/trips/tests, which import zero Django
    models)."""

    @transaction.atomic
    def save_planned_trip(self, *, current_location, pickup_location, dropoff_location,
                           current_cycle_used_hrs, plan_result: dict) -> Trip:
        wp = plan_result["waypoints"]

        trip = Trip.objects.create(
            current_location=current_location,
            current_lat=wp["current"]["lat"], current_lng=wp["current"]["lon"],
            pickup_location=pickup_location,
            pickup_lat=wp["pickup"]["lat"], pickup_lng=wp["pickup"]["lon"],
            dropoff_location=dropoff_location,
            dropoff_lat=wp["dropoff"]["lat"], dropoff_lng=wp["dropoff"]["lon"],
            current_cycle_used_hrs=current_cycle_used_hrs,
            distance_miles=plan_result["distance_miles"],
            driving_hours=plan_result["driving_hours"],
            duty_days=plan_result["duty_days"],
            route_geometry=plan_result["route_geometry"],
        )

        for i, stop in enumerate(plan_result["stops"]):
            Stop.objects.create(
                trip=trip,
                type=stop.get("type") or self._infer_stop_type(stop["label"]),
                location=stop.get("location") or stop["label"],
                lat=stop.get("lat"),
                lng=stop.get("lon"),
                at_mile=stop["at_mile"],
                duration_hrs=stop["duration_hrs"],
                sequence=i,
            )

        for sheet in plan_result["log_sheets"]:
            log_sheet = LogSheet.objects.create(trip=trip, day_number=sheet.day_number, totals=sheet.totals)
            DutySegment.objects.bulk_create([
                DutySegment(log_sheet=log_sheet, status=seg.status, start_hr=seg.start_hr,
                            end_hr=seg.end_hr, remark=seg.remark)
                for seg in sheet.segments
            ])

        return trip

    @staticmethod
    def _infer_stop_type(label: str) -> str:
        label_lower = label.lower()
        if "pickup" in label_lower:
            return Stop.StopType.PICKUP
        if "dropoff" in label_lower:
            return Stop.StopType.DROPOFF
        if "fuel" in label_lower:
            return Stop.StopType.FUEL
        if "restart" in label_lower:
            return Stop.StopType.RESTART
        if "sleeper" in label_lower or "10-hour" in label_lower:
            return Stop.StopType.SLEEPER_BERTH
        return Stop.StopType.REST_BREAK

    def get(self, trip_id: int) -> Trip:
        return Trip.objects.prefetch_related("stops", "log_sheets__segments").get(pk=trip_id)

    def list_recent(self, limit: int = 20):
        return Trip.objects.all()[:limit]
