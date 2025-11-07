import React, { useState, useEffect } from 'react';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Box,
  Chip,
} from '@mui/material';
import RecitationLogger from './RecitationLogger';
import MetricsDashboard from './MetricsDashboard';
import ApiTest from './ApiTest';
import { MantraRecitation } from '../types';
import { mantraService } from '../services/mantraService';
// import logo from '../assets/your-image.png'; // Uncomment and update path

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function MantraApp() {
  const [tabValue, setTabValue] = useState(0);
  const [recitations, setRecitations] = useState<MantraRecitation[]>([]);
  const [backendStatus, setBackendStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    const savedRecitations = localStorage.getItem('mantraRecitations');
    if (savedRecitations) {
      setRecitations(JSON.parse(savedRecitations));
    }

    // Test backend connection
    mantraService.testConnection()
      .then(isConnected => {
        setBackendStatus(isConnected ? 'connected' : 'disconnected');
      })
      .catch(() => {
        setBackendStatus('disconnected');
      });
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const addRecitation = (recitation: Omit<MantraRecitation, 'id'>) => {
    const newRecitation: MantraRecitation = {
      ...recitation,
      id: Date.now().toString(),
    };
    const updatedRecitations = [...recitations, newRecitation];
    setRecitations(updatedRecitations);
    localStorage.setItem('mantraRecitations', JSON.stringify(updatedRecitations));
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Mantra Recitation Tracker
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Backend Connection Status */}
            <Chip 
              label={backendStatus === 'connecting' ? 'Connecting...' : backendStatus === 'connected' ? 'Backend Connected' : 'Backend Offline'}
              color={backendStatus === 'connected' ? 'success' : backendStatus === 'connecting' ? 'default' : 'error'}
              size="small"
            />
            {/* Add your image here */}
            <img 
              src="/Nishan_Sahib.svg.png" // Replace with your image path
              alt="Logo" 
              style={{ 
                height: '40px', 
                width: 'auto',
              }} 
            />
          </Box>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg">
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Log Recitation" />
            <Tab label="Metrics & Analytics" />
            <Tab label="API Test" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <RecitationLogger onAddRecitation={addRecitation} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <MetricsDashboard recitations={recitations} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <ApiTest />
        </TabPanel>
      </Container>
    </>
  );
}