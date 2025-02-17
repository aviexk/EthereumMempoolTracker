import { useState, useEffect, useCallback } from "react";
import type { Transaction } from "@shared/schema";

export function useMempool() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      const tx = JSON.parse(event.data);
      setTransactions((prev) => [tx, ...prev].slice(0, 100)); // Keep last 100 transactions
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Attempt to reconnect after 5 seconds
      setTimeout(connect, 5000);
    };

    ws.onerror = () => {
      setError("Failed to connect to mempool");
      ws.close();
    };

    setSocket(ws);
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [connect]);

  return {
    transactions,
    isConnected,
    error
  };
}
