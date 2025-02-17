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
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (aValue === null || bValue === null) return 0;
      return sortDirection === "asc" ? 
        (aValue > bValue ? 1 : -1) : 
        (aValue < bValue ? 1 : -1);
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
    <div className="rounded-md border border-[#2c2d33]">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-[#2c2d33] hover:bg-[#2c2d33]">
            <TableHead onClick={() => toggleSort("hash")} className="cursor-pointer text-[#9d7dda]">
              Transaction Hash
            </TableHead>
            <TableHead onClick={() => toggleSort("from")} className="cursor-pointer text-[#9d7dda]">
              From
            </TableHead>
            <TableHead onClick={() => toggleSort("to")} className="cursor-pointer text-[#9d7dda]">
              To
            </TableHead>
            <TableHead onClick={() => toggleSort("value")} className="cursor-pointer text-[#9d7dda]">
              Value (ETH)
            </TableHead>
            <TableHead onClick={() => toggleSort("gasPrice")} className="cursor-pointer text-[#9d7dda]">
              Gas Price (Gwei)
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTransactions.map((tx) => (
            <TableRow key={tx.hash} className="border-b border-[#2c2d33] hover:bg-[#2c2d33]">
              <TableCell className="font-mono text-[#9d7dda]">{tx.hash.slice(0, 10)}...</TableCell>
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