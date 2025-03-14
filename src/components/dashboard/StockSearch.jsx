import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  TextField, 
  Autocomplete, 
  Box, 
  Typography, 
  CircularProgress,
  Paper
} from '@mui/material';

// Levenshtein distance implementation for fuzzy matching
const levenshteinDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(a.length + 1).fill().map(() => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[a.length][b.length];
};

function StockSearch({ onSelectTicker, availableTickers = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  // Filter and sort tickers based on Levenshtein distance
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return availableTickers.slice(0, 10); // Show top 10 by default
    
    // Calculate distance for each ticker
    return availableTickers
      .map(ticker => ({
        ticker,
        distance: levenshteinDistance(
          searchQuery.toUpperCase(), 
          ticker.toUpperCase()
        )
      }))
      .sort((a, b) => a.distance - b.distance) // Sort by distance (closest match first)
      .slice(0, 10) // Limit to top 10 matches
      .map(item => item.ticker);
  }, [searchQuery, availableTickers]);

  // Handle selection
  const handleSelect = (event, value) => {
    if (value && onSelectTicker) {
      onSelectTicker(value);
      setSearchQuery(''); // Clear the search after selection
      
      // Unfocus the search input
      if (inputRef.current) {
        inputRef.current.blur();
      } else if (document.activeElement) {
        document.activeElement.blur();
      }
    }
  };

  // Handle key down to prevent propagation
  const handleKeyDown = (event) => {
    // Prevent propagation of navigation keys
    if (['ArrowLeft', 'ArrowRight', 'Enter', 'Delete', 'Backspace'].includes(event.key)) {
      // Don't stop propagation for Tab key to maintain accessibility
      if (event.key !== 'Tab') {
        event.stopPropagation();
      }
      
      // If Enter is pressed and we have search results, select the first one
      if (event.key === 'Enter' && filteredOptions.length > 0 && searchQuery) {
        const firstResult = filteredOptions[0];
        onSelectTicker(firstResult);
        setSearchQuery(''); // Clear the search after selection
        event.preventDefault(); // Prevent default to avoid form submission
        
        // Unfocus the search input
        if (inputRef.current) {
          inputRef.current.blur();
        } else if (document.activeElement) {
          document.activeElement.blur();
        }
      }
    }
    
    // Also prevent Ctrl+Z from propagating
    if (event.key === 'z' && event.ctrlKey) {
      event.stopPropagation();
    }
  };

  return (
    <Autocomplete
      id="stock-search"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={filteredOptions}
      loading={loading}
      onChange={handleSelect}
      onInputChange={(event, newValue) => setSearchQuery(newValue)}
      onKeyDown={handleKeyDown}
      freeSolo
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      renderInput={(params) => (
        <TextField
          {...params}
          label="Search stocks"
          variant="outlined"
          size="small"
          fullWidth
          onKeyDown={handleKeyDown}
          inputRef={inputRef}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <li {...props}>
          <Typography variant="body2">{option}</Typography>
        </li>
      )}
      noOptionsText="No matching stocks found"
    />
  );
}

export default StockSearch; 