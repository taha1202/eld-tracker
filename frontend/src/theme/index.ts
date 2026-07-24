import { createTheme } from '@mui/material/styles';
import { colors } from './palette';
import { typography } from './typography';

export const theme = createTheme({
  palette: {
    mode: 'light',
    background: { default: colors.bg, paper: colors.surface },
    primary: { main: colors.navy, light: colors.navy600, dark: colors.navy700, contrastText: '#fff' },
    secondary: { main: colors.amber, contrastText: colors.navy },
    success: { main: colors.green },
    error: { main: colors.red },
    info: { main: colors.blue },
    warning: { main: colors.amber },
    text: { primary: colors.textPrimary, secondary: colors.textSecondary },
    divider: colors.border,
  },
  shape: { borderRadius: 12 },
  typography,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: colors.bg },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${colors.border}`,
          boxShadow: '0 1px 2px rgba(18,21,28,.05)',
          borderRadius: 18,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ ownerState, theme }) => ({
          borderRadius: 8,
          fontWeight: 600,
          ...(ownerState.variant === 'contained' &&
            ownerState.color === 'secondary' && { color: theme.palette.primary.main }),
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.75rem' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: colors.textTertiary,
          borderBottom: `1px solid ${colors.border}`,
        },
        body: { fontSize: '0.85rem', borderBottom: `1px solid ${colors.border}` },
      },
    },
  },
});
