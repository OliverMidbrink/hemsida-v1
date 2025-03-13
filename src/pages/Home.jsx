import { 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Button, 
  Card, 
  CardContent, 
  CardActionArea,
  Divider,
  Stack,
  Chip,
  useTheme
} from '@mui/material';
import { 
  TrendingUp, 
  Psychology, 
  BarChart, 
  ArrowForward,
  Dashboard as DashboardIcon,
  Info
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function Home() {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  const handleAboutClick = () => {
    navigate('/about');
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4, px: 2 }}>
      {/* Hero Section */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mb: 5, 
          borderRadius: 2,
          background: theme.palette.primary.main,
          position: 'relative',
          overflow: 'hidden',
          color: 'white',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '30%',
            height: '100%',
            background: `rgba(255, 255, 255, 0.05)`,
            clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
            zIndex: 1
          }
        }}
      >
        <Typography variant="h3" gutterBottom fontWeight="bold">
          Stock Prediction Project
        </Typography>
        <Typography variant="h6" paragraph sx={{ maxWidth: '80%', mb: 3 }}>
          Leveraging machine learning to predict stock market movements with neural network models
        </Typography>
        
        <Button 
          variant="contained" 
          color="secondary" 
          size="large"
          onClick={handleDashboardClick}
          endIcon={<DashboardIcon />}
          sx={{ 
            fontWeight: 'bold', 
            px: 3, 
            py: 1,
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.25)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          Go to Dashboard
        </Button>
      </Paper>

      {/* Features Section */}
      <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 3, fontWeight: 'bold' }}>
        Key Features
      </Typography>
      <Divider sx={{ mb: 4 }} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%', 
            borderRadius: 2,
            boxShadow: 'rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: 'rgba(0, 0, 0, 0.1) 0px 10px 50px'
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <TrendingUp sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Predictive Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Using historical market data to forecast future price movements with high accuracy
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%', 
            borderRadius: 2,
            boxShadow: 'rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: 'rgba(0, 0, 0, 0.1) 0px 10px 50px'
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Psychology sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Neural Networks
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Implementing deep learning models to identify complex patterns in market data
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%', 
            borderRadius: 2,
            boxShadow: 'rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: 'rgba(0, 0, 0, 0.1) 0px 10px 50px'
            }
          }}>
            <CardActionArea onClick={handleAboutClick}>
              <CardContent sx={{ p: 3 }}>
                <BarChart sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 2 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  M5 Model
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Our flagship neural network model for predicting 5% price movements
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <Typography variant="body2" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                    Learn more <Info sx={{ ml: 0.5, fontSize: 16 }} />
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>

      {/* Dashboard Section */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 4, 
          mt: 6, 
          borderRadius: 2,
          background: 'linear-gradient(to right, #f5f7fa, #e4e8f0)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ mb: { xs: 3, md: 0 } }}>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Ready to explore the analysis?
          </Typography>
          <Typography variant="body1" paragraph>
            View detailed stock predictions and analysis results in our interactive dashboard
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Chip 
              label="Real-time Data" 
              size="small" 
              sx={{ 
                bgcolor: 'rgba(0, 0, 0, 0.04)', 
                color: theme.palette.text.primary,
                fontWeight: 500
              }} 
            />
            <Chip 
              label="Interactive Charts" 
              size="small" 
              sx={{ 
                bgcolor: 'rgba(0, 0, 0, 0.04)', 
                color: theme.palette.text.primary,
                fontWeight: 500
              }} 
            />
            <Chip 
              label="ML Predictions" 
              size="small" 
              sx={{ 
                bgcolor: 'rgba(0, 0, 0, 0.04)', 
                color: theme.palette.text.primary,
                fontWeight: 500
              }} 
            />
          </Stack>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          onClick={handleDashboardClick}
          endIcon={<ArrowForward />}
          sx={{ 
            fontWeight: 'bold', 
            px: 3, 
            py: 1,
            minWidth: 200,
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          Go to Dashboard
        </Button>
      </Paper>
    </Box>
  );
}

export default Home; 