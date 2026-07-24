import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { colors } from '../../../theme/palette';
import { fontMono } from '../../../theme/typography';
import type { TripListItem } from '../../../types/trip';

type Row = { label: string; hours: number; color: string };

function MeterRow({ label, hours, color, maxHours }: Row & { maxHours: number }) {
  const MAX_BAR_PCT = 88;
  const widthPct = maxHours === 0 ? 0 : (hours / maxHours) * MAX_BAR_PCT;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem' }}
      >
        {label}
      </Typography>
      <Box sx={{ position: 'relative', height: 21, mt: 0.25 }}>
        <Box sx={{ position: 'absolute', inset: 0, borderRadius: 999, bgcolor: colors.surfaceAlt }} />
        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${widthPct}%`, borderRadius: 999, bgcolor: color, transition: 'width .4s ease' }} />
        <Typography sx={{ position: 'absolute', top: '50%', left: `calc(${widthPct}% + 14px)`, transform: 'translateY(-50%)', fontFamily: fontMono, fontWeight: 700, fontSize: '0.85rem', color: 'text.primary', whiteSpace: 'nowrap' }}>
          {hours.toFixed(1)}h
        </Typography>
      </Box>
    </Box>
  );
}

export default function DutyStatusChart({ trips }: { trips: TripListItem[] }) {
  const drivingHours = trips.reduce((sum, t) => sum + (t.driving_hours || 0), 0);
  const dutyDays = trips.reduce((sum, t) => sum + (t.duty_days || 0), 0);
  
  // estimate until actual logs are fully linked in trips response
  const onDutyNotDriving = dutyDays * 1.5;
  const sleeperBerth = dutyDays * 10;

  const ROWS: Row[] = [
    { label: 'Driving', hours: drivingHours, color: colors.green },
    { label: 'On-Duty (Not Driving)', hours: onDutyNotDriving, color: colors.amber700 },
    { label: 'Sleeper Berth', hours: sleeperBerth, color: colors.indigo },
  ];

  const maxHours = Math.max(...ROWS.map((r) => r.hours));

  return (
    <Card sx={{ p: 2.75, height: '100%' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        Hours by Duty Status
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>
        Aggregated across this week's trips
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
        {ROWS.map((row) => (
          <MeterRow key={row.label} {...row} maxHours={maxHours} />
        ))}
      </Box>
    </Card>
  );
}
