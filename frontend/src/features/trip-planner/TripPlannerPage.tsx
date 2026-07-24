import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import MyLocationOutlined from '@mui/icons-material/MyLocationOutlined';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import FlagOutlined from '@mui/icons-material/FlagOutlined';
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import AltRouteOutlined from '@mui/icons-material/AltRouteOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined';
import GavelOutlined from '@mui/icons-material/GavelOutlined';
import InputAdornment from '@mui/material/InputAdornment';
import LocationField from './components/LocationField';
import { tripsApi } from '../../shared/api/tripsApi';
import { colors } from '../../theme/palette';
import { fontMono } from '../../theme/typography';
import type { GeocodeResult } from '../../types/trip';

const ASSUMPTIONS = [
  { title: '70-hour / 8-day cycle', desc: "Driving isn't permitted after 70 hours on duty in any 8 consecutive days." },
  { title: '11-hour driving limit', desc: "Up to 11 hours of driving inside a 14-hour on-duty window." },
  { title: '30-minute break', desc: "Required once 8 cumulative hours of driving have passed." },
  { title: '10-hour reset', desc: "At least 10 consecutive hours off duty, or in the sleeper berth, between shifts." },
  { title: 'Fueling & stops', desc: "A fuel stop at least every 1,000 miles, plus 1 hour each for pickup and drop-off." },
];

export default function TripPlannerPage() {
  const navigate = useNavigate();
  const [currentLocation, setCurrentLocation] = useState<GeocodeResult | null>(null);
  const [pickupLocation, setPickupLocation] = useState<GeocodeResult | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<GeocodeResult | null>(null);
  const [cycleUsed, setCycleUsed] = useState<number | ''>('');

  const mutation = useMutation({
    mutationFn: tripsApi.planTrip,
    onSuccess: (trip) => navigate(`/trips/${trip.id}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLocation || !pickupLocation || !dropoffLocation) return;
    mutation.mutate({
      current_location: currentLocation.label,
      pickup_location: pickupLocation.label,
      dropoff_location: dropoffLocation.label,
      current_cycle_used_hrs: cycleUsed === '' ? 0 : cycleUsed,
    });
  };

  const isValid = Boolean(currentLocation && pickupLocation && dropoffLocation);
  


  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" sx={{ letterSpacing: '-0.01em', fontWeight: 800, mb: 0.5 }}>
        Plan a New Trip
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
        Enter the trip details.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.15fr 0.85fr' }, gap: 2, alignItems: 'start' }}>
        {/* ── FORM COLUMN (LEFT) ── */}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Card sx={{ p: 2.75 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.25 }}>
              Trip details
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
              We'll calculate the route, required rests, fuel stops, and draw your daily logs automatically.
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Current Location</Typography>
                  <LocationField
                    icon={<MyLocationOutlined sx={{ fontSize: 18, color: colors.textTertiary }} />}
                    value={currentLocation}
                    onChange={setCurrentLocation}
                    placeholder="e.g., Chicago, IL"
                    required
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.75 }}>
                    Where the driver and truck are right now.
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Pickup Location</Typography>
                  <LocationField
                    icon={<Inventory2Outlined sx={{ fontSize: 18, color: colors.textTertiary }} />}
                    value={pickupLocation}
                    onChange={setPickupLocation}
                    placeholder="e.g., Joliet, IL"
                    required
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.75 }}>
                    Where the load will be picked up.
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Drop-off Location</Typography>
                  <LocationField
                    icon={<FlagOutlined sx={{ fontSize: 18, color: colors.textTertiary }} />}
                    value={dropoffLocation}
                    onChange={setDropoffLocation}
                    placeholder="e.g., Houston, TX"
                    required
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.75 }}>
                    Final delivery destination.
                  </Typography>
                </Box>

                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Current Cycle Used (Hrs)
                    </Typography>
                    <Tooltip title="Total hours used in the current 8-day cycle" arrow placement="top">
                      <InfoOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                    </Tooltip>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    type="number"
                    value={cycleUsed}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCycleUsed(val === '' ? '' : Number(val));
                    }}
                    placeholder="0"
                    error={cycleUsed !== '' && (cycleUsed < 0 || cycleUsed > 70)}
                    slotProps={{ 
                      input: { 
                        inputProps: { min: 0, max: 70, step: 0.25 },
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccessTimeOutlined sx={{ fontSize: 18 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, fontFamily: fontMono, whiteSpace: 'nowrap' }}>
                              / 70 hrs
                            </Typography>
                          </InputAdornment>
                        )
                      } 
                    }}
                    sx={{ width: 200, '& .MuiInputBase-root': { height: 46, borderRadius: '10px' } }}
                  />
                </Box>
                {cycleUsed !== '' && (cycleUsed < 0 || cycleUsed > 70) ? (
                  <Typography variant="caption" sx={{ color: colors.red, display: 'block', mt: 0.75, fontWeight: 600 }}>
                    Enter a value between 0 and 70.
                  </Typography>
                ) : (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.75 }}>
                    Hours already on duty in the current 70-hour/8-day cycle.
                  </Typography>
                )}
                </Box>
              </Box>

              {mutation.isError && (
                <Alert severity="error" sx={{ mt: 1, py: 0.5 }}>
                  {(mutation.error as Error)?.message ?? 'Failed to plan trip.'}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                startIcon={mutation.isPending ? <CircularProgress size={18} color="inherit" /> : <AltRouteOutlined />}
                disabled={!isValid || mutation.isPending || (cycleUsed !== '' && (cycleUsed < 0 || cycleUsed > 70))}
                sx={{ mt: 0.5, height: 47, fontWeight: 700, borderRadius: '10px' }}
              >
                {mutation.isPending ? 'Calculating…' : 'Calculate Route & Logs'}
              </Button>
            </Box>
          </Card>
        </Box>

        {/* ── ASSUMPTIONS COLUMN (RIGHT) ── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Card sx={{ bgcolor: colors.blueSoft, border: `1px solid ${colors.border}`, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, color: colors.navy }}>
              <GavelOutlined sx={{ fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Planning Assumptions
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {ASSUMPTIONS.map((a, i) => (
                <Box key={a.title} sx={{ display: 'flex', gap: 1.5, borderBottom: i < ASSUMPTIONS.length - 1 ? `1px solid ${colors.border}` : 'none', pb: i < ASSUMPTIONS.length - 1 ? 2.5 : 0 }}>
                  <Box sx={{ 
                    width: 24, height: 24, borderRadius: '50%', bgcolor: '#fff', color: colors.navy, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    fontWeight: 700, fontSize: '0.8rem', mt: 0.25
                  }}>
                    {i + 1}
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>{a.title}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.4 }}>
                      {a.desc}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Card>
          
          <Card sx={{ bgcolor: '#fafafa', border: `1px dashed ${colors.borderStrong}`, p: 2.5 }}>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <LightbulbOutlined sx={{ fontSize: 20, color: 'text.primary', mt: 0.25 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Not sure about cycle hours?</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.4 }}>
                  Pull the total from the driver's last ELD certification, or start at 0 for a fresh 8-day cycle.
                </Typography>
              </Box>
            </Box>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
