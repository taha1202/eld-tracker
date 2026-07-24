import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TablePagination from '@mui/material/TablePagination';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import MoreVertOutlined from '@mui/icons-material/MoreVertOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import DirectionsCarFilledOutlined from '@mui/icons-material/DirectionsCarFilledOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import EventOutlined from '@mui/icons-material/EventOutlined';
import { useNavigate } from 'react-router-dom';
import { tripsApi } from '../../../shared/api/tripsApi';
import { fontMono } from '../../../theme/typography';
import { colors } from '../../../theme/palette';
import type { TripListItem } from '../../../types/trip';



export default function RecentTripsTable() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [rowMenuState, setRowMenuState] = useState<{ el: HTMLElement; tripId: number } | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const { data: trips, isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: tripsApi.listTrips,
  });

  const filtered = (trips ?? []).filter((t: TripListItem) => {
    if (search) {
      const q = search.toLowerCase();
      const text = `${t.current_location} ${t.pickup_location} ${t.dropoff_location}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Card sx={{ mt: 2 }}>
      <Box sx={{ p: 2.5, pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Recent Trips
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Your last planned or completed routes
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Search routes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined sx={{ fontSize: 18, color: colors.textTertiary }} />
                    </InputAdornment>
                  ),
                  sx: { fontSize: '0.8rem', height: 34 },
                },
              }}
              sx={{ width: 190 }}
            />
          </Box>
        </Box>
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Route</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Distance</TableCell>
              <TableCell>Days</TableCell>
              <TableCell sx={{ width: 44 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}><Skeleton /></TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  No trips found
                </TableCell>
              </TableRow>
            )}
            {paginated.map((t) => {
              return (
                <TableRow
                  key={t.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/trips/${t.id}`)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, color: 'text.primary' }}>
                      {t.pickup_location}
                      <ArrowForwardOutlined sx={{ fontSize: 14, color: colors.textTertiary }} />
                      {t.dropoff_location}
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      From {t.current_location}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontFamily: fontMono }}>{formatDate(t.created_at)}</TableCell>
                  <TableCell sx={{ fontFamily: fontMono }}>
                    {t.distance_miles ? `${Math.round(t.distance_miles).toLocaleString()} mi` : '-'}
                  </TableCell>
                  <TableCell sx={{ fontFamily: fontMono }}>
                    {t.duty_days ?? '-'}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      size="small"
                      onClick={(e) => setRowMenuState({ el: e.currentTarget, tripId: t.id })}
                    >
                      <MoreVertOutlined fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>

      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />

      <Menu
        anchorEl={rowMenuState?.el}
        open={Boolean(rowMenuState)}
        onClose={() => setRowMenuState(null)}
        slotProps={{ paper: { sx: { borderRadius: '12px', minWidth: 170 } } }}
      >
        <MenuItem onClick={() => { if (rowMenuState) navigate(`/trips/${rowMenuState.tripId}`); setRowMenuState(null); }}>
          <ListItemIcon><VisibilityOutlined fontSize="small" /></ListItemIcon>
          <ListItemText>View details</ListItemText>
        </MenuItem>
        <Divider />
      </Menu>
    </Card>
  );
}
