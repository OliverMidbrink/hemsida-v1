import { Typography, Box, Paper } from '@mui/material';
import Messages from '../components/dashboard/Messages';
import useAuthStore from '../stores/authStore';

function MessagesPage() {
  const { user } = useAuthStore();
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'oliver.midbrink@gmail.com';
  
  // Only allow access to the admin email
  if (!user || user.email !== adminEmail) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error">
          You don't have permission to view this page.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box>
      <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
        <Typography variant="h3" gutterBottom>
          Messages
        </Typography>
        <Typography variant="body1" paragraph>
          View and manage system messages.
        </Typography>
      </Paper>
      
      <Paper elevation={3} sx={{ p: 4 }}>
        <Messages />
      </Paper>
    </Box>
  );
}

export default MessagesPage; 