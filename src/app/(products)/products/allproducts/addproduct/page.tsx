"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { UploadCloud, Plus, Trash2, Loader2, Sparkles, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import Image from "next/image";
import { toast } from "react-toastify";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabaseClient";

interface Product {
  name: string;
  sku: string;
  price: string;
  description: string;
  category: string;
  supplier: string;
  images: File[];
}

interface Option {
  value: string;
  label: string;
}

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  required?: boolean;
  error?: string;
}

interface ImageUploadProps {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  isAnalyzing?: boolean;
  progress?: number;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const AddProductPage = () => {
  const [product, setProduct] = useState<Product>({
    name: "",
    sku: "",
    price: "",
    description: "",
    category: "",
    supplier: "",
    images: [],
  });
  const router = useRouter();

  const [categories, setCategories] = useState<Option[]>([
    { value: "produce", label: "Produce" },
    { value: "dairy", label: "Dairy" },
    { value: "bakery", label: "Bakery" },
    { value: "meat", label: "Meat" },
  ]);

  const suppliers: Option[] = [
    { value: "freshfarm", label: "FreshFarm" },
    { value: "greendairy", label: "GreenDairy" },
    { value: "bakershub", label: "BakersHub" },
  ];

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [aiFields, setAiFields] = useState<Partial<Product>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showAIConfetti, setShowAIConfetti] = useState(false);

