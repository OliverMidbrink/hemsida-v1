import { Typography, Box, Grid, Paper } from '@mui/material';
import Analysis from '../components/Analysis';
import CreateJob from '../components/jobs/CreateJob';

function Home() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" gutterBottom align="center">
        Welcome
      </Typography>
      <Typography variant="body1" align="center" paragraph>
        Create a new vector generation job or view existing jobs in the dashboard.
      </Typography>
      
      <Grid 
        container 
        spacing={4} 
        justifyContent="center" 
        sx={{ mt: 2 }}
      >
        <Grid item xs={12} sm={6} md={5}>
          <CreateJob />
        </Grid>
        <Grid item xs={12} sm={6} md={5}>
          <Paper elevation={3} sx={{ 
            p: 4, 
            textAlign: 'center', 
            height: '100%',
          }}>
            <Typography variant="h5" gutterBottom>
              View Analysis Results
            </Typography>
            <Box sx={{ 
              height: 'calc(100% - 80px)', // Reduced height
              mt: -2, // Negative margin to move up slightly
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Analysis />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Home; 