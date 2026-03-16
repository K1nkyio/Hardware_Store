import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, ShoppingCart, Search, AlertTriangle, Shield, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAnalyticsSummary, getAuditLogs } from "@/lib/analytics";
import { formatProductPrice, listProducts } from "@/lib/products";
import { getAdminProfile } from "@/lib/api";

const AdminReports = () => {
  const { toast } = useToast();
  const summaryQuery = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => getAnalyticsSummary(30),
  });
  
  // Get current admin user to check role
  const adminProfileQuery = useQuery({
    queryKey: ["admin-profile"],
    queryFn: () => getAdminProfile(),
  });
  
  // Check if user has super_admin role for audit logs
  const isSuperAdmin = adminProfileQuery.data?.user.role === "super_admin";
  
  const auditLogsQuery = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => getAuditLogs(20),
    enabled: isSuperAdmin, // Only fetch if user is super_admin
  });
  const productsQuery = useQuery({
    queryKey: ["products-reports"],
    queryFn: () => listProducts(),
  });

  const summary = summaryQuery.data;
  const maxFunnel = Math.max(1, ...(summary?.funnel ?? []).map((entry) => entry.sessions));

  const inventoryValueByCurrency = useMemo(() => {
    const grouped = (productsQuery.data ?? []).reduce<Record<string, number>>((acc, product) => {
      const currency = (product.currency || "KES").toUpperCase();
      acc[currency] = (acc[currency] ?? 0) + product.stock * product.priceCents;
      return acc;
    }, {});

    return Object.entries(grouped).map(([currency, priceCents]) =>
      formatProductPrice({ priceCents, currency })
    );
  }, [productsQuery.data]);

  const abandonedByCurrencyLabel = useMemo(() => {
    if (!summary) return "-";
    const byCurrency = summary.abandonedCarts.byCurrency ?? [];
    if (byCurrency.length === 0) return "-";
    return byCurrency
      .map((entry) =>
        formatProductPrice({
          priceCents: entry.subtotalCents,
          currency: entry.currency || "KES",
        })
      )
      .join(" + ");
  }, [summary]);

  const lostSalesByCurrencyLabel = useMemo(() => {
    if (!summary) return "-";
    const byCurrency = summary.outOfStockLostSales.byCurrency ?? [];
    if (byCurrency.length === 0) return "-";
    return byCurrency
      .map((entry) =>
        formatProductPrice({
          priceCents: entry.estimatedLostRevenueCents,
          currency: entry.currency || "KES",
        })
      )
      .join(" + ");
  }, [summary]);

  const handleExport = () => {
    if (!summary) return;
    const csv = [
      "stage,sessions,conversionPct",
      ...summary.funnel.map((entry) => `${entry.stage},${entry.sessions},${entry.conversionPct}`),
      "",
      "query,hits,lastSeen",
      ...summary.topSearchesNoResults.map(
        (entry) => `"${entry.query.replace(/"/g, '""')}",${entry.hits},${entry.lastSeen}`
      ),
      "",
      "abandonedCurrency,openCarts,subtotalCents,lastSeen",
      ...(summary.abandonedCarts.byCurrency ?? []).map(
        (entry) => `${entry.currency},${entry.openCarts},${entry.subtotalCents},${entry.lastSeen}`
      ),
      "",
      "lostSalesCurrency,events,estimatedLostRevenueCents",
      ...(summary.outOfStockLostSales.byCurrency ?? []).map(
        (entry) => `${entry.currency},${entry.events},${entry.estimatedLostRevenueCents}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `analytics-report-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast({ title: "Analytics report exported" });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-light text-foreground sm:text-2xl">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground font-light">
            Conversion funnel, search gaps, abandoned carts, lost sales, and audit logs.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-none font-light text-xs"
          onClick={handleExport}
          disabled={!summary}
        >
          <Download className="mr-1 h-3 w-3" /> Export Analytics
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-light text-muted-foreground">Purchases (Sessions)</span>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-light">
              {summary?.funnel.find((entry) => entry.stage === "Purchases")?.sessions ?? "-"}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-light text-muted-foreground">Open Abandoned Carts</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-light">{summary?.abandonedCarts.openCarts ?? "-"}</p>
            <p className="mt-1 text-xs font-light text-muted-foreground">
              Value: {abandonedByCurrencyLabel}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-light text-muted-foreground">Zero-Result Searches</span>
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-light">{summary?.topSearchesNoResults.length ?? "-"}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-light text-muted-foreground">Lost Sales (OOS)</span>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-light">{lostSalesByCurrencyLabel}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-light">Inventory Value by Currency</CardTitle>
        </CardHeader>
        <CardContent>
          {productsQuery.isPending ? (
            <p className="text-sm font-light text-muted-foreground">Loading inventory valuation...</p>
          ) : productsQuery.isError ? (
            <p className="text-sm font-light text-destructive">Could not load inventory valuation.</p>
          ) : inventoryValueByCurrency.length === 0 ? (
            <p className="text-sm font-light text-muted-foreground">No products available.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {inventoryValueByCurrency.map((entry) => (
                <span key={entry} className="rounded-none border border-border px-3 py-2 text-sm font-light">
                  {entry}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-light">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summaryQuery.isPending ? (
              <p className="text-sm font-light text-muted-foreground">Loading funnel data...</p>
            ) : summaryQuery.isError || !summary ? (
              <p className="text-sm font-light text-destructive">Could not load funnel data.</p>
            ) : (
              summary.funnel.map((entry) => (
                <div key={entry.stage}>
                  <div className="mb-1 flex justify-between text-sm font-light">
                    <span>{entry.stage}</span>
                    <span>
                      {entry.sessions} sessions ({entry.conversionPct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground transition-all duration-500"
                      style={{ width: `${Math.max(4, (entry.sessions / maxFunnel) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-light">Top Searches With No Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summaryQuery.isPending ? (
              <p className="text-sm font-light text-muted-foreground">Loading search analytics...</p>
            ) : summaryQuery.isError || !summary ? (
              <p className="text-sm font-light text-destructive">Could not load search analytics.</p>
            ) : summary.topSearchesNoResults.length === 0 ? (
              <p className="text-sm font-light text-muted-foreground">No zero-result search events yet.</p>
            ) : (
              summary.topSearchesNoResults.map((entry) => (
                <div
                  key={`${entry.query}-${entry.lastSeen}`}
                  className="flex items-center justify-between text-sm font-light"
                >
                  <span>{entry.query}</span>
                  <span className="text-muted-foreground">{entry.hits}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-light">
            <Shield className="h-4 w-4" /> Recent Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!isSuperAdmin ? (
            <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-none">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-light text-muted-foreground">
                  Access to audit logs requires super administrator privileges.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Current role: {adminProfileQuery.data?.user.role || "unknown"}
                </p>
              </div>
            </div>
          ) : auditLogsQuery.isPending ? (
            <p className="text-sm font-light text-muted-foreground">Loading audit logs...</p>
          ) : auditLogsQuery.isError ? (
            <p className="text-sm font-light text-destructive">Could not load audit logs.</p>
          ) : (auditLogsQuery.data ?? []).length === 0 ? (
            <p className="text-sm font-light text-muted-foreground">No audit logs available.</p>
          ) : (
            (auditLogsQuery.data ?? []).map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-1 border-b border-border pb-2 text-sm font-light last:border-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {entry.action} - {entry.entityType}{" "}
                    {entry.entityId ? `(${entry.entityId.slice(0, 8)})` : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Actor: {entry.actorId || "unknown"} ({entry.actorRole || "unknown"})
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReports;
