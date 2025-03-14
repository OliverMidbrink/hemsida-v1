import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import useSavedStocksStore from '../stores/savedStocksStore';

// Cache for chart instances
const chartCache = new Map();

function TickerChart({
  ticker,
  prediction,
  color,
  onPrev,
  onNext,
  isPrevDisabled,
  isNextDisabled,
  onSaveToggle
}) {
  const container = useRef();
  
  // Get saved stocks functions from store
  const { addStock, removeStock, isStockSaved } = useSavedStocksStore();
  const isSaved = isStockSaved(ticker);

  // Handle save/unsave stock
  const handleSaveStock = () => {
    if (isSaved) {
      removeStock(ticker);
      if (onSaveToggle) onSaveToggle(ticker, false);
    } else {
      addStock(ticker);
      if (onSaveToggle) onSaveToggle(ticker, true);
    }
  };

  // Create or get cached chart instance
  const chartInstance = useMemo(() => {
    if (!ticker) return null;
    
    // If we already have a chart instance for this ticker, return it
    if (chartCache.has(ticker)) {
      return chartCache.get(ticker);
    }

    // Create new chart instance
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    
    const widgetConfig = {
      autosize: true,
      symbol: ticker,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'light',
      style: '1',
      withdateranges: true,
      details: true,
      show_popup_button: true,
      popup_width: 1000,
      popup_height: 600,
      locale: 'en',
      hide_volume: true,
      allow_symbol_change: true,
      hide_side_toolbar: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    };
    
    script.innerHTML = JSON.stringify(widgetConfig, null, 2);
    
    // Cache the script element
    chartCache.set(ticker, script);
    return script;
  }, [ticker]);

  // Embed or re-embed TradingView chart in the container
  useEffect(() => {
    if (!container.current || !chartInstance) return;
    
    // Clear container
    container.current.innerHTML = '';
    
    // Clone the cached script to avoid DOM node reuse issues
    const scriptClone = chartInstance.cloneNode(true);
    container.current.appendChild(scriptClone);
  }, [chartInstance]);

  // Clean up chart cache when component unmounts
  useEffect(() => {
    return () => {
      // Only remove from cache if the stock is not saved
      if (!isSaved) {
        chartCache.delete(ticker);
      }
    };
  }, [ticker, isSaved]);

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
            <Tooltip title="Previous stock (← Left arrow)">
              <span>
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
              </span>
            </Tooltip>
            <Tooltip title="Next stock (→ Right arrow)">
              <span>
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
              </span>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default memo(TickerChart); 