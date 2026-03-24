import { trackAnalyticsEvent } from "@/lib/api";
import { getSessionId } from "@/lib/analytics";

export async function reportClientError(source: string, error: unknown, metadata?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error ?? "Unknown client error");
  await trackAnalyticsEvent({
    eventName: "client_error",
    sessionId: getSessionId(),
    payload: {
      source,
      message,
      stack: error instanceof Error ? error.stack : undefined,
      ...metadata,
    },
  });
}
