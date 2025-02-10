import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

function Navbar() {
  const { user, signOut } = useAuthStore();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          My App
        </Typography>
        <Box>
          <Button color="inherit" component={RouterLink} to="/">Home</Button>
          <Button color="inherit" component={RouterLink} to="/about">About</Button>
          {user && (
            <>
              <Button color="inherit" component={RouterLink} to="/contact">Contact</Button>
              <Button color="inherit" component={RouterLink} to="/dashboard">Dashboard</Button>
            </>
          )}
          {!user ? (
            <>
              <Button color="inherit" component={RouterLink} to="/login">Login</Button>
              <Button color="inherit" component={RouterLink} to="/register">Register</Button>
            </>
          ) : (
            <Button color="inherit" onClick={signOut}>Logout</Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar; 