import React, { useState, useEffect } from 'react';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Box,
} from '@mui/material';
import RecitationLogger from './RecitationLogger';
import MetricsDashboard from './MetricsDashboard';
import MantraManagement from './MantraManagement';
import { MantraRecitation } from '../types';

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

  useEffect(() => {
    const savedRecitations = localStorage.getItem('mantraRecitations');
    if (savedRecitations) {
      setRecitations(JSON.parse(savedRecitations));
    }
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
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg">
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Log Recitation" />
            <Tab label="Metrics & Analytics" />
            <Tab label="Manage Mantras" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <RecitationLogger onAddRecitation={addRecitation} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <MetricsDashboard recitations={recitations} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <MantraManagement />
        </TabPanel>
      </Container>
    </>
  );
}