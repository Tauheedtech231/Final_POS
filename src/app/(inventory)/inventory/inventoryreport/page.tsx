'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

type InventoryRecord = {
  product: string;
  sku: string;
  opening: number;
  purchases: number;
  sales: number;
  transferIn: number;
  transferOut: number;
};

export default function InventoryMovementReport() {
  const [rawData, setRawData] = useState<InventoryRecord[]>([]);
  const [filteredData, setFilteredData] = useState<InventoryRecord[]>([]);
  const [branch, setBranch] = useState('');
  const [dateRange, setDateRange] = useState('');

  // 🔄 Load data from JSON file on first render
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/data/inventoryReport.json');
        const data: InventoryRecord[] = await res.json();
        setRawData(data);
        setFilteredData(data);
      } catch (error) {
        console.error('Failed to load inventory data:', error);
      }
    };

    loadData();
  }, []);

  const applyFilters = () => {
    // ✏️ Add actual filtering logic here if needed
    setFilteredData(rawData);
  };

  const resetFilters = () => {
    setBranch('');
    setDateRange('');
    setFilteredData(rawData);
  };

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div>
        <h1 className="text-3xl font-bold">Inventory Movement Report</h1>
        <p className="text-muted-foreground">
          Track changes in stock levels across your branches.
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="date"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          />

          <Select value={branch} onValueChange={(value) => setBranch(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Main Street">Main Street</SelectItem>
              <SelectItem value="Downtown">Downtown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <Button onClick={applyFilters}>Apply Filters</Button>
          <Button onClick={resetFilters} variant="outline">
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Inventory Movement Report</h2>
        <div className="overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Opening Stock</TableHead>
                <TableHead>Purchases</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Transfers In</TableHead>
                <TableHead>Transfers Out</TableHead>
                <TableHead>Closing Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">
                    No data found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, idx) => {
                  const closing =
                    item.opening + item.purchases + item.transferIn - item.sales - item.transferOut;
                  return (
                    <TableRow key={idx}>
                      <TableCell>{item.product}</TableCell>
                      <TableCell className="text-blue-600">{item.sku}</TableCell>
                      <TableCell>{item.opening}</TableCell>
                      <TableCell>{item.purchases}</TableCell>
                      <TableCell>{item.sales}</TableCell>
                      <TableCell>{item.transferIn}</TableCell>
                      <TableCell>{item.transferOut}</TableCell>
                      <TableCell>{closing}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
