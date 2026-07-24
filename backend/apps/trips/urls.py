from django.urls import path

from apps.trips.views import GeocodeSearchView, PlanTripView, TripDetailView, TripListView

urlpatterns = [
    path("geocode/", GeocodeSearchView.as_view(), name="geocode-search"),
    path("trips/plan/", PlanTripView.as_view(), name="trip-plan"),
    path("trips/<int:trip_id>/", TripDetailView.as_view(), name="trip-detail"),
    path("trips/", TripListView.as_view(), name="trip-list"),
]
