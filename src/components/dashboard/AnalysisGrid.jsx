import { Box, Typography } from '@mui/material';

function AnalysisGrid({ analysisResults, onSelectTicker, selectedTickerIndex }) {
  if (!analysisResults) {
    return null;
  }

  // Compute mean and standard deviation for fluid color scaling.
  const total = analysisResults.predictions.reduce((sum, p) => sum + p, 0);
  const mean = total / analysisResults.predictions.length;
  const variance = analysisResults.predictions.reduce(
    (acc, p) => acc + Math.pow(p - mean, 2),
    0
  ) / analysisResults.predictions.length;
  const std = Math.sqrt(variance);

  // Dynamically compute background color for each cell.
  const getBackgroundColor = (prediction) => {
    if (std === 0) return "#ffffff";
    let n = (prediction - mean) / std;
    n = Math.max(-1, Math.min(1, n));
    if (n >= 0) {
      const factor = n;
      const r = Math.round(255 * (1 - factor) + 0 * factor);
      const g = Math.round(255 * (1 - factor) + 128 * factor);
      const b = Math.round(255 * (1 - factor) + 0 * factor);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const factor = -n;
      const r = Math.round(255 * (1 - factor) + 150 * factor);
      const g = Math.round(255 * (1 - factor) + 0 * factor);
      const b = Math.round(255 * (1 - factor) + 0 * factor);
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  const cells = analysisResults.tickers.map((ticker, idx) => {
    const prediction = analysisResults.predictions[idx];
    const bgColor = getBackgroundColor(prediction);

    // Check if this ticker is currently selected
    const isSelected = idx === selectedTickerIndex;

    return (
      <Box
        key={ticker}
        onClick={() => onSelectTicker(idx)}
        sx={{
          width: '100%',
          aspectRatio: '1',
          backgroundColor: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: isSelected ? '3px solid #0077FF' : '1px solid #ccc',
          p: 0.25,
        }}
      >
        <Typography sx={{ fontSize: '0.65rem', lineHeight: 1 }}>
          {ticker}
        </Typography>
      </Box>
    );
  });

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(46px, 1fr))',
        gap: 0.25,
      }}
    >
      {cells}
    </Box>
  );
}

export default AnalysisGrid; 