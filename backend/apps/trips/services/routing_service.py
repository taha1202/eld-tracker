from apps.core.clients.osrm_client import OsrmClient


class RoutingService:
    def __init__(self, client: OsrmClient = None):
        self.client = client or OsrmClient()

    def route(self, waypoints: list[dict]) -> dict:
        """waypoints: ordered list of {label, lat, lon}. Returns OSRM's route
        dict plus the per-leg distances needed by the HOS engine."""
        coords = [(wp["lon"], wp["lat"]) for wp in waypoints]
        result = self.client.route(coords)

        legs = []
        for i, leg in enumerate(result["legs"]):
            legs.append({
                "label": f"{waypoints[i]['label']} -> {waypoints[i + 1]['label']}",
                "distance_miles": leg["distance_miles"],
            })
        result["legs"] = legs
        return result
