import React, { useState, useEffect, useRef, memo } from 'react';
import { Box, Typography, IconButton, Collapse } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

function TickerChart({ ticker, prediction, color }) {
  const container = useRef();
  const [showToolbar, setShowToolbar] = useState(true);

  useEffect(() => {
    if (!container.current) return;
    // Clear any previous widget instance.
    container.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    const widgetConfig = {
      autosize: true,
      symbol: ticker ? `${ticker}` : "NASDAQ:AAPL",
      interval: "D",
      timezone: "Etc/UTC",
      theme: "light",
      style: "1",
      locale: "en",
      hide_volume: true,
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com"
    };
    script.innerHTML = JSON.stringify(widgetConfig, null, 2);
    container.current.appendChild(script);
  }, [ticker]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="tradingview-widget-container" ref={container} style={{ flex: 1 }}>
        <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 32px)", width: "100%" }}></div>
        <div className="tradingview-widget-copyright">
          <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
            <span className="blue-text">Track all markets on TradingView</span>
          </a>
        </div>
      </div>
      <Box sx={{ position: 'relative' }}>
        <IconButton
          onClick={() => setShowToolbar(prev => !prev)}
          sx={{
            position: 'absolute',
            left: 8,
            bottom: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)'
            }
          }}
        >
          <MenuIcon />
        </IconButton>
        <Collapse in={showToolbar}>
          <Box sx={{
            p: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.03)',
            borderTop: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontWeight: 500, color: 'text.secondary' }}>
                Expected probability of rising &gt; 5% in two days:
              </Typography>
              <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>
                {(prediction * 100).toFixed(1)}%
              </Typography>
            </Box>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Up signal
              </Typography>
              <Box sx={{
                width: 24,
                height: 24,
                backgroundColor: color || '#ffffff',
                borderRadius: 1
              }} />
            </Box>
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
}

export default memo(TickerChart); 