import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import ScrollToTop from "./components/ScrollToTop";
import { CartProvider } from "@/context/cart";
import { AuthProvider } from "@/context/auth";

const Index = lazy(() => import("./pages/Index"));
const Category = lazy(() => import("./pages/Category"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OurStory = lazy(() => import("./pages/about/OurStory"));
const CustomerCare = lazy(() => import("./pages/about/CustomerCare"));
const StoreLocator = lazy(() => import("./pages/about/StoreLocator"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Login = lazy(() => import("./pages/Login"));
const Account = lazy(() => import("./pages/Account"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <ScrollToTop />
            <Suspense fallback={<div className="min-h-screen bg-background" />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/category/:category" element={<Category />} />
                <Route path="/product/:productId" element={<ProductDetail />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/login" element={<Login />} />
                <Route path="/account" element={<Account />} />
                <Route path="/about/our-story" element={<OurStory />} />
                <Route path="/about/customer-care" element={<CustomerCare />} />
                <Route path="/about/store-locator" element={<StoreLocator />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
