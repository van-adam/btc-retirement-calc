import { useEffect, useState } from "react";
import { httpClient } from "../services/http-client";

export const useBitcoinPrice = (delay: number) => {
  const [btcPrice, setBtcPrice] = useState<number>();

  const refreshBtcPrice = () => {
    httpClient.get("/exrates").then((response) => {
      const price = response.data["BTC"] as number;
      if (price && price > 0) {
        setBtcPrice(price);
      }
    });
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
