import { Typography, Box, Paper, FormControl, InputLabel, Select, MenuItem, Grid, useTheme, alpha, List, ListItem, ListItemText, Divider, Chip, IconButton, Collapse, Fade, Tooltip } from '@mui/material';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import TickerChart from '../components/TickerChart';
import AnalysisGrid from '../components/dashboard/AnalysisGrid';
import useAuthStore from '../stores/authStore';
import useSavedStocksStore from '../stores/savedStocksStore';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function Dashboard() {
  const location = useLocation();
  const theme = useTheme();
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [errorAnalysis, setErrorAnalysis] = useState(null);
  const [selectedTickerIndex, setSelectedTickerIndex] = useState(null);
  const [selectedTicker, setSelectedTicker] = useState("");
  const [selectedModel, setSelectedModel] = useState("m5");
  const [selectedMarket, setSelectedMarket] = useState("us");
  const tickers = [/* The array of ticker symbols you have, e.g. "AAPL", "TSLA", etc. */];
  
  // Add state for saved stocks panel collapse
  const [savedStocksExpanded, setSavedStocksExpanded] = useState(true);
  
  // Get user from auth store
  const user = useAuthStore(state => state.user);
  
  // Get saved stocks from store
  const { savedStocks, removeStock } = useSavedStocksStore();
  
  // Extract username from email or use "Guest" if not logged in
  const getUsernameFromEmail = () => {
    if (!user || !user.email) return "Guest";
    
    const email = user.email;
    // Extract first part before @ symbol
    const namePart = email.split('@')[0];
    
    // If there's a dot in the first part, take only what's before the first dot
    const firstName = namePart.split('.')[0];
    
    // Capitalize the first letter
    return firstName.charAt(0).toUpperCase() + firstName.slice(1);
  };
  
  const username = getUsernameFromEmail();

  // Compute the selected ticker's color if analysis results are available.
  let selectedTickerColor = "";
  if (analysisResults && selectedTickerIndex !== null) {
      const total = analysisResults.predictions.reduce((sum, p) => sum + p, 0);
      const mean = total / analysisResults.predictions.length;
    const variance =
      analysisResults.predictions.reduce(
        (acc, p) => acc + Math.pow(p - mean, 2),
        0
      ) / analysisResults.predictions.length;
      const std = Math.sqrt(variance);

      const getBackgroundColor = (prediction) => {
           if (std === 0) return "#ffffff";
           let n = (prediction - mean) / std;
           n = Math.max(-1, Math.min(1, n));
           if (n >= 0) {
        const factor = n;
        const r = Math.round(255 * (1 - factor));
               const g = Math.round(255 * (1 - factor) + 128 * factor);
        const b = Math.round(255 * (1 - factor));
               return `rgb(${r}, ${g}, ${b})`;
           } else {
               const factor = -n;
               const r = Math.round(255 * (1 - factor) + 150 * factor);
        const g = Math.round(255 * (1 - factor));
        const b = Math.round(255 * (1 - factor));
               return `rgb(${r}, ${g}, ${b})`;
           }
      };
      selectedTickerColor = getBackgroundColor(analysisResults.predictions[selectedTickerIndex]);
  }

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoadingAnalysis(true);
      try {
        const response = await fetch('/data-api/analyze');
        if (!response.ok) throw new Error('Failed to fetch analysis results');
        const data = await response.json();
        setAnalysisResults(data);
      } catch (error) {
        setErrorAnalysis(error.message);
      } finally {
        setLoadingAnalysis(false);
      }
    };
    fetchAnalysis();
  }, []);

  // Automatically select the first ticker index once analysis results have loaded
  useEffect(() => {
    if (analysisResults && selectedTickerIndex === null && analysisResults.tickers.length > 0) {
      setSelectedTickerIndex(0);
    }
  }, [analysisResults, selectedTickerIndex]);

  // Automatically select the first ticker if none is selected
  useEffect(() => {
    if (!selectedTicker && tickers.length > 0) {
      setSelectedTicker(tickers[0]);
    }
  }, [selectedTicker, tickers]);

  // Handlers for "Previous" and "Next" in the TickerChart
  const handlePrevTicker = () => {
    if (selectedTickerIndex > 0) {
      setSelectedTickerIndex(selectedTickerIndex - 1);
    }
  };

  const handleNextTicker = () => {
    if (analysisResults && selectedTickerIndex < analysisResults.tickers.length - 1) {
      setSelectedTickerIndex(selectedTickerIndex + 1);
    }
  };

  // When user clicks a grid cell, select that ticker
  const handleTickerSelect = (idx) => {
    setSelectedTickerIndex(idx);
  };

  // Handle model change
  const handleModelChange = (event) => {
    setSelectedModel(event.target.value);
  };

  // Handle market change
  const handleMarketChange = (event) => {
    setSelectedMarket(event.target.value);
  };

  // Handle selecting a saved stock
  const handleSelectSavedStock = (ticker) => {
    if (analysisResults) {
      const index = analysisResults.tickers.findIndex(t => t === ticker);
      if (index !== -1) {
        setSelectedTickerIndex(index);
      }
    }
  };

  // Handle removing a saved stock
  const handleRemoveSavedStock = (ticker, event) => {
    event.stopPropagation(); // Prevent triggering the ListItem click
    removeStock(ticker);
  };

  // Toggle saved stocks panel expansion
  const toggleSavedStocksExpanded = () => {
    setSavedStocksExpanded(prev => !prev);
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
        <Typography variant="h3" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="h4" color="primary" gutterBottom>
          Welcome, {username}!
        </Typography>
        {!user && (
          <Typography variant="body1" sx={{ mb: 2, color: theme.palette.info.main }}>
            You're viewing as a guest. <a href="/login" style={{ color: theme.palette.primary.main }}>Log in</a> to save your preferences and access more features.
          </Typography>
        )}
        <Typography variant="body1" sx={{ mb: 3, color: theme.palette.text.secondary }}>
          Here you can see predictions on different markets made by different models.
        </Typography>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="model-select-label">Model</InputLabel>
              <Select
                labelId="model-select-label"
                id="model-select"
                value={selectedModel}
                onChange={handleModelChange}
                label="Model"
              >
                <MenuItem value="m5">M5 Model</MenuItem>
                <MenuItem value="m10" disabled>M10 Model (Coming Soon)</MenuItem>
                <MenuItem value="m15" disabled>M15 Model (Coming Soon)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="market-select-label">Market</InputLabel>
              <Select
                labelId="market-select-label"
                id="market-select"
                value={selectedMarket}
                onChange={handleMarketChange}
                label="Market"
              >
                <MenuItem value="us">US Market</MenuItem>
                <MenuItem value="eu" disabled>European Market (Coming Soon)</MenuItem>
                <MenuItem value="asia" disabled>Asian Market (Coming Soon)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Saved Stocks Panel - Collapsible Sidebar */}
        <Box
          sx={{
            width: savedStocksExpanded ? '250px' : '40px',
            transition: 'width 0.3s ease',
            flexShrink: 0,
          }}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            {/* Header with toggle button */}
            <Box sx={{ 
              p: savedStocksExpanded ? 2 : 1, 
              pb: savedStocksExpanded ? 1 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: savedStocksExpanded ? 'space-between' : 'center',
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
              minHeight: '48px',
            }}>
              {savedStocksExpanded ? (
                <>
                  <Typography variant="h6">Saved Stocks</Typography>
                  <IconButton
                    onClick={toggleSavedStocksExpanded}
                    size="small"
                    aria-expanded={savedStocksExpanded}
                    aria-label="collapse saved stocks"
                    sx={{
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.divider, 0.1),
                        color: theme.palette.text.primary,
                      },
                    }}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                </>
              ) : (
                <Tooltip title="Expand saved stocks" placement="right">
                  <IconButton
                    onClick={toggleSavedStocksExpanded}
                    size="small"
                    aria-expanded={savedStocksExpanded}
                    aria-label="expand saved stocks"
                    sx={{
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.divider, 0.1),
                        color: theme.palette.text.primary,
                      },
                    }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {/* Content */}
            <Box sx={{ 
              flex: 1, 
              overflow: 'auto',
              p: savedStocksExpanded ? 2 : 1,
              pt: savedStocksExpanded ? 2 : 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: savedStocksExpanded ? 'stretch' : 'center',
            }}>
              {savedStocksExpanded ? (
                // Expanded view
                savedStocks.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                    No saved stocks yet. Click the bookmark icon next to a stock chart to save it.
                  </Typography>
                ) : (
                  <List dense>
                    {savedStocks.map((ticker) => (
                      <ListItem 
                        key={ticker}
                        button
                        onClick={() => handleSelectSavedStock(ticker)}
                        sx={{
                          borderRadius: 1,
                          mb: 0.5,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          },
                          ...(analysisResults && selectedTickerIndex !== null && 
                             analysisResults.tickers[selectedTickerIndex] === ticker && {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.15),
                            },
                          }),
                        }}
                        secondaryAction={
                          <IconButton 
                            edge="end" 
                            aria-label="delete" 
                            size="small"
                            onClick={(e) => handleRemoveSavedStock(ticker, e)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        }
                      >
                        <ListItemText 
                          primary={ticker} 
                          primaryTypographyProps={{
                            fontWeight: analysisResults && selectedTickerIndex !== null && 
                                       analysisResults.tickers[selectedTickerIndex] === ticker ? 600 : 400
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )
              ) : (
                // Collapsed view - just show icons for saved stocks
                <>
                  {savedStocks.length > 0 ? (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      gap: 1,
                      mt: 1
                    }}>
                      {/* Show count chip at the top */}
                      <Tooltip title={`${savedStocks.length} saved stock${savedStocks.length !== 1 ? 's' : ''}`} placement="right">
                        <Chip
                          label={savedStocks.length}
                          size="small"
                          color="primary"
                          sx={{ 
                            width: '28px',
                            height: '28px',
                            mb: 1
                          }}
                        />
                      </Tooltip>
                      
                      {/* Show first 5 stocks */}
                      {savedStocks.slice(0, 5).map((ticker) => (
                        <Tooltip key={ticker} title={ticker} placement="right">
                          <Chip
                            label={ticker.slice(0, 1)}
                            size="small"
                            color={analysisResults && selectedTickerIndex !== null && 
                                  analysisResults.tickers[selectedTickerIndex] === ticker ? "primary" : "default"}
                            onClick={() => handleSelectSavedStock(ticker)}
                            sx={{ 
                              cursor: 'pointer',
                              width: '28px',
                              height: '28px',
                            }}
                          />
                        </Tooltip>
                      ))}
                      
                      {/* Show "more" indicator if needed */}
                      {savedStocks.length > 5 && (
                        <Tooltip title={`${savedStocks.length - 5} more - click to expand`} placement="right">
                          <Chip
                            label="+"
                            size="small"
                            variant="outlined"
                            sx={{ 
                              cursor: 'pointer',
                              width: '28px',
                              height: '28px',
                            }}
                            onClick={toggleSavedStocksExpanded}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  ) : (
                    <Tooltip title="No saved stocks" placement="right">
                      <Chip
                        label="0"
                        size="small"
                        variant="outlined"
                        sx={{ 
                          width: '28px',
                          height: '28px',
                          mt: 1
                        }}
                      />
                    </Tooltip>
                  )}
                </>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Chart Panel */}
        <Box sx={{ flex: 1 }}>
          <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
            {/* Analysis content directly without tabs */}
            <Box sx={{ p: 3 }}>
              {loadingAnalysis && <Typography>Loading analysis results...</Typography>}
              {errorAnalysis && <Typography color="error">{errorAnalysis}</Typography>}

              {analysisResults && selectedTickerIndex !== null && (
                <>
                  <Box sx={{ position: 'relative', height: 600, mb: 2 }}>
                    {/* Simplified to only render the selected ticker chart */}
                    {selectedTickerIndex !== null && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                        }}
                      >
                        <TickerChart
                          ticker={analysisResults.tickers[selectedTickerIndex]}
                          prediction={analysisResults.predictions[selectedTickerIndex]}
                          color={selectedTickerColor}
                          onPrev={handlePrevTicker}
                          onNext={handleNextTicker}
                          isPrevDisabled={selectedTickerIndex === 0}
                          isNextDisabled={
                            analysisResults &&
                            selectedTickerIndex === analysisResults.tickers.length - 1
                          }
                        />
                      </Box>
                    )}
                  </Box>
                </>
              )}

              <AnalysisGrid
                analysisResults={analysisResults}
                selectedTickerIndex={selectedTickerIndex}
                onSelectTicker={handleTickerSelect}
              />
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

export default Dashboard; 