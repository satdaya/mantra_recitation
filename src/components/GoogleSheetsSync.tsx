import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  CloudUpload as CloudUploadIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { mantraService } from '../services/mantraService';

interface GoogleSheetsSyncProps {
  onSyncComplete?: () => void;
}

const GoogleSheetsSync: React.FC<GoogleSheetsSyncProps> = ({ onSyncComplete }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    const enabled = mantraService.isGoogleSheetsEnabled();
    setIsEnabled(enabled);

    if (enabled) {
      const sheetsService = mantraService.getGoogleSheetsService();
      setIsConnected(sheetsService.isSignedIn());
    }
  }, []);

  const handleConnect = async () => {
    setIsTesting(true);
    setMessage('');

    try {
      const result = await mantraService.testGoogleSheetsConnection();

      if (result.success) {
        setIsConnected(true);
        setMessage(result.message);
        setMessageType('success');
        setSheetNames(result.sheetNames || []);
      } else {
        setMessage(result.message);
        setMessageType('error');
      }
    } catch (error: any) {
      setMessage(error.message || 'Failed to connect to Google Sheets');
      setMessageType('error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setMessage('');

    try {
      console.log('Starting Google Sheets sync...');
      const success = await mantraService.refreshGoogleSheets();

      if (success) {
        const mantras = await mantraService.getAllMantras();
        const gsMantraCount = mantras.filter(m => m.id.startsWith('gsheet-')).length;
        setMessage(`Successfully synced ${gsMantraCount} mantras from Google Sheets!`);
        setMessageType('success');
        setLastSyncTime(new Date());
        console.log(`Synced ${gsMantraCount} mantras from Google Sheets`);
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        setMessage('Failed to sync mantras. Please try again.');
        setMessageType('error');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      setMessage(error.message || 'An error occurred during sync');
      setMessageType('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = () => {
    const sheetsService = mantraService.getGoogleSheetsService();
    sheetsService.signOut();
    setIsConnected(false);
    setSheetNames([]);
    setMessage('Disconnected from Google Sheets');
    setMessageType('info');
  };

  if (!isEnabled) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <InfoIcon color="info" />
              <Typography variant="h6">Google Sheets Integration</Typography>
            </Box>
            <Alert severity="warning">
              Google Sheets integration is not configured. Please add the following to your <code>.env</code> file:
              <Box component="pre" sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1, fontSize: '0.85rem' }}>
{`REACT_APP_GOOGLE_CLIENT_ID=your_client_id
REACT_APP_GOOGLE_API_KEY=your_api_key
REACT_APP_GOOGLE_SHEET_ID=your_sheet_id`}
              </Box>
            </Alert>
            <Typography variant="body2" color="text.secondary">
              After adding these values, restart your development server.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <CloudUploadIcon color="primary" />
              <Typography variant="h6">Google Sheets Sync</Typography>
            </Box>
            {isConnected ? (
              <Chip
                icon={<CheckCircleIcon />}
                label="Connected"
                color="success"
                size="small"
              />
            ) : (
              <Chip
                icon={<ErrorIcon />}
                label="Not Connected"
                color="default"
                size="small"
              />
            )}
          </Box>

          {message && (
            <Alert severity={messageType} onClose={() => setMessage('')}>
              {message}
            </Alert>
          )}

          {!isConnected ? (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Connect to your Google Sheet to sync mantra data into the app.
              </Typography>
              <Button
                variant="contained"
                onClick={handleConnect}
                disabled={isTesting}
                startIcon={isTesting ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                sx={{ mt: 2 }}
              >
                {isTesting ? 'Connecting...' : 'Connect to Google Sheets'}
              </Button>
            </Box>
          ) : (
            <>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Your Google Sheet is connected and ready to sync.
                </Typography>
                {lastSyncTime && (
                  <Typography variant="caption" color="text.secondary">
                    Last synced: {lastSyncTime.toLocaleString()}
                  </Typography>
                )}
              </Box>

              {sheetNames.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Available Sheets:
                    </Typography>
                    <List dense>
                      {sheetNames.map((name, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={name}
                            secondary={index === 0 ? 'Reading from this sheet' : ''}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </>
              )}

              <Divider />

              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  onClick={handleSync}
                  disabled={isSyncing}
                  startIcon={isSyncing ? <CircularProgress size={20} /> : <SyncIcon />}
                >
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    // Clear all mantra caches
                    localStorage.removeItem('coreMantras');
                    localStorage.removeItem('googleSheetsMantras');
                    localStorage.removeItem('mantraRecitations');
                    setMessage('Cache cleared! Reloading page...');
                    setMessageType('info');
                    // Reload page to refresh data
                    setTimeout(() => window.location.reload(), 1000);
                  }}
                  disabled={isSyncing}
                >
                  Clear All Cache
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleDisconnect}
                  disabled={isSyncing}
                >
                  Disconnect
                </Button>
              </Stack>

              <Alert severity="info" icon={<InfoIcon />}>
                <Typography variant="body2">
                  <strong>Expected Sheet Format:</strong>
                </Typography>
                <Typography variant="caption" component="div">
                  Create multiple sheets in your Google Spreadsheet (e.g., "Banis", "Japji Paurees", "Assorted Mantras").
                  <br />
                  Each sheet should have these column headers (case-insensitive):
                  <br />
                  <strong>Mantra</strong> (required), <strong>Gurmukhi</strong>, <strong>Category</strong>,
                  <strong>Optimal Time</strong>, <strong>Optionality</strong>, <strong>Target Recitations</strong>,
                  <strong>Guru Authorship</strong>, <strong>Guru Number</strong>, <strong>Significance</strong>
                </Typography>
              </Alert>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default GoogleSheetsSync;
