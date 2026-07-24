import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../../constants/routes';
import { colors } from '../../theme/palette';

export default function TopBar() {
  const location = useLocation();
  const current = NAV_ITEMS.find((i) => i.path === location.pathname);

  return (
    <Box
      sx={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3.5,
        borderBottom: `1px solid ${colors.border}`,
        bgcolor: colors.surface,
        position: 'sticky',
        top: 0,
        zIndex: 1100, // Above Leaflet controls and tile panes
        flexShrink: 0,
      }}
    >
      <Box>
        <Typography
          variant="caption"
          sx={{ color: colors.textTertiary, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.68rem' }}
        >
          {current?.section ?? 'Workspace'}
        </Typography>
        <Typography variant="body1" sx={{ color: colors.textPrimary, fontWeight: 700, letterSpacing: '-0.01em', mt: -0.25 }}>
          {current?.label ?? 'Dashboard'}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      </Box>
    </Box>
  );
}
