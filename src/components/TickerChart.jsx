import React, { useState, useEffect, useRef, memo } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

function TickerChart({
  ticker,
  prediction,
  color,
  onPrev,
  onNext,
  isPrevDisabled,
  isNextDisabled
}) {
  const container = useRef();
  const [dockAtBottom, setDockAtBottom] = useState(false);   // Tracks whether toolbar is on bottom or right

  // Embed or re-embed TradingView chart in the container
  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    const widgetConfig = {
      autosize: true,
      symbol: ticker || 'NASDAQ:AAPL',
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'light',
      style: '1',
      locale: 'en',
      hide_volume: true,
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    };
    script.innerHTML = JSON.stringify(widgetConfig, null, 2);
    container.current.appendChild(script);
  }, [ticker]);

  // Toggle the dock orientation (right <-> bottom)
  const toggleDock = () => {
    setDockAtBottom((prev) => !prev);
  };

  // The outer container changes flexDirection based on dockAtBottom
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: dockAtBottom ? 'column' : 'row',
      }}
    >
      {/* Chart container */}
      <Box
        sx={{
          flex: 1,
          border: 'none',
          position: 'relative',
          '& .tradingview-widget-container': {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          },
        }}
      >
        <div
          className="tradingview-widget-container"
          ref={container}
        >
          <div
            className="tradingview-widget-container__widget"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </Box>

      {/* Toolbar / signals panel */}
      <Box
        sx={{
          width: dockAtBottom ? '100%' : '250px',
          height: dockAtBottom ? '120px' : 'auto',
          p: 2,
          backgroundColor: 'rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: dockAtBottom ? 'row' : 'column',
          gap: 2,
          justifyContent: 'space-between',
          alignItems: dockAtBottom ? 'center' : 'stretch',
        }}
      >
        {/* Top section with toggle and probability */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: dockAtBottom ? 'row' : 'column',
          gap: dockAtBottom ? 1 : 2,
          alignItems: dockAtBottom ? 'center' : 'flex-start',
          flex: dockAtBottom ? 1 : 'initial',
        }}>
          {/* Toggle button */}
          <IconButton
            onClick={toggleDock}
            sx={{
              alignSelf: dockAtBottom ? 'center' : 'flex-start',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' },
              mb: dockAtBottom ? 0 : 1,
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Probability info */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: dockAtBottom ? 'row' : 'column',
            alignItems: dockAtBottom ? 'center' : 'flex-start',
            gap: dockAtBottom ? 1 : 0.5
          }}>
            <Typography 
              sx={{ 
                fontWeight: 500, 
                color: 'text.secondary',
                fontSize: dockAtBottom ? '0.9rem' : 'inherit'
              }}
            >
              Expected probability of rising &gt; 5% in two days:
            </Typography>
            <Typography 
              sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
                fontSize: dockAtBottom ? '0.9rem' : 'inherit'
              }}
            >
              {(prediction * 100).toFixed(1)}%
            </Typography>
          </Box>
        </Box>

        {/* Bottom section with signal and navigation */}
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'row',
          justifyContent: dockAtBottom ? 'flex-end' : 'space-between',
          alignItems: 'center',
          gap: dockAtBottom ? 2 : 3,
          minWidth: dockAtBottom ? '200px' : 'auto',
          mt: dockAtBottom ? 0 : 2,
          pt: dockAtBottom ? 0 : 2,
          borderTop: dockAtBottom ? 'none' : '1px solid rgba(0,0,0,0.1)',
        }}>
          {/* Signal indicator */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            pl: dockAtBottom ? 0 : 1,
          }}>
            <Typography variant="h8">Signal</Typography>
            <Box
              sx={{
                width: 24,
                height: 24,
                backgroundColor: color || '#ffffff',
                borderRadius: 1,
                border: '1px solid rgba(0,0,0,0.1)',
              }}
            />
          </Box>

          {/* Navigation buttons */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'row',
            gap: 0.5,
            pr: dockAtBottom ? 0 : 1,
          }}>
            <IconButton 
              onClick={onPrev} 
              disabled={isPrevDisabled}
              size="small"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.8)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,1)',
                },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <IconButton 
              onClick={onNext} 
              disabled={isNextDisabled}
              size="small"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.8)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,1)',
                },
              }}
            >
              <ArrowForwardIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default memo(TickerChart); 