import { Typography, Box, Paper, FormControl, InputLabel, Select, MenuItem, Grid, useTheme, alpha } from '@mui/material';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import TickerChart from '../components/TickerChart';
import AnalysisGrid from '../components/dashboard/AnalysisGrid';
import useAuthStore from '../stores/authStore';

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
  const [cachedIndices, setCachedIndices] = useState(new Set());
  const [selectedTicker, setSelectedTicker] = useState("");
  const [selectedModel, setSelectedModel] = useState("m5");
  const [selectedMarket, setSelectedMarket] = useState("us");
  const tickers = [/* The array of ticker symbols you have, e.g. "AAPL", "TSLA", etc. */];
  
  // Get user from auth store
  const user = useAuthStore(state => state.user);
  
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

  // Cache adjacent tickers around the current one.
  const cacheAdjacentCharts = (mainIndex) => {
    if (!analysisResults) return;
    const adjacentIndices = [
      mainIndex - 2,
      mainIndex - 1,
      mainIndex + 1,
      mainIndex + 2,
    ].filter(i => i >= 0 && i < analysisResults.tickers.length);

    setCachedIndices(prev => {
      const newCache = new Set(prev);
      adjacentIndices.forEach(i => newCache.add(i));
      return newCache;
    });
  };

  // When user clicks a grid cell, select that ticker, and schedule its neighbors to cache.
  const handleTickerSelect = (idx) => {
    setSelectedTickerIndex(idx);
    setCachedIndices(prev => new Set([...prev, idx]));
    setTimeout(() => cacheAdjacentCharts(idx), 100);
  };

  // Handle model change
  const handleModelChange = (event) => {
    setSelectedModel(event.target.value);
  };

  // Handle market change
  const handleMarketChange = (event) => {
    setSelectedMarket(event.target.value);
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

      <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
        {/* Analysis content directly without tabs */}
        <Box sx={{ p: 3 }}>
          {loadingAnalysis && <Typography>Loading analysis results...</Typography>}
          {errorAnalysis && <Typography color="error">{errorAnalysis}</Typography>}

          {analysisResults && selectedTickerIndex !== null && (
            <>
              <Box sx={{ position: 'relative', height: 600, mb: 2 }}>
                {Array.from(new Set([...cachedIndices, selectedTickerIndex])).map(i => (
                  <Box
                    key={i}
                     sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      // Show only if this index is currently selected
                      visibility: i === selectedTickerIndex ? 'visible' : 'hidden',
                      zIndex: i === selectedTickerIndex ? 1 : 0,
                    }}
                  >
                    <TickerChart
                      ticker={analysisResults.tickers[i]}
                      prediction={analysisResults.predictions[i]}
                      color={
                        i === selectedTickerIndex
                          ? selectedTickerColor
                          : '#ffffff'
                      }
                      onPrev={handlePrevTicker}
                      onNext={handleNextTicker}
                      isPrevDisabled={selectedTickerIndex === 0}
                      isNextDisabled={
                        analysisResults &&
                        selectedTickerIndex === analysisResults.tickers.length - 1
                      }
                    />
                   </Box>
                ))}
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
  );
}

export default Dashboard; 