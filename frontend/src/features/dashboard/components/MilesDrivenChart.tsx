import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { LineChart } from '@mui/x-charts/LineChart';
import { colors } from '../../../theme/palette';
import type { TripListItem } from '../../../types/trip';

export default function MilesDrivenChart({ trips }: { trips: TripListItem[] }) {
  // Generate last 7 days
  const today = new Date();
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const DAYS = last7Days.map(d => d.toLocaleDateString('en-US', { weekday: 'short' }));
  
  // Aggregate miles by day
  const milesByDay = last7Days.map(day => {
    const dayStr = day.toISOString().split('T')[0];
    const tripsOnDay = trips.filter(t => t.created_at.startsWith(dayStr));
    return tripsOnDay.reduce((sum, t) => sum + (t.distance_miles || 0), 0);
  });

  // If no data, show some fallback or 0
  const total = milesByDay.reduce((a, b) => a + b, 0);

  return (
    <Card sx={{ p: 2.75, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Miles Driven - Last 7 Days
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Planned and completed mileage across active trips
          </Typography>
        </Box>
        <Chip
          label={`${Math.round(total).toLocaleString()} mi total`}
          size="small"
          variant="outlined"
          sx={{ borderColor: colors.borderStrong, fontWeight: 700 }}
        />
      </Box>

      <Box sx={{ mt: 1 }}>
        <LineChart
          height={260}
          series={[
            {
              data: milesByDay,
              color: colors.blue,
              area: true,
              showMark: true,
              curve: 'linear',
            },
          ]}
          xAxis={[{ scaleType: 'point', data: DAYS }]}
          grid={{ horizontal: true }}
          margin={{ left: 36, right: 16, top: 16, bottom: 24 }}
          hideLegend
        />
      </Box>
    </Card>
  );
}
