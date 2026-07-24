from django.db import models


class Trip(models.Model):


    current_location = models.CharField(max_length=255)
    current_lat = models.FloatField(null=True, blank=True)
    current_lng = models.FloatField(null=True, blank=True)

    pickup_location = models.CharField(max_length=255)
    pickup_lat = models.FloatField(null=True, blank=True)
    pickup_lng = models.FloatField(null=True, blank=True)

    dropoff_location = models.CharField(max_length=255)
    dropoff_lat = models.FloatField(null=True, blank=True)
    dropoff_lng = models.FloatField(null=True, blank=True)

    current_cycle_used_hrs = models.FloatField(default=0.0)


    distance_miles = models.FloatField(null=True, blank=True)
    driving_hours = models.FloatField(null=True, blank=True)
    duty_days = models.PositiveIntegerField(null=True, blank=True)

    # Cached OSRM route so a saved trip doesn't depend on the public demo
    # server being up every time it's re-opened.
    route_geometry = models.JSONField(null=True, blank=True)


    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Trip #{self.pk}: {self.current_location} -> {self.dropoff_location}"


class Stop(models.Model):
    class StopType(models.TextChoices):
        PICKUP = "pickup", "Pickup"
        DROPOFF = "dropoff", "Dropoff"
        FUEL = "fuel", "Fuel"
        REST_BREAK = "rest_break", "30-minute break"
        SLEEPER_BERTH = "sleeper_berth", "Sleeper berth rest"
        RESTART = "restart", "34-hour restart"

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="stops")
    type = models.CharField(max_length=20, choices=StopType.choices)
    location = models.CharField(max_length=255, blank=True)
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    at_mile = models.FloatField(null=True, blank=True)
    duration_hrs = models.FloatField()
    sequence = models.PositiveIntegerField()

    class Meta:
        ordering = ["sequence"]


class LogSheet(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="log_sheets")
    day_number = models.PositiveIntegerField()
    totals = models.JSONField(default=dict)  # { OFF, SB, D, ON } -> hours

    class Meta:
        ordering = ["day_number"]
        unique_together = ("trip", "day_number")


class DutySegment(models.Model):
    class Status(models.TextChoices):
        OFF_DUTY = "OFF", "Off duty"
        SLEEPER_BERTH = "SB", "Sleeper berth"
        DRIVING = "D", "Driving"
        ON_DUTY = "ON", "On duty (not driving)"

    log_sheet = models.ForeignKey(LogSheet, on_delete=models.CASCADE, related_name="segments")
    status = models.CharField(max_length=3, choices=Status.choices)
    start_hr = models.FloatField()
    end_hr = models.FloatField()
    remark = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        ordering = ["start_hr"]
