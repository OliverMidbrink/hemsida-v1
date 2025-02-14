import { Typography, Box, Paper, Tabs, Tab, Dialog, DialogContent, IconButton } from '@mui/material';
import { useState, useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import Messages from '../components/dashboard/Messages';
import JobsList from '../components/jobs/JobsList';
import { useLocation } from 'react-router-dom';
import TickerChart from '../components/TickerChart';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';

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
  const [openTickerDialog, setOpenTickerDialog] = useState(false);
  
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

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoadingAnalysis(true);
      try {
        const response = await fetch('http://localhost:8000/analyze');
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
          {analysisResults && (() => {
              // Compute mean and standard deviation for fluid color scaling.
              const total = analysisResults.predictions.reduce((sum, p) => sum + p, 0);
              const mean = total / analysisResults.predictions.length;
              const variance = analysisResults.predictions.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / analysisResults.predictions.length;
              const std = Math.sqrt(variance);

              // Function to compute a fluid gradient background color.
              // For n = (prediction - mean)/std clamped to [-1, 1]:
              //    n = 0   => white (255,255,255)
              //    n =  +1 => dark green (0,128,0)
              //    n =  -1 => dark red   (150,0,0)
              const getBackgroundColor = (prediction) => {
                  if (std === 0) return "#ffffff";
                  let n = (prediction - mean) / std;
                  n = Math.max(-1, Math.min(1, n));
                  if (n >= 0) {
                      const factor = n; // factor from 0 to 1.
                      const r = Math.round(255 * (1 - factor) + 0 * factor);       // from 255 to 0
                      const g = Math.round(255 * (1 - factor) + 128 * factor);     // from 255 to 128
                      const b = Math.round(255 * (1 - factor) + 0 * factor);       // from 255 to 0
                      return `rgb(${r}, ${g}, ${b})`;
                  } else {
                      const factor = -n; // factor from 0 to 1.
                      const r = Math.round(255 * (1 - factor) + 150 * factor);     // from 255 to 150
                      const g = Math.round(255 * (1 - factor) + 0 * factor);       // from 255 to 0
                      const b = Math.round(255 * (1 - factor) + 0 * factor);       // from 255 to 0
                      return `rgb(${r}, ${g}, ${b})`;
                  }
              };

              // Map tickers to grid cells; now open a modal dialog showing the TickerChart.
              const cells = analysisResults.tickers.map((ticker, idx) => {
                 const prediction = analysisResults.predictions[idx];
                 const bgColor = getBackgroundColor(prediction);
                 return (
                   <Box
                     key={ticker}
                     onClick={() => {
                       setSelectedTickerIndex(idx);
                       setOpenTickerDialog(true);
                     }}
                     sx={{
                       width: '100%',
                       aspectRatio: '1',
                       backgroundColor: bgColor,
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       cursor: 'pointer',
                       border: '1px solid #ccc',
                       p: 0.25
                     }}
                   >
                     <Typography 
                       sx={{ 
                         fontSize: '0.65rem',
                         lineHeight: 1
                       }}
                     >
                       {ticker}
                     </Typography>
                   </Box>
                 );
              });

              return (
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(46px, 1fr))',
                  gap: 0.25
                }}>
                  {cells}
                </Box>
              );
          })()}
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

      {/* Modal Dialog for Ticker Chart */}
      <Dialog
        open={openTickerDialog}
        onClose={() => setOpenTickerDialog(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogContent sx={{ position: 'relative', height: '80vh', p: 0 }}>
          <TickerChart 
            ticker={analysisResults && selectedTickerIndex !== null ? analysisResults.tickers[selectedTickerIndex] : ""}
            prediction={analysisResults && selectedTickerIndex !== null ? analysisResults.predictions[selectedTickerIndex] : 0}
          />
          <IconButton
            onClick={() => {
              if (selectedTickerIndex > 0) setSelectedTickerIndex(selectedTickerIndex - 1);
            }}
            disabled={selectedTickerIndex === 0}
            sx={{
              position: 'absolute',
              top: '50%',
              left: 16,
              transform: 'translateY(-50%)',
              backgroundColor: '#ffffff',
              borderRadius: '50%',
              "&:hover": { backgroundColor: '#ffffff' }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <IconButton
            onClick={() => {
              if (analysisResults && selectedTickerIndex < analysisResults.tickers.length - 1)
                setSelectedTickerIndex(selectedTickerIndex + 1);
            }}
            disabled={analysisResults && selectedTickerIndex === analysisResults.tickers.length - 1}
            sx={{
              position: 'absolute',
              top: '50%',
              right: 16,
              transform: 'translateY(-50%)',
              backgroundColor: '#ffffff',
              borderRadius: '50%',
              "&:hover": { backgroundColor: '#ffffff' }
            }}
          >
            <ArrowForwardIcon />
          </IconButton>
          <IconButton
            onClick={() => setOpenTickerDialog(false)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: '#ffffff',
              borderRadius: '50%',
              "&:hover": { backgroundColor: '#ffffff' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Dashboard; 