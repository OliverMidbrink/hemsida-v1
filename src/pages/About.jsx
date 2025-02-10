import { Typography, Box, Paper } from '@mui/material';

function About() {
  return (
    <Box>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          About Us
        </Typography>
        <Typography paragraph>
          This is a modern React application built with the latest tools and best practices.
          We use Vite for blazing fast development, Material-UI for beautiful components,
          and React Router for seamless navigation.
        </Typography>
      </Paper>
    </Box>
  );
}

export default About; 