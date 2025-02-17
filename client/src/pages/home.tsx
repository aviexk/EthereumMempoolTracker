import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { TransactionTable } from "@/components/transaction-table";
import { TransactionFilters } from "@/components/transaction-filters";
import { useMempool } from "@/hooks/use-mempool";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const { toast } = useToast();
  const { transactions, isConnected, error } = useMempool();

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: error,
      });
    }
  }, [error, toast]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Ethereum Mempool Tracker</h1>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Connected to Mempool' : 'Disconnected'}
            </span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Monitor</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionFilters />
            <TransactionTable transactions={transactions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
