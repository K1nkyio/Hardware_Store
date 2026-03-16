import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { getStorefrontPublicSettings } from "@/lib/api";
import { setTaxRatePercent } from "@/lib/pricing";

async function bootstrap() {
  try {
    const settings = await getStorefrontPublicSettings();
    setTaxRatePercent(settings.tax.taxRatePercent);
  } catch {
    // Keep env fallback tax rate when settings are unavailable.
  }

  createRoot(document.getElementById("root")!).render(<App />);
}

void bootstrap();
