import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { getStorefrontPublicSettings } from "@/lib/api";
import { setTaxRatePercent } from "@/lib/pricing";
import { reportClientError } from "@/lib/errors";

async function bootstrap() {
  if (typeof window !== "undefined") {
    window.addEventListener("error", (event) => {
      void reportClientError("window.error", event.error ?? event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });
    window.addEventListener("unhandledrejection", (event) => {
      void reportClientError("window.unhandledrejection", event.reason);
    });

    if ("serviceWorker" in navigator) {
      if (import.meta.env.PROD) {
        window.addEventListener("load", () => {
          navigator.serviceWorker.register("/sw.js").catch((error) => {
            void reportClientError("service-worker.register", error);
          });
        });
      } else {
        navigator.serviceWorker
          .getRegistrations()
          .then((registrations) =>
            Promise.all(registrations.map((registration) => registration.unregister()))
          )
          .catch((error) => {
            void reportClientError("service-worker.unregister", error);
          });

        if ("caches" in window) {
          caches
            .keys()
            .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
            .catch((error) => {
              void reportClientError("service-worker.clear-cache", error);
            });
        }
      }
    }
  }

  try {
    const settings = await getStorefrontPublicSettings();
    setTaxRatePercent(settings.tax.taxRatePercent);
  } catch (error) {
    void reportClientError("bootstrap.settings", error);
  }

  createRoot(document.getElementById("root")!).render(<App />);
}

void bootstrap();
