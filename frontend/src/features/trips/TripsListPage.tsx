import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import RecentTripsTable from '../dashboard/components/RecentTripsTable';

export default function TripsListPage() {
  return (
    <Box>
      <Typography variant="h5" sx={{ letterSpacing: '-0.01em', fontWeight: 800, mb: 0.25 }}>
        Trips
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        All your planned and completed routes
      </Typography>
      <RecentTripsTable />
    </Box>
  );
}
