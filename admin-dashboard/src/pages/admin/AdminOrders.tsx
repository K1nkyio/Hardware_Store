import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye, Truck, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AdminOrderDetail,
  AdminOrderListItem,
  formatMoney,
  getOrder,
  getOrderInvoice,
  listOrders,
  markOrderShipped,
  OrderStatus,
  updateOrder,
} from "@/lib/orders";
import { Textarea } from "@/components/ui/textarea";

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  ready_to_ship: "Ready to Ship",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  ready_to_ship: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function formatSlaCountdown(slaDueAt: string): string {
  if (!slaDueAt) return "No SLA";
  const diffMs = new Date(slaDueAt).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 0) return `${Math.abs(diffMinutes)}m overdue`;
  if (diffMinutes < 60) return `${diffMinutes}m left`;
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours}h ${minutes}m left`;
}

const AdminOrders = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<OrderStatus>("pending");
  const [editNotes, setEditNotes] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editTrackingNumber, setEditTrackingNumber] = useState("");
  const [editSlaMinutes, setEditSlaMinutes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ["admin-orders", statusFilter, search],
    queryFn: () =>
      listOrders({
        status: statusFilter === "all" ? undefined : statusFilter,
        q: search || undefined,
        limit: 200,
      }),
  });

  const selectedOrderQuery = useQuery({
    queryKey: ["admin-order", selectedOrderId],
    queryFn: () => getOrder(selectedOrderId as string),
    enabled: Boolean(selectedOrderId),
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: {
        status?: OrderStatus;
        notes?: string;
        tags?: string[];
        trackingNumber?: string;
        slaDueAt?: string;
      };
    }) => updateOrder(orderId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-order", selectedOrderId] });
      toast({ title: "Order updated" });
    },
    onError: (error) => {
      toast({
        title: "Could not update order",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const markShippedMutation = useMutation({
    mutationFn: ({ orderId, trackingNumber }: { orderId: string; trackingNumber?: string }) =>
      markOrderShipped(orderId, trackingNumber),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-order", selectedOrderId] });
      toast({ title: "Order marked as shipped" });
    },
    onError: (error) => {
      toast({
        title: "Could not mark order as shipped",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const pipeline = ordersQuery.data?.pipeline ?? [];
  const orders = ordersQuery.data?.items ?? [];

  useEffect(() => {
    const selected = selectedOrderQuery.data;
    if (!selected) return;
    setEditStatus(selected.status);
    setEditNotes(selected.notes || "");
    setEditTags((selected.tags ?? []).join(", "));
    setEditTrackingNumber(selected.trackingNumber || "");
    if (selected.slaDueAt) {
      const diff = Math.max(0, Math.round((new Date(selected.slaDueAt).getTime() - Date.now()) / 60000));
      setEditSlaMinutes(String(diff));
    } else {
      setEditSlaMinutes("");
    }
  }, [selectedOrderQuery.data]);

  const handleSaveUpdates = async () => {
    if (!selectedOrderId) return;
    const tags = editTags
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    const slaDueAt =
      editSlaMinutes.trim() !== "" && Number.isFinite(Number(editSlaMinutes))
        ? new Date(Date.now() + Number(editSlaMinutes) * 60000).toISOString()
        : undefined;

    await updateOrderMutation.mutateAsync({
      orderId: selectedOrderId,
      payload: {
        status: editStatus,
        notes: editNotes,
        tags,
        trackingNumber: editTrackingNumber || undefined,
        slaDueAt,
      },
    });
  };

  const handlePrintInvoice = async (order: AdminOrderListItem | AdminOrderDetail) => {
    try {
      const invoice = await getOrderInvoice(order.id);
      const popup = window.open("", "_blank", "width=900,height=720");
      if (!popup) {
        toast({
          title: "Popup blocked",
          description: "Allow popups to print invoices.",
          variant: "destructive",
        });
        return;
      }

      const rows = invoice.items
        .map(
          (item) =>
            `<tr><td>${item.productName}</td><td>${item.sku || "-"}</td><td>${item.quantity}</td><td>${formatMoney(
              invoice.order.currency,
              item.priceCents
            )}</td></tr>`
        )
        .join("");

      popup.document.write(`
        <html>
          <head><title>${invoice.invoiceNumber}</title></head>
          <body style="font-family: Arial, sans-serif; padding: 24px;">
            <h2>${invoice.invoiceNumber}</h2>
            <p>Order: ${invoice.order.id}</p>
            <p>Customer: ${invoice.order.customerName} (${invoice.order.customerEmail})</p>
            <p>Status: ${statusLabels[invoice.order.status]}</p>
            <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-top: 16px;">
              <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Price</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
            <p style="margin-top: 16px;"><strong>Total:</strong> ${formatMoney(
              invoice.order.currency,
              invoice.order.totalCents
            )}</p>
          </body>
        </html>
      `);
      popup.document.close();
      popup.focus();
      popup.print();
    } catch (error) {
      toast({
        title: "Could not print invoice",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const pipelineCards = useMemo(
    () =>
      pipeline.map((entry) => ({
        ...entry,
        label: statusLabels[entry.status],
      })),
    [pipeline]
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-light text-foreground sm:text-2xl">Orders</h1>
        <p className="text-sm font-light text-muted-foreground">
          Pipeline, SLA control, and shipping operations.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`border p-3 text-left ${
            statusFilter === "all" ? "border-foreground bg-foreground text-background" : "border-border"
          }`}
        >
          <p className="text-xs font-light">All</p>
          <p className="text-xl font-light">{orders.length}</p>
        </button>
        {pipelineCards.map((entry) => (
          <button
            key={entry.status}
            type="button"
            onClick={() => setStatusFilter(entry.status)}
            className={`border p-3 text-left ${
              statusFilter === entry.status
                ? "border-foreground bg-foreground text-background"
                : "border-border"
            }`}
          >
            <p className="text-xs font-light">{entry.label}</p>
            <p className="text-xl font-light">{entry.count}</p>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by order ID, customer, or email..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="rounded-none pl-9 font-light"
        />
      </div>

      <Card className="border border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[920px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-light">Order</TableHead>
                  <TableHead className="text-xs font-light">Customer</TableHead>
                  <TableHead className="text-xs font-light">Items</TableHead>
                  <TableHead className="text-xs font-light">Total</TableHead>
                  <TableHead className="text-xs font-light">Status</TableHead>
                  <TableHead className="text-xs font-light">SLA Timer</TableHead>
                  <TableHead className="text-xs font-light">Tags</TableHead>
                  <TableHead className="text-right text-xs font-light">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersQuery.isPending ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm font-light text-muted-foreground">
                      Loading orders...
                    </TableCell>
                  </TableRow>
                ) : ordersQuery.isError ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm font-light text-destructive">
                      Could not load orders.
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm font-light text-muted-foreground">
                      No orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="text-sm font-light">{order.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm font-light">
                        <div>
                          <p>{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-light">{order.itemCount}</TableCell>
                      <TableCell className="text-sm font-light">
                        {formatMoney(order.currency, order.totalCents)}
                      </TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-1 text-xs font-light ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-light">
                        {order.status === "delivered" || order.status === "cancelled"
                          ? "Closed"
                          : formatSlaCountdown(order.slaDueAt)}
                      </TableCell>
                      <TableCell className="text-xs font-light text-muted-foreground">
                        {(order.tags ?? []).slice(0, 2).join(", ") || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setSelectedOrderId(order.id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              void markShippedMutation.mutateAsync({
                                orderId: order.id,
                                trackingNumber: order.trackingNumber || undefined,
                              })
                            }
                            disabled={
                              markShippedMutation.isPending ||
                              order.status === "shipped" ||
                              order.status === "delivered" ||
                              order.status === "cancelled"
                            }
                          >
                            <Truck className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => void handlePrintInvoice(order)}
                          >
                            <Printer className="h-3 w-3" />
                          </Button>
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

      <Dialog open={Boolean(selectedOrderId)} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent className="!rounded-none max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-light text-xl">
              {selectedOrderQuery.data ? `Order ${selectedOrderQuery.data.id}` : "Order details"}
            </DialogTitle>
            <DialogDescription className="font-light text-sm text-muted-foreground">
              Update status, shipping workflow, notes, tags, and SLA target.
            </DialogDescription>
          </DialogHeader>
          {selectedOrderQuery.isPending ? (
            <p className="text-sm font-light text-muted-foreground">Loading order details...</p>
          ) : selectedOrderQuery.isError || !selectedOrderQuery.data ? (
            <p className="text-sm font-light text-destructive">Could not load order details.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 text-sm font-light sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p>{selectedOrderQuery.data.customerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p>{selectedOrderQuery.data.customerEmail}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p>{selectedOrderQuery.data.customerPhone || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p>{formatMoney(selectedOrderQuery.data.currency, selectedOrderQuery.data.totalCents)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-light text-muted-foreground">Status</p>
                  <Select value={editStatus} onValueChange={(value) => setEditStatus(value as OrderStatus)}>
                    <SelectTrigger className="rounded-none font-light">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(statusLabels) as OrderStatus[]).map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-light text-muted-foreground">Tracking Number</p>
                  <Input
                    value={editTrackingNumber}
                    onChange={(event) => setEditTrackingNumber(event.target.value)}
                    className="rounded-none font-light"
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-light text-muted-foreground">Tags (comma separated)</p>
                  <Input
                    value={editTags}
                    onChange={(event) => setEditTags(event.target.value)}
                    className="rounded-none font-light"
                    placeholder="priority, contractor, delayed"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-light text-muted-foreground">SLA Minutes From Now</p>
                  <Input
                    value={editSlaMinutes}
                    onChange={(event) => setEditSlaMinutes(event.target.value)}
                    className="rounded-none font-light"
                    placeholder="e.g. 120"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-light text-muted-foreground">Order Notes</p>
                <Textarea
                  value={editNotes}
                  onChange={(event) => setEditNotes(event.target.value)}
                  className="min-h-24 rounded-none font-light"
                  placeholder="Internal fulfillment notes..."
                />
              </div>

              <div className="border-t border-border pt-4">
                <p className="mb-2 text-sm font-light text-muted-foreground">Line Items</p>
                {selectedOrderQuery.data.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-1 text-sm font-light">
                    <span>
                      {item.productName} x {item.quantity}
                    </span>
                    <span>{formatMoney(item.currency, item.priceCents)}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <Button
                  variant="outline"
                  className="rounded-none font-light"
                  onClick={() => void handlePrintInvoice(selectedOrderQuery.data as AdminOrderDetail)}
                >
                  <Printer className="mr-2 h-4 w-4" /> Print Invoice
                </Button>
                <Button
                  variant="outline"
                  className="rounded-none font-light"
                  onClick={() =>
                    void markShippedMutation.mutateAsync({
                      orderId: selectedOrderQuery.data.id,
                      trackingNumber: editTrackingNumber || undefined,
                    })
                  }
                  disabled={
                    markShippedMutation.isPending ||
                    ["shipped", "delivered", "cancelled"].includes(selectedOrderQuery.data.status)
                  }
                >
                  <Truck className="mr-2 h-4 w-4" /> Mark Shipped
                </Button>
                <Button
                  className="rounded-none bg-foreground font-light text-background hover:bg-foreground/90"
                  onClick={() => void handleSaveUpdates()}
                  disabled={updateOrderMutation.isPending}
                >
                  {updateOrderMutation.isPending ? "Saving..." : "Save Updates"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;

