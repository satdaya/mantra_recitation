import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as SubmitIcon,
} from '@mui/icons-material';
import { mantraService, Mantra } from '../services/mantraService';

interface MantraManagementProps {
  onMantraAdded?: () => void;
}

const categories = [
  'Devotion',
  'Wisdom',
  'Compassion',
  'Peace',
  'Healing',
  'Protection',
  'Prosperity',
  'Self-realization',
  'Obstacles',
  'Other',
];

export default function MantraManagement({ onMantraAdded }: MantraManagementProps) {
  const [mantras, setMantras] = useState<Mantra[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sanskrit: '',
    translation: '',
    category: '',
    traditionalCount: 108,
    submittedBy: '',
  });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadMantras();
  }, []);

  const loadMantras = async () => {
    const allMantras = await mantraService.getAllMantras();
    setMantras(allMantras);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    try {
      // Add to user mantras
      const newMantra = mantraService.addUserMantra({
        name: formData.name,
        sanskrit: formData.sanskrit || undefined,
        translation: formData.translation || undefined,
        category: formData.category || undefined,
        traditionalCount: formData.traditionalCount,
        submittedBy: formData.submittedBy || undefined,
      });

      // Optionally submit to Airtable for review
      setSubmitStatus('submitting');
      const submitted = await mantraService.submitForReview(newMantra);
      setSubmitStatus(submitted ? 'success' : 'idle');

      // Reset form and reload
      setFormData({
        name: '',
        sanskrit: '',
        translation: '',
        category: '',
        traditionalCount: 108,
        submittedBy: '',
      });
      setOpen(false);
      await loadMantras();
      onMantraAdded?.();

      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (error) {
      console.error('Error adding mantra:', error);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (mantraService.deleteUserMantra(id)) {
      await loadMantras();
      onMantraAdded?.();
    }
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
            onClick={() => setOpen(true)}
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

        <Grid container spacing={3}>
          {/* Core Mantras */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Core Mantras ({coreMantras.length})
            </Typography>
            <List dense>
              {coreMantras.map((mantra) => (
                <ListItem key={mantra.id}>
                  <ListItemText
                    primary={mantra.name}
                    secondary={
                      <Box>
                        {mantra.translation && (
                          <Typography variant="body2" color="textSecondary">
                            {mantra.translation}
                          </Typography>
                        )}
                        {mantra.category && (
                          <Chip 
                            label={mantra.category} 
                            size="small" 
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Grid>

          {/* User Mantras */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Your Mantras ({userMantras.length})
            </Typography>
            <List dense>
              {userMantras.map((mantra) => (
                <ListItem key={mantra.id}>
                  <ListItemText
                    primary={mantra.name}
                    secondary={
                      <Box>
                        {mantra.translation && (
                          <Typography variant="body2" color="textSecondary">
                            {mantra.translation}
                          </Typography>
                        )}
                        <Box display="flex" gap={1} mt={0.5}>
                          {mantra.category && (
                            <Chip 
                              label={mantra.category} 
                              size="small"
                            />
                          )}
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
                      edge="end"
                      onClick={() => handleDelete(mantra.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {userMantras.length === 0 && (
                <ListItem>
                  <ListItemText 
                    primary="No personal mantras yet"
                    secondary="Add your own mantras to this collection"
                  />
                </ListItem>
              )}
            </List>
          </Grid>
        </Grid>

        {/* Add Mantra Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle>Add New Mantra</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Mantra Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Sanskrit Text (optional)"
                    value={formData.sanskrit}
                    onChange={(e) => setFormData({ ...formData, sanskrit: e.target.value })}
                    multiline
                    rows={2}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Translation/Meaning (optional)"
                    value={formData.translation}
                    onChange={(e) => setFormData({ ...formData, translation: e.target.value })}
                    multiline
                    rows={2}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categories.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Traditional Count"
                    type="number"
                    value={formData.traditionalCount}
                    onChange={(e) => setFormData({ ...formData, traditionalCount: Number(e.target.value) })}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Your Name (optional)"
                    value={formData.submittedBy}
                    onChange={(e) => setFormData({ ...formData, submittedBy: e.target.value })}
                    helperText="If provided, this mantra may be submitted for inclusion in the core library"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button 
                type="submit" 
                variant="contained"
                disabled={submitStatus === 'submitting'}
                startIcon={submitStatus === 'submitting' ? <SubmitIcon /> : <AddIcon />}
              >
                {submitStatus === 'submitting' ? 'Adding...' : 'Add Mantra'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </CardContent>
    </Card>
  );
}