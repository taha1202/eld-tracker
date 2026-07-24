"""
Thin wrapper around Photon (https://photon.komoot.io) — an open-source,
OSM-based geocoder built specifically for search-as-you-type.

Deliberately NOT Nominatim: Nominatim's usage policy explicitly forbids
building autocomplete on its public API ("Auto-complete search: This is not
yet supported by Nominatim and you must not implement such a service on the
client side using the API" — operations.osmfoundation.org/policies/nominatim).
Photon is the compliant, purpose-built alternative on the same OSM data.
"""

import requests
from django.conf import settings

from apps.core.exceptions import UpstreamServiceUnavailable

DEFAULT_TIMEOUT = 6  # seconds — used interactively as the user types


class PhotonClient:
    def __init__(self, base_url: str = None, timeout: int = DEFAULT_TIMEOUT):
        self.base_url = (base_url or getattr(settings, "PHOTON_BASE_URL", "https://photon.komoot.io/api")).rstrip("/")
        self.timeout = timeout

    def search(self, query: str, limit: int = 5) -> list[dict]:
        """Returns a list of { label, lat, lon } candidates for autocomplete."""
        if not query or len(query.strip()) < 2:
            return []

        try:
            resp = requests.get(
                self.base_url,
                params={"q": query, "limit": 15},  # request more to ensure we get US results after filtering
                timeout=self.timeout,
                headers={"User-Agent": "eld-tracker/1.0"},
            )
        except requests.RequestException as exc:
            raise UpstreamServiceUnavailable(f"Photon request failed: {exc}") from exc

        if resp.status_code != 200:
            raise UpstreamServiceUnavailable(f"Photon returned HTTP {resp.status_code}")

        features = resp.json().get("features", [])
        results = []
        for f in features:
            props = f.get("properties", {})
            if props.get("countrycode", "").upper() != "US" and props.get("country", "") != "United States":
                continue
            lon, lat = f["geometry"]["coordinates"]
            label_parts = [props.get(k) for k in ("name", "city", "state", "country") if props.get(k)]
            results.append({
                "label": ", ".join(dict.fromkeys(label_parts)),  # dedupe while preserving order
                "lat": lat,
                "lon": lon,
            })
            if len(results) >= limit:
                break
        return results

    def geocode_one(self, query: str) -> dict:
        """Used server-side by the trip planner — takes the top match."""
        results = self.search(query, limit=1)
        if not results:
            return None
        return results[0]

    def reverse(self, lat: float, lon: float) -> dict:
        """Reverse geocode coordinates into a {label, lat, lon} dict."""
        try:
            resp = requests.get(
                f"{self.base_url.replace('/api', '')}/reverse",
                params={"lat": lat, "lon": lon, "limit": 1},
                timeout=self.timeout,
                headers={"User-Agent": "eld-tracker/1.0"},
            )
        except requests.RequestException as exc:
            raise UpstreamServiceUnavailable(f"Photon reverse request failed: {exc}") from exc

        if resp.status_code != 200:
            raise UpstreamServiceUnavailable(f"Photon returned HTTP {resp.status_code}")

        features = resp.json().get("features", [])
        if not features:
            return {"label": "Unknown Location", "lat": lat, "lon": lon}
            
        f = features[0]
        props = f.get("properties", {})
        label_parts = [props.get(k) for k in ("name", "city", "state", "country") if props.get(k)]
        
        return {
            "label": ", ".join(dict.fromkeys(label_parts)),
            "lat": lat,
            "lon": lon,
        }

