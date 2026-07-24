// Design tokens ported 1:1 from the HTML mockups (styles.css) so the real
// app matches what was already approved, not a re-interpretation of it.

export const colors = {
  bg: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F2F5',
  border: '#E4E7EC',
  borderStrong: '#D3D7DE',

  textPrimary: '#12151C',
  textSecondary: '#636B78',
  textTertiary: '#9AA1AC',

  navy: '#14213D',
  navy700: '#1D2E52',
  navy600: '#2B4372',
  navy100: '#E7EAF2',

  amber: '#F5A524',
  amberSoft: '#FFF4DE',
  amber700: '#B77300',

  green: '#17B26A',
  greenSoft: '#E7F9F0',
  red: '#E23D3D',
  redSoft: '#FDEAEA',
  blue: '#2970FF',
  blueSoft: '#EAF1FF',
  indigo: '#5B5FEF',
  indigoSoft: '#ECEDFD',
} as const;
