import { Typography, Box, Paper, Tabs, Tab } from '@mui/material';
import { useState } from 'react';
import useAuthStore from '../stores/authStore';
import Messages from '../components/dashboard/Messages';

function Dashboard() {
  const [tab, setTab] = useState(0);
  const { user } = useAuthStore();
  
  // Extract username from email (everything before the first dot, uppercase)
  const username = user?.email
    .split('@')[0]          // Get part before @
    .split('.')[0]          // Get part before first dot
    .toUpperCase();        // Convert to uppercase

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
        <Typography variant="h3" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="h4" color="primary" gutterBottom>
          Welcome, {username}!
        </Typography>
      </Paper>

      {user.is_admin && (
        <Paper elevation={3} sx={{ p: 4 }}>
          <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
            <Tab label="Overview" />
            <Tab label="Messages" />
          </Tabs>
          <Box sx={{ mt: 2 }}>
            {tab === 0 ? (
              <Typography>Admin Dashboard Overview</Typography>
            ) : (
              <Messages />
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
}

export default Dashboard; 