  useEffect(() => {
    return () => {
      previewImages.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewImages]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isAnalyzing) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 300);
    }
    
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!product.name.trim()) newErrors.name = "Product name is required";
    if (!product.sku.trim()) newErrors.sku = "SKU is required";
    if (!product.price) newErrors.price = "Price is required";
    if (isNaN(Number(product.price))) newErrors.price = "Price must be a number";
    if (!product.category) newErrors.category = "Category is required";
    if (!product.supplier) newErrors.supplier = "Supplier is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    
    const validFiles = files.filter(file => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error("Invalid file type. Only JPEG, PNG, and WEBP are allowed.");
        return false;
      }
      
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File too large");
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    setProduct(prev => ({ ...prev, images: [...prev.images, ...validFiles] }));

    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...newPreviews]);

    const firstImage = validFiles[0];
    if (firstImage) {
      setIsAnalyzing(true);
      setProgress(0);
      setShowAIConfetti(false);
      
      const toastId = toast.loading("Analyzing image with AI...")
      
      setTimeout(async () => {
        try {
          const formData = new FormData();
          formData.append("image", firstImage);
          const res = await fetch("/api/generate-fields-from-image", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (!res.ok) throw new Error("AI processing failed");
          const lines = data.result.split("\n");
          const values: Record<string, string> = {};
          lines.forEach((line: string) => {
            const [key, value] = line.split(":");
            if (key && value) {
              const trimmedKey = key.trim().toLowerCase();
              let trimmedValue = value.trim();

              if (trimmedKey === "price") {
                const numericValue = trimmedValue.match(/\d+(\.\d+)?/);
                trimmedValue = numericValue ? numericValue[0] : "";
              }

              values[trimmedKey] = trimmedValue;
            }
          });
          
          const mockResponse = {
            name: values.name || "Organic Apples",
            price: values.price,
            category: values.category || "produce",
            description: values.description || "Fresh organic apples from local farms",
            sku: values.sku || "APL-ORG-001"
          };
          
          setAiFields(mockResponse);
          setConfirmDialogOpen(true);
          setShowAIConfetti(true);
          toast.dismiss(toastId);
          toast.success("AI analysis completed");
        } catch (error) {
          console.error("AI auto-fill failed", error);
          toast.dismiss(toastId);
          toast.error("AI analysis failed");
        } finally {
          setIsAnalyzing(false);
          setProgress(100);
        }
      }, 2500);
    }
  };

  const applyAiFields = () => {
    if (!aiFields) return;

    setProduct(prev => ({
      ...prev,
      name: aiFields.name || prev.name,
      price: aiFields.price || prev.price,
      category: aiFields.category || prev.category,
      description: aiFields.description || prev.description,
      sku: aiFields.sku || prev.sku,
    }));

    if (aiFields.category && !categories.some(cat => cat.value === aiFields.category?.toLowerCase())) {
      const newCategory = {
        value: aiFields.category.toLowerCase(),
        label: aiFields.category,
      };
      setCategories(prev => [...prev, newCategory]);
    }

    setConfirmDialogOpen(false);
    toast.success("AI fields applied successfully");
  };

  const removeImage = (index: number) => {
    const newImages = [...product.images];
    newImages.splice(index, 1);
    setProduct({ ...product, images: newImages });

    const newPreviews = [...previewImages];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviewImages(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const imageFile = product?.images[0];
    let imgUrl = "";
    
    if (imageFile) {
      const file_path = `products/${Date.now()}_${imageFile.name}`;
      const { error } = await supabase.storage
        .from('images')
        .upload(file_path, imageFile);
      
      if (error) {
        toast.error("Image upload failed");
      } else {
        imgUrl = `${supabase.storage.from('images').getPublicUrl(file_path).data.publicUrl}`;
      }
    }

    const newProducts = {
      name: product.name,
      sku: product.sku,
      price: product.price,
      description: product.description,
      category: product.category,
      supplier: product.supplier,
      images: imgUrl
    };

    if (!validateForm()) {
      toast.error("Please fix the errors in the form before submitting.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const {  error } = await supabase
        .from('products')
        .insert([newProducts]);
      
      if (error) {
        toast.error("Failed to add product");
      } else {
        toast.success("Product added successfully!");
        setTimeout(() => {
          router.push("/products/allproducts");
        }, 1000);
        
        setProduct({
          name: "",
          sku: "",
          price: "",
          description: "",
          category: "",
          supplier: "",
          images: [],
        });
        setPreviewImages([]);
        setErrors({});
      }
    } catch (error) {
      toast.error(`Failed to add product. Please try again ${error}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {showAIConfetti && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}vw`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                borderRadius: '50%',
              }}
            />
          ))}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Add Product</h1>
          <p className="text-sm text-muted-foreground">
            Fill in the product details below
          </p>
        </div>
        <Button 
          type="submit" 
          form="product-form"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Save Product
            </>
          )}
        </Button>
      </div>

      <form
        id="product-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Enter the basic details about your product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InputField 
                label="Name" 
                value={product.name} 
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                required
                error={errors.name}
                className="w-full border-b-2 border-gray-300 bg-transparent focus:border-blue-600 focus:outline-none placeholder:text-gray-400 text-base px-1 py-2 transition-all duration-300"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField 
                  label="SKU" 
                  value={product.sku} 
                  onChange={(e) => setProduct({ ...product, sku: e.target.value })}
                  required
                  error={errors.sku}
                />
                <InputField 
                  label="Price" 
                  type="number" 
                  value={product.price} 
                  onChange={(e) => setProduct({ ...product, price: e.target.value })}
                  required
                  error={errors.price}
                />
              </div>
              
              <InputField 
                label="Description" 
                value={product.description} 
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField 
                  label="Category" 
                  value={product.category} 
                  onChange={(value) => setProduct({ ...product, category: value })}
                  options={categories}
                  required
                  error={errors.category}
                />
                <SelectField 
                  label="Supplier" 
                  value={product.supplier} 
                  onChange={(value) => setProduct({ ...product, supplier: value })}
                  options={suppliers}
                  required
                  error={errors.supplier}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Product Images</CardTitle>
                  <CardDescription>
                    Upload high-quality images of your product (max 5MB each)
                  </CardDescription>
                </div>
                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    <span>AI Analyzing</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ImageUpload 
                onChange={handleImageUpload} 
                disabled={isAnalyzing}
                isAnalyzing={isAnalyzing}
                progress={progress}
              />
              
              {isAnalyzing && (
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Extracting product details...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
              
              {previewImages.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">
                    Uploaded Images ({previewImages.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {previewImages.map((preview, index) => (
                      <div key={index} className="relative group">
                        <div className="relative h-24 w-full rounded-md overflow-hidden border">
                          <Image
                            src={preview}
                            alt={`Product preview ${index + 1}`}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 hover:bg-red-500 text-white"
                          onClick={() => removeImage(index)}
                          type="button"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Inventory History</CardTitle>
              <CardDescription>
                Recent inventory changes for similar products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 font-medium text-left">Date</th>
                      <th className="p-3 font-medium text-left">Action</th>
                      <th className="p-3 font-medium text-left">Qty</th>
                      <th className="p-3 font-medium text-left">User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted">
                    {[
                      { date: "2024-01-15", action: "Added", quantity: 100, user: "Emily Carter" },
                      { date: "2024-01-20", action: "Sold", quantity: -20, user: "System" },
                      { date: "2024-02-05", action: "Adjusted", quantity: 10, user: "Emily Carter" },
                      { date: "2024-02-10", action: "Sold", quantity: -30, user: "System" },
                    ].map((record, index) => (
                      <tr key={index}>
                        <td className="p-3">{record.date}</td>
                        <td className="p-3">{record.action}</td>
                        <td className={`p-3 font-medium ${
                          record.quantity > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {record.quantity > 0 ? `+${record.quantity}` : record.quantity}
                        </td>
                        <td className="p-3">{record.user}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <DialogTitle>AI Suggestions Detected</DialogTitle>
            </div>
            <CardDescription>
              We found these product details in your image. Would you like to apply them?
            </CardDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {aiFields.name && (
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Name:</span>
                <span className="text-sm font-medium">{aiFields.name}</span>
              </div>
            )}
            {aiFields.sku && (
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">SKU:</span>
                <span className="text-sm font-medium">{aiFields.sku}</span>
              </div>
            )}
            {aiFields.price && (
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Price:</span>
                <span className="text-sm font-medium">PKR {aiFields.price}</span>
              </div>
            )}
            {aiFields.category && (
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Category:</span>
                <span className="text-sm font-medium capitalize">{aiFields.category}</span>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialogOpen(false)}
            >
              Keep My Data
            </Button>
            <Button 
              onClick={applyAiFields}
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Apply AI Suggestions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  value, 
  onChange, 
  type = "text", 
  required = false,
  error,
  className = ""
}) => (
  <div className="space-y-2">
    <label className="text-sm font-medium">
      {label} {required && <span className="text-destructive">*</span>}
    </label>
    <div className="relative">
      <Input 
        type={type}
        value={value} 
        onChange={onChange}
        className={`
          w-full px-4 py-2 rounded-lg border-2 
          focus:ring-2 focus:ring-primary/50 hover:border-blue-300 focus:border-primary 
          transition-all duration-200
          bg-background text-foreground
          ${error ? "border-destructive" : "border-gray-300 dark:border-gray-600"}
          ${className}
        `}
      />
      {error && (
        <svg 
          className="absolute right-3 top-2.5 h-5 w-5 text-destructive"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
    </div>
    {error && (
      <p className="text-sm text-destructive flex items-center gap-1">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {error}
      </p>
    )}
  </div>
);

const SelectField: React.FC<SelectFieldProps> = ({ 
  label, 
  value, 
  onChange, 
  options, 
  required = false,
  error 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-1">
        {label} 
        {required && <span className="text-destructive">*</span>}
      </label>
      
      <Select 
        value={value} 
        onValueChange={onChange}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger 
          className={`
            w-full px-4 py-3 rounded-lg border-2
            transition-all duration-200 ease-in-out
            hover:border-primary/50
            focus:ring-2 focus:ring-primary/30 focus:border-primary
            ${error ? "border-destructive" : "border-gray-300 dark:border-gray-600"}
            ${isOpen ? "ring-2 ring-primary/30 border-primary" : ""}
            flex items-center justify-between
          `}
        >
          <SelectValue 
            placeholder={
              <span className="text-muted-foreground">
                Select {label.toLowerCase()}
              </span>
            } 
          />
          <ChevronDown 
            className={`
              h-4 w-4 ml-2 transition-transform duration-200
              ${isOpen ? "transform rotate-180" : ""}
              ${error ? "text-destructive" : "text-muted-foreground"}
            `}
          />
        </SelectTrigger>
        
        <SelectContent 
          className={`
            mt-1 rounded-lg border border-gray-200 dark:border-gray-700
            shadow-lg overflow-hidden animate-in fade-in-80
            bg-background z-50
          `}
        >
          {options.map((opt) => (
            <SelectItem 
              key={opt.value} 
              value={opt.value}
              className={`
                px-4 py-2 transition-colors duration-150
                hover:bg-primary/10 focus:bg-primary/10
                cursor-pointer
              `}
            >
              <div className="flex items-center gap-2">
                <span>{opt.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1 mt-1">
          <svg 
            className="h-4 w-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onChange, 
  disabled,
  isAnalyzing,
  progress 
}) => (
  <label className={`
    relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg 
    cursor-pointer bg-muted/50 hover:bg-muted transition-colors overflow-hidden
    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
    ${isAnalyzing ? "border-primary/50" : "border-border"}
  `}>
    {isAnalyzing && (
      <div 
        className="absolute bottom-0 left-0 h-1 bg-primary/20 transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    )}
    
    <div className={`flex flex-col items-center justify-center pt-5 pb-6 transition-opacity ${isAnalyzing ? "opacity-70" : ""}`}>
      {isAnalyzing ? (
        <div className="flex flex-col items-center">
          <div className="relative">
            <UploadCloud className="w-8 h-8 mb-3 text-primary" />
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500 animate-pulse" />
          </div>
          <p className="mb-2 text-sm text-primary font-medium">
            Analyzing with AI...
          </p>
        </div>
      ) : (
        <>
          <UploadCloud className="w-8 h-8 mb-3 text-muted-foreground" />
          <p className="mb-2 text-sm text-muted-foreground">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">JPEG, PNG, WEBP (MAX. 5MB each)</p>
        </>
      )}
    </div>
    <input 
      type="file" 
      className="hidden" 
      multiple 
      accept="image/jpeg,image/png,image/webp" 
      onChange={onChange}
      disabled={disabled}
    />
  </label>
);

export default AddProductPage;