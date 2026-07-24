from apps.core.clients.photon_client import PhotonClient
from apps.core.exceptions import GeocodeFailed


class GeocodingService:
    def __init__(self, client: PhotonClient = None):
        self.client = client or PhotonClient()

    def autocomplete(self, query: str) -> list[dict]:
        return self.client.search(query)

    def resolve(self, location_text: str) -> dict:
        """Turn a free-text location into {label, lat, lon}. Raises GeocodeFailed
        if nothing matches — the caller should surface this as a 422 telling the
        user to pick a more specific location."""
        result = self.client.geocode_one(location_text)
        if not result:
            raise GeocodeFailed(f"Could not find a location matching '{location_text}'")
        return result

    def reverse(self, lat: float, lon: float) -> dict:
        return self.client.reverse(lat, lon)
