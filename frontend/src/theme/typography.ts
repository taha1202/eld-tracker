import type { ThemeOptions } from '@mui/material/styles';

// Inter for UI text, JetBrains Mono for anything numeric (KPI values, mileage,
// hour totals), a small nod to an ELD's digital display, kept from the mockups.
export const fontUi = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
export const fontMono = "'JetBrains Mono', ui-monospace, monospace";

export const typography: ThemeOptions['typography'] = {
  fontFamily: fontUi,
  h1: { fontFamily: fontUi, fontWeight: 800, letterSpacing: '-0.01em' },
  h2: { fontFamily: fontUi, fontWeight: 800, letterSpacing: '-0.01em' },
  h3: { fontFamily: fontUi, fontWeight: 700, letterSpacing: '-0.01em' },
  h4: { fontFamily: fontUi, fontWeight: 700, letterSpacing: '-0.01em' },
  h5: { fontFamily: fontUi, fontWeight: 700, letterSpacing: '-0.01em' },
  h6: { fontFamily: fontUi, fontWeight: 700, letterSpacing: '-0.01em' },
  button: { fontWeight: 600, textTransform: 'none' },
};
