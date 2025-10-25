import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { api } from '../lib/api';

export default function ApiTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testHealthCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.healthCheck();
      setResult({ type: 'health', data: response });
    } catch (err) {
      setError(`Health check failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetMantras = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getMantras();
      setResult({ type: 'mantras', data: response });
    } catch (err) {
      setError(`Get mantras failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreateRecitation = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.createRecitation({
        mantra_id: 'm1',
        user_id: 'test-user',
        count: 108,
        duration_minutes: 15,
        notes: 'Test recitation from React frontend'
      });
      setResult({ type: 'create_recitation', data: response });
    } catch (err) {
      setError(`Create recitation failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        API Connection Test
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button 
          variant="contained" 
          onClick={testHealthCheck}
          disabled={loading}
        >
          Test Health Check
        </Button>
        <Button 
          variant="contained" 
          onClick={testGetMantras}
          disabled={loading}
        >
          Test Get Mantras
        </Button>
        <Button 
          variant="contained" 
          onClick={testCreateRecitation}
          disabled={loading}
        >
          Test Create Recitation
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {result.type.replace('_', ' ').toUpperCase()} Result:
            </Typography>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto'
            }}>
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}