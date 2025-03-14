import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import Footer from './Footer';
import { Box, IconButton, Tooltip, Snackbar, Alert } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

function Layout() {
  const [isFullWidth, setIsFullWidth] = useState(true); // Default to fullscreen
  const [showNotification, setShowNotification] = useState(false);
  const mainContainerRef = useRef(null);
  const parentContainerRef = useRef(null);

  const toggleFullWidth = () => {
    // If we're in constrained mode and trying to go to full width
    if (!isFullWidth) {
      const mainWidth = mainContainerRef.current?.offsetWidth || 0;
      const parentWidth = parentContainerRef.current?.offsetWidth || 0;
      
      // If the constrained width is already within 4% of the full width
      if (parentWidth > 0 && mainWidth / parentWidth > 0.96) {
        setShowNotification(true);
        return; // Don't toggle if already close to full width
      }
    }
    
    setIsFullWidth(!isFullWidth);
  };

  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowNotification(false);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh' 
    }}>
      <Navigation />
      <Box 
        ref={parentContainerRef}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          position: 'relative',
        }}
      >
        <Box 
          component="main" 
          ref={mainContainerRef}
          sx={{ 
            flexGrow: 1, 
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: isFullWidth ? '100%' : '1440px', // Standard width for a 13" MacBook
            width: '100%',
            margin: '0 auto',
            position: 'relative',
            transition: 'max-width 0.3s ease',
          }}
        >
          <Tooltip title={isFullWidth ? "Standard Width" : "Full Width"}>
            <IconButton 
              onClick={toggleFullWidth}
              size="small"
              sx={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 10,
                color: (theme) => theme.palette.text.secondary,
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: (theme) => theme.palette.primary.main,
                },
                boxShadow: 'none',
              }}
            >
              {isFullWidth ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
          <Outlet />
        </Box>
      </Box>
      <Footer />
      
      <Snackbar 
        open={showNotification} 
        autoHideDuration={4000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity="info" sx={{ width: '100%' }}>
          Already at full width. Your screen size is close to the standard width.
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Layout; 