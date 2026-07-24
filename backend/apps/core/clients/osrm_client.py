"""
Thin wrapper around OSRM's HTTP API (https://project-osrm.org/docs/v5.5.1/api/).

Points at the public demo server by default (router.project-osrm.org) — free,
open source, best-effort, no API key. Swap OSRM_BASE_URL in settings to point
at a self-hosted instance later without touching calling code.
"""

import requests
from django.conf import settings

from apps.core.exceptions import RouteNotFound, UpstreamServiceUnavailable

DEFAULT_TIMEOUT = 30  # seconds — the demo server is best-effort, fail fast


class OsrmClient:
    def __init__(self, base_url: str = None, timeout: int = DEFAULT_TIMEOUT):
        self.base_url = (base_url or getattr(settings, "OSRM_BASE_URL", "https://router.project-osrm.org")).rstrip("/")
        self.timeout = timeout

    def route(self, coordinates: list[tuple[float, float]]) -> dict:
        """
        coordinates: ordered list of (lon, lat) tuples — current, pickup, dropoff, ...
        Returns: { "distance_miles": float, "duration_hrs": float, "geometry": geojson, "legs": [...] }
        """
        coord_str = ";".join(f"{lon},{lat}" for lon, lat in coordinates)
        url = f"{self.base_url}/route/v1/driving/{coord_str}"
        params = {"overview": "full", "geometries": "geojson", "steps": "false"}

        try:
            resp = requests.get(url, params=params, timeout=self.timeout)
        except requests.RequestException as exc:
            raise UpstreamServiceUnavailable(f"OSRM request failed: {exc}") from exc

        if resp.status_code != 200:
            raise UpstreamServiceUnavailable(f"OSRM returned HTTP {resp.status_code}")

        data = resp.json()
        if data.get("code") != "Ok" or not data.get("routes"):
            raise RouteNotFound(f"OSRM could not find a route: {data.get('code')}")

        route = data["routes"][0]
        meters = route["distance"]
        seconds = route["duration"]

        return {
            "distance_miles": round(meters / 1609.34, 2),
            "duration_hrs": round(seconds / 3600, 2),
            "geometry": route["geometry"],
            "legs": [
                {"distance_miles": round(leg["distance"] / 1609.34, 2), "duration_hrs": round(leg["duration"] / 3600, 2)}
                for leg in route.get("legs", [])
            ],
        }
