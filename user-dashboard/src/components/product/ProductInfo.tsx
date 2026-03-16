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
import { formatProductPrice, Product } from "@/lib/api";
import { useCart } from "@/context/cart";
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

  useEffect(() => {
    setQuantity(minQuantity);
  }, [minQuantity, product.id]);

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
