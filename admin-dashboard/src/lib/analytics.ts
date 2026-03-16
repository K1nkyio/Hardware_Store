import { apiRequest } from "@/lib/api";

export type AnalyticsSummary = {
  windowDays: number;
  funnel: Array<{
    stage: string;
    sessions: number;
    conversionPct: number;
  }>;
  topSearchesNoResults: Array<{
    query: string;
    hits: number;
    lastSeen: string;
  }>;
  abandonedCarts: {
    openCarts: number;
    subtotalCents: number;
    lastSeen: string;
    byCurrency: Array<{
      currency: string;
      openCarts: number;
      subtotalCents: number;
      lastSeen: string;
    }>;
  };
  outOfStockLostSales: {
    events: number;
    estimatedLostRevenueCents: number;
    byCurrency: Array<{
      currency: string;
      events: number;
      estimatedLostRevenueCents: number;
    }>;
  };
};

export async function getAnalyticsSummary(days = 30): Promise<AnalyticsSummary> {
  return apiRequest<AnalyticsSummary>(`/api/analytics/dashboard-summary?days=${days}`);
}

export async function getAuditLogs(limit = 100): Promise<
  Array<{
    id: string;
    actorId: string;
    actorRole: string;
    action: string;
    entityType: string;
    entityId: string;
    details: Record<string, unknown> | null;
    createdAt: string;
  }>
> {
  return apiRequest(`/api/analytics/audit-logs?limit=${limit}`);
}
