import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import MantraApp from './components/MantraApp';

const theme = createTheme({
  palette: {
    primary: {
      main: '#6b46c1',
    },
    secondary: {
      main: '#ec4899',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MantraApp />
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
