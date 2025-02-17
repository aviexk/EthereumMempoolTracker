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

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Connect to Ethereum network via Quicknode
  const provider = new ethers.WebSocketProvider(process.env.QUICKNODE_WSS_URL!);

  // Process transactions in batches
  async function processPendingTransactions() {
    if (pendingTxs.length === 0) {
      // Schedule next check
      setTimeout(processPendingTransactions, 1000 / RATE_LIMIT);
      return;
    }

    console.log(`Processing ${Math.min(BATCH_SIZE, pendingTxs.length)} transactions from queue of ${pendingTxs.length}`);

    // Take first BATCH_SIZE transactions
    const batch = pendingTxs.splice(0, BATCH_SIZE);

    for (const txHash of batch) {
      try {
        const tx = await provider.getTransaction(txHash);
        if (!tx) {
          console.log(`Transaction ${txHash} not found`);
          continue;
        }

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

        console.log(`Processed and broadcast transaction ${tx.hash}`);
      } catch (error: any) {
        if (error?.error?.code === -32007) {
          // Rate limit hit - add back to queue
          console.log(`Rate limit hit, requeueing transaction ${txHash}`);
          pendingTxs.push(txHash);
        } else {
          console.error("Error processing transaction:", error);
        }
      }
    }

    // Schedule next batch
    setTimeout(processPendingTransactions, 1000 / RATE_LIMIT);
  }

  // Initialize WebSocket connection handlers
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  // Start processing loop
  processPendingTransactions();

  // Listen for new transactions
  provider.on("pending", (txHash) => {
    console.log(`Received pending transaction: ${txHash}`);
    pendingTxs.push(txHash);
  });

  return httpServer;
}