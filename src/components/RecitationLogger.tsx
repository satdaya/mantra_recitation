import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { MantraRecitation } from '../types';

interface RecitationLoggerProps {
  onAddRecitation: (recitation: Omit<MantraRecitation, 'id'>) => void;
}

const commonMantras = [
  'Om Mani Padme Hum',
  'Gayatri Mantra',
  'Om Namah Shivaya',
  'Hare Krishna',
  'Om Gam Ganapataye Namaha',
  'So Hum',
  'Om Shanti Shanti Shanti',
  'Custom'
];

export default function RecitationLogger({ onAddRecitation }: RecitationLoggerProps) {
  const [mantraName, setMantraName] = useState('');
  const [customMantra, setCustomMantra] = useState('');
  const [count, setCount] = useState<number>(108);
  const [duration, setDuration] = useState<number>(15);
  const [timestamp, setTimestamp] = useState<Dayjs>(dayjs());
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalMantraName = mantraName === 'Custom' ? customMantra : mantraName;
    
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
    if (mantraName === 'Custom') {
      setCustomMantra('');
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Log New Recitation
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Mantra</InputLabel>
                <Select
                  value={mantraName}
                  onChange={(e) => setMantraName(e.target.value)}
                  required
                >
                  {commonMantras.map((mantra) => (
                    <MenuItem key={mantra} value={mantra}>
                      {mantra}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {mantraName === 'Custom' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Custom Mantra Name"
                  value={customMantra}
                  onChange={(e) => setCustomMantra(e.target.value)}
                  required
                />
              </Grid>
            )}
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Count"
                type="number"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
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
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (optional)"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
              >
                Log Recitation
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
}