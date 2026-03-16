import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Package,
  ArrowDown,
  ArrowUp,
  History,
  Settings2,
  Building2,
} from "lucide-react";
import { listProducts } from "@/lib/products";
import {
  createStockMovement,
  getInventoryOverview,
  InventoryMovement,
  listStockMovements,
  listSuppliers,
  updateProductInventorySettings,
} from "@/lib/inventory";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TabKey = "alerts" | "movements" | "suppliers";

const movementTypeLabel: Record<InventoryMovement["movementType"], string> = {
  in: "Stock In",
  out: "Stock Out",
  adjustment: "Adjustment",
};

const AdminInventory = () => {
  const [tab, setTab] = useState<TabKey>("alerts");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [movementType, setMovementType] = useState<InventoryMovement["movementType"]>("adjustment");
  const [movementQty, setMovementQty] = useState("1");
  const [movementReason, setMovementReason] = useState("");
  const [configProductId, setConfigProductId] = useState<string | null>(null);
  const [reorderThreshold, setReorderThreshold] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierLeadTimeDays, setSupplierLeadTimeDays] = useState("7");
  const [supplierSku, setSupplierSku] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const overviewQuery = useQuery({
    queryKey: ["inventory-overview"],
    queryFn: getInventoryOverview,
  });

  const movementsQuery = useQuery({
    queryKey: ["inventory-movements"],
    queryFn: () => listStockMovements(),
  });

  const suppliersQuery = useQuery({
    queryKey: ["inventory-suppliers"],
    queryFn: listSuppliers,
  });

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: () => listProducts(),
  });

  const createMovementMutation = useMutation({
    mutationFn: createStockMovement,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["inventory-overview"] });
      await queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      setMovementQty("1");
      setMovementReason("");
      toast({ title: "Stock movement recorded" });
    },
    onError: (error) => {
      toast({
        title: "Could not record stock movement",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: Parameters<typeof updateProductInventorySettings>[1];
    }) => updateProductInventorySettings(productId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["inventory-overview"] });
      await queryClient.invalidateQueries({ queryKey: ["inventory-suppliers"] });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      setConfigProductId(null);
      toast({ title: "Inventory settings updated" });
    },
    onError: (error) => {
      toast({
        title: "Could not update inventory settings",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const summary = overviewQuery.data?.summary ?? {
    totalProducts: 0,
    outOfStock: 0,
    lowStock: 0,
    totalSuppliers: 0,
    activeSuppliers: 0,
  };
  const lowStockItems = overviewQuery.data?.lowStockItems ?? [];
  const recentMovements = useMemo(
    () => movementsQuery.data ?? overviewQuery.data?.recentMovements ?? [],
    [movementsQuery.data, overviewQuery.data?.recentMovements]
  );
  const products = productsQuery.data ?? [];

  const openConfig = (productId: string) => {
    const product = products.find((entry) => entry.id === productId);
    setConfigProductId(productId);
    setReorderThreshold(String(product?.reorderThreshold ?? 10));
    setSupplierName("");
    setSupplierEmail("");
    setSupplierPhone("");
    setSupplierLeadTimeDays("7");
    setSupplierSku("");
  };

  const submitStockMovement = async () => {
    if (!selectedProductId) return;
    const quantity = Number(movementQty);
    if (!Number.isFinite(quantity) || quantity === 0) {
      toast({ title: "Quantity cannot be zero", variant: "destructive" });
      return;
    }
    await createMovementMutation.mutateAsync({
      productId: selectedProductId,
      movementType,
      quantity,
      reason: movementReason || undefined,
    });
  };

  const submitInventorySettings = async () => {
    if (!configProductId) return;
    const threshold = Number(reorderThreshold);
    if (!Number.isFinite(threshold) || threshold < 0) {
      toast({ title: "Invalid reorder threshold", variant: "destructive" });
      return;
    }

    const payload: Parameters<typeof updateProductInventorySettings>[1] = {
      reorderThreshold: Math.floor(threshold),
    };

    if (supplierName.trim()) {
      payload.supplier = {
        name: supplierName.trim(),
        email: supplierEmail.trim() || undefined,
        phone: supplierPhone.trim() || undefined,
        leadTimeDays: Number(supplierLeadTimeDays) || undefined,
        supplierSku: supplierSku.trim() || undefined,
        preferred: true,
      };
    }

    await updateSettingsMutation.mutateAsync({
      productId: configProductId,
      payload,
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-light text-foreground sm:text-2xl">Inventory & Stock</h1>
        <p className="text-sm text-muted-foreground font-light">
          Threshold alerts, supplier mapping, and stock movement controls.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border border-border">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-light text-muted-foreground">Total Products</span>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-light">{summary.totalProducts}</p>
          </CardContent>
        </Card>
        <Card className="border border-red-200 bg-red-50/50">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-light text-red-600">Low Stock</span>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-2xl font-light text-red-700">{summary.lowStock}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-light text-muted-foreground">Out of Stock</span>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-light">{summary.outOfStock}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-light text-muted-foreground">Suppliers</span>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-light">{summary.totalSuppliers}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-light text-muted-foreground">Active Suppliers</span>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-light">{summary.activeSuppliers}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={tab === "alerts" ? "default" : "outline"}
          size="sm"
          className="rounded-none font-light text-xs"
          onClick={() => setTab("alerts")}
        >
          <AlertTriangle className="mr-1 h-3 w-3" /> Low Stock Alerts
        </Button>
        <Button
          variant={tab === "movements" ? "default" : "outline"}
          size="sm"
          className="rounded-none font-light text-xs"
          onClick={() => setTab("movements")}
        >
          <History className="mr-1 h-3 w-3" /> Stock Movements
        </Button>
        <Button
          variant={tab === "suppliers" ? "default" : "outline"}
          size="sm"
          className="rounded-none font-light text-xs"
          onClick={() => setTab("suppliers")}
        >
          <Building2 className="mr-1 h-3 w-3" /> Supplier Mapping
        </Button>
      </div>

      {tab === "alerts" && (
        <Card className="border border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[860px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-light">Product</TableHead>
                    <TableHead className="text-xs font-light">SKU</TableHead>
                    <TableHead className="text-xs font-light">Stock</TableHead>
                    <TableHead className="text-xs font-light">Reorder Threshold</TableHead>
                    <TableHead className="text-xs font-light">Updated</TableHead>
                    <TableHead className="text-right text-xs font-light">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overviewQuery.isPending ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-sm font-light text-muted-foreground">
                        Loading inventory alerts...
                      </TableCell>
                    </TableRow>
                  ) : lowStockItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-sm font-light text-muted-foreground">
                        No low stock items.
                      </TableCell>
                    </TableRow>
                  ) : (
                    lowStockItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm font-light">{item.name}</TableCell>
                        <TableCell className="text-sm font-light text-muted-foreground">{item.sku || "-"}</TableCell>
                        <TableCell className="text-sm font-light text-red-600">{item.stock}</TableCell>
                        <TableCell className="text-sm font-light">{item.reorderThreshold}</TableCell>
                        <TableCell className="text-sm font-light text-muted-foreground">
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openConfig(item.id)}
                          >
                            <Settings2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "movements" && (
        <div className="space-y-4">
          <Card className="border border-border">
            <CardContent className="space-y-4 p-5">
              <p className="text-sm font-light text-muted-foreground">Record a stock movement</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs font-light">Product</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger className="rounded-none font-light">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-light">Type</Label>
                  <Select
                    value={movementType}
                    onValueChange={(value) => setMovementType(value as InventoryMovement["movementType"])}
                  >
                    <SelectTrigger className="rounded-none font-light">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Stock In</SelectItem>
                      <SelectItem value="out">Stock Out</SelectItem>
                      <SelectItem value="adjustment">Adjustment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-light">Quantity</Label>
                  <Input
                    value={movementQty}
                    onChange={(event) => setMovementQty(event.target.value)}
                    className="rounded-none font-light"
                    placeholder="1"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-light">Reason</Label>
                  <Input
                    value={movementReason}
                    onChange={(event) => setMovementReason(event.target.value)}
                    className="rounded-none font-light"
                    placeholder="Manual correction"
                  />
                </div>
              </div>
              <Button
                className="rounded-none bg-foreground font-light text-background hover:bg-foreground/90"
                onClick={() => void submitStockMovement()}
                disabled={createMovementMutation.isPending || !selectedProductId}
              >
                {createMovementMutation.isPending ? "Saving..." : "Record Movement"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[920px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-light">Date</TableHead>
                      <TableHead className="text-xs font-light">Product</TableHead>
                      <TableHead className="text-xs font-light">Type</TableHead>
                      <TableHead className="text-xs font-light">Qty</TableHead>
                      <TableHead className="text-xs font-light">Prev Stock</TableHead>
                      <TableHead className="text-xs font-light">Next Stock</TableHead>
                      <TableHead className="text-xs font-light">Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movementsQuery.isPending ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center text-sm font-light text-muted-foreground">
                          Loading stock movement history...
                        </TableCell>
                      </TableRow>
                    ) : recentMovements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center text-sm font-light text-muted-foreground">
                          No stock movement records yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentMovements.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm font-light text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm font-light">{log.productName}</TableCell>
                          <TableCell>
                            <span
                              className={`flex items-center gap-1 text-xs font-light ${
                                log.movementType === "in"
                                  ? "text-green-600"
                                  : log.movementType === "out"
                                  ? "text-red-500"
                                  : "text-yellow-600"
                              }`}
                            >
                              {log.movementType === "in" ? <ArrowDown className="h-3 w-3" /> : null}
                              {log.movementType === "out" ? <ArrowUp className="h-3 w-3" /> : null}
                              {movementTypeLabel[log.movementType]}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm font-light">{log.quantity}</TableCell>
                          <TableCell className="text-sm font-light">{log.previousStock}</TableCell>
                          <TableCell className="text-sm font-light">{log.nextStock}</TableCell>
                          <TableCell className="text-sm font-light text-muted-foreground">{log.reason || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "suppliers" && (
        <Card className="border border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[860px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-light">Supplier</TableHead>
                    <TableHead className="text-xs font-light">Email</TableHead>
                    <TableHead className="text-xs font-light">Phone</TableHead>
                    <TableHead className="text-xs font-light">Lead Time (days)</TableHead>
                    <TableHead className="text-xs font-light">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliersQuery.isPending ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-sm font-light text-muted-foreground">
                        Loading suppliers...
                      </TableCell>
                    </TableRow>
                  ) : (suppliersQuery.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-sm font-light text-muted-foreground">
                        No suppliers mapped yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (suppliersQuery.data ?? []).map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="text-sm font-light">{supplier.name}</TableCell>
                        <TableCell className="text-sm font-light text-muted-foreground">
                          {supplier.email || "-"}
                        </TableCell>
                        <TableCell className="text-sm font-light text-muted-foreground">
                          {supplier.phone || "-"}
                        </TableCell>
                        <TableCell className="text-sm font-light">{supplier.leadTimeDays}</TableCell>
                        <TableCell>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-light ${
                              supplier.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {supplier.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(configProductId)} onOpenChange={(open) => !open && setConfigProductId(null)}>
        <DialogContent className="!rounded-none max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-light text-xl">Inventory Settings</DialogTitle>
            <DialogDescription className="font-light text-sm text-muted-foreground">
              Configure reorder threshold and preferred supplier for this product.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-light">Reorder Threshold</Label>
              <Input
                value={reorderThreshold}
                onChange={(event) => setReorderThreshold(event.target.value)}
                className="rounded-none font-light"
                placeholder="10"
              />
            </div>
            <div className="border-t border-border pt-4">
              <p className="mb-3 text-xs font-light text-muted-foreground">Preferred Supplier (optional)</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  value={supplierName}
                  onChange={(event) => setSupplierName(event.target.value)}
                  className="rounded-none font-light"
                  placeholder="Supplier name"
                />
                <Input
                  value={supplierLeadTimeDays}
                  onChange={(event) => setSupplierLeadTimeDays(event.target.value)}
                  className="rounded-none font-light"
                  placeholder="Lead time (days)"
                />
                <Input
                  value={supplierEmail}
                  onChange={(event) => setSupplierEmail(event.target.value)}
                  className="rounded-none font-light"
                  placeholder="Supplier email"
                />
                <Input
                  value={supplierPhone}
                  onChange={(event) => setSupplierPhone(event.target.value)}
                  className="rounded-none font-light"
                  placeholder="Supplier phone"
                />
                <Input
                  value={supplierSku}
                  onChange={(event) => setSupplierSku(event.target.value)}
                  className="rounded-none font-light sm:col-span-2"
                  placeholder="Supplier SKU"
                />
              </div>
            </div>
            <Button
              className="rounded-none bg-foreground font-light text-background hover:bg-foreground/90"
              onClick={() => void submitInventorySettings()}
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInventory;

