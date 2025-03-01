import { Typography, Box, Paper, Tabs, Tab } from '@mui/material';
import { useState, useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import Messages from '../components/dashboard/Messages';
import JobsList from '../components/jobs/JobsList';
import { useLocation } from 'react-router-dom';
import TickerChart from '../components/TickerChart';
import AnalysisGrid from '../components/dashboard/AnalysisGrid';

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
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');

  const { user } = useAuthStore();
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [errorAnalysis, setErrorAnalysis] = useState(null);
  const [selectedTickerIndex, setSelectedTickerIndex] = useState(null);
  const [cachedIndices, setCachedIndices] = useState(new Set());
  const [selectedTicker, setSelectedTicker] = useState("");
  const tickers = [/* The array of ticker symbols you have, e.g. "AAPL", "TSLA", etc. */];
  
  // Extract username from email (everything before the first dot, uppercase)
  const username = user?.email
    .split('@')[0]          // Get part before @
    .split('.')[0]          // Get part before first dot
    .toUpperCase();        // Convert to uppercase

  // Build tabs dynamically:
  // Default tab is "Analysis". For admin, add "Jobs" and "Messages".
  // For non-admin, if redirected from job creation with ?tab=jobs, add a "Jobs" tab.
  let tabs = [{ label: "Analysis" }];
  if (user.is_admin) {
    tabs.push({ label: "Jobs" });
    tabs.push({ label: "Messages" });
  } else if (tabParam === "jobs") {
    tabs.push({ label: "Jobs" });
  }

  // Set default active tab based on query parameter:
  const defaultTabIndex = (tabParam === "jobs") ? 1 : 0;
  const [currentTab, setCurrentTab] = useState(defaultTabIndex);

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

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
        <Typography variant="h3" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="h4" color="primary" gutterBottom>
          Welcome, {username}!
        </Typography>
      </Paper>

      <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
          </Tabs>

        {/* TabPanel for Analysis */}
          <TabPanel value={currentTab} index={0}>
          {loadingAnalysis && <Typography>Loading analysis results...</Typography>}
          {errorAnalysis && <Typography color="error">{errorAnalysis}</Typography>}

          {analysisResults && selectedTickerIndex !== null && (
            <>
              {/*
                A single container of fixed height (e.g. 600px). 
                We absolutely position each TickerChart inside. 
                Only the selected one is visible; the others are hidden 
                but remain in the DOM to avoid re-loading.
              */}
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
        </TabPanel>

        {/* TabPanel for Jobs (Overview) */}
        {tabs.length > 1 && (
          <TabPanel value={currentTab} index={1}>
            <JobsList />
          </TabPanel>
        )}

        {/* TabPanel for Messages (only for admin) */}
        {user.is_admin && tabs.length > 2 && (
          <TabPanel value={currentTab} index={2}>
            <Messages />
          </TabPanel>
        )}
        </Paper>
    </Box>
  );
}

export default Dashboard; 