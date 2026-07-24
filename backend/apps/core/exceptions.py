class DomainError(Exception):
    """Base class for errors that should become a clean 4xx API response,
    as opposed to an unexpected 500."""
    http_status = 400


class GeocodeFailed(DomainError):
    """Photon couldn't resolve a location string to coordinates."""
    http_status = 422


class RouteNotFound(DomainError):
    """OSRM couldn't find a drivable route between two points."""
    http_status = 422


class UpstreamServiceUnavailable(DomainError):
    """OSRM or Photon's public demo server is down or rate-limiting us —
    both are best-effort, no-SLA public services, so this is expected
    occasionally and should surface as a friendly retry-able error, not
    a stack trace."""
    http_status = 503
