import type { ReactNode } from 'react';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { SvgIconComponent } from '@mui/icons-material';
import { fontMono } from '../../../theme/typography';

type KpiCardProps = {
  label: ReactNode;
  value: ReactNode;
  icon: SvgIconComponent;
  iconBg: string;
  iconColor: string;
  footer?: ReactNode;
};

export default function KpiCard({ label, value, icon: Icon, iconBg, iconColor, footer }: KpiCardProps) {
  return (
    <Card sx={{ p: 2.5, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {label}
        </Typography>
        <Box
          sx={{
            width: 34, height: 34, borderRadius: '10px', bgcolor: iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 18, color: iconColor }} />
        </Box>
      </Box>

      <Typography sx={{ fontFamily: fontMono, fontWeight: 700, fontSize: '1.65rem', letterSpacing: '-0.01em' }}>
        {value}
      </Typography>

      {footer && <Box sx={{ mt: 1.25 }}>{footer}</Box>}
    </Card>
  );
}
