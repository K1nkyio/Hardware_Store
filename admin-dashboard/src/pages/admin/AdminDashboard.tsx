import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  CircleDollarSign,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatProductPrice, listProducts } from "@/lib/products";
import { listOrders, formatMoney } from "@/lib/orders";
import { getAnalyticsSummary } from "@/lib/analytics";
const recentOrdersLimit = 8;

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  ready_to_ship: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const LOW_STOCK_THRESHOLD = 10;

const AdminDashboard = () => {
  const [chartRange, setChartRange] = useState<"daily" | "weekly" | "monthly">("daily");

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: () => listProducts(),
  });
  const ordersQuery = useQuery({
    queryKey: ["admin-orders-dashboard"],
    queryFn: () => listOrders({ limit: recentOrdersLimit }),
  });
  const analyticsQuery = useQuery({
    queryKey: ["analytics-summary-dashboard"],
    queryFn: () => getAnalyticsSummary(30),
  });

  const products = productsQuery.data ?? [];

  const overviewCards = useMemo(() => {
    const activeProducts = products.filter((product) => product.status === "active").length;
    const lowStockItems = products.filter(
      (product) => product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD
    ).length;
    const inventoryValueByCurrency = products.reduce<Record<string, number>>((acc, product) => {
      const currency = (product.currency || "KES").toUpperCase();
      const nextValue = (acc[currency] ?? 0) + product.stock * product.priceCents;
      acc[currency] = nextValue;
      return acc;
    }, {});

    const inventoryValue = Object.entries(inventoryValueByCurrency);
    const inventoryValueLabel =
      inventoryValue.length === 0
        ? formatProductPrice({ priceCents: 0, currency: "KES" })
        : inventoryValue.length === 1
          ? formatProductPrice({ priceCents: inventoryValue[0][1], currency: inventoryValue[0][0] })
          : inventoryValue
              .sort((a, b) => b[1] - a[1])
              .map(([currency, cents]) => formatProductPrice({ priceCents: cents, currency }))
              .join(" + ");

    const purchases = analyticsQuery.data?.funnel.find((entry) => entry.stage === "Purchases")?.sessions ?? 0;
    return [
      {
        title: "Total Products",
        value: String(products.length),
        icon: Package,
      },
      {
        title: "Active Products",
        value: String(activeProducts),
        icon: CheckCircle2,
      },
      {
        title: "Low Stock Alerts",
        value: String(lowStockItems),
        icon: AlertTriangle,
      },
      {
        title: "Purchases (30d)",
        value: String(purchases),
        icon: CircleDollarSign,
      },
      {
        title: "Inventory Value",
        value: inventoryValueLabel,
        icon: CircleDollarSign,
      },
    ];
  }, [analyticsQuery.data, products]);

  const salesData = useMemo(() => {
    const counts = new Map<string, number>();

    products.forEach((product) => {
      const key = product.category || "Uncategorized";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [products]);

  const maxValue = Math.max(0, ...salesData.map((entry) => entry.value));

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-light text-foreground sm:text-2xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground font-light">
          Live snapshot based on backend product data.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {productsQuery.isPending ? (
          <Card className="border border-border lg:col-span-4">
            <CardContent className="p-5">
              <p className="text-sm font-light text-muted-foreground">Loading dashboard metrics...</p>
            </CardContent>
          </Card>
        ) : productsQuery.isError ? (
          <Card className="border border-border lg:col-span-4">
            <CardContent className="p-5">
              <p className="text-sm font-light text-destructive">Could not load metrics from backend.</p>
            </CardContent>
          </Card>
        ) : (
          overviewCards.map((card) => (
            <Card key={card.title} className="border border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground font-light">{card.title}</span>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-2xl font-light text-foreground">{card.value}</span>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-light">Products by Category</CardTitle>
              <div className="flex gap-1">
                {(["daily", "weekly", "monthly"] as const).map((range) => (
                  <Button
                    key={range}
                    variant={chartRange === range ? "default" : "ghost"}
                    size="sm"
                    className="text-xs h-7 rounded-none font-light"
                    onClick={() => setChartRange(range)}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {salesData.length === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-sm font-light text-muted-foreground">No category data yet.</p>
              </div>
            ) : (
              <div className="flex items-end gap-3 h-48 pt-4">
                {salesData.map((entry) => (
                  <div key={entry.label} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-foreground rounded-sm transition-all duration-300"
                      style={{ height: `${(entry.value / maxValue) * 100}%` }}
                    />
                    <span className="text-xs text-muted-foreground font-light text-center line-clamp-2">
                      {entry.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-light">Inventory Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm font-light">
              <span className="text-muted-foreground">In Stock</span>
              <span>{products.filter((product) => product.stock > 0).length}</span>
            </div>
            <div className="flex justify-between text-sm font-light">
              <span className="text-muted-foreground">Out of Stock</span>
              <span>{products.filter((product) => product.stock === 0).length}</span>
            </div>
            <div className="flex justify-between text-sm font-light">
              <span className="text-muted-foreground">Low Stock ({LOW_STOCK_THRESHOLD} or below)</span>
              <span>
                {products.filter((product) => product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD).length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-light">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersQuery.isPending ? (
            <p className="text-sm font-light text-muted-foreground">Loading recent orders...</p>
          ) : ordersQuery.isError ? (
            <p className="text-sm font-light text-destructive">Could not load recent orders.</p>
          ) : (ordersQuery.data?.items ?? []).length === 0 ? (
            <p className="text-sm font-light text-muted-foreground">No orders available yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-light text-xs">Order ID</TableHead>
                    <TableHead className="font-light text-xs">Customer</TableHead>
                    <TableHead className="font-light text-xs">Total</TableHead>
                    <TableHead className="font-light text-xs">Status</TableHead>
                    <TableHead className="font-light text-xs">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(ordersQuery.data?.items ?? []).map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="text-sm font-light">{order.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm font-light">{order.customerName}</TableCell>
                      <TableCell className="text-sm font-light">{formatMoney(order.currency, order.totalCents)}</TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-light ${statusColor[order.status]}`}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-light text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
