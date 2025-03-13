import { useState } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardActionArea,
  Collapse,
  Chip,
  Divider,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import { 
  TrendingUp, 
  Psychology, 
  Code, 
  BarChart,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';

function About() {
  const [expandedModel, setExpandedModel] = useState(false);
  const theme = useTheme();

  const handleModelClick = () => {
    setExpandedModel(!expandedModel);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4, px: 2 }}>
      {/* Project Overview Section */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 2,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          position: 'relative',
          overflow: 'hidden',
          color: 'white',
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%)',
            zIndex: 1
          },
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
        <Typography variant="h3" gutterBottom fontWeight="bold" sx={{ 
          textShadow: '0 2px 10px rgba(0,0,0,0.1)',
          position: 'relative',
          zIndex: 2
        }}>
          Open Source Stock Prediction
        </Typography>
        <Typography variant="h6" paragraph sx={{ 
          maxWidth: '80%', 
          mb: 3,
          opacity: 0.9,
          position: 'relative',
          zIndex: 2
        }}>
          An open-source initiative leveraging machine learning to predict stock market movements
          with neural network models.
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2, position: 'relative', zIndex: 2 }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 2,
              '& svg': {
                filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.2))'
              }
            }}>
              <TrendingUp sx={{ mr: 1, fontSize: 28 }} />
              <Typography variant="h6">Predictive Analytics</Typography>
            </Box>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Using historical market data to forecast future price movements
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 2,
              '& svg': {
                filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.2))'
              }
            }}>
              <Psychology sx={{ mr: 1, fontSize: 28 }} />
              <Typography variant="h6">Neural Networks</Typography>
            </Box>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Implementing deep learning models to identify complex patterns
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 2,
              '& svg': {
                filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.2))'
              }
            }}>
              <Code sx={{ mr: 1, fontSize: 28 }} />
              <Typography variant="h6">Open Source</Typography>
            </Box>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Freely available code and models for community collaboration
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Models Section */}
      <Typography variant="h4" gutterBottom sx={{ 
        mt: 6, 
        mb: 3, 
        color: theme.palette.text.primary,
        fontWeight: 600,
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -8,
          left: 0,
          width: 60,
          height: 4,
          borderRadius: 2,
          backgroundColor: theme.palette.primary.main
        }
      }}>
        Our Models
      </Typography>
      <Divider sx={{ mb: 4, opacity: 0.6 }} />
      
      <Card 
        sx={{ 
          mb: 4, 
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          background: `linear-gradient(to right, ${alpha(theme.palette.primary.light, 0.05)}, ${alpha(theme.palette.background.paper, 1)})`,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <CardActionArea onClick={handleModelClick} sx={{ 
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.03)
          }
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  mr: 2
                }}>
                  <BarChart 
                    sx={{ 
                      fontSize: 28, 
                      color: theme.palette.primary.main
                    }} 
                  />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold" color={theme.palette.primary.dark}>
                    M5 Model
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Neural Network for 5% Price Movement Prediction
                  </Typography>
                </Box>
              </Box>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main
              }}>
                {expandedModel ? <ExpandLess /> : <ExpandMore />}
              </Box>
            </Box>
            
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                label="Neural Network" 
                size="small" 
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1), 
                  color: theme.palette.primary.dark,
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.15)
                  }
                }} 
              />
              <Chip 
                label="ReLU Activation" 
                size="small" 
                sx={{ 
                  bgcolor: alpha(theme.palette.secondary.main, 0.1), 
                  color: theme.palette.secondary.dark,
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.secondary.main, 0.15)
                  }
                }} 
              />
              <Chip 
                label="Sigmoid Output" 
                size="small" 
                sx={{ 
                  bgcolor: alpha(theme.palette.info.main, 0.1), 
                  color: theme.palette.info.dark,
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.info.main, 0.15)
                  }
                }} 
              />
            </Stack>
          </CardContent>
        </CardActionArea>
        
        <Collapse in={expandedModel} timeout="auto" unmountOnExit>
          <CardContent sx={{ pt: 0, pb: 3, px: 3 }}>
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom color={theme.palette.primary.main} fontWeight={500}>
                  Architecture
                </Typography>
                <Typography variant="body2" paragraph sx={{ color: theme.palette.text.secondary }}>
                  • Single hidden layer with 500 units<br />
                  • ReLU activation function<br />
                  • Sigmoid output layer for binary classification<br />
                  • 54 input features (log1p daily opening price changes)
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom color={theme.palette.primary.main} fontWeight={500}>
                  Prediction Target
                </Typography>
                <Typography variant="body2" paragraph sx={{ color: theme.palette.text.secondary }}>
                  The M5 model predicts whether a stock will increase by 5% or more in the near future, 
                  providing a binary classification output through its sigmoid activation function.
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color={theme.palette.primary.main} fontWeight={500}>
                  Performance Metrics
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  The model is continuously evaluated on out-of-sample data to ensure robustness 
                  and reliability in various market conditions. Performance metrics include accuracy, 
                  precision, recall, and F1 score.
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Collapse>
      </Card>
      
      {/* Future Development Section */}
      <Paper elevation={0} sx={{ 
        p: 4, 
        mt: 4, 
        borderRadius: 2,
        bgcolor: alpha(theme.palette.secondary.main, 0.05),
        border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '30%',
          height: '100%',
          background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 100%)`,
          zIndex: 0
        }
      }}>
        <Typography variant="h5" gutterBottom sx={{ 
          color: theme.palette.secondary.dark,
          fontWeight: 600,
          position: 'relative',
          zIndex: 1
        }}>
          Future Development
        </Typography>
        <Typography variant="body1" sx={{ 
          color: theme.palette.text.secondary,
          position: 'relative',
          zIndex: 1
        }}>
          We're constantly working to improve our models and add new features. Future plans include 
          implementing more complex architectures, incorporating additional data sources, and 
          developing ensemble methods to enhance prediction accuracy.
        </Typography>
      </Paper>
    </Box>
  );
}

export default About; 