import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Skeleton from '@mui/material/Skeleton';
import RouteOutlined from '@mui/icons-material/RouteOutlined';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined';
import LocalGasStationOutlined from '@mui/icons-material/LocalGasStationOutlined';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import FlagOutlined from '@mui/icons-material/FlagOutlined';
import LocalCafeOutlined from '@mui/icons-material/LocalCafeOutlined';
import HotelOutlined from '@mui/icons-material/HotelOutlined';
import PrintOutlined from '@mui/icons-material/PrintOutlined';
import TripOriginOutlined from '@mui/icons-material/TripOriginOutlined';
import { tripsApi } from '../../shared/api/tripsApi';
import { fontMono } from '../../theme/typography';
import { colors } from '../../theme/palette';
import EldGrid from './components/EldGrid';
import TripMap, { type MapWaypoint } from '../../shared/components/TripMap';
import type { Stop, DutyStatus } from '../../types/trip';

const KPI_ITEMS = [
  { key: 'distance', label: 'Total distance', icon: <RouteOutlined sx={{ fontSize: 16 }} /> },
  { key: 'driving', label: 'Driving time', icon: <TimerOutlined sx={{ fontSize: 16 }} /> },
  { key: 'days', label: 'Duty days', icon: <CalendarTodayOutlined sx={{ fontSize: 16 }} /> },
  { key: 'stops', label: 'Fuel & rest stops', icon: <LocalGasStationOutlined sx={{ fontSize: 16 }} /> },
];

const STOP_ICON_MAP: Record<string, React.ReactNode> = {
  pickup: <Inventory2Outlined sx={{ fontSize: 16 }} />,
  dropoff: <FlagOutlined sx={{ fontSize: 16 }} />,
  fuel: <LocalGasStationOutlined sx={{ fontSize: 16 }} />,
  rest_break: <LocalCafeOutlined sx={{ fontSize: 16 }} />,
  sleeper_berth: <HotelOutlined sx={{ fontSize: 16 }} />,
  restart: <HotelOutlined sx={{ fontSize: 16 }} />,
};

const STOP_CHIP_COLOR: Record<string, string> = {
  pickup: 'chip-amber',
  dropoff: 'chip-green',
  rest_break: 'chip-grey',
  sleeper_berth: 'chip-indigo',
  fuel: 'chip-amber',
  restart: 'chip-indigo',
};

const DUTY_LABEL: Record<DutyStatus, string> = {
  OFF: 'Off duty',
  SB: 'Sleeper berth',
  D: 'Driving',
  ON: 'On duty (not driving)',
};

function chipSx(variant: string) {
  const map: Record<string, { bg: string; color: string }> = {
    'chip-blue': { bg: colors.blueSoft, color: '#1553D6' },
    'chip-amber': { bg: colors.amberSoft, color: colors.amber700 },
    'chip-green': { bg: colors.greenSoft, color: '#0C8A50' },
    'chip-indigo': { bg: colors.indigoSoft, color: colors.indigo },
    'chip-grey': { bg: colors.surfaceAlt, color: colors.textSecondary },
  };
  return map[variant] ?? { bg: colors.surfaceAlt, color: colors.textSecondary };
}

function getStopTimelineData(s: Stop, timeText?: string) {
  const data: Record<string, { title: string; chip: string }> = {
    pickup: { title: 'Pickup', chip: `${s.duration_hrs} hr on duty` },
    dropoff: { title: 'Dropoff', chip: `${s.duration_hrs} hr on duty` },
    fuel: { title: 'Fuel stop', chip: `${s.duration_hrs} hr on duty` },
    rest_break: { title: 'Required 30-minute break', chip: `30 min · 8 hrs cumulative driving` },
    sleeper_berth: { title: '10-hour rest (sleeper berth)', chip: `10 hrs · resets 11h / 14h clocks` },
    restart: { title: '34-hour restart', chip: `34 hrs · cycle reset` },
  };
  const base = data[s.type] ?? { title: s.type, chip: `${s.duration_hrs} hr` };
  return { ...base, time: timeText };
}

