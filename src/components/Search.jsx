import { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  CircularProgress,
  List,
  ListItem,
  ListItemText 
} from '@mui/material';

function Search() {
  const [searchText, setSearchText] = useState('');
  const [clientId] = useState(() => `client-${Math.random().toString(36).substr(2, 9)}`);
  const [socket, setSocket] = useState(null);
  const [jobs, setJobs] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/data-api/ws/${clientId}`);
    
    ws.onopen = () => {
      console.log('WebSocket Connected');
      setSocket(ws);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'job_update') {
        setJobs(prev => ({
          ...prev,
          [data.job_id]: {
            status: data.status,
            result: data.result,
            created_at: data.created_at,
            completed_at: data.completed_at
          }
        }));
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      if (ws) ws.close();
    };
  }, [clientId]);

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/data-api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': clientId
        },
        body: JSON.stringify({
          search_text: searchText,
          client_id: clientId
        }),
      });
      
      if (!response.ok) throw new Error('Search request failed');
      
      const data = await response.json();
      console.log('Search job created:', data.job_id);
      
      setJobs(prev => ({
        ...prev,
        [data.job_id]: {
          status: 'pending',
          result: null
        }
      }));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Vector Search
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <TextField
          fullWidth
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          label="Enter search text"
          variant="outlined"
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={loading || !searchText.trim()}
        >
          Search
        </Button>
      </Box>

      <Typography variant="h6" gutterBottom>
        Search Results
      </Typography>
      
      <List>
        {Object.entries(jobs).map(([jobId, job]) => (
          <ListItem 
            key={jobId}
            sx={{ 
              bgcolor: 'background.paper',
              mb: 1,
              borderRadius: 1,
              border: 1,
              borderColor: 'divider'
            }}
          >
            <ListItemText
              primary={`Job ${jobId}`}
              secondary={
                <>
                  <Typography component="span" display="block">
                    Status: {job.status}
                    {job.status === 'running' && (
                      <CircularProgress size={16} sx={{ ml: 1 }} />
                    )}
                  </Typography>
                  {job.result && (
                    <Typography component="span" display="block">
                      Vector: [{job.result.vector.slice(0, 3).join(', ')}, ...]
                    </Typography>
                  )}
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export default Search; 