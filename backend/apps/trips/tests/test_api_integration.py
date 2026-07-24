"""
Full-stack integration test: HTTP request in -> geocoding -> routing -> HOS
engine -> log sheets -> DB rows out.

OSRM and Photon are mocked here rather than called live, because this
sandbox's own network egress allowlist doesn't include photon.komoot.io or
router.project-osrm.org (confirmed via curl — `x-deny-reason: host_not_allowed`).
That's a constraint of this coding environment, not the app: on Render, with
normal outbound internet access, OsrmClient/PhotonClient hit the real public
endpoints exactly as written. Mocking at the client boundary here proves the
Django view -> service -> repository wiring is correct independent of that.
"""

import pytest
from unittest.mock import patch
from rest_framework.test import APIClient

from apps.trips.models import Trip, LogSheet, DutySegment


FAKE_GEOCODE = {
    "Dallas, TX": {"label": "Dallas, TX", "lat": 32.7767, "lon": -96.7970},
    "Shreveport, LA": {"label": "Shreveport, LA", "lat": 32.5252, "lon": -93.7502},
    "Savannah, GA": {"label": "Savannah, GA", "lat": 32.0809, "lon": -81.0912},
}

FAKE_ROUTE = {
    "distance_miles": 941.0,
    "duration_hrs": 17.1,
    "geometry": {"type": "LineString", "coordinates": [[-96.797, 32.7767], [-81.0912, 32.0809]]},
    "legs": [
        {"distance_miles": 190.0, "duration_hrs": 3.5},
        {"distance_miles": 751.0, "duration_hrs": 13.6},
    ],
}


@pytest.mark.django_db
@patch("apps.trips.services.routing_service.OsrmClient.route", return_value=FAKE_ROUTE)
@patch("apps.trips.services.geocoding_service.PhotonClient.geocode_one",
       side_effect=lambda q: FAKE_GEOCODE[q])
def test_plan_trip_end_to_end(mock_geocode, mock_route):
    client = APIClient()
    resp = client.post("/api/trips/plan/", {
        "current_location": "Dallas, TX",
        "pickup_location": "Shreveport, LA",
        "dropoff_location": "Savannah, GA",
        "current_cycle_used_hrs": 18.5,
    }, format="json")

    assert resp.status_code == 201, resp.data
    body = resp.json()

    assert body["distance_miles"] == 941.0
    assert body["duty_days"] == len(body["log_sheets"])
    assert body["duty_days"] >= 2  # 941 mi at 55mph is > 11-hr single-day driving limit

    # every log sheet totals 24 hours, per FMCSA's own requirement
    for sheet in body["log_sheets"]:
        assert sum(sheet["totals"].values()) == pytest.approx(24.0, abs=0.01)

    # a pickup and a dropoff stop exist, each 1 hour
    stop_labels = [s["location"] for s in body["stops"]]
    assert any("Pickup" in s for s in stop_labels)
    assert any("Dropoff" in s for s in stop_labels)

    # it actually persisted
    trip = Trip.objects.get(pk=body["id"])
    assert trip.distance_miles == 941.0
    assert LogSheet.objects.filter(trip=trip).count() == body["duty_days"]
    assert DutySegment.objects.filter(log_sheet__trip=trip).exists()


@pytest.mark.django_db
def test_plan_trip_rejects_identical_pickup_and_dropoff():
    client = APIClient()
    resp = client.post("/api/trips/plan/", {
        "current_location": "Dallas, TX",
        "pickup_location": "Shreveport, LA",
        "dropoff_location": "Shreveport, LA",
        "current_cycle_used_hrs": 10,
    }, format="json")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_plan_trip_rejects_cycle_hours_over_70():
    client = APIClient()
    resp = client.post("/api/trips/plan/", {
        "current_location": "Dallas, TX",
        "pickup_location": "Shreveport, LA",
        "dropoff_location": "Savannah, GA",
        "current_cycle_used_hrs": 95,
    }, format="json")
    assert resp.status_code == 400
