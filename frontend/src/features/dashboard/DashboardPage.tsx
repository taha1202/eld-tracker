import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import LocalGasStationOutlined from '@mui/icons-material/LocalGasStationOutlined';
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined';
import AltRouteOutlined from '@mui/icons-material/AltRouteOutlined';
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import AddOutlined from '@mui/icons-material/AddOutlined';
import Tooltip from '@mui/material/Tooltip';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tripsApi } from '../../shared/api/tripsApi';
import KpiCard from './components/KpiCard';
import MilesDrivenChart from './components/MilesDrivenChart';
import DutyStatusChart from './components/DutyStatusChart';
import RecentTripsTable from './components/RecentTripsTable';
import { colors } from '../../theme/palette';
import { ROUTES } from '../../constants/routes';

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: trips = [] } = useQuery({
    queryKey: ['trips'],
    queryFn: tripsApi.listTrips,
  });

  const totalTrips = trips.length;
  const totalFuelStops = trips.reduce((sum, t) => sum + (t.fuel_stops_count || 0), 0);
  const totalMiles = trips.reduce((sum, t) => sum + (t.distance_miles || 0), 0);
  
  const validTrips = trips.filter(t => t.duty_days && t.duty_days > 0);
  const avgDays = validTrips.length > 0
    ? validTrips.reduce((sum, t) => sum + (t.duty_days || 0), 0) / validTrips.length
    : 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ letterSpacing: '-0.01em', fontWeight: 800 }}>
            Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
            Performance and usage metrics across your planned routes
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddOutlined />}
          onClick={() => navigate(ROUTES.planTrip)}
          size="large"
        >
          Plan a trip
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label={
              <Tooltip title="Total number of trips planned" arrow placement="top">
                <Box component="span">Total Trips</Box>
              </Tooltip>
            }
            value={totalTrips.toString()}
            icon={LocalShippingOutlined}
            iconBg={colors.blueSoft}
            iconColor={colors.blue}
            footer={
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                All recorded plans
              </Typography>
            }
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label={
              <Tooltip title="Total distance of all recorded trips" arrow placement="top">
                <Box component="span">Miles Planned (Total)</Box>
              </Tooltip>
            }
            value={`${Math.round(totalMiles).toLocaleString()} mi`}
            icon={AltRouteOutlined}
            iconBg={colors.greenSoft}
            iconColor={colors.green}
            footer={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Chip
                  size="small"
                  icon={<TrendingUpOutlined sx={{ fontSize: '14px !important' }} />}
                  label="+18%"
                  sx={{ bgcolor: colors.greenSoft, color: '#0C8A50', height: 22 }}
                />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  vs last week
                </Typography>
              </Box>
            }
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label={
              <Tooltip title="Total number of fuel stops planned across all trips" arrow placement="top">
                <Box component="span">Total Planned Fuel Stops</Box>
              </Tooltip>
            }
            value={totalFuelStops.toString()}
            icon={LocalGasStationOutlined}
            iconBg={colors.indigoSoft}
            iconColor={colors.indigo}
            footer={
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Refueling stops scheduled
              </Typography>
            }
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label={
              <Tooltip title="Average driving days per trip" arrow placement="top">
                <Box component="span">Avg. Driving Days</Box>
              </Tooltip>
            }
            value={avgDays.toFixed(1)}
            icon={AccessTimeOutlined}
            iconBg={colors.amberSoft}
            iconColor={colors.amber700}
            footer={
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Days required per trip
              </Typography>
            }
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <MilesDrivenChart trips={trips} />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <DutyStatusChart trips={trips} />
        </Grid>
      </Grid>

      <RecentTripsTable />
    </Box>
  );
}
