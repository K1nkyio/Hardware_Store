import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
}

const products: Product[] = [
  { id: 1, name: "PVC Pipe 1/2\" x 10ft", category: "Pipes & Fittings", price: "₱85" },
  { id: 2, name: "Brass Gate Valve 1\"", category: "Valves", price: "₱450" },
  { id: 3, name: "Stainless Kitchen Faucet", category: "Faucets & Taps", price: "₱2,850" },
  { id: 4, name: "Ceramic Pedestal Sink", category: "Sinks", price: "₱4,200" },
  { id: 5, name: "Rain Shower Head", category: "Bathroom Fixtures", price: "₱1,650" },
  { id: 6, name: "Toilet Bowl Set", category: "Bathroom Fixtures", price: "₱5,800" },
];

const ProductCarousel = () => {
  return (
    <section className="w-full mb-16 px-6">
      <h2 className="text-lg font-light text-foreground mb-6">Best Sellers</h2>
      <Carousel
        opts={{ align: "start", loop: false }}
        className="w-full"
      >
        <CarouselContent>
          {products.map((product) => (
            <CarouselItem
              key={product.id}
              className="basis-1/2 md:basis-1/3 lg:basis-1/4 pr-2 md:pr-4"
            >
              <Link to={`/product/${product.id}`}>
                <Card className="border-none shadow-none bg-transparent group">
                  <CardContent className="p-0">
                    <div className="aspect-square mb-3 overflow-hidden bg-muted flex items-center justify-center">
                      <span className="text-4xl">
                        {product.category === "Pipes & Fittings" ? "🔧" :
                         product.category === "Valves" ? "⚙️" :
                         product.category === "Faucets & Taps" ? "🚿" :
                         product.category === "Sinks" ? "🪣" : "🚽"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-light text-muted-foreground">{product.category}</p>
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-foreground">{product.name}</h3>
                        <p className="text-sm font-light text-foreground">{product.price}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
};

export default ProductCarousel;
