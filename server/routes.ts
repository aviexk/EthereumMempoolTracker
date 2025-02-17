import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { ethers } from "ethers";
import { storage } from "./storage";
import { insertTransactionSchema } from "@shared/schema";

// Rate limiting variables
let pendingTxs: string[] = [];
const RATE_LIMIT = 10; // requests per second
const BATCH_SIZE = 5; // process 5 transactions at a time
let isProcessing = false;

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Connect to Ethereum network via Quicknode
  const provider = new ethers.WebSocketProvider(process.env.QUICKNODE_WSS_URL!);

  // Process transactions in batches
  async function processPendingTransactions() {
    if (isProcessing) return;
    isProcessing = true;

    while (pendingTxs.length > 0) {
      // Take first BATCH_SIZE transactions
      const batch = pendingTxs.splice(0, BATCH_SIZE);

      for (const txHash of batch) {
        try {
          const tx = await provider.getTransaction(txHash);
          if (!tx) continue;

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
        } catch (error: any) {
          if (error?.error?.code === -32007) {
            // Rate limit hit - add back to queue
            pendingTxs.push(txHash);
            // Wait before continuing
            await new Promise(resolve => setTimeout(resolve, 1000 / RATE_LIMIT));
          } else {
            console.error("Error processing transaction:", error);
          }
        }
      }

      // Wait before processing next batch
      await new Promise(resolve => setTimeout(resolve, 1000 / RATE_LIMIT));
    }

    isProcessing = false;
    // Schedule next check
    setTimeout(processPendingTransactions, 1000);
  }

  provider.on("pending", (txHash) => {
    pendingTxs.push(txHash);
    if (!isProcessing) {
      processPendingTransactions();
    }
  });

  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('close', () => console.log('Client disconnected'));
  });

  return httpServer;
}