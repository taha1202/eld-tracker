from apps.trips.services.geocoding_service import GeocodingService
from apps.trips.services.routing_service import RoutingService
from apps.trips.services.hos_engine import plan_trip, RouteLeg, HosConfig, total_driving_hours, duty_day_count
from apps.trips.services.log_sheet_builder import build_log_sheets


import math

def haversine_miles(lon1, lat1, lon2, lat2):
    R = 3959.87433
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    return R * 2 * math.asin(math.sqrt(a))

def interpolate_polyline(geometry, target_distance_miles):
    coords = geometry.get("coordinates", [])
    if not coords:
        return None
    
    cumulative_distance = 0.0
    for i in range(len(coords) - 1):
        p1 = coords[i]
        p2 = coords[i + 1]
        dist = haversine_miles(p1[0], p1[1], p2[0], p2[1])
        
        if cumulative_distance + dist >= target_distance_miles:
            remainder = target_distance_miles - cumulative_distance
            if dist == 0:
                return {"lat": p2[1], "lon": p2[0]}
            ratio = remainder / dist
            interp_lon = p1[0] + (p2[0] - p1[0]) * ratio
            interp_lat = p1[1] + (p2[1] - p1[1]) * ratio
            return {"lat": interp_lat, "lon": interp_lon}
        
        cumulative_distance += dist
        
    last_pt = coords[-1]
    return {"lat": last_pt[1], "lon": last_pt[0]}

class TripPlannerService:
    """The single entry point views.py calls — everything else is a detail."""

    def __init__(self, geocoder: GeocodingService = None, router: RoutingService = None, hos_config: HosConfig = None):
        self.geocoder = geocoder or GeocodingService()
        self.router = router or RoutingService()
        self.hos_config = hos_config or HosConfig()

    def plan(self, current_location: str, pickup_location: str, dropoff_location: str,
             current_cycle_used_hrs: float, start_hour_of_day: float = 6.0) -> dict:

        current = self._resolve(current_location)
        pickup = self._resolve(pickup_location)
        dropoff = self._resolve(dropoff_location)

        route = self.router.route([current, pickup, dropoff])

        legs = [RouteLeg(label=leg["label"], distance_miles=leg["distance_miles"]) for leg in route["legs"]]
        timeline = plan_trip(legs, current_cycle_used_hrs=current_cycle_used_hrs, config=self.hos_config)
        sheets = build_log_sheets(timeline, start_hour_of_day=start_hour_of_day)

        return {
            "waypoints": {"current": current, "pickup": pickup, "dropoff": dropoff},
            "route_geometry": route["geometry"],
            "distance_miles": route["distance_miles"],
            "driving_hours": total_driving_hours(timeline),
            "duty_days": len(sheets),
            "timeline": timeline,
            "log_sheets": sheets,
            "stops": self._extract_stops(timeline, route["geometry"]),
        }

    def _resolve(self, location_text: str) -> dict:
        result = self.geocoder.resolve(location_text)
        return {"label": location_text, "lat": result["lat"], "lon": result["lon"]}

    def _extract_stops(self, timeline, route_geometry) -> list[dict]:
        """Non-driving events, in order, for the itinerary list."""
        stops = []
        cumulative_miles = 0.0
        for seg in timeline:
            if seg.status == "D":
                cumulative_miles += seg.distance_miles or 0
                continue
            if seg.remark:
                # Interpolate from route geometry
                stop_pt = interpolate_polyline(route_geometry, cumulative_miles)
                location_label = "Unknown location"
                lat, lon = None, None
                
                if stop_pt:
                    lat, lon = stop_pt["lat"], stop_pt["lon"]
                    try:
                        rev = self.geocoder.reverse(lat, lon)
                        location_label = rev["label"]
                    except Exception:
                        location_label = f"Lat: {lat:.2f}, Lon: {lon:.2f}"
                        
                # Some types are explicit
                stop_type = "fuel" if "fuel" in seg.remark.lower() else (
                    "rest_break" if "break" in seg.remark.lower() else (
                    "sleeper_berth" if "rest" in seg.remark.lower() else (
                    "restart" if "restart" in seg.remark.lower() else (
                    "pickup" if "pickup" in seg.remark.lower() else (
                    "dropoff" if "dropoff" in seg.remark.lower() else "other"
                )))))
                
                stops.append({
                    "type": stop_type,
                    "label": seg.remark,
                    "location": location_label,
                    "lat": lat,
                    "lon": lon,
                    "duration_hrs": seg.duration_hrs,
                    "at_mile": round(cumulative_miles, 1),
                })
        return stops
