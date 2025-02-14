import React from 'react';
import { Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Analysis() {
  const navigate = useNavigate();

  const handleClick = () => {
    // Navigate to the dashboard page which displays the /analyze results
    navigate('/dashboard');
  };

  return (
    <Box display="flex" justifyContent="center" mt={2}>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleClick}
        sx={{ minWidth: 120 }}
      >
        View Analysis Results
      </Button>
    </Box>
  );
}

export default Analysis; 