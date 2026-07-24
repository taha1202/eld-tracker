import { useState, useEffect, useRef, useCallback } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined';
import { tripsApi } from '../../../shared/api/tripsApi';
import type { GeocodeResult } from '../../../types/trip';

type Props = {
  label?: string;
  icon: React.ReactNode;
  value: GeocodeResult | null;
  onChange: (val: GeocodeResult | null) => void;
  required?: boolean;
  placeholder?: string;
};

export default function LocationField({ icon, value, onChange, required, placeholder }: Props) {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchOptions = useCallback(async (q: string) => {
    if (q.length < 2) { setOptions([]); return; }
    setLoading(true);
    try {
      const results = await tripsApi.geocode(q);
      setOptions(results);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchOptions(inputValue), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue, fetchOptions]);

  return (
    <Autocomplete
      options={options}
      getOptionLabel={(opt) => opt.label || ''}
      filterOptions={(x) => x}
      loading={loading}
      value={value}
      onChange={(_, val) => onChange(val)}
      inputValue={inputValue}
      onInputChange={(_, val) => setInputValue(val)}
      isOptionEqualToValue={(option, val) => option.label === val.label}
      renderInput={(params) => (
        <TextField
          {...params}
          required={required}
          placeholder={placeholder ?? 'Search city, address, or truck stop'}
          sx={{ '& .MuiInputBase-root': { height: 46, borderRadius: '10px' } }}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <InputAdornment position="start">
                  {icon ?? <LocationOnOutlined sx={{ fontSize: 18 }} />}
                </InputAdornment>
                {params.InputProps?.startAdornment}
              </>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress size={16} /> : null}
                {params.InputProps?.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => {
        const { key, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & { key: string };
        return (
          <li key={key} {...rest}>
            <LocationOnOutlined sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            {option.label}
          </li>
        );
      }}
      noOptionsText={inputValue.length < 2 ? "Start typing to search…" : "No matches found"}
    />
  );
}
