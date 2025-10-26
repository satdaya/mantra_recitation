import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
} from '@mui/material';
import {
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';

interface WheelTimerProps {
  label: string;
  value: string; // Format: "HH:MM"
  onChange: (time: string) => void;
  size?: 'small' | 'medium';
}

export default function WheelTimer({ label, value, onChange, size = 'medium' }: WheelTimerProps) {
  const [hours, setHours] = useState(12);
  const [minutes, setMinutes] = useState(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [time, periodPart] = value.split(' ');
      const [h, m] = time.split(':').map(Number);
      setHours(h === 0 ? 12 : h > 12 ? h - 12 : h);
      setMinutes(m);
      setPeriod(periodPart as 'AM' | 'PM' || (h >= 12 ? 'PM' : 'AM'));
    }
  }, [value]);

  // Update parent when time changes
  useEffect(() => {
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;
    
    const timeString = `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    onChange(timeString);
  }, [hours, minutes, period, onChange]);

  const adjustHours = (direction: 'up' | 'down') => {
    if (direction === 'up') {
      setHours(hours === 12 ? 1 : hours + 1);
    } else {
      setHours(hours === 1 ? 12 : hours - 1);
    }
  };

  const adjustMinutes = (direction: 'up' | 'down') => {
    if (direction === 'up') {
      setMinutes(minutes === 59 ? 0 : minutes + 1);
    } else {
      setMinutes(minutes === 0 ? 59 : minutes - 1);
    }
  };

  const togglePeriod = () => {
    setPeriod(period === 'AM' ? 'PM' : 'AM');
  };

  const wheelSize = size === 'small' ? 60 : 80;
  const fontSize = size === 'small' ? '1rem' : '1.5rem';
  const iconSize = size === 'small' ? 'small' : 'medium';

  return (
    <Box>
      <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
        {label}
      </Typography>
      <Box display="flex" alignItems="center" gap={1}>
        {/* Hours Wheel */}
        <Paper 
          elevation={1} 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            width: wheelSize,
            py: 1
          }}
        >
          <IconButton 
            size={iconSize} 
            onClick={() => adjustHours('up')}
            sx={{ p: 0.5 }}
          >
            <ArrowUpIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize,
              fontWeight: 'bold',
              minHeight: '1.5em',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {hours}
          </Typography>
          <IconButton 
            size={iconSize} 
            onClick={() => adjustHours('down')}
            sx={{ p: 0.5 }}
          >
            <ArrowDownIcon />
          </IconButton>
          <Typography variant="caption" color="textSecondary">
            HR
          </Typography>
        </Paper>

        <Typography variant="h5" sx={{ mx: 0.5 }}>:</Typography>

        {/* Minutes Wheel */}
        <Paper 
          elevation={1} 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            width: wheelSize,
            py: 1
          }}
        >
          <IconButton 
            size={iconSize} 
            onClick={() => adjustMinutes('up')}
            sx={{ p: 0.5 }}
          >
            <ArrowUpIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize,
              fontWeight: 'bold',
              minHeight: '1.5em',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {minutes.toString().padStart(2, '0')}
          </Typography>
          <IconButton 
            size={iconSize} 
            onClick={() => adjustMinutes('down')}
            sx={{ p: 0.5 }}
          >
            <ArrowDownIcon />
          </IconButton>
          <Typography variant="caption" color="textSecondary">
            MIN
          </Typography>
        </Paper>

        {/* AM/PM Toggle */}
        <Paper 
          elevation={1} 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            width: wheelSize * 0.8,
            py: 1,
            cursor: 'pointer'
          }}
          onClick={togglePeriod}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize,
              fontWeight: 'bold',
              color: 'primary.main',
              userSelect: 'none'
            }}
          >
            {period}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            PERIOD
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}