import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../shared/components/AppLayout';
import DashboardPage from '../features/dashboard/DashboardPage';
import TripPlannerPage from '../features/trip-planner/TripPlannerPage';
import TripResultsPage from '../features/trip-results/TripResultsPage';
import TripsListPage from '../features/trips/TripsListPage';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/plan', element: <TripPlannerPage /> },
      { path: '/trips', element: <TripsListPage /> },
      { path: '/trips/:tripId', element: <TripResultsPage /> },
    ],
  },
]);
