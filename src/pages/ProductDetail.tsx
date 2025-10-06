import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, ShoppingCart, ArrowLeft, Check, Truck, Shield, RotateCcw } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { products } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/utils/currency";

export default function ProductDetail() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  
  const product = products.find(p => p.id === id);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-bold mb-3">Product Not Found</h1>
            <p className="text-muted-foreground mb-4 text-sm">The product you're looking for doesn't exist.</p>
            <Button asChild size="sm">
              <Link to="/products">
                <ArrowLeft className="mr-1 h-3 w-3" /> Back to Products
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!product.inStock) return;
    
    for(let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    
    toast({
      title: "Added to cart",
      description: `${quantity}x ${product.name} added to your cart`,
    });
  };

  // Generate multiple product images (simulated)
  const productImages = [
    product.image,
    product.image.replace('w=400', 'w=400&sat=-100'), // B&W version as variation
    product.image.replace('w=400', 'w=400&hue=180'), // Hue shifted version
  ];

  const features = [
    "Professional Grade Quality",
    "Durable Construction",
    "Easy to Use Design",
    "Ergonomic Handle",
    "Corrosion Resistant",
    "Long-lasting Performance"
  ];

  const specifications = [
    { label: "Brand", value: product.brand },
    { label: "Category", value: product.category },
    { label: "Rating", value: `${product.rating}/5.0` },
    { label: "Reviews", value: product.reviewCount.toLocaleString() },
    { label: "Stock Status", value: product.inStock ? "In Stock" : "Out of Stock" },
    { label: "SKU", value: `SKU-${product.id.padStart(6, '0')}` }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24">
        {/* Breadcrumb */}
        <section className="py-3 border-b">
          <div className="container">
            <div className="flex items-center text-xs text-muted-foreground">
              <Link to="/" className="hover:text-primary">Home</Link>
              <span className="mx-1">/</span>
              <Link to="/products" className="hover:text-primary">Products</Link>
              <span className="mx-1">/</span>
              <span className="text-foreground">{product.name}</span>
            </div>
          </div>
        </section>

        {/* Product Details */}
        <section className="section-sm">
          <div className="container">
            <Button variant="ghost" asChild className="mb-4" size="sm">
              <Link to="/products">
                <ArrowLeft className="mr-1 h-3 w-3" /> Back to Products
              </Link>
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Product Images */}
              <div className="space-y-3">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={productImages[selectedImage]} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                        selectedImage === index ? 'border-primary' : 'border-muted'
                      }`}
                    >
                      <img 
                        src={image} 
                        alt={`${product.name} view ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-4">
                {/* Badges */}
                <div className="flex gap-2 flex-wrap">
                  {product.isNew && (
                    <Badge className="bg-success text-success-foreground text-xs">NEW</Badge>
                  )}
                  {product.isBestSeller && (
                    <Badge className="bg-primary text-primary-foreground text-xs">BEST SELLER</Badge>
                  )}
                  {product.discount && (
                    <Badge variant="destructive" className="text-xs">-{product.discount}%</Badge>
                  )}
                </div>

                {/* Brand & Category */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="font-medium text-primary">{product.brand}</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>{product.category}</span>
                </div>

                {/* Product Title */}
                <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>

                {/* Rating */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${
                          i < Math.floor(product.rating) 
                            ? 'fill-warning text-warning' 
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{product.rating}</span>
                  <span className="text-sm text-muted-foreground">
                    ({product.reviewCount.toLocaleString()} reviews)
                  </span>
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(product.price).usd}
                      </span>
                      <span className="text-lg text-muted-foreground">
                        / {formatCurrency(product.price).ksh}
                      </span>
                    </div>
                    {product.originalPrice && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg text-muted-foreground line-through">
                          {formatCurrency(product.originalPrice).usd}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          / {formatCurrency(product.originalPrice).ksh}
                        </span>
                      </div>
                    )}
                  </div>
                  {product.originalPrice && (
                    <p className="text-sm text-success">
                      You save {formatCurrency(product.originalPrice - product.price).usd} / {formatCurrency(product.originalPrice - product.price).ksh}
                    </p>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>

                {/* Stock Status */}
                <div className={`flex items-center gap-2 text-sm ${
                  product.inStock ? 'text-success' : 'text-destructive'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    product.inStock ? 'bg-success' : 'bg-destructive'
                  }`} />
                  {product.inStock ? 'In Stock - Ready to Ship' : 'Out of Stock'}
                </div>

                {/* Quantity & Add to Cart */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium">Quantity:</label>
                    <div className="flex items-center border rounded-md">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-2 py-1 hover:bg-muted text-sm"
                        disabled={!product.inStock}
                      >
                        -
                      </button>
                      <span className="px-3 py-1 border-x text-sm">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-2 py-1 hover:bg-muted text-sm"
                        disabled={!product.inStock}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      className="flex-1" 
                      disabled={!product.inStock}
                      onClick={handleAddToCart}
                      size="sm"
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Add to Cart - {formatCurrency(product.price * quantity).usd}
                    </Button>
                  </div>
                </div>

                {/* Features */}
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <Truck className="h-3 w-3 text-primary" />
                        <span>Free Shipping</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3 text-primary" />
                        <span>2 Year Warranty</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <RotateCcw className="h-3 w-3 text-primary" />
                        <span>30-Day Returns</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Product Details Tabs */}
        <section className="section-sm bg-muted/30">
          <div className="container">
            <Tabs defaultValue="features" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="features" className="text-xs">Features</TabsTrigger>
                <TabsTrigger value="specifications" className="text-xs">Specifications</TabsTrigger>
                <TabsTrigger value="reviews" className="text-xs">Reviews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="features" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Product Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-3 w-3 text-success" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="specifications" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Specifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {specifications.map((spec, index) => (
                        <div key={index} className="flex justify-between items-center py-1 border-b border-muted text-sm">
                          <span className="font-medium">{spec.label}:</span>
                          <span className="text-muted-foreground">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Customer Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[1, 2, 3].map((review) => (
                        <div key={review} className="border-b border-muted pb-3 last:border-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-warning text-warning" />
                              ))}
                            </div>
                            <span className="text-xs font-medium">John D.</span>
                            <span className="text-xs text-muted-foreground">Verified Purchase</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Great quality product. Works exactly as described and shipping was fast.
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}