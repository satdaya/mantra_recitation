import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import MantraApp from './components/MantraApp';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FFBF00', // Golden yellow
    },
    secondary: {
      main: '#FFBF00', // Golden yellow
    },
    background: {
      default: '#0A2856', // Dark blue background
      paper: '#0A2856', // Dark blue for cards/papers
    },
    text: {
      primary: '#FFBF00', // Golden yellow text
      secondary: '#FFBF00', // Golden yellow secondary text
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
