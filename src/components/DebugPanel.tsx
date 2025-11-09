import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button, Box, Alert } from '@mui/material';
import { mantraService } from '../services/mantraService';
import { googleSheetsService } from '../services/googleSheetsService';

export default function DebugPanel() {
  const [status, setStatus] = useState<string>('');
  const [mantras, setMantras] = useState<any[]>([]);

  const checkGoogleSheets = async () => {
    setStatus('Checking Google Sheets connection...');

    try {
      const gsService = mantraService.getGoogleSheetsService();
      const isSignedIn = gsService.isSignedIn();

      setStatus(`Signed in: ${isSignedIn}\n`);

      if (!isSignedIn) {
        setStatus('Not signed in to Google Sheets. Please connect first.');
        return;
      }

      // Get sheet names
      const sheetNames = await gsService.getSheetNames();
      setStatus(prev => prev + `Sheet names: ${sheetNames.join(', ')}\n`);

      // Get all mantras
      const allMantras = await gsService.getMantras();
      setStatus(prev => prev + `Total mantras loaded: ${allMantras.length}\n`);
      setMantras(allMantras);

      // Show categories
      const categories = Array.from(new Set(allMantras.map(m => m.category)));
      setStatus(prev => prev + `Categories: ${categories.join(', ')}\n`);

    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const clearAllCache = () => {
    localStorage.removeItem('googleSheetsMantras');
    localStorage.removeItem('coreMantras');
    setStatus('Cache cleared! Refresh the page to reload.');
  };

  const forceSync = async () => {
    setStatus('Forcing sync...');
    try {
      await mantraService.refreshGoogleSheets();
      setStatus('Sync complete! Check console for details.');
      await checkGoogleSheets();
    } catch (error: any) {
      setStatus(`Sync error: ${error.message}`);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Debug Panel
        </Typography>

        <Box display="flex" gap={2} mb={2}>
          <Button variant="contained" onClick={checkGoogleSheets}>
            Check Google Sheets
          </Button>
          <Button variant="outlined" onClick={clearAllCache}>
            Clear Cache
          </Button>
          <Button variant="contained" color="secondary" onClick={forceSync}>
            Force Sync
          </Button>
        </Box>

        {status && (
          <Alert severity="info" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
            {status}
          </Alert>
        )}

        {mantras.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Loaded Mantras ({mantras.length})
            </Typography>
            <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
              <pre style={{ fontSize: '12px' }}>
                {JSON.stringify(mantras, null, 2)}
              </pre>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
