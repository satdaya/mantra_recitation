import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  TextField,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Checkbox,
  ListItemText,
  OutlinedInput,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { MantraRecitation } from '../types';
import { mantraService, Mantra } from '../services/mantraService';

interface DataBackfillProps {
  onAddRecitation: (recitation: Omit<MantraRecitation, 'id'>) => void;
}

export default function DataBackfill({ onAddRecitation }: DataBackfillProps) {
  const [mantraName, setMantraName] = useState('');
  const [count, setCount] = useState<number>(108);
  const [duration, setDuration] = useState<number | ''>('');
  const [timestamp, setTimestamp] = useState<Dayjs | null>(dayjs());
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  // Date range mode
  const [useRange, setUseRange] = useState(false);
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [timeOfDay, setTimeOfDay] = useState<Dayjs | null>(dayjs().hour(6).minute(0));

  // CSV format
  const [csvData, setCsvData] = useState('');

  // Bulk add by filters
  const [mantras, setMantras] = useState<Mantra[]>([]);
  const [selectedOptionality, setSelectedOptionality] = useState<string[]>([]);
  const [selectedOptimalTime, setSelectedOptimalTime] = useState<string[]>([]);
  const [bulkStartDate, setBulkStartDate] = useState<Dayjs | null>(dayjs());
  const [bulkEndDate, setBulkEndDate] = useState<Dayjs | null>(dayjs());

  // Load mantras on mount
  useEffect(() => {
    const loadMantras = async () => {
      const allMantras = await mantraService.getAllMantras();
      setMantras(allMantras.filter(m => m.id !== 'custom'));
    };
    loadMantras();
  }, []);

  // Get unique optionality values from mantras
  const optionalityOptions = Array.from(
    new Set(mantras.map(m => m.optionality).filter(Boolean))
  ) as string[];

  // Get unique optimal time values from mantras
  const optimalTimeOptions = Array.from(
    new Set(mantras.map(m => m.optimalTime).filter(Boolean))
  ) as string[];

  // Get filtered mantras based on selections
  const getFilteredMantras = () => {
    return mantras.filter(m => {
      const matchesOptionality = selectedOptionality.length === 0 ||
        (m.optionality && selectedOptionality.includes(m.optionality));
      const matchesOptimalTime = selectedOptimalTime.length === 0 ||
        (m.optimalTime && selectedOptimalTime.includes(m.optimalTime));
      return matchesOptionality && matchesOptimalTime;
    });
  };

  // Get time of day from optimal time string
  const getTimeFromOptimalTime = (optimalTime: string | undefined): Dayjs => {
    const timeMap: Record<string, { hour: number; minute: number }> = {
      'Amrit Vela': { hour: 4, minute: 0 },
      'Morning': { hour: 6, minute: 0 },
      'Afternoon': { hour: 12, minute: 0 },
      'Evening': { hour: 18, minute: 0 },
      'Night': { hour: 21, minute: 0 },
      'Any Time': { hour: 6, minute: 0 },
    };
    const time = optimalTime && timeMap[optimalTime] ? timeMap[optimalTime] : { hour: 6, minute: 0 };
    return dayjs().hour(time.hour).minute(time.minute);
  };

  const handleManualAdd = () => {
    if (!mantraName || !count) {
      setMessage('Please fill in Mantra Name and Count');
      setMessageType('error');
      return;
    }

    if (useRange) {
      // Date range mode
      if (!startDate || !endDate || !timeOfDay) {
        setMessage('Please fill in Start Date, End Date, and Time of Day');
        setMessageType('error');
        return;
      }

      if (endDate.isBefore(startDate)) {
        setMessage('End date must be after start date');
        setMessageType('error');
        return;
      }

      let currentDate = startDate;
      let addedCount = 0;

      while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
        const recitationTimestamp = currentDate
          .hour(timeOfDay.hour())
          .minute(timeOfDay.minute())
          .second(0);

        onAddRecitation({
          mantraName,
          count,
          duration: duration === '' ? undefined : duration,
          timestamp: recitationTimestamp.toDate(),
          notes: notes || undefined,
        });

        addedCount++;
        currentDate = currentDate.add(1, 'day');
      }

      setMessage(`Added ${addedCount} recitations: ${mantraName} (${count} each) from ${startDate.format('YYYY-MM-DD')} to ${endDate.format('YYYY-MM-DD')}`);
      setMessageType('success');
    } else {
      // Single date mode
      if (!timestamp) {
        setMessage('Please fill in Date/Time');
        setMessageType('error');
        return;
      }

      onAddRecitation({
        mantraName,
        count,
        duration: duration === '' ? undefined : duration,
        timestamp: timestamp.toDate(),
        notes: notes || undefined,
      });

      setMessage(`Added: ${mantraName} (${count} times) on ${timestamp.format('YYYY-MM-DD HH:mm')}`);
      setMessageType('success');
    }

    // Reset form
    setMantraName('');
    setCount(108);
    setDuration('');
    setNotes('');
    setTimestamp(dayjs());
    setStartDate(dayjs());
    setEndDate(dayjs());
  };

  const handleCSVImport = () => {
    if (!csvData.trim()) {
      setMessage('Please paste CSV data');
      setMessageType('error');
      return;
    }

    try {
      const lines = csvData.trim().split('\n');
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

      let imported = 0;
      let failed = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};

        headers.forEach((header, index) => {
          row[header] = values[index];
        });

        try {
          const recitation: Omit<MantraRecitation, 'id'> = {
            mantraName: row.mantra || row.mantraname || row.name,
            count: parseInt(row.count) || 0,
            duration: row.duration ? parseInt(row.duration) : undefined,
            timestamp: row.date || row.timestamp ? new Date(row.date || row.timestamp) : new Date(),
            notes: row.notes || undefined,
          };

          if (recitation.mantraName && recitation.count > 0) {
            onAddRecitation(recitation);
            imported++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error('Error parsing row:', lines[i], error);
          failed++;
        }
      }

      setMessage(`Import complete! ${imported} imported, ${failed} failed`);
      setMessageType('success');
      setCsvData('');
    } catch (error: any) {
      setMessage(`Import error: ${error.message}`);
      setMessageType('error');
    }
  };

  const handleJSONImport = () => {
    try {
      const data = JSON.parse(csvData);
      const recitations = Array.isArray(data) ? data : [data];

      let imported = 0;
      recitations.forEach((rec: any) => {
        try {
          onAddRecitation({
            mantraName: rec.mantraName || rec.name,
            count: rec.count,
            duration: rec.duration,
            timestamp: rec.timestamp ? new Date(rec.timestamp) : new Date(),
            notes: rec.notes,
          });
          imported++;
        } catch (error) {
          console.error('Error importing recitation:', rec, error);
        }
      });

      setMessage(`Imported ${imported} recitations from JSON`);
      setMessageType('success');
      setCsvData('');
    } catch (error: any) {
      setMessage(`JSON parse error: ${error.message}`);
      setMessageType('error');
    }
  };

  const handleBulkAddByFilters = () => {
    if (selectedOptionality.length === 0 && selectedOptimalTime.length === 0) {
      setMessage('Please select at least one Optionality or Optimal Time filter');
      setMessageType('error');
      return;
    }

    if (!bulkStartDate || !bulkEndDate) {
      setMessage('Please fill in Start Date and End Date');
      setMessageType('error');
      return;
    }

    if (bulkEndDate.isBefore(bulkStartDate)) {
      setMessage('End date must be after start date');
      setMessageType('error');
      return;
    }

    const filteredMantras = getFilteredMantras();
    if (filteredMantras.length === 0) {
      setMessage('No mantras match the selected filters');
      setMessageType('error');
      return;
    }

    let totalAdded = 0;

    // For each day in the range
    let currentDate = bulkStartDate;
    while (currentDate.isBefore(bulkEndDate) || currentDate.isSame(bulkEndDate, 'day')) {
      // Add each filtered mantra
      for (const mantra of filteredMantras) {
        const recitationTime = getTimeFromOptimalTime(mantra.optimalTime);
        const recitationTimestamp = currentDate
          .hour(recitationTime.hour())
          .minute(recitationTime.minute())
          .second(0);

        onAddRecitation({
          mantraName: mantra.name,
          count: mantra.traditionalCount || 1,
          duration: undefined,
          timestamp: recitationTimestamp.toDate(),
          notes: `Bulk backfill - ${mantra.optionality || 'N/A'} / ${mantra.optimalTime || 'Any Time'}`,
        });

        totalAdded++;
      }

      currentDate = currentDate.add(1, 'day');
    }

    const dayCount = bulkEndDate.diff(bulkStartDate, 'day') + 1;
    setMessage(`Added ${totalAdded} recitations (${filteredMantras.length} mantras x ${dayCount} days)`);
    setMessageType('success');

    // Reset filters
    setSelectedOptionality([]);
    setSelectedOptimalTime([]);
    setBulkStartDate(dayjs());
    setBulkEndDate(dayjs());
  };

  const generateSampleCSV = () => {
    const sample = `mantra,count,duration,date,notes
Japji Sahib,1,30,2024-01-01 06:00,Morning recitation
Waheguru,108,15,2024-01-01 20:00,Evening simran
Mool Mantra,125000,60,2024-01-02 05:00,Early morning`;

    setCsvData(sample);
    setMessage('Sample CSV loaded - modify as needed');
    setMessageType('info');
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Data Backfill
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Manually add historical recitations or import bulk data
        </Typography>

        {message && (
          <Alert severity={messageType} onClose={() => setMessage('')} sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        {/* Manual Entry */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Manual Entry
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              fullWidth
              label="Mantra Name"
              value={mantraName}
              onChange={(e) => setMantraName(e.target.value)}
              required
            />

            <Box display="flex" gap={2} flexWrap="wrap">
              <TextField
                label="Count"
                type="number"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                inputProps={{ min: 1 }}
                required
                sx={{ flex: 1, minWidth: '150px' }}
              />

              <TextField
                label="Duration (minutes)"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
                inputProps={{ min: 1 }}
                sx={{ flex: 1, minWidth: '150px' }}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={useRange}
                  onChange={(e) => setUseRange(e.target.checked)}
                />
              }
              label="Use date range (add one recitation per day)"
            />

            {useRange ? (
              <Box display="flex" gap={2} flexWrap="wrap">
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{ textField: { sx: { flex: 1, minWidth: '150px' } } }}
                />
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{ textField: { sx: { flex: 1, minWidth: '150px' } } }}
                />
                <TimePicker
                  label="Time of Day"
                  value={timeOfDay}
                  onChange={(newValue) => setTimeOfDay(newValue)}
                  slotProps={{ textField: { sx: { flex: 1, minWidth: '150px' } } }}
                />
              </Box>
            ) : (
              <DateTimePicker
                label="Date & Time"
                value={timestamp}
                onChange={(newValue) => setTimestamp(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            )}

            <TextField
              fullWidth
              label="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={2}
            />

            <Button variant="contained" onClick={handleManualAdd}>
              Add Recitation
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Bulk Add by Optionality / Optimal Time */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Bulk Add by Optionality / Optimal Time
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Add recitations for all mantras matching the selected filters across a date range
          </Typography>

          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" gap={2} flexWrap="wrap">
              <FormControl sx={{ flex: 1, minWidth: '200px' }}>
                <InputLabel>Optionality</InputLabel>
                <Select
                  multiple
                  value={selectedOptionality}
                  onChange={(e) => setSelectedOptionality(
                    typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
                  )}
                  input={<OutlinedInput label="Optionality" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {optionalityOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      <Checkbox checked={selectedOptionality.indexOf(option) > -1} />
                      <ListItemText primary={option} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ flex: 1, minWidth: '200px' }}>
                <InputLabel>Optimal Time</InputLabel>
                <Select
                  multiple
                  value={selectedOptimalTime}
                  onChange={(e) => setSelectedOptimalTime(
                    typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
                  )}
                  input={<OutlinedInput label="Optimal Time" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {optimalTimeOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      <Checkbox checked={selectedOptimalTime.indexOf(option) > -1} />
                      <ListItemText primary={option} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box display="flex" gap={2} flexWrap="wrap">
              <DatePicker
                label="Start Date"
                value={bulkStartDate}
                onChange={(newValue) => setBulkStartDate(newValue)}
                slotProps={{ textField: { sx: { flex: 1, minWidth: '150px' } } }}
              />
              <DatePicker
                label="End Date"
                value={bulkEndDate}
                onChange={(newValue) => setBulkEndDate(newValue)}
                slotProps={{ textField: { sx: { flex: 1, minWidth: '150px' } } }}
              />
            </Box>

            {/* Preview of matched mantras */}
            {(selectedOptionality.length > 0 || selectedOptimalTime.length > 0) && (
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>{getFilteredMantras().length} mantras</strong> match your filters:
                  {getFilteredMantras().length <= 10 ? (
                    <> {getFilteredMantras().map(m => m.name).join(', ')}</>
                  ) : (
                    <> {getFilteredMantras().slice(0, 10).map(m => m.name).join(', ')}... and {getFilteredMantras().length - 10} more</>
                  )}
                </Typography>
              </Alert>
            )}

            <Button
              variant="contained"
              color="secondary"
              onClick={handleBulkAddByFilters}
              disabled={selectedOptionality.length === 0 && selectedOptimalTime.length === 0}
            >
              Bulk Add Recitations
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* CSV/JSON Import */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Bulk Import (CSV or JSON)
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Button size="small" onClick={generateSampleCSV} sx={{ mr: 1 }}>
              Load Sample CSV
            </Button>
            <Typography variant="caption" color="textSecondary">
              CSV Headers: mantra, count, duration, date, notes
            </Typography>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={10}
            placeholder="Paste CSV or JSON data here..."
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            sx={{ mb: 2, fontFamily: 'monospace', fontSize: '12px' }}
          />

          <Box display="flex" gap={2}>
            <Button variant="contained" onClick={handleCSVImport}>
              Import CSV
            </Button>
            <Button variant="outlined" onClick={handleJSONImport}>
              Import JSON
            </Button>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>CSV Format:</strong> First row must be headers. Columns: mantra, count, duration, date, notes
              <br />
              <strong>JSON Format:</strong> Array of objects with keys: mantraName, count, duration, timestamp, notes
            </Typography>
          </Alert>
        </Box>
      </CardContent>
    </Card>
  );
}
