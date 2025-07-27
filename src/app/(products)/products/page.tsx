"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Barcode, 
  Plus, 
  Minus, 
  Trash2, 
  Wallet, 
  CreditCard, 
  ChevronLeft, 
  ChevronRight,
  ShoppingCart,
  Loader2
} from "lucide-react";
import supabase from "@/lib/supabaseClient";
import debounce from 'lodash.debounce';
import Image from "next/image";

// Define proper types
type Product = {
  id: number;
  name: string;
  price: number;
  
  images?: string;
  sku?: string;
  unit?: string;
  category: string;
};

type CartItem = {
  id: number;
  quantity: number;
  product?: Product;
};

const categories = [
  { id: "all", name: "All Products" },
  { id: "produce", name: "Produce" },
  { id: "dairy", name: "Dairy" },
  { id: "bakery", name: "Bakery" },
  { id: "meat", name: "Meat" },
  { id: "beverages", name: "Beverages" }
];

const TAX_RATE = 0.1; // 10% tax

// Shimmer loading component
const ProductSkeleton = () => (
  <Card className="animate-pulse">
    <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
    <CardContent className="p-3 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      <div className="h-9 bg-gray-200 rounded mt-2"></div>
    </CardContent>
  </Card>
);

export default function POS() {
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const itemsPerPage = 8;

  // Enhanced search function
const searchProducts = useMemo(
  () =>
    debounce((query: string) => {
      console.log("Searching for:", query); // optional: remove later
      setSearchLoading(false);
      // You can also trigger a search API call here
    }, 300),
  []
);

// Handle input change
const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const query = e.target.value;
  setSearchQuery(query);
  setSearchLoading(true);
  searchProducts(query);
};

  // Filter products with enhanced search
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "all" || 
      product.category.toLowerCase() === selectedCategory;
    
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  // Fetch products from supabase with proper error handling
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('products').select('*');
        console.log(data)
        
        if (error) {
          console.error("Error fetching products:", error);
          return;
        }
        
        // Ensure prices are numbers
        const processedData = data?.map(item => ({
          ...item,
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price
        })) || [];
        
        setProducts(processedData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Cart functions with proper typing
  const addToCart = (productId: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing) {
        return prev.map(item => 
          item.id === productId ? {...item, quantity: item.quantity + 1} : item
        );
      }
      return [...prev, { id: productId, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.id === productId ? {...item, quantity: newQuantity} : item
    ));
  };

  // Calculate cart items with products
  const cartItems: CartItem[] = cart.map(item => {
    const product = products.find(p => p.id === item.id);
    return { ...item, product };
  }).filter(item => item.product);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + ((item.product?.price || 0) * item.quantity);
  }, 0);

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  // Complete order function
  const completeOrder = async () => {
    if (cartItems.length === 0) return;
    
    try {
      setCart([]);
      alert("Order completed successfully!");
    } catch (error) {
      console.error("Error completing order:", error);
      alert("Failed to complete order. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between border-b">
        <h1 className="font-bold text-lg">Point of Sale</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Product Catalog */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search and Barcode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                className="pl-10 bg-white"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
              )}
            </div>
            <div className="relative">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Scan barcode" className="pl-10 bg-white" />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="overflow-x-auto">
            <div className="flex space-x-2 pb-2">
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setPage(1);
                  }}
                  className="whitespace-nowrap"
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: itemsPerPage }).map((_, index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
          ) : (
            <>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
  {paginatedProducts.map(product => {
    console.log("🖼️ Product Image:", product.images); // 👈 Print in console

    return (
      <Card key={product.id} className="hover:shadow-md transition-shadow">
        <div className="aspect-square relative overflow-hidden">
          <Image
            src={product?.images || "/Pos1.png"}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
        <CardContent className="p-3 space-y-1">
          <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
          <p className="text-sm text-gray-600">
            ${product.price.toFixed(2)}{product?.unit && `/${product?.unit}`}
          </p>
          <Button
            size="sm"
            className="w-full mt-2"
            onClick={() => addToCart(product.id)}
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </CardContent>
      </Card>
    );
  })}
</div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    {totalPages > 5 && page < totalPages - 2 && (
                      <span className="px-2">...</span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column - Cart */}
        <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Order Summary</CardTitle>
                <div className="flex items-center gap-1">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="font-medium">{cartItems.length} items</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-500">
                  <ShoppingCart className="h-10 w-10 mb-2" />
                  <p>Your cart is empty</p>
                  <p className="text-sm">Add products to get started</p>
                </div>
              ) : (
                <div className="divide-y">
                  {cartItems.map(item => (
                    <div key={item.id} className="p-4 flex items-start gap-3">
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100">
                        <Image
                          src={item.product?.images || "/Pos1.png"}
                          alt={item.product?.name || "Product Image"}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product?.name}</h4>
                        <p className="text-sm text-gray-600">
                          ${item.product?.price.toFixed(2)}
                          {item.product?.unit && `/${item.product?.unit}`}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 h-8 w-8 p-0"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <div className="border-t p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ({TAX_RATE * 100}%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-12">
                  <Wallet className="h-5 w-5 mr-2" /> Cash
                </Button>
                <Button variant="outline" className="h-12">
                  <CreditCard className="h-5 w-5 mr-2" /> Card
                </Button>
              </div>
              <Button 
                className="w-full h-12"
                onClick={completeOrder}
                disabled={cartItems.length === 0}
              >
                Complete Order
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}