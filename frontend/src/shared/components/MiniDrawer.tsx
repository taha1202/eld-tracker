import { styled, type CSSObject, type Theme } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import MenuIcon from '@mui/icons-material/Menu';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAV_ITEMS } from '../../constants/routes';
import { colors } from '../../theme/palette';

export const DRAWER_WIDTH = 248;
export const DRAWER_WIDTH_COLLAPSED = 72;

const openedMixin = (theme: Theme): CSSObject => ({
  width: DRAWER_WIDTH,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: DRAWER_WIDTH_COLLAPSED,
});

const StyledDrawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })<{ open?: boolean }>(
  ({ theme, open }) => ({
    width: DRAWER_WIDTH,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && openedMixin(theme)),
    ...(!open && closedMixin(theme)),
    '& .MuiDrawer-paper': {
      backgroundColor: colors.navy,
      color: '#fff',
      borderRight: 'none',
      ...(open && openedMixin(theme)),
      ...(!open && closedMixin(theme)),
    },
  })
);

type MiniDrawerProps = {
  open: boolean;
  onToggle: () => void;
};

export default function MiniDrawer({ open, onToggle }: MiniDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const groupedSections = Array.from(new Set(NAV_ITEMS.map((i) => i.section)));

  return (
    <StyledDrawer variant="permanent" open={open}>
      <Box
        sx={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: open ? 1.5 : 0,
          justifyContent: open ? 'flex-start' : 'center',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}
      >
        <Tooltip title={open ? 'Collapse menu' : 'Expand menu'} placement="right">
          <IconButton onClick={onToggle} sx={{ color: 'rgba(255,255,255,0.85)' }} aria-label="toggle navigation">
            <MenuIcon />
          </IconButton>
        </Tooltip>
        {open && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
            <Box
              sx={{
                width: 28, height: 28, borderRadius: '8px', bgcolor: colors.amber,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <LocalShippingIcon sx={{ fontSize: 17, color: colors.navy }} />
            </Box>
            <Typography variant="body2" noWrap sx={{ letterSpacing: '-0.01em', fontWeight: 700 }}>
              ELD Tracker
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1 }}>
        {groupedSections.map((section) => (
          <Box key={section}>
            {open && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block', px: 2.5, pt: 2, pb: 0.75,
                  fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                  fontSize: '0.68rem', color: 'rgba(244,246,250,0.4)',
                }}
              >
                {section}
              </Typography>
            )}
            <List disablePadding sx={{ px: 1.5 }}>
              {NAV_ITEMS.filter((i) => i.section === section).map((item) => {
                const isActive = item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);
                const Icon = item.icon;
                return (
                  <ListItem key={item.path} disablePadding sx={{ display: 'block', mb: 0.25 }}>
                    <Tooltip title={!open ? item.label : ''} placement="right">
                      <ListItemButton
                        selected={isActive}
                        onClick={() => navigate(item.path)}
                        sx={{
                          minHeight: 40,
                          borderRadius: '8px',
                          justifyContent: open ? 'flex-start' : 'center',
                          px: 1.5,
                          color: 'rgba(244,246,250,0.72)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: '#fff' },
                          '&.Mui-selected': {
                            bgcolor: 'rgba(245,165,36,0.14)',
                            color: '#fff',
                            '&:hover': { bgcolor: 'rgba(245,165,36,0.18)' },
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0, mr: open ? 1.75 : 'auto', justifyContent: 'center',
                            color: 'inherit',
                          }}
                        >
                          <Icon fontSize="small" />
                        </ListItemIcon>
                        {open && (
                          <ListItemText
                            primary={item.label}
                            slotProps={{ primary: { sx: { fontSize: '0.85rem', fontWeight: 500 } } }}
                          />
                        )}
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
    </StyledDrawer>
  );
}
