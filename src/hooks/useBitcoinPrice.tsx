import { useEffect, useState } from "react";

// Fetches BTC/USD price directly from Binance's public API.
// No API key needed, CORS-friendly, no proxy required.
const fetchBtcPrice = async (): Promise<number> => {
  const response = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return parseFloat(data.price);
};

export const useBitcoinPrice = (delay: number) => {
  const [btcPrice, setBtcPrice] = useState<number>();

  const refreshBtcPrice = async () => {
    try {
      const price = await fetchBtcPrice();
      if (price && price > 0) {
        setBtcPrice(price);
      }
    } catch (e) {
      console.error("[useBitcoinPrice] Failed to fetch BTC price:", e);
    }
  };

  useEffect(() => {
    refreshBtcPrice();
  }, []);

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(refreshBtcPrice, delay);
      return () => clearInterval(id);
    }
  }, [delay]);

  return btcPrice;
};
