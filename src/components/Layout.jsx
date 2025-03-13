import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import Footer from './Footer';
import { Box } from '@mui/material';

function Layout() {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh' 
    }}>
      <Navigation />
      <Box component="main" sx={{ 
        flexGrow: 1, 
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
}

export default Layout; 