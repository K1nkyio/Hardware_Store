import { API_BASE_URL, trackAnalyticsEvent } from "@/lib/api";

const SESSION_KEY = "hardware_store_session_id";

function generateId() {
  return `sess_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const next = generateId();
  window.localStorage.setItem(SESSION_KEY, next);
  return next;
}

export async function trackEvent(eventName: string, payload?: Record<string, unknown>, userEmail?: string) {
  try {
    const body = {
      eventName,
      sessionId: getSessionId(),
      userEmail,
      payload,
    };

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const url = `${API_BASE_URL}/api/analytics/events`;
      const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    }

    await trackAnalyticsEvent(body);
  } catch {
    // Swallow analytics errors to avoid breaking UX.
  }
}
