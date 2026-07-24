import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import type { SvgIconComponent } from '@mui/icons-material';
import { colors } from '../../theme/palette';

type Props = {
  title: string;
  description: string;
  icon: SvgIconComponent;
};

export default function PlaceholderPage({ title, description, icon: Icon }: Props) {
  return (
    <Box>
      <Typography variant="h5" sx={{ letterSpacing: '-0.01em', mb: 3, fontWeight: 800 }}>
        {title}
      </Typography>
      <Card
        sx={{
          p: 6, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', textAlign: 'center', gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 48, height: 48, borderRadius: '14px', bgcolor: colors.navy100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon sx={{ color: colors.navy }} />
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {title} is coming in the next build pass
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 420 }}>
          {description}
        </Typography>
      </Card>
    </Box>
  );
}
