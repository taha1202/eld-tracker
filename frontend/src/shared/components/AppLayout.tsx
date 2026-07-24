import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { Outlet, useLocation } from 'react-router-dom';
import MiniDrawer from './MiniDrawer';
import TopBar from './TopBar';
import { colors } from '../../theme/palette';

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: colors.bg }}>
      <MiniDrawer open={drawerOpen} onToggle={() => setDrawerOpen((v) => !v)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <TopBar />
        <Box sx={{ p: { xs: 2, md: 3.5 }, flex: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
