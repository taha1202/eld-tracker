import { apiClient } from './apiClient';
import type { Trip, TripListItem, GeocodeResult, PlanTripPayload } from '../../types/trip';

export const tripsApi = {
  /** GET /api/geocode/?q=... */
  geocode: async (q: string): Promise<GeocodeResult[]> => {
    const { data } = await apiClient.get<{ results: GeocodeResult[] }>('/geocode/', { params: { q } });
    return data.results;
  },

  /** POST /api/trips/plan/ */
  planTrip: async (payload: PlanTripPayload): Promise<Trip> => {
    const { data } = await apiClient.post<Trip>('/trips/plan/', payload);
    return data;
  },

  /** GET /api/trips/ */
  listTrips: async (): Promise<TripListItem[]> => {
    const { data } = await apiClient.get<TripListItem[]>('/trips/');
    return data;
  },

  /** GET /api/trips/:id/ */
  getTrip: async (id: number): Promise<Trip> => {
    const { data } = await apiClient.get<Trip>(`/trips/${id}/`);
    return data;
  },
};
