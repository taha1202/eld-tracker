import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import AltRouteOutlined from '@mui/icons-material/AltRouteOutlined';
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined';

import type { SvgIconComponent } from '@mui/icons-material';

export const ROUTES = {
  dashboard: '/',
  planTrip: '/plan',
  trips: '/trips',
  tripResults: (id: string | number = ':tripId') => `/trips/${id}`,
} as const;

export type NavItem = {
  label: string;
  path: string;
  icon: SvgIconComponent;
  section: string;
};

export const NAV_ITEMS: NavItem[] = [
  { section: 'Workspace', label: 'Dashboard', path: ROUTES.dashboard, icon: DashboardOutlined },
  { section: 'Workspace', label: 'Plan a trip', path: ROUTES.planTrip, icon: AltRouteOutlined },
  { section: 'Workspace', label: 'Trips', path: ROUTES.trips, icon: LocalShippingOutlined },
];
