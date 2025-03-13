import { AppBar, Toolbar, Button, Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

function Navigation() {
  const { user, signOut } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'oliver.midbrink@gmail.com';

  return (
    <AppBar 
      position="static" 
      sx={{ 
        backgroundColor: theme.palette.primary.main,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography 
          variant="h6" 
          component={RouterLink} 
          to="/" 
          sx={{ 
            color: 'white', 
            textDecoration: 'none',
            fontWeight: 'bold',
            display: { xs: 'none', sm: 'block' }
          }}
        >
          Open Source Stock Prediction
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexGrow: { xs: 1, sm: 0 },
          justifyContent: { xs: 'flex-start', sm: 'center' },
          gap: 1,
          ml: { xs: 0, sm: 2 }
        }}>
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/"
            sx={{ fontWeight: 500 }}
          >
            Home
          </Button>
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/about"
            sx={{ fontWeight: 500 }}
          >
            About
          </Button>
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/dashboard"
            sx={{ fontWeight: 500 }}
          >
            Dashboard
          </Button>
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/contact"
            sx={{ fontWeight: 500 }}
          >
            Contact
          </Button>
          {user && user.email === adminEmail && (
            <Button 
              color="inherit" 
              component={RouterLink} 
              to="/messages"
              sx={{ fontWeight: 500 }}
            >
              Messages
            </Button>
          )}
        </Box>
        
        <Box>
          {user ? (
            <Button 
              variant="outlined" 
              color="inherit" 
              onClick={signOut}
              sx={{ 
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Sign Out
            </Button>
          ) : (
            <>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/login"
                sx={{ fontWeight: 500 }}
              >
                Login
              </Button>
              <Button 
                variant="outlined"
                color="inherit" 
                component={RouterLink} 
                to="/register"
                sx={{ 
                  ml: 1,
                  fontWeight: 500,
                  borderColor: 'rgba(255,255,255,0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navigation; 