import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function TransactionFilters() {
  const [filters, setFilters] = useState({
    address: "",
    minValue: "",
  });

  return (
    <div className="flex gap-4 mb-4">
      <div className="flex-1">
        <Input
          placeholder="Filter by address..."
          value={filters.address}
          onChange={(e) => setFilters({ ...filters, address: e.target.value })}
          className="font-mono"
        />
      </div>
      <div className="w-48">
        <Input
          placeholder="Min value (ETH)..."
          type="number"
          value={filters.minValue}
          onChange={(e) => setFilters({ ...filters, minValue: e.target.value })}
        />
      </div>
      <Button
        variant="outline"
        onClick={() => setFilters({ address: "", minValue: "" })}
      >
        Clear Filters
      </Button>
    </div>
  );
}
