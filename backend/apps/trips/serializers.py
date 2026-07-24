from rest_framework import serializers

from apps.trips.models import Trip, Stop, LogSheet, DutySegment


class PlanTripRequestSerializer(serializers.Serializer):
    current_location = serializers.CharField(max_length=255)
    pickup_location = serializers.CharField(max_length=255)
    dropoff_location = serializers.CharField(max_length=255)
    current_cycle_used_hrs = serializers.FloatField(min_value=0, max_value=70)

    def validate(self, attrs):
        if attrs["pickup_location"].strip().lower() == attrs["dropoff_location"].strip().lower():
            raise serializers.ValidationError("Pickup and dropoff locations must be different.")
        return attrs


class DutySegmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = DutySegment
        fields = ["status", "start_hr", "end_hr", "remark"]


class LogSheetSerializer(serializers.ModelSerializer):
    segments = DutySegmentSerializer(many=True, read_only=True)

    class Meta:
        model = LogSheet
        fields = ["day_number", "totals", "segments"]


class StopSerializer(serializers.ModelSerializer):
    lon = serializers.FloatField(source='lng', read_only=True)

    class Meta:
        model = Stop
        fields = ["type", "location", "lat", "lon", "at_mile", "duration_hrs", "sequence"]


class TripSerializer(serializers.ModelSerializer):
    stops = StopSerializer(many=True, read_only=True)
    log_sheets = LogSheetSerializer(many=True, read_only=True)

    class Meta:
        model = Trip
        fields = [
            "id", "current_location", "pickup_location", "dropoff_location",
            "current_cycle_used_hrs", "distance_miles", "driving_hours", "duty_days",
            "route_geometry", "created_at", "stops", "log_sheets",
        ]


class TripListSerializer(serializers.ModelSerializer):
    """Lighter shape for the dashboard's recent-trips table — no geometry/segments."""
    fuel_stops_count = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = ["id", "current_location", "pickup_location", "dropoff_location",
                  "distance_miles", "duty_days", "driving_hours", "fuel_stops_count", "created_at"]

    def get_fuel_stops_count(self, obj):
        return obj.stops.filter(type=Stop.StopType.FUEL).count()
