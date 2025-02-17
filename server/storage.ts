import { type Transaction, type InsertTransaction } from "@shared/schema";

export interface IStorage {
  insertTransaction(tx: InsertTransaction): Promise<Transaction>;
  getTransactions(): Promise<Transaction[]>;
}

export class MemStorage implements IStorage {
  private transactions: Map<string, Transaction>;
  private currentId: number;

  constructor() {
    this.transactions = new Map();
    this.currentId = 1;
  }

  async insertTransaction(tx: InsertTransaction): Promise<Transaction> {
    const id = this.currentId++;
    const transaction: Transaction = {
      id,
      hash: tx.hash,
      from: tx.from,
      to: tx.to ?? null,
      value: tx.value,
      gasPrice: tx.gasPrice,
      gasLimit: tx.gasLimit,
      timestamp: tx.timestamp,
      data: tx.data,
    };

    this.transactions.set(tx.hash, transaction);

    // Keep only last 1000 transactions in memory
    if (this.transactions.size > 1000) {
      const firstKey = this.transactions.keys().next().value;
      if (firstKey) {
        this.transactions.delete(firstKey);
      }
    }

    return transaction;
  }

  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }
}

export const storage = new MemStorage();