import { pgTable, text, serial, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  hash: text("hash").notNull().unique(),
  from: text("from").notNull(),
  to: text("to"),
  value: text("value").notNull(),
  gasPrice: numeric("gas_price").notNull(),
  gasLimit: numeric("gas_limit").notNull(),
  timestamp: text("timestamp").notNull(),
  data: text("data").notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;