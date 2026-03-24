import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/context/compare";
import { formatProductPrice } from "@/lib/api";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";

const Compare = () => {
  usePageMeta({
    title: "Compare Products | Raph Supply",
    description: "Compare technical specs, compatibility, pricing, and stock across trade-ready hardware products.",
  });
  const { items, clear, remove } = useCompare();
  const specKeys = Array.from(new Set(items.flatMap((item) => Object.keys(item.specs ?? {})))).slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Comparison</p>
              <h1 className="text-3xl font-light text-foreground">Compare trade gear side by side</h1>
            </div>
            {items.length > 0 && (
              <Button variant="outline" className="rounded-none" onClick={clear}>
                Clear comparison
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="border border-dashed border-border p-8 text-sm text-muted-foreground">
              No products selected for comparison yet. Add up to four items from category or product pages.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-border bg-muted/30 p-4 text-left text-sm font-medium">Field</th>
                    {items.map((item) => (
                      <th key={item.id} className="min-w-[220px] border border-border p-4 text-left align-top">
                        <div className="space-y-3">
                          <img src={item.imageUrl || "/placeholder.svg"} alt={item.name} className="h-36 w-full object-cover" />
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.category}</p>
                            <Link to={`/product/${item.id}`} className="text-base font-medium text-foreground hover:underline">
                              {item.name}
                            </Link>
                          </div>
                          <p className="text-sm text-muted-foreground">{formatProductPrice(item)}</p>
                          <Button variant="ghost" className="h-auto px-0 text-sm underline" onClick={() => remove(item.id)}>
                            Remove
                          </Button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border p-4 text-sm text-muted-foreground">SKU</td>
                    {items.map((item) => (
                      <td key={`${item.id}-sku`} className="border border-border p-4 text-sm text-foreground">{item.sku || "N/A"}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border border-border p-4 text-sm text-muted-foreground">Compatibility</td>
                    {items.map((item) => (
                      <td key={`${item.id}-compat`} className="border border-border p-4 text-sm text-foreground">{item.compatibility || "Not listed"}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border border-border p-4 text-sm text-muted-foreground">Stock</td>
                    {items.map((item) => (
                      <td key={`${item.id}-stock`} className="border border-border p-4 text-sm text-foreground">{item.stock > 0 ? `${item.stock} available` : "Out of stock"}</td>
                    ))}
                  </tr>
                  {specKeys.map((key) => (
                    <tr key={key}>
                      <td className="border border-border p-4 text-sm text-muted-foreground">{key}</td>
                      {items.map((item) => (
                        <td key={`${item.id}-${key}`} className="border border-border p-4 text-sm text-foreground">
                          {String(item.specs?.[key] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Compare;