function formatTimeRange(start: Date, end: Date): string {
  const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
  const startStr = start.toLocaleTimeString('en-US', timeOpts);
  const endStr = end.toLocaleTimeString('en-US', timeOpts);
  
  const startDay = Math.floor(start.getTime() / 86400000 - start.getTimezoneOffset() / 1440);
  const endDay = Math.floor(end.getTime() / 86400000 - end.getTimezoneOffset() / 1440);
  const dayDiff = endDay - startDay;
  const daySuffix = dayDiff > 0 ? ` (+${dayDiff} day${dayDiff > 1 ? 's' : ''})` : '';
  
  return `${startStr} - ${endStr}${daySuffix}`;
}

export default function TripResultsPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [activeDay, setActiveDay] = useState(0);
  const [mainTab, setMainTab] = useState(0);

  const { data: trip, isLoading } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => tripsApi.getTrip(Number(tripId)),
    enabled: Boolean(tripId),
  });

  if (isLoading || !trip) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={32} />
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {[1,2,3,4].map((i) => (
            <Grid key={i} size={{ xs: 6, md: 3 }}><Skeleton variant="rounded" height={100} /></Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={360} sx={{ mt: 2 }} />
      </Box>
    );
  }

  const fuelRestStops = trip.stops.filter((s) => !['pickup', 'dropoff'].includes(s.type)).length;
  const currentSheet = trip.log_sheets[activeDay];

  const kpiValues: Record<string, React.ReactNode> = {
    distance: (
      <>
        {Math.round(trip.distance_miles ?? 0).toLocaleString()}
        <Typography component="span" sx={{ fontSize: 13, color: 'text.secondary', ml: 0.5 }}>mi</Typography>
      </>
    ),
    driving: (
      <>
        {(trip.driving_hours ?? 0).toFixed(1)}
        <Typography component="span" sx={{ fontSize: 13, color: 'text.secondary', ml: 0.5 }}>hrs</Typography>
      </>
    ),
    days: String(trip.duty_days ?? 0),
    stops: String(fuelRestStops),
  };

  const waypoints: MapWaypoint[] = trip.stops
    .filter((s) => s.lat != null && s.lon != null)
    .map((s) => ({
      label: getStopTimelineData(s).title,
      lat: s.lat!,
      lon: s.lon!,
      type: s.type as any,
    }));
  
  if (waypoints.length === 0 && trip.route_geometry) {
    // Fallback if stops somehow lack lat/lon
    const coords = (trip.route_geometry as any)?.coordinates ?? [];
    if (coords.length > 0) {
      waypoints.push({ label: trip.current_location, lon: coords[0][0], lat: coords[0][1], type: 'current' as any });
      waypoints.push({ label: trip.dropoff_location, lon: coords[coords.length-1][0], lat: coords[coords.length-1][1], type: 'dropoff' });
    }
  }

  // Pre-calculate timestamps for stops
  const AVG_SPEED_MPH = 55.0;
  const tripStart = new Date(trip.created_at);
  tripStart.setHours(6, 0, 0, 0); // Trip planner assumes 6 AM start

  let cumulativeStopsHrs = 0;
  const stopTimings = trip.stops.map((s) => {
    const drivingHrs = (s.at_mile ?? 0) / AVG_SPEED_MPH;
    const arrivalHrs = drivingHrs + cumulativeStopsHrs;
    const departureHrs = arrivalHrs + s.duration_hrs;
    
    const arrivalDate = new Date(tripStart.getTime() + arrivalHrs * 3600000);
    const departureDate = new Date(tripStart.getTime() + departureHrs * 3600000);
    
    cumulativeStopsHrs += s.duration_hrs;
    return formatTimeRange(arrivalDate, departureDate);
  });

  return (
    <Box>
      <style>
        {`
          @media print {
            @page {
              size: landscape;
              margin: 15mm;
            }
            body * {
              visibility: hidden !important;
            }
            #printable-area, #printable-area * {
              visibility: visible !important;
            }
            #printable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
            }
            /* Ensure the SVG grid scales correctly in print */
            #printable-area svg {
              max-width: 100%;
              height: auto;
            }
          }
        `}
      </style>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Trip #{trip.id}
          </Typography>
          <Typography variant="h5" sx={{ letterSpacing: '-0.01em', fontWeight: 800 }}>
            {trip.pickup_location} → {trip.dropoff_location}
          </Typography>
        </Box>
      </Box>

      {/* KPI row */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {KPI_ITEMS.map((item) => (
          <Grid key={item.key} size={{ xs: 6, md: 3 }}>
            <Card sx={{ p: 2.25 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                {item.icon}{item.label}
              </Typography>
              <Typography sx={{ fontFamily: fontMono, fontWeight: 700, fontSize: '1.65rem', letterSpacing: '-0.01em' }}>
                {kpiValues[item.key]}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={mainTab} 
          onChange={(_, v) => setMainTab(v)}
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '1rem', minWidth: 120 },
            '& .Mui-selected': { color: `${colors.navy} !important` },
            '& .MuiTabs-indicator': { backgroundColor: colors.navy },
          }}
        >
          <Tab label="Route & Map" />
          <Tab label="Daily Logs" />
        </Tabs>
      </Box>

      {mainTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2.5 }}>
          
          {/* Top Row: Map + Itinerary */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' }, gap: 2, alignItems: 'start' }}>
            {/* Left: Map */}
            <Card sx={{ height: 500, position: 'relative', overflow: 'hidden' }}>
              <TripMap routeGeometry={trip.route_geometry} waypoints={waypoints} height={500} />
            </Card>

            {/* Right: Itinerary */}
            <Card sx={{ p: 2.75, height: 500, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, flexShrink: 0 }}>
                Stops & Rest Schedule
              </Typography>
              <Box sx={{ 
                display: 'flex', flexDirection: 'column', overflowY: 'auto', pr: 1, pt: 1, flex: 1,
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-thumb': { backgroundColor: colors.textTertiary, borderRadius: '4px' }
              }}>
                {/* Depart */}
                <StopRow 
                  icon={<TripOriginOutlined sx={{ fontSize: 18 }} />} 
                  title="Depart current location" 
                  place={trip.current_location}
                  timeText={tripStart.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                  colorVariant="chip-blue"
                />
                {trip.stops.map((stop, i) => {
                  const isLast = i === trip.stops.length - 1;
                  const csColor = STOP_CHIP_COLOR[stop.type] ?? 'chip-grey';
                  const tl = getStopTimelineData(stop, stopTimings[i]);
                  return (
                    <StopRow
                      key={stop.sequence}
                      icon={STOP_ICON_MAP[stop.type]}
                      title={tl.title}
                      place={stop.location}
                      chipText={tl.chip}
                      timeText={tl.time}
                      colorVariant={csColor}
                      isLast={isLast}
                    />
                  );
                })}
              </Box>
            </Card>
          </Box>
        </Box>
      )}

      {mainTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Daily log sheets</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Auto-drawn from the duty schedule above, providing one 24-hour grid per day that matches the FMCSA driver's daily log format.
              </Typography>
            </Box>
            <Button variant="contained" color="primary" startIcon={<PrintOutlined />} onClick={() => window.print()}>
              Print Log
            </Button>
          </Box>

      {trip.log_sheets.length > 0 && (
        <Card>
          <Tabs
            value={activeDay}
            onChange={(_, v) => setActiveDay(v)}
            sx={{
              px: 2.5, borderBottom: `1px solid ${colors.border}`,
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' },
              '& .Mui-selected': { color: `${colors.navy} !important` },
              '& .MuiTabs-indicator': { backgroundColor: colors.navy },
            }}
          >
            {trip.log_sheets.map((sheet) => (
              <Tab key={sheet.day_number} label={`Day ${sheet.day_number}`} />
            ))}
          </Tabs>

          {currentSheet && (
            <>
              <Box sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${colors.border}` }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {currentSheet.totals.D !== undefined && (
                    <Chip label={`${currentSheet.totals.D?.toFixed(1) ?? 0} hrs driving`} size="small" sx={{ bgcolor: colors.blueSoft, color: '#1553D6', border: 'none' }} />
                  )}
                </Box>
              </Box>
              <Box sx={{ px: 2.5, py: 1 }}>
                <EldGrid segments={currentSheet.segments} svgId={`grid-day-${currentSheet.day_number}`} />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderTop: `1px solid ${colors.border}`, bgcolor: colors.surfaceAlt }}>
                {(['OFF', 'SB', 'D', 'ON'] as DutyStatus[]).map((status) => (
                  <Box key={status} sx={{ p: 1.75, borderRight: `1px solid ${colors.border}`, '&:last-child': { borderRight: 'none' } }}>
                    <Typography variant="overline" sx={{ color: 'text.secondary', fontSize: '0.65rem', letterSpacing: '0.04em' }}>
                      {DUTY_LABEL[status]}
                    </Typography>
                    <Typography sx={{ fontFamily: fontMono, fontWeight: 700, fontSize: '0.85rem' }}>
                      {(currentSheet.totals[status] ?? 0).toFixed(1)} hrs
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Card>
      )}
      </Box>
    )}
      {/* Isolated Print Area */}
      <Box id="printable-area" sx={{ display: 'none', '@media print': { display: 'block' } }}>
        {trip.log_sheets.map((sheet, index) => (
          <Box key={sheet.day_number} sx={{ mb: 4, pageBreakAfter: index === trip.log_sheets.length - 1 ? 'auto' : 'always' }}>
            <Box sx={{ mb: 4, pb: 2, borderBottom: `2px solid ${colors.navy}` }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: colors.navy, mb: 1 }}>Daily Log - Day {sheet.day_number}</Typography>
              <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 600 }}>Trip #{trip.id}: {trip.pickup_location} → {trip.dropoff_location}</Typography>
            </Box>
            <Box>
              <EldGrid segments={sheet.segments} svgId={`print-grid-day-${sheet.day_number}`} />
              
              {/* Totals Summary */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                mt: 4, 
                border: `1px solid ${colors.border}`, 
                borderRadius: '8px',
                overflow: 'hidden',
                bgcolor: '#fafafa' 
              }}>
                {(['OFF', 'SB', 'D', 'ON'] as DutyStatus[]).map((status) => (
                  <Box key={status} sx={{ p: 2.5, borderRight: `1px solid ${colors.border}`, '&:last-child': { borderRight: 'none' } }}>
                    <Typography variant="overline" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                      {DUTY_LABEL[status]}
                    </Typography>
                    <Typography sx={{ fontFamily: fontMono, fontWeight: 800, fontSize: '1.25rem', mt: 0.5 }}>
                      {(sheet.totals[status] ?? 0).toFixed(1)} hrs
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/* ── Small helper components ── */

function StopRow({ 
  icon, 
  title, 
  place, 
  chipText,
  timeText,
  colorVariant,
  isLast 
}: { 
  icon: React.ReactNode; 
  title: string; 
  place: string; 
  chipText?: string;
  timeText?: string;
  colorVariant: string;
  isLast?: boolean;
}) {
  const cs = chipSx(colorVariant);

  return (
    <Box sx={{ display: 'flex', gap: 2.5, position: 'relative' }}>
      {/* Timeline Line */}
      {!isLast && (
        <Box 
          sx={{ 
            position: 'absolute', left: 19, top: 40, bottom: -12, 
            width: 2, bgcolor: colors.border, zIndex: 0 
          }} 
        />
      )}

      {/* Icon */}
      <Box
        sx={{
          width: 40, height: 40, borderRadius: '12px', 
          bgcolor: cs.bg, color: cs.color, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          flexShrink: 0, zIndex: 1, position: 'relative'
        }}
      >
        {icon}
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, pb: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.25 }}>
          <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
            {title}
          </Typography>
          {timeText && (
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {timeText}
            </Typography>
          )}
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>{place}</Typography>
        
        {chipText && (
          <Chip
            label={chipText}
            size="small"
            sx={{ bgcolor: colors.surfaceAlt, color: colors.textSecondary, fontWeight: 600, border: 'none', fontSize: '0.75rem', height: 24 }}
          />
        )}
      </Box>
    </Box>
  );
}
