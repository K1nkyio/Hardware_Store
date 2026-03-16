import { ArrowRight, ClipboardCheck, PhoneCall } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ResponsiveImage from "@/components/common/ResponsiveImage";
import { homeShowcase } from "@/lib/homeImages";

const HomeFinalCta = () => {
  return (
    <section className="home-reveal home-delay-6 w-full px-4 sm:px-6 pb-20">
      <div className="mx-auto max-w-[1460px]">
        <div className="relative overflow-hidden border border-border bg-gradient-to-r from-muted/40 via-background to-muted/25 p-5 sm:p-6 md:p-10">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-foreground/5 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 left-16 h-52 w-52 rounded-full bg-muted-foreground/10 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Ready to Place Your Order?</p>
              <h2 className="mt-2 text-2xl font-normal leading-tight text-foreground sm:text-3xl md:text-4xl">
                Get project-ready supplies with fewer delays.
              </h2>
              <div className="mt-4 overflow-hidden border border-border bg-muted">
                <div className="aspect-[16/9]">
                  <ResponsiveImage
                    src={homeShowcase.toolkit}
                    alt="Order-ready tool kit preview"
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    sizes="(min-width: 1280px) 520px, (min-width: 768px) 58vw, 100vw"
                  />
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                Compare categories, choose delivery options, and complete checkout in minutes. Need assistance for a large
                order? Our team can help you build a practical list and quote.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button asChild className="rounded-none">
                  <Link to="/category/shop">Start Shopping</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-none">
                  <Link to="/about/customer-care">Request Bulk Support</Link>
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="home-card-rise relative aspect-[4/3] overflow-hidden border border-border bg-muted" style={{ animationDelay: "180ms" }}>
                <ResponsiveImage
                  src={homeShowcase.fittings}
                  alt="Plumbing fittings and tools"
                  className="absolute inset-0 h-full w-full object-cover"
                  sizes="(min-width: 1280px) 420px, (min-width: 768px) 46vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-black/5" />
                <div className="relative z-10 flex h-full flex-col justify-end p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-white/75">Project Ready</p>
                  <p className="mt-1 text-sm text-white">Quickly source fittings and installation essentials.</p>
                </div>
              </div>
              <div className="home-card-rise border border-border bg-background/75 p-4" style={{ animationDelay: "240ms" }}>
                <div className="flex items-start gap-3">
                  <ClipboardCheck className="mt-0.5 h-4 w-4 text-foreground" />
                  <div>
                    <p className="text-sm font-normal text-foreground">Plan purchases by project phase</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Organize materials by urgency and place fewer fragmented orders.
                    </p>
                  </div>
                </div>
              </div>
              <div className="home-card-rise border border-border bg-background/75 p-4" style={{ animationDelay: "300ms" }}>
                <div className="flex items-start gap-3">
                  <PhoneCall className="mt-0.5 h-4 w-4 text-foreground" />
                  <div>
                    <p className="text-sm font-normal text-foreground">Need recommendations?</p>
                    <Link to="/about/customer-care" className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      Talk to customer care
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeFinalCta;
