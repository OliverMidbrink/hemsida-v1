import { useState, useRef } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import StatusIndicator from '../StatusIndicator';
import useWebSocketStore from '../../stores/websocketStore';

function CreateJob() {
  const [jobText, setJobText] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const { clientId } = useWebSocketStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobText.trim() || !user) return;

    setLoading(true);
    try {
      const response = await fetch('/python-api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': user.id.toString()
        },
        body: JSON.stringify({
          text: jobText,
          client_id: clientId
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create job');
      }
      
      const data = await response.json();
      setNotification({
        open: true,
        message: 'Job created successfully! Redirecting to dashboard...',
        severity: 'success'
      });

      setTimeout(() => {
        navigate('/dashboard?tab=jobs');
      }, 2000);
    } catch (error) {
      // Check if error is an object and extract the message or stringify it
      const errorMsg = typeof error === 'object' && error !== null 
        ? (error.message || JSON.stringify(error))
        : error;
      setNotification({
        open: true,
        message: 'Failed to create job: ' + errorMsg,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ 
      p: 4, 
      textAlign: 'center', 
      height: '100%', 
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <StatusIndicator />
      <Typography variant="h5" gutterBottom align="center">
        Create New Vector Job
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          multiline
          rows={3}
          value={jobText}
          onChange={(e) => setJobText(e.target.value)}
          label="Enter text for vector generation"
          variant="outlined"
          margin="normal"
          disabled={loading}
        />
        
        <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !jobText.trim()}
            sx={{ minWidth: 120 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Job'}
          </Button>
        </Box>
      </form>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          severity={notification.severity}
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

export default CreateJob; 