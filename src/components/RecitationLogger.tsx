import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { MantraRecitation } from '../types';
import { mantraService, Mantra } from '../services/mantraService';

interface RecitationLoggerProps {
  onAddRecitation: (recitation: Omit<MantraRecitation, 'id'>) => void;
}

// Mantras are now loaded dynamically from the mantra service

export default function RecitationLogger({ onAddRecitation }: RecitationLoggerProps) {
  const [mantras, setMantras] = useState<Mantra[]>([]);
  const [mantraName, setMantraName] = useState('');
  const [customMantra, setCustomMantra] = useState('');
  const [count, setCount] = useState<number>(108);
  const [duration, setDuration] = useState<number>(15);
  const [timestamp, setTimestamp] = useState<Dayjs>(dayjs());
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadMantras();
  }, []);

  const loadMantras = async () => {
    const allMantras = await mantraService.getAllMantras();
    setMantras(allMantras);
    
    // Auto-fill count based on selected mantra's traditional count
    if (mantraName && mantraName !== 'custom') {
      const selectedMantra = allMantras.find(m => m.name === mantraName);
      if (selectedMantra?.traditionalCount) {
        setCount(selectedMantra.traditionalCount);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalMantraName = mantraName === 'custom' ? customMantra : mantraName;
    
    if (!finalMantraName || count <= 0 || duration <= 0) {
      return;
    }

    onAddRecitation({
      mantraName: finalMantraName,
      count,
      duration,
      timestamp: timestamp.toDate(),
      notes: notes || undefined,
    });

    setCount(108);
    setDuration(15);
    setTimestamp(dayjs());
    setNotes('');
    if (mantraName === 'custom') {
      setCustomMantra('');
    }
    
    // Reload mantras in case new ones were added
    loadMantras();
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Log New Recitation
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Box display="flex" flexDirection="column" gap={3}>
            <Box display="flex" flexWrap="wrap" gap={2}>
              <Box flex="1" minWidth="200px">
                <FormControl fullWidth>
                  <InputLabel>Mantra</InputLabel>
                  <Select
                    value={mantraName}
                    onChange={(e) => setMantraName(e.target.value)}
                    required
                  >
                    {mantras.map((mantra) => (
                      <MenuItem key={mantra.id} value={mantra.name}>
                        {mantra.name}
                        {mantra.source === 'user' && ' (Personal)'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              {mantraName === 'custom' && (
                <Box flex="1" minWidth="200px">
                  <TextField
                    fullWidth
                    label="Custom Mantra Name"
                    value={customMantra}
                    onChange={(e) => setCustomMantra(e.target.value)}
                    required
                  />
                </Box>
              )}
            </Box>
            
            <Box display="flex" flexWrap="wrap" gap={2}>
              <Box flex="1" minWidth="150px">
                <TextField
                  fullWidth
                  label="Count"
                  type="number"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  inputProps={{ min: 1 }}
                  required
                />
              </Box>
              
              <Box flex="1" minWidth="150px">
                <TextField
                  fullWidth
                  label="Duration (minutes)"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  inputProps={{ min: 1 }}
                  required
                />
              </Box>
              
              <Box flex="1" minWidth="250px">
                <DateTimePicker
                  label="Date & Time"
                  value={timestamp}
                  onChange={(newValue) => newValue && setTimestamp(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />
              </Box>
            </Box>
            
            <TextField
              fullWidth
              label="Notes (optional)"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
            >
              Log Recitation
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
}