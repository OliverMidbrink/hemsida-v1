import { useState, useEffect, useRef } from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  Typography, 
  Paper,
  CircularProgress,
  Chip,
  LinearProgress,
  Box,
  IconButton,
  Collapse,
  Divider
} from '@mui/material';
import useAuthStore from '../../stores/authStore';
import useWebSocketStore from '../../stores/websocketStore';
import RefreshIcon from '@mui/icons-material/Refresh';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import ClearAllIcon from '@mui/icons-material/ClearAll';

function JobsList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { clientId, socket, setSocket } = useWebSocketStore();
  const user = useAuthStore(state => state.user);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const [expandedLogs, setExpandedLogs] = useState({});
  const [jobLogs, setJobLogs] = useState({});
  const [alert, setAlert] = useState({ show: false, message: '' });
  const [wsUpdates, setWsUpdates] = useState({});
  const wsUpdatesRef = useRef({}); // Add ref to avoid dependency cycle
  const [deleteDialog, setDeleteDialog] = useState({ open: false, jobId: null });
  const [clearAllDialog, setClearAllDialog] = useState(false);
  const [error, setError] = useState(null);

  // Add ref to track polling interval
  const pollingInterval = useRef(null);

  // Add a ref to track the WebSocket instance
  const wsRef = useRef(null);

  // WebSocket setup
  useEffect(() => {
    let mounted = true;
    let reconnectTimeout = null;

    const connect = () => {
      if (!mounted || !user) return;

      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      const wsUrl = `ws://localhost:8000/ws/${clientId}?token=${user.id}`;
      console.log('Connecting WebSocket...', { clientId, userId: user.id });
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket Connected');
        setSocket(ws);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        if (!mounted) return;
        
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket received:', data);

          if (data.type === 'job_update') {
            // Update UI immediately
            setJobs(prevJobs => {
              const jobIndex = prevJobs.findIndex(j => j.job_id === data.job_id);
              const updatedJobs = [...prevJobs];

              const updatedJob = {
                ...(jobIndex >= 0 ? updatedJobs[jobIndex] : {}),
                ...data,
                search_text: jobIndex >= 0 ? updatedJobs[jobIndex].search_text : data.search_text,
                _lastUpdate: Date.now()
              };

              if (jobIndex >= 0) {
                updatedJobs[jobIndex] = updatedJob;
              } else {
                updatedJobs.push(updatedJob);
              }

              console.log('Updating job:', {
                jobId: data.job_id,
                status: data.status,
                progress: data.progress,
                currentJobs: updatedJobs.length
              });

              return updatedJobs;
            });

            // Show alert for update with auto-hide for completed status
            setAlert({
              show: true,
              message: `Update: ${data.status} - Progress: ${data.progress}%`
            });
            
            // Clear alert after delay, immediately for completed jobs
            const hideDelay = data.status === 'completed' ? 6000 : 6000;
            setTimeout(() => setAlert({ show: false, message: '' }), hideDelay);

            // Update logs
            setJobLogs(prev => ({
              ...prev,
              [data.job_id]: [
                ...(prev[data.job_id] || []),
                {
                  timestamp: new Date().toISOString(),
                  status: data.status,
                  progress: data.progress,
                  worker: data.worker_id,
                  source: 'WebSocket'
                }
              ]
            }));
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        if (mounted && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          reconnectTimeout = setTimeout(connect, 1000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connect();

    return () => {
      mounted = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, clientId]); // Only depend on user and clientId

  // Initial fetch of jobs
  useEffect(() => {
    const fetchJobs = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/python-api/jobs', {
          headers: {
            'Authorization': user.id.toString()
          }
        });
        if (response.ok) {
          const data = await response.json();
          setJobs(data);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [user]);

  // Function to fetch a specific job
  const fetchJob = async (jobId) => {
    if (!user) return;
    
    try {
      const response = await fetch(`/python-api/jobs/${jobId}`, {
        headers: {
          'Authorization': user.id.toString()
        }
      });
      if (response.ok) {
        const updatedJob = await response.json();
        console.log('Job update received:', {
          jobId,
          status: updatedJob.status,
          progress: updatedJob.progress,
          previousProgress: jobs.find(j => j.job_id === jobId)?.progress
        });
        
        setJobs(prevJobs => {
          return prevJobs.map(job => 
            job.job_id === jobId ? {
              ...job,                // Keep existing job data
              ...updatedJob,         // Update with new data
              progress: updatedJob.progress ?? job.progress, // Ensure progress is not lost
              search_text: job.search_text,
              _lastUpdate: Date.now()
            } : job
          );
        });

        // Add to logs only if there's a change
        const currentJob = jobs.find(j => j.job_id === jobId);
        if (currentJob?.progress !== updatedJob.progress || currentJob?.status !== updatedJob.status) {
          setJobLogs(prevLogs => ({
            ...prevLogs,
            [jobId]: [
              ...(prevLogs[jobId] || []),
              {
                timestamp: new Date().toISOString(),
                status: updatedJob.status,
                progress: updatedJob.progress,
                worker: updatedJob.worker_id
              }
            ]
          }));
        }

        // Add visual feedback for updates
        if (updatedJob.status === 'running') {
          setAlert({
            show: true,
            message: `Job ${jobId} progress: ${updatedJob.progress}%`
          });
          setTimeout(() => setAlert({ show: false, message: '' }), 1000);
        }

        return updatedJob;
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      setError(error.message);
    }
  };

  // Set up polling for running jobs
  useEffect(() => {
    const startPolling = () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }

      const runningJobs = jobs.filter(job => 
        job.status === 'running' || job.status === 'pending'
      );
      
      if (runningJobs.length > 0) {
        console.log('Starting polling for jobs:', runningJobs.map(j => j.job_id));
        
        pollingInterval.current = setInterval(() => {
          runningJobs.forEach(job => {
            fetchJob(job.job_id);
          });
        }, 1000); // Poll every second
      }
    };

    startPolling();

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [jobs.map(job => `${job.job_id}-${job.status}`).join(',')]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'running': return 'warning';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  // Update refreshJobs to also trigger polling
  const refreshJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/python-api/jobs', {
        headers: {
          'Authorization': user.id.toString()
        }
      });
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add function to fetch job logs
  const fetchJobLogs = async (jobId) => {
    if (!user) return;
    
    try {
      const response = await fetch(`/python-api/jobs/${jobId}/logs`, {
        headers: {
          'Authorization': user.id.toString()
        }
      });
      if (response.ok) {
        const logs = await response.json();
        setJobLogs(prevLogs => ({
          ...prevLogs,
          [jobId]: logs.map(log => ({
            timestamp: log.timestamp,
            status: log.status,
            progress: log.progress,
            worker: log.worker_id
          }))
        }));
      }
    } catch (error) {
      console.error('Error fetching job logs:', error);
      setError(error.message);
    }
  };

  // Update toggleLogs to fetch logs when expanding
  const toggleLogs = (jobId) => {
    setExpandedLogs(prev => {
      const newState = {
        ...prev,
        [jobId]: !prev[jobId]
      };
      
      // Fetch logs when expanding
      if (newState[jobId]) {
        fetchJobLogs(jobId);
      }
      
      return newState;
    });
  };

  const handleDelete = async (jobId) => {
    if (!user) return;
    
    try {
      const response = await fetch(`/python-api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': user.id.toString()
        }
      });
      
      if (response.ok) {
        // Remove from local state
        setJobs(prevJobs => prevJobs.filter(job => job.job_id !== jobId));
        setJobLogs(prevLogs => {
          const newLogs = { ...prevLogs };
          delete newLogs[jobId];
          return newLogs;
        });
        setAlert({
          show: true,
          message: 'Job deleted successfully'
        });
        setTimeout(() => setAlert({ show: false, message: '' }), 2000);
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      setError(error.message);
      setAlert({
        show: true,
        message: 'Error deleting job'
      });
      setTimeout(() => setAlert({ show: false, message: '' }), 2000);
    } finally {
      setDeleteDialog({ open: false, jobId: null });
    }
  };

  // Add clear all handler
  const handleClearAll = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/python-api/jobs/clear-all', {
        method: 'DELETE',
        headers: {
          'Authorization': user.id.toString()
        }
      });
      
      if (response.ok) {
        // Clear local state
        setJobs([]);
        setJobLogs({});
        setAlert({
          show: true,
          message: 'All jobs cleared successfully'
        });
        setTimeout(() => setAlert({ show: false, message: '' }), 2000);
      }
    } catch (error) {
      console.error('Error clearing jobs:', error);
      setError(error.message);
      setAlert({
        show: true,
        message: 'Error clearing jobs'
      });
      setTimeout(() => setAlert({ show: false, message: '' }), 2000);
    } finally {
      setClearAllDialog(false);
    }
  };

  // Update the debug panel to use both state and ref
  const renderDebugPanel = () => (
    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
      <Typography variant="h6">WebSocket Updates Debug</Typography>
      <Typography variant="subtitle2" color="text.secondary">
        Active Updates: {Object.keys(wsUpdatesRef.current).length}
      </Typography>
      {Object.entries(wsUpdatesRef.current).map(([jobId, data]) => (
        <Box key={jobId} sx={{ mt: 1 }}>
          <Typography variant="subtitle2">
            Job {jobId} - Last Update: {new Date(data.lastUpdate).toLocaleTimeString()}
          </Typography>
          <Box sx={{ ml: 2 }}>
            {data.updates.map((update, i) => (
              <Typography key={i} variant="body2">
                {new Date(update.timestamp).toLocaleTimeString()} - 
                Status: {update.status} - 
                Progress: {update.progress}% - 
                Worker: {update.worker}
              </Typography>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );

  if (error) return <Typography color="error">{error}</Typography>;

  if (loading) {
    return <CircularProgress />;
  }

  if (!jobs || jobs.length === 0) return <Typography>No jobs found.</Typography>;

  return (
    <>
      {alert.show && (
        <Box
          sx={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            bgcolor: 'info.main',
            color: 'white',
            p: 2,
            borderRadius: 1,
            boxShadow: 3,
          }}
        >
          {alert.message}
        </Box>
      )}
      <Paper sx={{ p: 2, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h6">
            Recent Vector Jobs
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
            <IconButton 
              size="small"
              onClick={refreshJobs}
              disabled={loading}
              title="Refresh jobs"
            >
              <RefreshIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setClearAllDialog(true)}
              disabled={loading || jobs.length === 0}
              title="Clear all jobs"
              color="error"
            >
              <ClearAllIcon />
            </IconButton>
          </Box>
        </Box>
        <List>
          {jobs.map((job) => (
            <ListItem 
              key={job.job_id}
              sx={{ 
                mb: 1, 
                borderRadius: 1,
                border: 1,
                borderColor: 'divider',
                flexDirection: 'column',
                alignItems: 'stretch'
              }}
            >
              <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{job.search_text}</span>
                      <Chip 
                        label={job.status}
                        color={getStatusColor(job.status)}
                        size="small"
                      />
                      {job.position > 0 && (
                        <Chip 
                          label={`Queue: #${job.position}`}
                          color="default"
                          size="small"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Box component="span" sx={{ display: 'block', mb: 1 }}>
                        Created: {new Date(job.created_at).toLocaleString()}
                        {job.completed_at && ` | Completed: ${new Date(job.completed_at).toLocaleString()}`}
                        {job.worker_id && ` | Worker: ${job.worker_id}`}
                      </Box>
                      {(job.status === 'running' || job.status === 'pending') && (
                        <LinearProgress 
                          variant={job.status === 'running' ? "determinate" : "indeterminate"}
                          value={job.progress || 0}
                          sx={{ mb: 1 }}
                        />
                      )}
                      {job.result && (
                        <Box 
                          sx={{ 
                            maxHeight: 100,
                            overflow: 'auto',
                            bgcolor: 'grey.100',
                            p: 1,
                            borderRadius: 1,
                            fontSize: '0.875rem',
                            fontFamily: 'monospace'
                          }}
                        >
                          Vector: [{job.result.vector.slice(0, 5).join(', ')}, ...]
                        </Box>
                      )}
                      {job.error_message && (
                        <Typography variant="body2" color="error">
                          Error: {job.error_message}
                        </Typography>
                      )}
                    </>
                  }
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => toggleLogs(job.job_id)}
                    sx={{ mt: 1 }}
                  >
                    {expandedLogs[job.job_id] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setDeleteDialog({ open: true, jobId: job.job_id })}
                    sx={{ mt: 1 }}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>

              <Collapse in={expandedLogs[job.job_id]} timeout="auto" unmountOnExit>
                <Divider sx={{ my: 1 }} />
                <Box 
                  sx={{ 
                    p: 1,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    maxHeight: 200,
                    overflow: 'auto',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace'
                  }}
                >
                  {jobLogs[job.job_id]?.map((log, index) => (
                    <Box key={index} sx={{ mb: 0.5 }}>
                      <span style={{ color: 'grey' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      {' - '}
                      <span style={{ color: 'blue' }}>{log.status}</span>
                      {log.progress !== undefined && (
                        <span style={{ color: 'green' }}>{' - Progress: ' + log.progress + '%'}</span>
                      )}
                      {log.worker && (
                        <span style={{ color: 'purple' }}>{' - Worker: ' + log.worker}</span>
                      )}
                      {log.source && (
                        <span style={{ color: 'orange' }}>{' - ' + log.source}</span>
                      )}
                    </Box>
                  ))}
                  {(!jobLogs[job.job_id] || jobLogs[job.job_id].length === 0) && (
                    <Box sx={{ color: 'text.secondary' }}>No logs available</Box>
                  )}
                </Box>
              </Collapse>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, jobId: null })}
      >
        <DialogTitle>Delete Job</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this job? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, jobId: null })}
            color="primary"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleDelete(deleteDialog.jobId)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Clear All Confirmation Dialog */}
      <Dialog
        open={clearAllDialog}
        onClose={() => setClearAllDialog(false)}
      >
        <DialogTitle>Clear All Jobs</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to clear all jobs? This action cannot be undone and will remove all job history.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setClearAllDialog(false)}
            color="primary"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleClearAll}
            color="error"
            variant="contained"
          >
            Clear All
          </Button>
        </DialogActions>
      </Dialog>

      {process.env.NODE_ENV === 'development' && renderDebugPanel()}
    </>
  );
}

export default JobsList; 