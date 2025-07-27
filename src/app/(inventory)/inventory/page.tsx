"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Sparkles, Download, Brain, Search, ArrowUpDown, Loader2, BarChart2, Package, PackageCheck, PackageX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface InventoryItem {
  id: number;
  dateTime: string;
  user: string;
  type: 'In' | 'Out';
  quantity: string;
  remarks: string;
}

function AIChatModal({ 
  open, 
  onClose,
  inventory
}: {
  open: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
}) {
  const [query, setQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChat = async () => {
    if (!query.trim()) return;

    setChatResponse('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/generate-fields-from-image/analize-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: query,
          inventoryData: JSON.stringify(inventory) 
        }),
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value);
        setChatResponse((prev) => prev + chunk);
      }
    } catch (err) {
      setChatResponse('⚠️ Error talking to AI. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Inventory Assistant
          </DialogTitle>
          <DialogDescription>
            Ask natural language questions about your inventory data
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto mb-4">
          {chatResponse ? (
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 mt-0.5">
                  <AvatarImage src="/ai-avatar.png" />
                  <AvatarFallback className="bg-purple-500 text-white text-xs">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                    {chatResponse}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-8">
              <div>
                <div className="mx-auto w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                  <Brain className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">Drop Your Query</h3>
                <p className="text-sm text-muted-foreground">
  What items need restocking? or Show me recent outbound items
</p>

              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Type your question..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleChat()}
            className="flex-1"
          />
          <Button onClick={handleChat} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="ml-2">Ask</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof InventoryItem; direction: 'asc' | 'desc' } | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions'>('dashboard');
  const [showChat, setShowChat] = useState(false);

  // Fetch inventory data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsDataLoading(true);
        const response = await fetch('/data/inventoryData.json');
        const data = await response.json();
        setInventory(data);
        setFilteredInventory(data);
      } catch (error) {
        console.error('Error fetching inventory data:', error);
        setInventory([]);
        setFilteredInventory([]);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchData();
  }, []);

  // Search and filter functionality
  useEffect(() => {
    const filtered = inventory.filter(
      (item) =>
        item.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.remarks.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredInventory(filtered);
  }, [searchQuery, inventory]);

  // Sorting functionality
  const sortedInventory = React.useMemo(() => {
    const sortableItems = [...filteredInventory];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredInventory, sortConfig]);

  const requestSort = (key: keyof InventoryItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Export to CSV
  const handleExport = () => {
    try {
      const csvContent = [
        ['ID', 'DateTime', 'User', 'Type', 'Quantity', 'Remarks'],
        ...sortedInventory.map((item) => [
          item.id,
          item.dateTime,
          item.user,
          item.type,
          item.quantity,
          item.remarks,
        ]),
      ]
        .map((row) => row.join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Data exported successfully!");
    } catch (error) {
      toast.error("Failed to export data.");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Stats for dashboard
  const stats = {
    totalTransactions: inventory.length,
    inbound: inventory.filter(i => i.type === 'In').length,
    outbound: inventory.filter(i => i.type === 'Out').length,
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles />
            AI Inventory Intelligence
          </h1>
          <p className="text-muted-foreground dark:text-gray-400">
            Smart inventory management powered by artificial intelligence
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-white transition-all duration-300 hover:bg-neutral-800 active:scale-95 shadow-md"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline font-medium tracking-wide">Export Data</span>
          </Button>
          
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => setShowChat(true)}
              className="relative gap-2 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 overflow-hidden group bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Brain className="h-4 w-4 text-white" />
              </motion.div>
              <motion.span className="hidden sm:inline tracking-wide">
                AI Insights
              </motion.span>
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* AI Chat Modal */}
      <AIChatModal 
        open={showChat} 
        onClose={() => setShowChat(false)}
        inventory={inventory}
      />

      {/* Rest of your component remains the same */}
      
      {/* ... (keep all your existing navigation tabs, search bar, and content sections) ... */}
       <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="flex mb-6 border-b dark:border-gray-700"
      >
        <button
          className={`px-4 py-2 font-medium flex items-center gap-2 ${
            activeTab === 'dashboard'
              ? 'text-purple-600 border-b-2 border-purple-600 dark:text-purple-400 dark:border-purple-400'
              : 'text-muted-foreground hover:text-gray-800 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('dashboard')}
        >
          <BarChart2 className="h-4 w-4" />
          Dashboard
        </button>
        <button
          className={`px-4 py-2 font-medium flex items-center gap-2 ${
            activeTab === 'transactions'
              ? 'text-purple-600 border-b-2 border-purple-600 dark:text-purple-400 dark:border-purple-400'
              : 'text-muted-foreground hover:text-gray-800 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('transactions')}
        >
          <Package className="h-4 w-4" />
          Transactions
        </button>
      </motion.div>

  

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              
<Card className="relative overflow-hidden border-0 shadow-md bg-gray-900 hover:shadow-lg transition-shadow duration-300 rounded-2xl group">
  {/* Subtle glow effect on hover */}
  <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-purple-800/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      {/* Left section: Text */}
      <div>
        <p className="text-sm text-gray-300/80">Total Transactions</p>
        {isDataLoading ? (
          <Skeleton className="h-8 w-24 mt-2 rounded-md bg-gray-700/50" />
        ) : (
          <p className="text-3xl font-bold mt-1 text-white">
            {stats.totalTransactions}
            <span className="ml-2 text-sm font-normal text-purple-300/80">+12%</span>
          </p>
        )}
      </div>

      {/* Right section: Icon */}
      <div className="p-3 rounded-full bg-gray-700/50 backdrop-blur-sm shadow-inner transition-transform duration-300 hover:scale-110 hover:bg-purple-500/20">
        <BarChart2 className="h-6 w-6 text-purple-300" />
      </div>
    </div>

    {/* White progress bar with subtle glow */}
    <div className="mt-4">
      <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full w-3/4 bg-gradient-to-r from-white to-gray-200 rounded-full shadow-[0_0_4px_rgba(255,255,255,0.3)]"></div>
      </div>
    </div>
  </CardContent>
</Card>

<Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 hover:shadow-lg transition-all duration-300 rounded-2xl group">
  {/* Glowing accent effect */}
  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-emerald-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
  
  {/* Subtle grid pattern */}
  <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjMDAwMDAwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDVMNSAwWk02IDRMNCA2Wk0tMSAxTDEgLTFaIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMSI+PC9wYXRoPgo8L3N2Zz4=')]"></div>

  <CardContent className="p-6 relative z-10">
    <div className="flex items-center justify-between">
      {/* Text Content */}
      <div>
        <p className="text-sm text-gray-300/80">Inbound Items</p>
        {isDataLoading ? (
          <Skeleton className="h-8 w-24 mt-2 rounded-md bg-gray-700/50" />
        ) : (
          <p className="text-3xl font-bold mt-1 text-white">
            {stats.inbound}
            <span className="ml-2 text-sm font-normal text-emerald-400/80">+5.2%</span>
          </p>
        )}
      </div>

      {/* Icon with glow effect */}
      <div className="p-3 rounded-full bg-gray-700/50 backdrop-blur-sm shadow-inner transition-all duration-300 hover:scale-110 hover:bg-emerald-500/20 hover:shadow-[0_0_10px_rgba(16,185,129,0.3)]">
        <PackageCheck className="h-6 w-6 text-emerald-400" />
      </div>
    </div>

    {/* Progress indicator */}
    <div className="mt-4">
      <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full w-3/4 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
      </div>
    </div>
  </CardContent>
</Card>

<Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 hover:shadow-lg transition-all duration-300 group">
  {/* Glowing red accent on hover */}
  <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-red-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
  
  <CardContent className="p-6 relative z-10">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-300/80">Outbound Items</p>
        {isDataLoading ? (
          <Skeleton className="h-8 w-20 mt-2 rounded-md bg-gray-700/50" />
        ) : (
          <p className="text-3xl font-bold mt-1 text-white">
            {stats.outbound}
            <span className="ml-2 text-sm font-normal text-red-400/80">-3.8%</span>
          </p>
        )}
      </div>
      
      {/* Enhanced icon container with glow */}
      <div className="p-3 rounded-full bg-gray-700/50 backdrop-blur-sm shadow-inner transition-all duration-300 hover:scale-110 hover:bg-red-500/20 hover:shadow-[0_0_10px_rgba(239,68,68,0.3)]">
        <PackageX className="h-6 w-6 text-red-400" />
      </div>
    </div>

    {/* Red progress bar */}
    <div className="mt-4">
      <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full w-3/4 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.5)]"></div>
      </div>
    </div>
  </CardContent>
</Card>
            </div>

            {/* Recent Activity */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Last {Math.min(5, sortedInventory.length)} inventory transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isDataLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : sortedInventory.length > 0 ? (
                  <div className="space-y-4">
                    {sortedInventory.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                            {item.type === 'In' ? (
                              <PackageCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <PackageX className="h-5 w-5 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{item.remarks}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(item.dateTime)} • {item.user}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={item.type === 'In' ? 'default' : 'destructive'}
                          className="px-3 py-1 text-sm"
                        >
                          {item.type} {item.quantity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No inventory transactions found
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="transactions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Transactions Table */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  All inventory movements with detailed information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isDataLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => requestSort('id')}
                          >
                            <div className="flex items-center gap-1">
                              ID
                              {sortConfig?.key === 'id' && (
                                sortConfig.direction === 'asc' ? (
                                  <ArrowUpDown className="h-4 w-4 opacity-50" />
                                ) : (
                                  <ArrowUpDown className="h-4 w-4 opacity-50 rotate-180" />
                                )
                              )}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => requestSort('dateTime')}
                          >
                            <div className="flex items-center gap-1">
                              Date/Time
                              {sortConfig?.key === 'dateTime' && (
                                sortConfig.direction === 'asc' ? (
                                  <ArrowUpDown className="h-4 w-4 opacity-50" />
                                ) : (
                                  <ArrowUpDown className="h-4 w-4 opacity-50 rotate-180" />
                                )
                              )}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => requestSort('user')}
                          >
                            <div className="flex items-center gap-1">
                              User
                              {sortConfig?.key === 'user' && (
                                sortConfig.direction === 'asc' ? (
                                  <ArrowUpDown className="h-4 w-4 opacity-50" />
                                ) : (
                                  <ArrowUpDown className="h-4 w-4 opacity-50 rotate-180" />
                                )
                              )}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => requestSort('type')}
                          >
                            <div className="flex items-center gap-1">
                              Type
                              {sortConfig?.key === 'type' && (
                                sortConfig.direction === 'asc' ? (
                                  <ArrowUpDown className="h-4 w-4 opacity-50" />
                                ) : (
                                  <ArrowUpDown className="h-4 w-4 opacity-50 rotate-180" />
                                )
                              )}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => requestSort('quantity')}
                          >
                            <div className="flex items-center gap-1">
                              Quantity
                              {sortConfig?.key === 'quantity' && (
                                sortConfig.direction === 'asc' ? (
                                  <ArrowUpDown className="h-4 w-4 opacity-50" />
                                ) : (
                                  <ArrowUpDown className="h-4 w-4 opacity-50 rotate-180" />
                                )
                              )}
                            </div>
                          </TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedInventory.length > 0 ? (
                          sortedInventory.map((item) => (
                            <TableRow
                              key={item.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            >
                              <TableCell className="font-medium">{item.id}</TableCell>
                              <TableCell>{formatDate(item.dateTime)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300">
                                      {item.user
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  {item.user}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={item.type === 'In' ? 'default' : 'destructive'}
                                  className="min-w-[60px] justify-center"
                                >
                                  {item.type}
                                </Badge>
                              </TableCell>
                              <TableCell
                                className={`font-medium ${
                                  item.type === 'In'
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}
                              >
                                {item.quantity}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {item.remarks}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="h-[300px] text-center text-muted-foreground"
                            >
                              No inventory transactions found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}