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
  ListSubheader,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { MantraRecitation } from '../types';
import { mantraService, Mantra } from '../services/mantraService';

interface RecitationLoggerProps {
  onAddRecitation: (recitation: Omit<MantraRecitation, 'id'>) => void;
}

// Define the same categories as MantraManagement
const mantraCategories = {
  'Banis': {
    name: 'Banis',
    description: 'Daily prayers and complete compositions',
    subcategories: ['Japji Sahib', 'Jaap Sahib', 'Sukhmani Sahib', 'Rehras Sahib', 'Kirtan Sohila', 'Ardas'],
    defaultCount: 1
  },
  'Japji Paurees': {
    name: 'Japji Paurees',
    description: 'Individual verses from Japji Sahib',
    subcategories: ['Pauree 1', 'Pauree 2', 'Pauree 3', 'Pauree 4', 'Pauree 5', 'Pauree 6', 'Pauree 7', 'Pauree 8', 'Pauree 9', 'Pauree 10', 'Pauree 11', 'Pauree 12', 'Pauree 13', 'Pauree 14', 'Pauree 15', 'Pauree 16', 'Pauree 17', 'Pauree 18', 'Pauree 19', 'Pauree 20', 'Pauree 21', 'Pauree 22', 'Pauree 23', 'Pauree 24', 'Pauree 25', 'Pauree 26', 'Pauree 27', 'Pauree 28', 'Pauree 29', 'Pauree 30', 'Pauree 31', 'Pauree 32', 'Pauree 33', 'Pauree 34', 'Pauree 35', 'Pauree 36', 'Pauree 37', 'Slok'],
    defaultCount: 11
  },
  'Assorted Mantras': {
    name: 'Assorted Mantras',
    description: 'Individual mantras and simran',
    subcategories: ['Waheguru', 'Satnam', 'Ik Onkar', 'Guru Mantra', 'Mool Mantra', 'Other Simran'],
    defaultCount: 108
  }
};

// Daily Banis list (same as MantraManagement)
const dailyBanis = [
  'Japji Sahib',
  'Jaap Sahib', 
  'Tav-Prasad Savaiye',
  'Chaupai Sahib',
  'Anand Sahib',
  'Rehras Sahib',
  'Kirtan Sohila',
  'Sukhmani Sahib',
  'Asa Di Var',
  'Ramkali Ki Var'
];

// Helper function to get default count based on category
const getDefaultCountForMantra = (mantraName: string): number => {
  // Check if it's a daily bani
  if (dailyBanis.includes(mantraName)) return 1;
  
  // Check if it's a Japji Pauree
  if (mantraCategories['Japji Paurees'].subcategories.includes(mantraName)) return 11;
  
  // Check if it's an assorted mantra
  if (mantraCategories['Assorted Mantras'].subcategories.includes(mantraName)) return 108;
  
  // Check main categories
  for (const [mainCat, config] of Object.entries(mantraCategories)) {
    if (mantraName === mainCat) return config.defaultCount;
  }
  
  return 108; // Default fallback
};

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
                    onChange={(e) => handleMantraChange(e.target.value)}
                    required
                  >
                    {/* Daily Banis Section */}
                    <ListSubheader>📿 Daily Banis</ListSubheader>
                    {dailyBanis.map((bani) => (
                      <MenuItem key={`bani-${bani}`} value={bani} sx={{ pl: 4 }}>
                        {bani}
                      </MenuItem>
                    ))}
                    
                    {/* Japji Paurees Section */}
                    <ListSubheader>🔢 Japji Paurees</ListSubheader>
                    {mantraCategories['Japji Paurees'].subcategories.map((pauree) => (
                      <MenuItem key={`pauree-${pauree}`} value={pauree} sx={{ pl: 4 }}>
                        {pauree}
                      </MenuItem>
                    ))}
                    
                    {/* Assorted Mantras Section */}
                    <ListSubheader>🕉️ Assorted Mantras</ListSubheader>
                    {mantraCategories['Assorted Mantras'].subcategories.map((mantra) => (
                      <MenuItem key={`assorted-${mantra}`} value={mantra} sx={{ pl: 4 }}>
                        {mantra}
                      </MenuItem>
                    ))}
                    
                    {/* User/Personal Mantras Section */}
                    {mantras.filter(m => m.source === 'user').length > 0 && (
                      <>
                        <ListSubheader>👤 Your Personal Mantras</ListSubheader>
                        {mantras
                          .filter(m => m.source === 'user')
                          .map((mantra) => (
                            <MenuItem key={`user-${mantra.id}`} value={mantra.name} sx={{ pl: 4 }}>
                              {mantra.name} (Personal)
                            </MenuItem>
                          ))}
                      </>
                    )}
                    
                    {/* Core Mantras that don't fit in categories */}
                    {mantras.filter(m => 
                      m.source === 'core' && 
                      !dailyBanis.includes(m.name) &&
                      !mantraCategories['Japji Paurees'].subcategories.includes(m.name) &&
                      !mantraCategories['Assorted Mantras'].subcategories.includes(m.name)
                    ).length > 0 && (
                      <>
                        <ListSubheader>📚 Other Core Mantras</ListSubheader>
                        {mantras
                          .filter(m => 
                            m.source === 'core' && 
                            !dailyBanis.includes(m.name) &&
                            !mantraCategories['Japji Paurees'].subcategories.includes(m.name) &&
                            !mantraCategories['Assorted Mantras'].subcategories.includes(m.name)
                          )
                          .map((mantra) => (
                            <MenuItem key={`core-${mantra.id}`} value={mantra.name} sx={{ pl: 4 }}>
                              {mantra.name}
                            </MenuItem>
                          ))}
                      </>
                    )}
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