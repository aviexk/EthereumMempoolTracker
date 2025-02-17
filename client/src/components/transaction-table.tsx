import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type Transaction } from "@shared/schema";
import { formatEther } from "ethers";

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const [sortField, setSortField] = useState<keyof Transaction>("timestamp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      if (sortDirection === "asc") {
        return a[sortField] > b[sortField] ? 1 : -1;
      }
      return a[sortField] < b[sortField] ? 1 : -1;
    });
  }, [transactions, sortField, sortDirection]);

  const toggleSort = (field: keyof Transaction) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => toggleSort("hash")} className="cursor-pointer">
              Transaction Hash
            </TableHead>
            <TableHead onClick={() => toggleSort("from")} className="cursor-pointer">
              From
            </TableHead>
            <TableHead onClick={() => toggleSort("to")} className="cursor-pointer">
              To
            </TableHead>
            <TableHead onClick={() => toggleSort("value")} className="cursor-pointer">
              Value (ETH)
            </TableHead>
            <TableHead onClick={() => toggleSort("gasPrice")} className="cursor-pointer">
              Gas Price (Gwei)
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTransactions.map((tx) => (
            <TableRow key={tx.hash}>
              <TableCell className="font-mono">{tx.hash.slice(0, 10)}...</TableCell>
              <TableCell className="font-mono">{tx.from.slice(0, 8)}...</TableCell>
              <TableCell className="font-mono">{tx.to ? `${tx.to.slice(0, 8)}...` : 'Contract Creation'}</TableCell>
              <TableCell>{formatEther(tx.value)}</TableCell>
              <TableCell>{Number(tx.gasPrice) / 1e9}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
