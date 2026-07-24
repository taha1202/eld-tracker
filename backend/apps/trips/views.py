from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status as http_status

from apps.core.exceptions import DomainError
from apps.trips.serializers import PlanTripRequestSerializer, TripSerializer, TripListSerializer
from apps.trips.services.geocoding_service import GeocodingService
from apps.trips.services.trip_planner_service import TripPlannerService
from apps.trips.repositories.trip_repository import TripRepository


class GeocodeSearchView(APIView):
    """GET /api/geocode/?q=Dallas — proxies Photon so the frontend never talks
    to a third-party API directly (keeps rate limits/User-Agent server-side,
    and leaves room to add caching later without a frontend change)."""

    def get(self, request):
        query = request.query_params.get("q", "")
        try:
            results = GeocodingService().autocomplete(query)
        except DomainError as exc:
            return Response({"detail": str(exc)}, status=exc.http_status)
        return Response({"results": results})


class PlanTripView(APIView):
    """POST /api/trips/plan/ — the main endpoint. Body:
    { current_location, pickup_location, dropoff_location, current_cycle_used_hrs }
    """

    def post(self, request):
        req = PlanTripRequestSerializer(data=request.data)
        req.is_valid(raise_exception=True)
        data = req.validated_data

        try:
            plan_result = TripPlannerService().plan(
                current_location=data["current_location"],
                pickup_location=data["pickup_location"],
                dropoff_location=data["dropoff_location"],
                current_cycle_used_hrs=data["current_cycle_used_hrs"],
            )
        except DomainError as exc:
            return Response({"detail": str(exc)}, status=exc.http_status)

        trip = TripRepository().save_planned_trip(
            current_location=data["current_location"],
            pickup_location=data["pickup_location"],
            dropoff_location=data["dropoff_location"],
            current_cycle_used_hrs=data["current_cycle_used_hrs"],
            plan_result=plan_result,
        )

        return Response(TripSerializer(trip).data, status=http_status.HTTP_201_CREATED)


class TripDetailView(APIView):
    def get(self, request, trip_id: int):
        try:
            trip = TripRepository().get(trip_id)
        except Exception:
            return Response({"detail": "Trip not found."}, status=http_status.HTTP_404_NOT_FOUND)
        return Response(TripSerializer(trip).data)


class TripListView(APIView):
    def get(self, request):
        trips = TripRepository().list_recent()
        return Response(TripListSerializer(trips, many=True).data)
