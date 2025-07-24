"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { MoreVertical, PlusCircle, Search, RotateCcw, Trash2, Edit, Check, X } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import supabase from "@/lib/supabaseClient";

const initialFilters = {
  search: "",
  category: "all",
  stockStatus: "all",
  supplier: "all",
};

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  supplier: string;
};

// Shimmer loading component for table rows
const TableRowSkeleton = () => (
  <tr className="border-b border-border/50">
    {[...Array(6)].map((_, i) => (
      <td key={i} className="p-4 align-middle">
        <div className="h-6 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
      </td>
    ))}
  </tr>
);

const ProductsTable = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editValues, setEditValues] = useState({
    name: "",
    price: 0,
    stock: 0,
    category: "",
    supplier: "",
  });

  const handleReset = () => {
    setFilters(initialFilters);
    toast.success("Filters reset successfully");
  };

const handleDelete = async (id: string) => {
  toast.promise(
    (async () => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(products.filter((p) => p.id !== id));
    })(),
    {
      loading: "Deleting product...",
      success: "Product deleted successfully!",
      error: "Failed to delete product",
    }
  );
};


  useEffect(() => {
    const getProducts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        toast.error("Failed to load products");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    getProducts();
  }, []);

  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setEditValues({
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category,
      supplier: product.supplier,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({
      name: "",
      price: 0,
      stock: 0,
      category: "",
      supplier: "",
    });
  };

const saveEditing =async (id: string) =>{
  toast.promise(
    (async () => {
      const { error } = await supabase
        .from('products')
        .update({
          name: editValues.name,
          price: editValues.price,
          stock: editValues.stock,
          category: editValues.category,
          supplier: editValues.supplier,
        })
        .eq('id', id);

      if (error) throw error;

      setProducts(products.map((p) => (p.id === id ? { ...p, ...editValues } : p)));
      setEditingId(null);
      setEditValues({
        name: "",
        price: 0,
        stock: 0,
        category: "",
        supplier: "",
      });
    })(),
    {
      loading: "Saving changes...",
      success: "Product updated successfully!",
      error: "Failed to update product",
    }
  );
}
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory = filters.category !== "all" ? product.category === filters.category : true;
    const matchesStock =
      filters.stockStatus === "in"
        ? product.stock > 10
        : filters.stockStatus === "low"
        ? product.stock > 0 && product.stock <= 10
        : filters.stockStatus === "out"
        ? product.stock === 0
        : true;
    const matchesSupplier = filters.supplier !== "all" ? product.supplier === filters.supplier : true;

    return matchesSearch && matchesCategory && matchesStock && matchesSupplier;
  });

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (stock <= 10) {
      return <Badge variant="outline">Low Stock</Badge>;
    } else {
      return <Badge variant="outline">In Stock</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Product Inventory
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {isLoading ? "Loading..." : `${filteredProducts.length} products found`}
                </p>
              </div>
              <Link href="/products/allproducts/addproduct">
                <Button className="shadow-md hover:shadow-lg transition-shadow">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-9"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </motion.div>

              <Select
                value={filters.category}
                onValueChange={(val) => setFilters({ ...filters, category: val })}
              >
                <SelectTrigger className="hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Produce">Produce</SelectItem>
                  <SelectItem value="Dairy">Dairy</SelectItem>
                  <SelectItem value="Bakery">Bakery</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.stockStatus}
                onValueChange={(val) => setFilters({ ...filters, stockStatus: val })}
              >
                <SelectTrigger className="hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="All Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock Status</SelectItem>
                  <SelectItem value="in">In Stock</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.supplier}
                onValueChange={(val) => setFilters({ ...filters, supplier: val })}
              >
                <SelectTrigger className="hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {!isLoading && Array.from(new Set(products.map(p => p.supplier))).map(supplier => (
                    <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={handleReset}
                className="hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>

            <div className="rounded-lg border border-border/50 overflow-hidden">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b border-border/50">
                    <tr className="border-b transition-colors hover:bg-muted/10">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        SKU
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Price
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Stock
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Category
                      </th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    <AnimatePresence>
                      {isLoading ? (
                        [...Array(5)].map((_, i) => (
                          <TableRowSkeleton key={`skeleton-${i}`} />
                        ))
                      ) : filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                          <motion.tr
                            key={product.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ duration: 0.3 }}
                            className={`border-b border-border/50 transition-colors ${editingId === product.id ? "bg-primary/5" : "hover:bg-muted/10"}`}
                          >
                            {editingId === product.id ? (
                              <>
                                <td className="p-4 align-middle">
                                  <Input
                                    value={editValues.name}
                                    onChange={(e) => setEditValues({...editValues, name: e.target.value})}
                                    className="h-8"
                                  />
                                </td>
                                <td className="p-4 align-middle text-muted-foreground">
                                  {product.sku}
                                </td>
                                <td className="p-4 align-middle">
                                  <Input
                                    type="number"
                                    value={editValues.price}
                                    onChange={(e) => setEditValues({...editValues, price: Number(e.target.value)})}
                                    className="h-8"
                                  />
                                </td>
                                <td className="p-4 align-middle">
                                  <Input
                                    type="number"
                                    value={editValues.stock}
                                    onChange={(e) => setEditValues({...editValues, stock: Number(e.target.value)})}
                                    className="h-8"
                                  />
                                </td>
                                <td className="p-4 align-middle">
                                  <Select
                                    value={editValues.category}
                                    onValueChange={(val) => setEditValues({...editValues, category: val})}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Produce">Produce</SelectItem>
                                      <SelectItem value="Dairy">Dairy</SelectItem>
                                      <SelectItem value="Bakery">Bakery</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="p-4 align-middle text-right space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEditing}
                                    className="h-8 w-8 p-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => saveEditing(product.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-4 align-middle font-medium">
                                  <motion.div whileHover={{ x: 2 }}>
                                    {product.name}
                                  </motion.div>
                                </td>
                                <td className="p-4 align-middle text-muted-foreground">
                                  {product.sku}
                                </td>
                                <td className="p-4 align-middle">
                                  ${product.price.toFixed(2)}
                                </td>
                                <td className="p-4 align-middle">
                                  <div className="flex items-center gap-2">
                                    {getStockBadge(product.stock)}
                                    <span className="text-muted-foreground text-sm">
                                      ({product.stock} units)
                                    </span>
                                  </div>
                                </td>
                                <td className="p-4 align-middle">
                                  <Badge variant="outline">{product.category}</Badge>
                                </td>
                                <td className="p-4 align-middle text-right">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                        <span className="sr-only">More</span>
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent 
                                      className="w-40 p-2" 
                                      align="end"
                                      sideOffset={8}
                                    >
                                      <Button
                                        variant="ghost"
                                        className="w-full justify-start text-sm px-2 hover:bg-primary/10 hover:text-primary"
                                        onClick={() => startEditing(product)}
                                      >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        className="w-full justify-start text-sm text-destructive px-2 hover:bg-destructive/10"
                                        onClick={() => handleDelete(product.id)}
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </Button>
                                    </PopoverContent>
                                  </Popover>
                                </td>
                              </>
                            )}
                          </motion.tr>
                        ))
                      ) : (
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <td className="p-8 text-center text-muted-foreground" colSpan={6}>
                            No products found matching your criteria.
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ProductsTable;