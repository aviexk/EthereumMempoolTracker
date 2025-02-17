import { useState, useEffect, useCallback } from "react";
import type { Transaction } from "@shared/schema";

export function useMempool() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      console.log('Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const tx = JSON.parse(event.data);
          console.log('Received transaction:', tx.hash);
          setTransactions((prev) => [tx, ...prev].slice(0, 100)); // Keep last 100 transactions
        } catch (e) {
          console.error('Error processing message:', e);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        // Attempt to reconnect after 5 seconds
        setTimeout(connect, 5000);
      };

      ws.onerror = (e) => {
        console.error('WebSocket error:', e);
        setError("Failed to connect to mempool");
        ws.close();
      };

      setSocket(ws);
    } catch (e) {
      console.error('Error creating WebSocket:', e);
      setError("Failed to create WebSocket connection");
    }
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