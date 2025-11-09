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
import { mantraCategories, dailyBanis, getDefaultCountForMantra } from '../constants/mantraCategories';

interface RecitationLoggerProps {
  onAddRecitation: (recitation: Omit<MantraRecitation, 'id'>) => void;
}


export default function RecitationLogger({ onAddRecitation }: RecitationLoggerProps) {
  const [mantras, setMantras] = useState<Mantra[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [mantraName, setMantraName] = useState('');
  const [customMantra, setCustomMantra] = useState('');
  const [count, setCount] = useState<number>(108);
  const [duration, setDuration] = useState<number | ''>('');
  const [timestamp, setTimestamp] = useState<Dayjs | null>(dayjs());
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadMantras();
  }, []);

  const loadMantras = async () => {
    const allMantras = await mantraService.getAllMantras();
    console.log('All loaded mantras:', allMantras);
    console.log('Categories found:', Array.from(new Set(allMantras.map(m => m.category))));
    console.log('Google Sheets mantras:', allMantras.filter(m => m.id.startsWith('gsheet-')));
    setMantras(allMantras);
  };

  // Handle category selection change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setMantraName(''); // Reset mantra selection when category changes
    setCount(getDefaultCountForMantra(category)); // Set default count for category
  };

  // Handle mantra selection change
  const handleMantraChange = (selectedMantraName: string) => {
    setMantraName(selectedMantraName);
    
    if (selectedMantraName && selectedMantraName !== 'custom') {
      // First try to get traditional count from loaded mantras
      const selectedMantra = mantras.find(m => m.name === selectedMantraName);
      if (selectedMantra?.traditionalCount) {
        setCount(selectedMantra.traditionalCount);
      } else {
        // Fall back to category-based default count
        setCount(getDefaultCountForMantra(selectedMantraName));
      }
    }
  };

  // Get available mantras for the selected category
  const getAvailableMantras = () => {
    if (selectedCategory === 'Personal Mantras') {
      return mantras.filter(m => m.source === 'user').map(m => m.name);
    }

    // Get mantras from Google Sheets or other sources that match the category
    const categoryMapping: Record<string, string> = {
      'Daily Banis': 'Banis',
      'Japji Paurees': 'Japji Paurees',
      'Assorted Mantras': 'Assorted Mantras'
    };

    const categoryName = categoryMapping[selectedCategory];
    if (categoryName) {
      const categoryMantras = mantras
        .filter(m => m.category === categoryName && m.source === 'core')
        .map(m => m.name);

      console.log(`Looking for category: ${categoryName}, found ${categoryMantras.length} mantras`);
      console.log('Matching mantras:', categoryMantras);

      // Return Google Sheets mantras (no fallback to hardcoded lists)
      return categoryMantras;
    }

    return [];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalMantraName = mantraName === 'custom' ? customMantra : mantraName;

    if (!finalMantraName || count <= 0) {
      return;
    }

    onAddRecitation({
      mantraName: finalMantraName,
      count,
      duration: duration === '' ? undefined : duration,
      timestamp: timestamp ? timestamp.toDate() : undefined,
      notes: notes || undefined,
    });

    setSelectedCategory('');
    setMantraName('');
    setCustomMantra('');
    setCount(108);
    setDuration('');
    setTimestamp(dayjs());
    setNotes('');

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
              {/* Category Selection */}
              <Box flex="1" minWidth="200px">
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    required
                  >
                    <MenuItem value="Daily Banis">📿 Daily Banis</MenuItem>
                    <MenuItem value="Japji Paurees">🔢 Japji Paurees</MenuItem>
                    <MenuItem value="Assorted Mantras">🕉️ Assorted Mantras</MenuItem>
                    {mantras.filter(m => m.source === 'user').length > 0 && (
                      <MenuItem value="Personal Mantras">👤 Personal Mantras</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Box>

              {/* Mantra Selection - Only show when category is selected */}
              {selectedCategory && (
                <Box flex="1" minWidth="200px">
                  <FormControl fullWidth>
                    <InputLabel>Mantra</InputLabel>
                    <Select
                      value={mantraName}
                      onChange={(e) => handleMantraChange(e.target.value)}
                      required
                    >
                      {getAvailableMantras().map((mantra) => (
                        <MenuItem key={`${selectedCategory}-${mantra}`} value={mantra}>
                          {mantra}
                          {selectedCategory === 'Personal Mantras' && ' (Personal)'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
            </Box>
            
            {mantraName === 'custom' && (
              <TextField
                fullWidth
                label="Custom Mantra Name"
                value={customMantra}
                onChange={(e) => setCustomMantra(e.target.value)}
                required
              />
            )}
            
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
                  label="Duration (minutes) - Optional"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
                  inputProps={{ min: 1 }}
                  placeholder="Leave empty if unknown"
                />
              </Box>

              <Box flex="1" minWidth="250px">
                <DateTimePicker
                  label="Date & Time"
                  value={timestamp}
                  onChange={(newValue) => setTimestamp(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
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