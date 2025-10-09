import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Smartphone, ShieldCheck, ArrowLeft } from "lucide-react";
import { formatPrice } from "@/utils/currency";

export default function Checkout() {
  const navigate = useNavigate();
  const { state, clearCart } = useCart();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "card">("card");
  const [isProcessing, setIsProcessing] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  const items = state.items;
  const subtotal = state.total;
  const shipping = subtotal > 100 ? 0 : 10;
  const tax = subtotal * 0.08;
  const totalAmount = subtotal + shipping + tax;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Please log in to checkout</h2>
            <Button onClick={() => navigate("/auth")}>Go to Login</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">{t.checkout.emptyCart}</h2>
            <Button onClick={() => navigate("/products")}>{t.checkout.continueShopping}</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          customer_email: email,
          customer_phone: phone,
          customer_name: name,
          subtotal: subtotal,
          shipping: shipping,
          tax: tax,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          payment_status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: t.checkout.paymentSuccess,
        description: `${t.checkout.paymentSuccessMessage} Order ID: ${order.id}`,
      });
      clearCart();
      navigate("/");
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "Failed to process order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 section">
        <div className="container max-w-6xl">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.checkout.backToCart}
          </Button>

          <h1 className="text-3xl font-bold mb-8">{t.checkout.title}</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{t.checkout.contactInformation}</CardTitle>
                  <CardDescription>{t.checkout.paymentSuccessMessage}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t.checkout.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t.checkout.enterEmail}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">{t.checkout.name}</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder={t.checkout.enterName}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t.checkout.phone}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={t.checkout.enterPhoneNumber}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>{t.checkout.paymentMethod}</CardTitle>
                  <CardDescription>{t.checkout.paymentSuccessMessage}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "mpesa" | "card")}>
                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                        <RadioGroupItem value="mpesa" id="mpesa" />
                        <Label htmlFor="mpesa" className="flex items-center gap-3 cursor-pointer flex-1">
                          <Smartphone className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="font-medium">{t.checkout.mpesa}</div>
                            <div className="text-sm text-muted-foreground">{t.checkout.mpesaInstructions}</div>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-medium">{t.checkout.card}</div>
                            <div className="text-sm text-muted-foreground">{t.checkout.securePaymentMessage}</div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>

                    {paymentMethod === "card" && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="space-y-2">
                          <Label htmlFor="cardNumber">{t.checkout.cardNumber}</Label>
                          <Input
                            id="cardNumber"
                            placeholder={t.checkout.enterCard}
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            maxLength={19}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="expiryDate">{t.checkout.expiryDate}</Label>
                            <Input
                              id="expiryDate"
                              placeholder={t.checkout.enterExpiry}
                              value={expiryDate}
                              onChange={(e) => setExpiryDate(e.target.value)}
                              maxLength={5}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cvv">{t.checkout.cvv}</Label>
                            <Input
                              id="cvv"
                              placeholder={t.checkout.enterCvv}
                              value={cvv}
                              onChange={(e) => setCvv(e.target.value)}
                              maxLength={4}
                              type="password"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ShieldCheck className="h-4 w-4" />
                      <span>{t.checkout.securePaymentMessage}</span>
                    </div>

                    <Button
                      type="submit"
                      className="w-full btn-primary"
                      size="lg"
                      disabled={isProcessing}
                    >
                      {isProcessing ? t.checkout.processing : `${t.checkout.completePayment} ${formatPrice(totalAmount)}`}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>{t.checkout.orderSummary}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{t.common.qty}: {item.quantity}</p>
                          <p className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t.checkout.subtotal}</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t.checkout.shipping}</span>
                      <span>{shipping === 0 ? t.checkout.free : formatPrice(shipping)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t.checkout.tax}</span>
                      <span>{formatPrice(tax)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>{t.checkout.total}</span>
                      <span>{formatPrice(totalAmount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
