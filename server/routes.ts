import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { ethers } from "ethers";
import { storage } from "./storage";
import { insertTransactionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Connect to Ethereum network via Quicknode
  const provider = new ethers.WebSocketProvider(process.env.QUICKNODE_WSS_URL!);

  provider.on("pending", async (txHash) => {
    try {
      const tx = await provider.getTransaction(txHash);
      if (!tx) return;

      const transaction = {
        hash: tx.hash,
        from: tx.from,
        to: tx.to ?? null,
        value: tx.value.toString(),
        gasPrice: tx.gasPrice?.toString() || "0",
        gasLimit: tx.gasLimit.toString(),
        timestamp: Date.now().toString(),
        data: tx.data,
      };

      // Validate transaction data
      const parsed = insertTransactionSchema.parse(transaction);

      // Store transaction
      const stored = await storage.insertTransaction(parsed);

      // Broadcast to all connected clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(stored));
        }
      });
    } catch (error) {
      console.error("Error processing transaction:", error);
    }
  });

  return httpServer;
}