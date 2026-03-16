import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Search, Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  bulkUpdateProducts,
  createProduct,
  deleteProduct,
  formatProductPrice,
  listProducts,
  Product,
  ProductStatus,
  updateProduct,
  uploadProductImage,
} from "@/lib/products";
import { Checkbox } from "@/components/ui/checkbox";

const STATUS_LABELS: Record<ProductStatus, string> = {
  active: "Active",
  draft: "Draft",
  out_of_stock: "Out of Stock",
};

const STATUS_BADGE_CLASSES: Record<ProductStatus, string> = {
  active: "bg-green-100 text-green-800",
  draft: "bg-gray-100 text-gray-800",
  out_of_stock: "bg-red-100 text-red-800",
};

const CATEGORY_PRESETS = [
  "Electrical & Lighting",
  "Safety Equipment",
  "Cleaning & Home Maintenance",
  "Paints",
  "Tools",
  "Building & Construction Materials",
  "Plumbing",
];

const CURRENCY_OPTIONS = [
  { code: "KES", label: "Kenya Shilling (KES)" },
  { code: "USD", label: "US Dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
  { code: "PHP", label: "Philippine Peso (PHP)" },
];

type ProductFormValues = {
  name: string;
  sku: string;
  category: string;
  description: string;
  compatibility: string;
  warranty: string;
  safetyInfo: string;
  price: number;
  currency: string;
  stock: number;
  status: ProductStatus;
  imageFiles: File[];
  existingImageUrls: string[];
};

type CsvValidationError = {
  row: number;
  sku: string;
  reason: string;
};

function parseCsvContent(content: string): Array<Record<string, string>> {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((entry) => entry.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((entry) => entry.trim());
    const result: Record<string, string> = {};
    headers.forEach((header, index) => {
      result[header] = values[index] ?? "";
    });
    return result;
  });
}

