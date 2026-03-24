import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Minus, Plus } from "lucide-react";
import { Heart, Scale } from "lucide-react";
import { createQuoteRequest, formatProductPrice, Product } from "@/lib/api";
import { useCart } from "@/context/cart";
import { useWishlist } from "@/context/wishlist";
import { useCompare } from "@/context/compare";
import { useAuth } from "@/context/auth";
import {
  calculateTaxCents,
  calculateTotalWithTaxCents,
  DEFAULT_DELIVERY_ESTIMATE,
  formatTaxRate,
} from "@/lib/pricing";
import { LOW_STOCK_THRESHOLD } from "@/lib/inventory";
import { trackEvent } from "@/lib/analytics";

type ProductInfoProps = {
  product: Product;
};

const ProductInfo = ({ product }: ProductInfoProps) => {
  const { addItem } = useCart();
  const { currentUser } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { isCompared, toggleCompare } = useCompare();
  const backorderLimit = 10;
  const maxQuantity = product.stock > 0 ? product.stock : product.backorderable ? backorderLimit : 0;
  const minQuantity = maxQuantity > 0 ? 1 : 0;
  const [quantity, setQuantity] = useState(minQuantity);
  const taxCents = calculateTaxCents(product.priceCents);
  const totalWithTaxCents = calculateTotalWithTaxCents(product.priceCents);
  const formattedBase = formatProductPrice(product);
  const formattedTax = formatProductPrice({ priceCents: taxCents, currency: product.currency });
  const formattedTotal = formatProductPrice({ priceCents: totalWithTaxCents, currency: product.currency });
  const inStock = product.stock > 0;
  const isLowStock = inStock && product.stock <= LOW_STOCK_THRESHOLD;
  const isBackorder = !inStock && product.backorderable;
  const outOfStockTrackedRef = useRef<string | null>(null);
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteStatus, setQuoteStatus] = useState("");
  const [quoteForm, setQuoteForm] = useState({
    customerName: currentUser?.fullName ?? "",
    customerEmail: currentUser?.email ?? "",
    customerPhone: currentUser?.phone ?? "",
    companyName: currentUser?.companyName ?? "",
    accountType: currentUser?.accountType ?? "customer",
    notes: "",
  });

  useEffect(() => {
    setQuantity(minQuantity);
  }, [minQuantity, product.id]);

  useEffect(() => {
    setQuoteForm((prev) => ({
      ...prev,
      customerName: currentUser?.fullName ?? prev.customerName,
      customerEmail: currentUser?.email ?? prev.customerEmail,
      customerPhone: currentUser?.phone ?? prev.customerPhone,
      companyName: currentUser?.companyName ?? prev.companyName,
      accountType: currentUser?.accountType ?? prev.accountType,
    }));
  }, [currentUser]);

  useEffect(() => {
    if (inStock) return;
    if (outOfStockTrackedRef.current === product.id) return;
    outOfStockTrackedRef.current = product.id;
    trackEvent("out_of_stock_impression", {
      productId: product.id,
      name: product.name,
      priceCents: product.priceCents,
      currency: product.currency,
      backorderable: product.backorderable,
    });
  }, [inStock, product.backorderable, product.currency, product.id, product.name, product.priceCents]);

  const incrementQuantity = () => {
    if (maxQuantity <= 0) return;
    setQuantity((prev) => Math.min(maxQuantity, prev + 1));
  };
  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(minQuantity, prev - 1));
  };

  const addToCart = () => {
    if (maxQuantity <= 0) return;
    const safeQuantity = Math.min(quantity, maxQuantity);
    addItem(product, safeQuantity);
    trackEvent("add_to_cart", {
      productId: product.id,
      quantity: safeQuantity,
      backorder: isBackorder,
    });
    console.log("Added to bag:", { productId: product.id, quantity: safeQuantity });
    alert(`Added ${safeQuantity} x ${product.name} to bag!`);
  };

  const handleQuoteSubmit = async () => {
    setQuoteSubmitting(true);
    setQuoteStatus("");
    try {
      await createQuoteRequest({
        productId: product.id,
        branchId: product.pickupLocations?.[0]?.branchId,
        customerName: quoteForm.customerName,
        customerEmail: quoteForm.customerEmail,
        customerPhone: quoteForm.customerPhone,
        companyName: quoteForm.companyName,
        accountType: quoteForm.accountType as "customer" | "contractor" | "company",
        quantity,
        notes: quoteForm.notes,
      });
      setQuoteStatus("Quote request submitted. Our trade desk will follow up shortly.");
      setQuoteFormOpen(false);
    } catch (error) {
      setQuoteStatus(error instanceof Error ? error.message : "Unable to submit quote request.");
    } finally {
      setQuoteSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="hidden lg:block">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/category/${product.category.toLowerCase().replace(/\s+/g, "-")}`}>
                  {product.category}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-light text-muted-foreground mb-1">{product.category}</p>
            <h1 className="text-2xl md:text-3xl font-light text-foreground">{product.name}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {(product.badges ?? []).map((badge) => (
                <span key={badge} className="border border-border px-2 py-1 text-[11px] uppercase tracking-wide text-foreground">
                  {badge}
                </span>
              ))}
            </div>
            <p className="text-xs uppercase tracking-wide mt-2">
              <span
                className={
                  isBackorder
                    ? "text-amber-600"
                    : inStock
                    ? isLowStock
                      ? "text-amber-600"
                      : "text-emerald-600"
                    : "text-rose-600"
                }
              >
                {isBackorder
                  ? `Backorder — ships in ${product.backorderEtaDays ?? 7} days`
                  : inStock
                  ? isLowStock
                    ? "Low stock"
                    : "In stock"
                  : "Out of stock"}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total (Incl. VAT)</p>
            <p className="text-xl font-light text-foreground">{formattedTotal}</p>
            <p className="text-xs text-muted-foreground">Base: {formattedBase}</p>
            <p className="text-xs text-muted-foreground">VAT ({formatTaxRate()}): {formattedTax}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 py-4 border-b border-border">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="rounded-none" onClick={() => void toggleWishlist(product)}>
            <Heart className={`mr-2 h-4 w-4 ${isWishlisted(product.id) ? "fill-current" : ""}`} />
            {isWishlisted(product.id) ? "Saved" : "Save"}
          </Button>
          <Button variant="outline" className="rounded-none" onClick={() => toggleCompare(product)}>
            <Scale className="mr-2 h-4 w-4" />
            {isCompared(product.id) ? "Compared" : "Compare"}
          </Button>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-light text-foreground">SKU</h3>
          <p className="text-sm font-light text-muted-foreground">{product.sku || "N/A"}</p>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-light text-foreground">Stock</h3>
          <p className="text-sm font-light text-muted-foreground">
            {inStock ? `${product.stock} units available` : isBackorder ? "Available for backorder" : "Out of stock"}
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-light text-foreground">Delivery estimate</h3>
          <p className="text-sm font-light text-muted-foreground">{DEFAULT_DELIVERY_ESTIMATE}</p>
        </div>
        {product.bulkPricing && product.bulkPricing.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-light text-foreground">Bulk pricing</h3>
            <div className="space-y-2">
              {product.bulkPricing.map((tier) => (
                <div key={tier.minQuantity} className="flex items-center justify-between border border-border px-3 py-2 text-sm">
                  <span className="text-muted-foreground">{tier.label || `${tier.minQuantity}+ units`}</span>
                  <span className="text-foreground">{formatProductPrice({ priceCents: tier.priceCents, currency: product.currency })}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {product.pickupLocations && product.pickupLocations.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-light text-foreground">Pickup locations</h3>
            <div className="space-y-2">
              {product.pickupLocations.slice(0, 3).map((branch) => (
                <div key={branch.branchId} className="border border-border px-3 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-foreground">{branch.name}</p>
                      <p className="text-muted-foreground">{branch.city} • {branch.address}</p>
                    </div>
                    <span className="text-emerald-700">{branch.stock} ready</span>
                  </div>
                  {branch.pickupEta && <p className="mt-1 text-xs text-muted-foreground">{branch.pickupEta}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-light text-foreground">Quantity</span>
          <div className="flex items-center border border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={decrementQuantity}
              disabled={quantity <= minQuantity}
              className="h-10 w-10 p-0 hover:bg-transparent hover:opacity-50 rounded-none border-none"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="h-10 flex items-center px-4 text-sm font-light min-w-12 justify-center border-l border-r border-border">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={incrementQuantity}
              disabled={quantity >= maxQuantity || maxQuantity <= 0}
              className="h-10 w-10 p-0 hover:bg-transparent hover:opacity-50 rounded-none border-none"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button
          onClick={addToCart}
          disabled={maxQuantity <= 0}
          className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-light rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {maxQuantity <= 0 ? "Out of Stock" : isBackorder ? "Add to Bag (Backorder)" : "Add to Bag"}
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 rounded-none"
          onClick={() => setQuoteFormOpen((prev) => !prev)}
        >
          Request Trade Quote
        </Button>
        {quoteFormOpen && (
          <div className="space-y-3 border border-border p-4">
            <input
              className="w-full border border-border bg-transparent px-3 py-2 text-sm"
              placeholder="Your name"
              value={quoteForm.customerName}
              onChange={(e) => setQuoteForm((prev) => ({ ...prev, customerName: e.target.value }))}
            />
            <input
              className="w-full border border-border bg-transparent px-3 py-2 text-sm"
              placeholder="Email"
              value={quoteForm.customerEmail}
              onChange={(e) => setQuoteForm((prev) => ({ ...prev, customerEmail: e.target.value }))}
            />
            <input
              className="w-full border border-border bg-transparent px-3 py-2 text-sm"
              placeholder="Phone"
              value={quoteForm.customerPhone}
              onChange={(e) => setQuoteForm((prev) => ({ ...prev, customerPhone: e.target.value }))}
            />
            <input
              className="w-full border border-border bg-transparent px-3 py-2 text-sm"
              placeholder="Company name"
              value={quoteForm.companyName}
              onChange={(e) => setQuoteForm((prev) => ({ ...prev, companyName: e.target.value }))}
            />
            <textarea
              className="min-h-24 w-full border border-border bg-transparent px-3 py-2 text-sm"
              placeholder="Project notes, branch preference, lead time, or bulk requirements"
              value={quoteForm.notes}
              onChange={(e) => setQuoteForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
            <Button className="w-full rounded-none" disabled={quoteSubmitting} onClick={handleQuoteSubmit}>
              {quoteSubmitting ? "Submitting quote..." : "Submit quote request"}
            </Button>
          </div>
        )}
        {quoteStatus && <p className="text-sm text-muted-foreground">{quoteStatus}</p>}
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total (Incl. VAT)</p>
            <p className="text-lg font-light text-foreground">{formattedTotal}</p>
          </div>
          <Button
            onClick={addToCart}
            disabled={maxQuantity <= 0}
            className="h-11 px-6 bg-foreground text-background hover:bg-foreground/90 font-light rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {maxQuantity <= 0 ? "Out of Stock" : isBackorder ? "Backorder" : "Add to Bag"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
