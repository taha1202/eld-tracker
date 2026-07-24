/** Mirrors backend DutySegment.Status choices. */
export type DutyStatus = 'OFF' | 'SB' | 'D' | 'ON';

export interface DutySegment {
  status: DutyStatus;
  start_hr: number;
  end_hr: number;
  remark: string | null;
}

export interface LogSheet {
  day_number: number;
  totals: Record<DutyStatus, number>;
  segments: DutySegment[];
}

export interface Stop {
  type: 'pickup' | 'dropoff' | 'fuel' | 'rest_break' | 'sleeper_berth' | 'restart';
  location: string;
  lat?: number;
  lon?: number;
  at_mile: number | null;
  duration_hrs: number;
  sequence: number;
}

export interface Trip {
  id: number;
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used_hrs: number;
  distance_miles: number | null;
  driving_hours: number | null;
  duty_days: number | null;
  route_geometry: [number, number][] | null;

  created_at: string;
  stops: Stop[];
  log_sheets: LogSheet[];
}

/** Lighter shape returned by GET /api/trips/ (list endpoint). */
export interface TripListItem {
  id: number;
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  distance_miles: number | null;
  driving_hours: number | null;

  duty_days: number | null;
  fuel_stops_count?: number;
  created_at: string;
}

export interface GeocodeResult {
  label: string;
  lat: number;
  lon: number;
}

export interface PlanTripPayload {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used_hrs: number;
}
