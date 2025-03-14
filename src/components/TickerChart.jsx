import React, { useState, useEffect, useRef, memo } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import useSavedStocksStore from '../stores/savedStocksStore';

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
  
  // Get saved stocks functions from store
  const { addStock, removeStock, isStockSaved } = useSavedStocksStore();
  const isSaved = isStockSaved(ticker);

  // Handle save/unsave stock
  const handleSaveStock = () => {
    if (isSaved) {
      removeStock(ticker);
    } else {
      addStock(ticker);
    }
  };

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

  // The outer container with fixed row direction (side menu always on right)
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
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

      {/* Toolbar / signals panel - always on right */}
      <Box
        sx={{
          width: '250px',
          height: 'auto',
          p: 2,
          backgroundColor: 'rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          justifyContent: 'space-between',
          alignItems: 'stretch',
        }}
      >
        {/* Top section with save button and probability */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: 2,
          alignItems: 'flex-start',
        }}>
          {/* Save Stock button */}
          <Tooltip title={isSaved ? "Remove from saved stocks" : "Save stock"}>
            <IconButton
              onClick={handleSaveStock}
              sx={{
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' },
                mb: 1,
                color: isSaved ? 'primary.main' : 'inherit',
              }}
            >
              {isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            </IconButton>
          </Tooltip>

          {/* Probability info */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 0.5
          }}>
            <Typography 
              sx={{ 
                fontWeight: 500, 
                color: 'text.secondary',
              }}
            >
              Expected probability of rising &gt; 5% in two days:
            </Typography>
            <Typography 
              sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
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
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 3,
          mt: 2,
          pt: 2,
          borderTop: '1px solid rgba(0,0,0,0.1)',
        }}>
          {/* Signal indicator */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            pl: 1,
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
            pr: 1,
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