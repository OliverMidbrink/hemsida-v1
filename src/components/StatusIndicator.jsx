import { useState, useEffect } from 'react';
import { Box, Tooltip } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import useAuthStore from '../stores/authStore';

function StatusIndicator() {
  const [status, setStatus] = useState({ health: false, auth: false, checking: true });
  const user = useAuthStore(state => state.user);
  const getAuthHeader = useAuthStore(state => state.getAuthHeader);
  const verifyToken = useAuthStore(state => state.verifyToken);

  useEffect(() => {
    let mounted = true;
    let checkInterval;

    const checkStatus = async () => {
      if (!mounted) return;
      
      setStatus(prev => ({ ...prev, checking: true }));
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        // Check API health
        const healthResponse = await fetch('/data-api/health', {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        });
        
        clearTimeout(timeoutId);
        
        // Check authentication if user exists
        let authStatus = false;
        if (user && user.token) {
          authStatus = await verifyToken();
        }
        
        if (mounted) {
          setStatus({
            health: healthResponse.ok,
            auth: authStatus,
            checking: false
          });
        }
      } catch (error) {
        console.error('API check failed:', error);
        if (mounted) {
          setStatus({
            health: false,
            auth: false,
            checking: false
          });
        }
      }
    };

    checkStatus();
    checkInterval = setInterval(checkStatus, 30000);

    return () => {
      mounted = false;
      clearInterval(checkInterval);
    };
  }, [user, verifyToken]);

  const getStatusInfo = () => {
    if (status.checking) {
      return {
        color: 'warning',
        message: 'Checking API connection...'
      };
    }
    if (!status.health) {
      return {
        color: 'error',
        message: 'Python API is not available'
      };
    }
    if (!user || !status.auth) {
      return {
        color: 'warning',
        message: user ? 'Authentication failed' : 'Not logged in'
      };
    }
    return {
      color: 'success',
      message: 'API is connected'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
      <Tooltip title={statusInfo.message}>
        <FiberManualRecordIcon 
          color={statusInfo.color}
          sx={{ 
            animation: status.checking ? 'pulse 1.5s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.3 },
              '100%': { opacity: 1 },
            }
          }}
        />
      </Tooltip>
    </Box>
  );
}

export default StatusIndicator; 