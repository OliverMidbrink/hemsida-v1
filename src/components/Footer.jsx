import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Link, 
  Divider, 
  IconButton, 
  useTheme, 
  alpha 
} from '@mui/material';
import { 
  GitHub, 
  LinkedIn, 
  Twitter, 
  TrendingUp, 
  Psychology, 
  Code 
} from '@mui/icons-material';

function Footer() {
  const theme = useTheme();
  
  const currentYear = new Date().getFullYear();
  
  return (
    <Box 
      component="footer" 
      sx={{
        mt: 'auto',
        py: 6,
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${alpha(theme.palette.primary.main, 0.9)} 100%)`,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at bottom left, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%)',
          zIndex: 1
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '30%',
          height: '100%',
          background: `rgba(255, 255, 255, 0.05)`,
          clipPath: 'polygon(100% 0, 0 100%, 100% 100%)',
          zIndex: 1
        }
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ 
              textShadow: '0 2px 10px rgba(0,0,0,0.1)',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: 0,
                width: 40,
                height: 3,
                borderRadius: 1.5,
                backgroundColor: alpha(theme.palette.secondary.main, 0.7)
              }
            }}>
              Open Source Stock Prediction
            </Typography>
            <Typography variant="body2" sx={{ mt: 2, opacity: 0.9, maxWidth: '90%' }}>
              An open-source initiative leveraging machine learning to predict stock market movements
              with neural network models.
            </Typography>
            <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
              <IconButton 
                aria-label="GitHub" 
                sx={{ 
                  color: 'white', 
                  bgcolor: alpha(theme.palette.common.white, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.2) }
                }}
              >
                <GitHub />
              </IconButton>
              <IconButton 
                aria-label="LinkedIn" 
                sx={{ 
                  color: 'white', 
                  bgcolor: alpha(theme.palette.common.white, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.2) }
                }}
              >
                <LinkedIn />
              </IconButton>
              <IconButton 
                aria-label="Twitter" 
                sx={{ 
                  color: 'white', 
                  bgcolor: alpha(theme.palette.common.white, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.2) }
                }}
              >
                <Twitter />
              </IconButton>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Key Features
            </Typography>
            <Box component="ul" sx={{ pl: 0, listStyle: 'none' }}>
              <Box component="li" sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <TrendingUp sx={{ mr: 1, fontSize: 20, opacity: 0.8 }} />
                <Typography variant="body2">Predictive Analytics</Typography>
              </Box>
              <Box component="li" sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <Psychology sx={{ mr: 1, fontSize: 20, opacity: 0.8 }} />
                <Typography variant="body2">Neural Networks</Typography>
              </Box>
              <Box component="li" sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <Code sx={{ mr: 1, fontSize: 20, opacity: 0.8 }} />
                <Typography variant="body2">Open Source</Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Quick Links
            </Typography>
            <Box component="ul" sx={{ pl: 0, listStyle: 'none' }}>
              <Box component="li" sx={{ mb: 1 }}>
                <Link href="/" color="inherit" underline="hover" sx={{ opacity: 0.9, '&:hover': { opacity: 1 } }}>
                  Home
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Link href="/about" color="inherit" underline="hover" sx={{ opacity: 0.9, '&:hover': { opacity: 1 } }}>
                  About
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Link href="/dashboard" color="inherit" underline="hover" sx={{ opacity: 0.9, '&:hover': { opacity: 1 } }}>
                  Dashboard
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Link href="/contact" color="inherit" underline="hover" sx={{ opacity: 0.9, '&:hover': { opacity: 1 } }}>
                  Contact
                </Link>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 4, borderColor: alpha(theme.palette.common.white, 0.2) }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            © {currentYear} Open Source Stock Prediction. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link href="/privacy" color="inherit" underline="hover" sx={{ opacity: 0.8, fontSize: '0.875rem' }}>
              Privacy Policy
            </Link>
            <Link href="/terms" color="inherit" underline="hover" sx={{ opacity: 0.8, fontSize: '0.875rem' }}>
              Terms of Service
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default Footer; 