function triggerDownload(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const AdminProducts = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<ProductStatus | "none">("none");
  const [bulkStockDelta, setBulkStockDelta] = useState("");
  const [bulkPriceDelta, setBulkPriceDelta] = useState("");
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: () => listProducts(),
  });

  const products = productsQuery.data ?? [];

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...CATEGORY_PRESETS,
            ...products.map((product) => product.category.trim()).filter(Boolean),
          ]
        )
      ).sort((a, b) => a.localeCompare(b)),
    [products]
  );

  const filtered = useMemo(
    () =>
      products.filter((product) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          product.name.toLowerCase().includes(q) ||
          product.sku.toLowerCase().includes(q);

        const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;

        return matchesSearch && matchesCategory;
      }),
    [products, search, categoryFilter]
  );

  const invalidateProductQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: async () => {
      await invalidateProductQueries();
      setIsAddOpen(false);
      toast({ title: "Product added" });
    },
    onError: (error) => {
      toast({
        title: "Could not add product",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateProduct>[1] }) =>
      updateProduct(id, payload),
    onSuccess: async () => {
      await invalidateProductQueries();
      setEditProduct(null);
      toast({ title: "Product updated" });
    },
    onError: (error) => {
      toast({
        title: "Could not update product",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: async () => {
      await invalidateProductQueries();
      toast({ title: "Product deleted" });
    },
    onError: (error) => {
      toast({
        title: "Could not delete product",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: uploadProductImage,
    onError: (error) => {
      toast({
        title: "Image upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: bulkUpdateProducts,
    onSuccess: async (result) => {
      await invalidateProductQueries();
      setSelectedIds([]);
      setBulkStatus("none");
      setBulkStockDelta("");
      setBulkPriceDelta("");
      toast({ title: `Bulk update complete (${result.updatedCount} products)` });
    },
    onError: (error) => {
      toast({
        title: "Bulk update failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const isSaving =
    createMutation.isPending || updateMutation.isPending || uploadMutation.isPending;
  const isBulkUpdating = bulkMutation.isPending;

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleSave = async (values: ProductFormValues) => {
    let imageUrls = [...values.existingImageUrls];
    if (values.imageFiles.length > 0) {
      const uploadedUrls = await Promise.all(
        values.imageFiles.map((file) => uploadMutation.mutateAsync(file))
      );
      imageUrls = Array.from(new Set(uploadedUrls.filter(Boolean)));
    }
    const imageUrl = imageUrls[0] ?? "";

    const payload = {
      name: values.name.trim(),
      sku: values.sku.trim() || undefined,
      category: values.category.trim() || undefined,
      description: values.description.trim() || undefined,
      compatibility: values.compatibility.trim() || undefined,
      warranty: values.warranty.trim() || undefined,
      safetyInfo: values.safetyInfo.trim() || undefined,
      priceCents: Math.round(values.price * 100),
      currency: values.currency || "KES",
      stock: Math.max(0, Math.floor(values.stock)),
      status: values.status,
      imageUrl: imageUrl || undefined,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    };

    if (editProduct) {
      await updateMutation.mutateAsync({ id: editProduct.id, payload });
      return;
    }

    await createMutation.mutateAsync(payload);
  };

  const allFilteredIds = filtered.map((product) => product.id);
  const allVisibleSelected =
    allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllVisible = (checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
      return;
    }
    setSelectedIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
  };

  const toggleRowSelection = (productId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) return Array.from(new Set([...prev, productId]));
      return prev.filter((id) => id !== productId);
    });
  };

  const handleBulkApply = async () => {
    if (selectedIds.length === 0) {
      toast({ title: "Select at least one product", variant: "destructive" });
      return;
    }

    const payload: Parameters<typeof bulkUpdateProducts>[0] = { ids: selectedIds };
    if (bulkStatus !== "none") payload.setStatus = bulkStatus;
    if (bulkStockDelta.trim() !== "") {
      const value = Number(bulkStockDelta);
      if (!Number.isFinite(value)) {
        toast({ title: "Invalid stock delta", variant: "destructive" });
        return;
      }
      payload.stockDelta = Math.round(value);
    }
    if (bulkPriceDelta.trim() !== "") {
      const value = Number(bulkPriceDelta);
      if (!Number.isFinite(value)) {
        toast({ title: "Invalid price delta", variant: "destructive" });
        return;
      }
      payload.priceDeltaCents = Math.round(value * 100);
    }

    if (
      payload.setStatus === undefined &&
      payload.stockDelta === undefined &&
      payload.priceDeltaCents === undefined
    ) {
      toast({ title: "No bulk changes provided", variant: "destructive" });
      return;
    }

    await bulkMutation.mutateAsync(payload);
  };

  const handleQuickPublish = async (status: ProductStatus) => {
    if (selectedIds.length === 0) {
      toast({ title: "Select at least one product", variant: "destructive" });
      return;
    }
    await bulkMutation.mutateAsync({
      ids: selectedIds,
      setStatus: status,
    });
  };

  const handleExportCsv = () => {
    const headers = ["name", "sku", "category", "priceCents", "currency", "stock", "status", "imageUrl"];
    const rows = products.map((product) => [
      product.name,
      product.sku || "",
      product.category || "",
      String(product.priceCents),
      product.currency,
      String(product.stock),
      product.status,
      product.imageUrl || "",
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.map((item) => `"${String(item).replace(/"/g, '""')}"`).join(","))].join("\n");
    triggerDownload(`products-export-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv;charset=utf-8");
  };

  const handleImportCsv = async (file: File) => {
    const content = await file.text();
    const rows = parseCsvContent(content);
    if (rows.length === 0) {
      toast({ title: "CSV has no data rows", variant: "destructive" });
      return;
    }

    const errors: CsvValidationError[] = [];
    const validRows: Array<{
      rowNumber: number;
      name: string;
      sku: string;
      category?: string;
      priceCents: number;
      currency: string;
      stock: number;
      status: ProductStatus;
      imageUrl?: string;
    }> = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const name = row.name?.trim() || "";
      const sku = row.sku?.trim() || "";
      const status = (row.status?.trim() || "active") as ProductStatus;
      const priceCents = Number(row.priceCents);
      const stock = Number(row.stock);

      if (!name) {
        errors.push({ row: rowNumber, sku, reason: "Missing product name" });
        return;
      }
      if (!Number.isFinite(priceCents) || priceCents < 0) {
        errors.push({ row: rowNumber, sku, reason: "Invalid priceCents" });
        return;
      }
      if (!Number.isFinite(stock) || stock < 0) {
        errors.push({ row: rowNumber, sku, reason: "Invalid stock" });
        return;
      }
      if (!["active", "draft", "out_of_stock"].includes(status)) {
        errors.push({ row: rowNumber, sku, reason: "Invalid status" });
        return;
      }

      validRows.push({
        rowNumber,
        name,
        sku,
        category: row.category?.trim() || undefined,
        priceCents: Math.floor(priceCents),
        currency: (row.currency?.trim() || "KES").toUpperCase(),
        stock: Math.floor(stock),
        status,
        imageUrl: row.imageUrl?.trim() || undefined,
      });
    });

    const bySku = new Map(
      products
        .filter((entry) => entry.sku)
        .map((entry) => [entry.sku.trim().toLowerCase(), entry])
    );

    let createdCount = 0;
    let updatedCount = 0;
    for (const row of validRows) {
      try {
        const existing = row.sku ? bySku.get(row.sku.toLowerCase()) : undefined;
        if (existing) {
          await updateProduct(existing.id, {
            name: row.name,
            sku: row.sku || undefined,
            category: row.category,
            priceCents: row.priceCents,
            currency: row.currency,
            stock: row.stock,
            status: row.status,
            imageUrl: row.imageUrl,
          });
          updatedCount += 1;
        } else {
          await createProduct({
            name: row.name,
            sku: row.sku || undefined,
            category: row.category,
            priceCents: row.priceCents,
            currency: row.currency,
            stock: row.stock,
            status: row.status,
            imageUrl: row.imageUrl,
          });
          createdCount += 1;
        }
      } catch (error) {
        errors.push({
          row: row.rowNumber,
          sku: row.sku,
          reason: error instanceof Error ? error.message : "Import failed",
        });
      }
    }

    if (errors.length > 0) {
      const report = [
        "row,sku,error",
        ...errors.map((entry) => `${entry.row},"${entry.sku.replace(/"/g, '""')}","${entry.reason.replace(/"/g, '""')}"`),
      ].join("\n");
      triggerDownload(`products-import-errors-${new Date().toISOString().slice(0, 10)}.csv`, report, "text/csv;charset=utf-8");
    }

    await invalidateProductQueries();
    toast({
      title: "CSV import processed",
      description: `Created: ${createdCount}, Updated: ${updatedCount}, Errors: ${errors.length}`,
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-light text-foreground sm:text-2xl">Products</h1>
          <p className="text-sm text-muted-foreground font-light">{products.length} products total</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleImportCsv(file);
              }
              event.currentTarget.value = "";
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="rounded-none font-light text-xs"
            onClick={() => importInputRef.current?.click()}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            <Upload className="h-3 w-3 mr-1" /> Import CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-none font-light text-xs"
            onClick={handleExportCsv}
          >
            <Download className="h-3 w-3 mr-1" /> Export CSV
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="rounded-none font-light text-xs bg-foreground text-background hover:bg-foreground/90"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="!rounded-none max-h-[90vh] overflow-y-auto">
              <ProductForm
                categoryOptions={CATEGORY_PRESETS}
                onSave={handleSave}
                onCancel={() => setIsAddOpen(false)}
                isSaving={isSaving}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9 rounded-none font-light"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48 rounded-none font-light">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-border">
        <CardContent className="space-y-3 p-4">
          <p className="text-xs font-light uppercase tracking-[0.18em] text-muted-foreground">
            Bulk Operations ({selectedIds.length} selected)
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <Select value={bulkStatus} onValueChange={(value) => setBulkStatus(value as ProductStatus | "none")}>
              <SelectTrigger className="rounded-none font-light">
                <SelectValue placeholder="Set status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No status change</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={bulkStockDelta}
              onChange={(event) => setBulkStockDelta(event.target.value)}
              className="rounded-none font-light"
              placeholder="Stock delta e.g. -5"
            />
            <Input
              value={bulkPriceDelta}
              onChange={(event) => setBulkPriceDelta(event.target.value)}
              className="rounded-none font-light"
              placeholder="Price delta (currency)"
            />
            <Button
              variant="outline"
              className="rounded-none font-light"
              onClick={() => void handleQuickPublish("active")}
              disabled={isBulkUpdating || selectedIds.length === 0}
            >
              Publish
            </Button>
            <Button
              variant="outline"
              className="rounded-none font-light"
              onClick={() => void handleQuickPublish("draft")}
              disabled={isBulkUpdating || selectedIds.length === 0}
            >
              Unpublish
            </Button>
          </div>
          <Button
            className="rounded-none bg-foreground font-light text-background hover:bg-foreground/90"
            onClick={() => void handleBulkApply()}
            disabled={isBulkUpdating || selectedIds.length === 0}
          >
            {isBulkUpdating ? "Applying..." : "Apply Bulk Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={(checked) => toggleSelectAllVisible(Boolean(checked))}
                    aria-label="Select all visible products"
                  />
                </TableHead>
                <TableHead className="font-light text-xs">Product</TableHead>
                <TableHead className="font-light text-xs">SKU</TableHead>
                <TableHead className="font-light text-xs hidden md:table-cell">Category</TableHead>
                <TableHead className="font-light text-xs">Price</TableHead>
                <TableHead className="font-light text-xs">Stock</TableHead>
                <TableHead className="font-light text-xs hidden sm:table-cell">Status</TableHead>
                <TableHead className="font-light text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsQuery.isPending ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-sm font-light text-muted-foreground text-center py-10">
                    Loading products...
                  </TableCell>
                </TableRow>
              ) : productsQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-sm font-light text-destructive text-center py-10">
                    Could not load products.
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-sm font-light text-muted-foreground text-center py-10">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(product.id)}
                        onCheckedChange={(checked) => toggleRowSelection(product.id, Boolean(checked))}
                        aria-label={`Select ${product.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-sm font-light">{product.name}</TableCell>
                    <TableCell className="text-sm font-light text-muted-foreground">{product.sku || "-"}</TableCell>
                    <TableCell className="text-sm font-light text-muted-foreground hidden md:table-cell">
                      {product.category || "-"}
                    </TableCell>
                    <TableCell className="text-sm font-light">{formatProductPrice(product)}</TableCell>
                    <TableCell className={`text-sm font-light ${product.stock <= 10 ? "text-red-500" : ""}`}>
                      {product.stock}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-light ${STATUS_BADGE_CLASSES[product.status]}`}
                      >
                        {STATUS_LABELS[product.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Dialog
                          open={editProduct?.id === product.id}
                          onOpenChange={(open) => {
                            if (!open) setEditProduct(null);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setEditProduct(product)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="!rounded-none max-h-[90vh] overflow-y-auto">
                            <ProductForm
                              product={product}
                              categoryOptions={CATEGORY_PRESETS}
                              onSave={handleSave}
                              onCancel={() => setEditProduct(null)}
                              isSaving={isSaving}
                            />
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="!rounded-none">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-light">Delete Product</AlertDialogTitle>
                              <AlertDialogDescription className="font-light">
                                Are you sure you want to delete "{product.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-none font-light">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="rounded-none font-light bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => {
                                  void handleDelete(product.id);
                                }}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ProductForm = ({
  product,
  categoryOptions,
  onSave,
  onCancel,
  isSaving,
}: {
  product?: Product;
  categoryOptions: string[];
  onSave: (values: ProductFormValues) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}) => {
  const { toast } = useToast();
  const [name, setName] = useState(product?.name || "");
  const [sku, setSku] = useState(product?.sku || "");
  const [category, setCategory] = useState(
    product?.category && categoryOptions.includes(product.category) ? product.category : ""
  );
  const [description, setDescription] = useState(product?.description || "");
  const [compatibility, setCompatibility] = useState(product?.compatibility || "");
  const [warranty, setWarranty] = useState(product?.warranty || "");
  const [safetyInfo, setSafetyInfo] = useState(product?.safetyInfo || "");
  const [price, setPrice] = useState(
    product ? (product.priceCents / 100).toFixed(2) : ""
  );
  const [currency, setCurrency] = useState((product?.currency || "KES").toUpperCase());
  const [stock, setStock] = useState(product ? String(product.stock) : "0");
  const [status, setStatus] = useState<ProductStatus>(product?.status || "active");
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const existingImageUrls = useMemo(
    () => Array.from(new Set((product?.imageUrls ?? [product?.imageUrl ?? ""]).filter(Boolean))),
    [product]
  );

  const handleSubmit = async () => {
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (!name.trim()) {
      toast({ title: "Product name is required", variant: "destructive" });
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      toast({ title: "Price must be 0 or higher", variant: "destructive" });
      return;
    }

    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      toast({ title: "Stock must be 0 or higher", variant: "destructive" });
      return;
    }

    try {
      await onSave({
        name,
        sku,
        category,
        description,
        compatibility,
        warranty,
        safetyInfo,
        price: parsedPrice,
        currency,
        stock: parsedStock,
        status,
        imageFiles,
        existingImageUrls,
      });
    } catch {
      // Errors are surfaced by mutation handlers in the parent component.
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-light text-xl">{product ? "Edit Product" : "Add Product"}</DialogTitle>
        <DialogDescription className="font-light text-sm text-muted-foreground">
          Configure product details, pricing, inventory, and images.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="font-light">Name</Label>
          <Input value={name} onChange={(event) => setName(event.target.value)} className="rounded-none font-light" />
        </div>

        <div className="space-y-2">
          <Label className="font-light">SKU</Label>
          <Input value={sku} onChange={(event) => setSku(event.target.value)} className="rounded-none font-light" />
        </div>

        <div className="space-y-2">
          <Label className="font-light">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="rounded-none font-light">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="font-light">Description</Label>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="rounded-none font-light min-h-20"
          />
        </div>

        <div className="space-y-2">
          <Label className="font-light">Compatibility</Label>
          <Textarea
            value={compatibility}
            onChange={(event) => setCompatibility(event.target.value)}
            className="rounded-none font-light min-h-20"
            placeholder="e.g. Fits 1/2 in fittings and standard PVC couplings"
          />
        </div>

        <div className="space-y-2">
          <Label className="font-light">Warranty</Label>
          <Textarea
            value={warranty}
            onChange={(event) => setWarranty(event.target.value)}
            className="rounded-none font-light min-h-20"
            placeholder="e.g. 12-month replacement for manufacturing defects"
          />
        </div>

        <div className="space-y-2">
          <Label className="font-light">Safety Info</Label>
          <Textarea
            value={safetyInfo}
            onChange={(event) => setSafetyInfo(event.target.value)}
            className="rounded-none font-light min-h-20"
            placeholder="e.g. Wear gloves during installation; keep out of reach of children"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-light">Price</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="rounded-none font-light"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-light">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="rounded-none font-light">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-light">Stock Qty</Label>
            <Input
              type="number"
              min="0"
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              className="rounded-none font-light"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-light">Status</Label>
          <Select value={status} onValueChange={(value: ProductStatus) => setStatus(value)}>
            <SelectTrigger className="rounded-none font-light">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="font-light">Product Images</Label>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              const files = event.target.files ? Array.from(event.target.files) : [];
              setImageFiles(files);
            }}
            className="rounded-none font-light"
          />
          <p className="text-xs text-muted-foreground">You can choose multiple images at once.</p>
          {imageFiles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {imageFiles.map((file) => (
                <p key={`${file.name}-${file.lastModified}`} className="text-xs text-muted-foreground">
                  {file.name}
                </p>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(existingImageUrls.length > 0 ? existingImageUrls : ["/placeholder.svg"]).map((url, index) => (
                <img
                  key={`${url}-${index}`}
                  src={url}
                  alt={`${product?.name ?? "Product"} image ${index + 1}`}
                  className="h-20 w-20 object-cover border border-border"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" className="rounded-none font-light" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          className="rounded-none font-light bg-foreground text-background hover:bg-foreground/90"
          onClick={() => {
            void handleSubmit();
          }}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : product ? "Save Changes" : "Add Product"}
        </Button>
      </DialogFooter>
    </>
  );
};

export default AdminProducts;
