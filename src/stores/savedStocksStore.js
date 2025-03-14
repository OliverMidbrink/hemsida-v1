import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSavedStocksStore = create(
  persist(
    (set, get) => ({
      savedStocks: [],
      
      // Add a stock to saved stocks
      addStock: (ticker) => {
        const { savedStocks } = get();
        // Only add if not already in the list
        if (!savedStocks.includes(ticker)) {
          set({ savedStocks: [...savedStocks, ticker] });
        }
      },
      
      // Remove a stock from saved stocks
      removeStock: (ticker) => {
        const { savedStocks } = get();
        set({ savedStocks: savedStocks.filter(stock => stock !== ticker) });
      },
      
      // Check if a stock is saved
      isStockSaved: (ticker) => {
        const { savedStocks } = get();
        return savedStocks.includes(ticker);
      },
    }),
    {
      name: 'saved-stocks-storage', // name of the item in localStorage
      getStorage: () => localStorage, // use localStorage
    }
  )
);

export default useSavedStocksStore; 