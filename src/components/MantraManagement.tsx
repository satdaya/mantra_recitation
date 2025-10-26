import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as SubmitIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { mantraService, Mantra } from '../services/mantraService';
import WheelTimer from './WheelTimer';
import { mantraCategories, dailyBanis, getDefaultCountForMantra } from '../constants/mantraCategories';

interface MantraManagementProps {
  onMantraAdded?: () => void;
}

// Bani tracking interface
interface BaniSession {
  bani: string;
  completed: boolean;
  startTime: string;
  endTime: string;
  date: string;
}

export default function MantraManagement({ onMantraAdded }: MantraManagementProps) {
  const [mantras, setMantras] = useState<Mantra[]>([]);
  const [open, setOpen] = useState(false);
  const [editingMantra, setEditingMantra] = useState<Mantra | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Banis');
  const [formData, setFormData] = useState({
    name: '',
    sanskrit: '',
    gurmukhi: '',
    translation: '',
    category: '',
    traditionalCount: 108,
    submittedBy: '',
  });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  
  // Bani tracking state
  const [baniSessions, setBaniSessions] = useState<BaniSession[]>([]);
  const [showBaniTimer, setShowBaniTimer] = useState<string | null>(null);

  useEffect(() => {
    loadMantras();
    loadBaniSessions();
  }, []);

  const loadBaniSessions = () => {
    const today = new Date().toISOString().split('T')[0];
    const savedSessions = localStorage.getItem(`baniSessions_${today}`);
    if (savedSessions) {
      setBaniSessions(JSON.parse(savedSessions));
    } else {
      // Initialize today's sessions
      const initialSessions: BaniSession[] = dailyBanis.map(bani => ({
        bani,
        completed: false,
        startTime: '06:00 AM',
        endTime: '06:30 AM',
        date: today
      }));
      setBaniSessions(initialSessions);
    }
  };

  const saveBaniSessions = (sessions: BaniSession[]) => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`baniSessions_${today}`, JSON.stringify(sessions));
    setBaniSessions(sessions);
  };

  const updateBaniSession = (bani: string, updates: Partial<BaniSession>) => {
    const updatedSessions = baniSessions.map(session =>
      session.bani === bani ? { ...session, ...updates } : session
    );
    saveBaniSessions(updatedSessions);
  };

  const toggleBaniCompletion = (bani: string) => {
    updateBaniSession(bani, { completed: !baniSessions.find(s => s.bani === bani)?.completed });
  };

  const loadMantras = async () => {
    const allMantras = await mantraService.getAllMantras();
    setMantras(allMantras);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    try {
      if (editingMantra) {
        // Update existing mantra
        const updatedMantra: Mantra = {
          ...editingMantra,
          name: formData.name,
          sanskrit: formData.sanskrit || undefined,
          gurmukhi: formData.gurmukhi || undefined,
          translation: formData.translation || undefined,
          category: formData.category || undefined,
          traditionalCount: formData.traditionalCount,
          submittedBy: formData.submittedBy || undefined,
        };
        
        // Update in local storage
        const userMantras = mantraService.getUserMantras();
        const updatedMantras = userMantras.map(m => 
          m.id === editingMantra.id ? updatedMantra : m
        );
        localStorage.setItem('userMantras', JSON.stringify(updatedMantras));
        
        setSubmitStatus('success');
      } else {
        // Add new mantra
        const newMantra = mantraService.addUserMantra({
          name: formData.name,
          sanskrit: formData.sanskrit || undefined,
          gurmukhi: formData.gurmukhi || undefined,
          translation: formData.translation || undefined,
          category: formData.category || undefined,
          traditionalCount: formData.traditionalCount,
          submittedBy: formData.submittedBy || undefined,
        });

        // Optionally submit to Airtable for review
        setSubmitStatus('submitting');
        const submitted = await mantraService.submitForReview(newMantra);
        setSubmitStatus(submitted ? 'success' : 'idle');
      }

      // Reset form and reload
      setFormData({
        name: '',
        sanskrit: '',
        gurmukhi: '',
        translation: '',
        category: '',
        traditionalCount: 108,
        submittedBy: '',
      });
      setEditingMantra(null);
      setOpen(false);
      await loadMantras();
      onMantraAdded?.();

      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving mantra:', error);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    }
  };

  const handleEdit = (mantra: Mantra) => {
    setEditingMantra(mantra);
    setFormData({
      name: mantra.name,
      sanskrit: mantra.sanskrit || '',
      gurmukhi: mantra.gurmukhi || '',
      translation: mantra.translation || '',
      category: mantra.category || '',
      traditionalCount: mantra.traditionalCount || 108,
      submittedBy: mantra.submittedBy || '',
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (mantraService.deleteUserMantra(id)) {
      await loadMantras();
      onMantraAdded?.();
    }
  };

  const handleAddNew = () => {
    setEditingMantra(null);
    setFormData({
      name: '',
      sanskrit: '',
      gurmukhi: '',
      translation: '',
      category: '',
      traditionalCount: 108,
      submittedBy: '',
    });
    setOpen(true);
  };

  // Helper function to filter mantras by category
  const getMantrasByCategory = (category: string) => {
    return mantras.filter(mantra => {
      // Check main category
      if (mantra.category === category) return true;
      
      // Check subcategories
      const categoryConfig = mantraCategories[category as keyof typeof mantraCategories];
      if (categoryConfig && mantra.category && categoryConfig.subcategories.includes(mantra.category)) {
        return true;
      }
      
      return false;
    });
  };

  const userMantras = mantras.filter(m => m.source === 'user');
  const coreMantras = mantras.filter(m => m.source === 'core' && m.id !== 'custom');

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Mantra Library</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
          >
            Add Mantra
          </Button>
        </Box>

        {submitStatus === 'success' && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Mantra added successfully and submitted for review!
          </Alert>
        )}

        {submitStatus === 'error' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Mantra added locally, but couldn't submit for review. Check your connection.
          </Alert>
        )}

        {/* Category Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={selectedCategory} 
            onChange={(e, newValue) => setSelectedCategory(newValue)}
            variant="fullWidth"
          >
            {Object.entries(mantraCategories).map(([key, config]) => (
              <Tab 
                key={key}
                label={config.name} 
                value={key}
                sx={{ textTransform: 'none' }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Display selected category */}
        <Box>
          {selectedCategory === 'Banis' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Daily Banis Tracker
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Track your daily Bani recitations with precise start and end times
              </Typography>

              {/* Daily Banis List */}
              <List>
                {baniSessions.map((session) => (
                  <ListItem key={session.bani} sx={{ 
                    border: 1, 
                    borderColor: 'divider', 
                    borderRadius: 1, 
                    mb: 1,
                    backgroundColor: session.completed ? 'success.light' : 'background.paper'
                  }}>
                    <Checkbox
                      checked={session.completed}
                      onChange={() => toggleBaniCompletion(session.bani)}
                      sx={{ mr: 2 }}
                    />
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ 
                          textDecoration: session.completed ? 'line-through' : 'none',
                          fontWeight: session.completed ? 'normal' : 'medium'
                        }}>
                          {session.bani}
                        </Typography>
                      }
                      secondary={
                        session.completed 
                          ? `Completed: ${session.startTime} - ${session.endTime}`
                          : `Planned: ${session.startTime} - ${session.endTime}`
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button
                        size="small"
                        variant={showBaniTimer === session.bani ? "contained" : "outlined"}
                        onClick={() => setShowBaniTimer(showBaniTimer === session.bani ? null : session.bani)}
                      >
                        Set Times
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              {/* Timer Interface */}
              {showBaniTimer && (
                <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Set Times for {showBaniTimer}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 300px' }}>
                      <WheelTimer
                        label="Start Time"
                        value={baniSessions.find(s => s.bani === showBaniTimer)?.startTime || '06:00 AM'}
                        onChange={(time) => updateBaniSession(showBaniTimer, { startTime: time })}
                      />
                    </Box>
                    <Box sx={{ flex: '1 1 300px' }}>
                      <WheelTimer
                        label="End Time"
                        value={baniSessions.find(s => s.bani === showBaniTimer)?.endTime || '06:30 AM'}
                        onChange={(time) => updateBaniSession(showBaniTimer, { endTime: time })}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="contained" 
                      onClick={() => setShowBaniTimer(null)}
                    >
                      Done
                    </Button>
                  </Box>
                </Paper>
              )}
            </Box>
          )}

          {/* Other categories (Japji Paurees, Assorted Mantras) */}
          {Object.entries(mantraCategories).map(([categoryKey, config]) => (
            selectedCategory === categoryKey && categoryKey !== 'Banis' && (
              <Box key={categoryKey}>
                <Typography variant="h6" gutterBottom>
                  {config.name}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  {config.description}
                </Typography>

                {/* Core mantras for this category */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">
                      Core {config.name} ({getMantrasByCategory(categoryKey).filter(m => m.source === 'core').length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {getMantrasByCategory(categoryKey)
                        .filter(m => m.source === 'core')
                        .map((mantra) => (
                        <ListItem key={mantra.id}>
                          <ListItemText
                            primary={mantra.name}
                            secondary={
                              <Box>
                                {mantra.gurmukhi && (
                                  <Typography variant="body2" color="textSecondary">
                                    {mantra.gurmukhi}
                                  </Typography>
                                )}
                                {mantra.translation && (
                                  <Typography variant="body2" color="textSecondary">
                                    {mantra.translation}
                                  </Typography>
                                )}
                                <Chip 
                                  label={`Default: ${mantra.traditionalCount || config.defaultCount}`}
                                  size="small" 
                                  sx={{ mt: 0.5 }}
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                      {getMantrasByCategory(categoryKey).filter(m => m.source === 'core').length === 0 && (
                        <ListItem>
                          <ListItemText 
                            primary="No core mantras in this category yet"
                            secondary="Check back as we add more content"
                          />
                        </ListItem>
                      )}
                    </List>
                  </AccordionDetails>
                </Accordion>

                {/* User mantras for this category */}
                <Accordion sx={{ mt: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">
                      Your {config.name} ({getMantrasByCategory(categoryKey).filter(m => m.source === 'user').length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {getMantrasByCategory(categoryKey)
                        .filter(m => m.source === 'user')
                        .map((mantra) => (
                        <ListItem key={mantra.id}>
                          <ListItemText
                            primary={mantra.name}
                            secondary={
                              <Box>
                                {mantra.gurmukhi && (
                                  <Typography variant="body2" color="textSecondary">
                                    {mantra.gurmukhi}
                                  </Typography>
                                )}
                                {mantra.translation && (
                                  <Typography variant="body2" color="textSecondary">
                                    {mantra.translation}
                                  </Typography>
                                )}
                                <Box display="flex" gap={1} mt={0.5}>
                                  <Chip 
                                    label={`Count: ${mantra.traditionalCount}`}
                                    size="small"
                                  />
                                  <Chip 
                                    label="Personal" 
                                    size="small" 
                                    color="secondary"
                                  />
                                </Box>
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              onClick={() => handleEdit(mantra)}
                              size="small"
                              sx={{ mr: 1 }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              edge="end"
                              onClick={() => handleDelete(mantra.id)}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                      {getMantrasByCategory(categoryKey).filter(m => m.source === 'user').length === 0 && (
                        <ListItem>
                          <ListItemText 
                            primary={`No personal ${config.name.toLowerCase()} yet`}
                            secondary={`Add your own ${config.name.toLowerCase()} to this collection`}
                          />
                        </ListItem>
                      )}
                    </List>
                  </AccordionDetails>
                </Accordion>
              </Box>
            )
          ))}
        </Box>

        {/* Add Mantra Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle>
              {editingMantra ? 'Edit Mantra' : 'Add New Mantra'}
            </DialogTitle>
            <DialogContent>
              <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
                <TextField
                  fullWidth
                  label="Mantra Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                
                <Box display="flex" gap={2}>
                  <TextField
                    fullWidth
                    label="Sanskrit Text (optional)"
                    value={formData.sanskrit}
                    onChange={(e) => setFormData({ ...formData, sanskrit: e.target.value })}
                    multiline
                    rows={2}
                  />
                  
                  <TextField
                    fullWidth
                    label="Gurmukhi Text (optional)"
                    value={formData.gurmukhi}
                    onChange={(e) => setFormData({ ...formData, gurmukhi: e.target.value })}
                    multiline
                    rows={2}
                    helperText="ਗੁਰਮੁਖੀ ਲਿਖਤ"
                  />
                </Box>
                
                <TextField
                  fullWidth
                  label="Translation/Meaning (optional)"
                  value={formData.translation}
                  onChange={(e) => setFormData({ ...formData, translation: e.target.value })}
                  multiline
                  rows={2}
                />
                
                <Box display="flex" gap={2}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.category}
                      onChange={(e) => {
                        const newCategory = e.target.value;
                        const defaultCount = getDefaultCountForMantra(newCategory);
                        setFormData({ 
                          ...formData, 
                          category: newCategory,
                          traditionalCount: defaultCount
                        });
                      }}
                    >
                      {/* Main categories */}
                      {Object.entries(mantraCategories).map(([key, config]) => (
                        <MenuItem key={key} value={key}>
                          <strong>{config.name}</strong>
                        </MenuItem>
                      ))}
                      
                      {/* Subcategories */}
                      {Object.entries(mantraCategories).map(([mainKey, config]) => 
                        config.subcategories.map((subcat) => (
                          <MenuItem key={`${mainKey}-${subcat}`} value={subcat} sx={{ pl: 4 }}>
                            → {subcat}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    fullWidth
                    label="Traditional Count"
                    type="number"
                    value={formData.traditionalCount}
                    onChange={(e) => setFormData({ ...formData, traditionalCount: Number(e.target.value) })}
                    inputProps={{ min: 1 }}
                  />
                </Box>
                
                <TextField
                  fullWidth
                  label="Your Name (optional)"
                  value={formData.submittedBy}
                  onChange={(e) => setFormData({ ...formData, submittedBy: e.target.value })}
                  helperText="If provided, this mantra may be submitted for inclusion in the core library"
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button 
                type="submit" 
                variant="contained"
                disabled={submitStatus === 'submitting'}
                startIcon={submitStatus === 'submitting' ? <SubmitIcon /> : (editingMantra ? <EditIcon /> : <AddIcon />)}
              >
                {submitStatus === 'submitting' 
                  ? (editingMantra ? 'Updating...' : 'Adding...') 
                  : (editingMantra ? 'Update Mantra' : 'Add Mantra')
                }
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </CardContent>
    </Card>
  );
}