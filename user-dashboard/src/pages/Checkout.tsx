import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Check } from "lucide-react";
import CheckoutHeader from "../components/header/CheckoutHeader";
import Footer from "../components/footer/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useCart } from "@/context/cart";
import {
  createOrder,
  formatProductPrice,
  getProductsBulk,
  getStorefrontPublicSettings,
  getShippingQuote,
  initializeCheckoutPayment,
  upsertAbandonedCart,
  validatePromoCode,
  verifyCheckoutPayment,
  StorefrontPublicSettings,
  ShippingOption,
  OrderResponse,
} from "@/lib/api";
import {
  calculateTaxCents,
  DEFAULT_RETURN_POLICY,
  formatTaxRate,
  setTaxRatePercent,
} from "@/lib/pricing";
import { trackEvent } from "@/lib/analytics";
import { useAuth } from "@/context/auth";
import { usePageMeta } from "@/hooks/usePageMeta";

const Checkout = () => {
  usePageMeta({
    title: "Checkout | Raph Supply",
    description: "Complete your hardware order with secure checkout, live shipping, promo validation, and branch pickup options.",
  });
  const PENDING_CHECKOUT_KEY = "pending_checkout_order_v1";
  const fallbackPaymentMethods: StorefrontPublicSettings["payment"]["methods"] = [
    { id: "card", label: "Credit / Debit Card", enabled: true },
    { id: "mpesa", label: "M-Pesa", enabled: true },
  ];
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [customerDetails, setCustomerDetails] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [shippingAddress, setShippingAddress] = useState({
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [hasSeparateBilling, setHasSeparateBilling] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [shippingOption, setShippingOption] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [paymentMethods, setPaymentMethods] = useState<StorefrontPublicSettings["payment"]["methods"]>(
    fallbackPaymentMethods
  );
  const [mpesaDetails, setMpesaDetails] = useState({
    phoneNumber: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountCents: number; description?: string } | null>(null);
  const [promoMessage, setPromoMessage] = useState("");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [orderSummary, setOrderSummary] = useState<OrderResponse | null>(null);
  const checkoutTrackedRef = useRef(false);
  const abandonedCartTimerRef = useRef<number | null>(null);
  const shippingFetchTimerRef = useRef<number | null>(null);
  const inventorySyncTimerRef = useRef<number | null>(null);
  const lastInventorySyncKeyRef = useRef("");
  const inFlightInventorySyncKeyRef = useRef<string | null>(null);

  const { items: cartItems, updateQuantity, subtotalCents, syncItems, clear } = useCart();
  const { currentUser } = useAuth();
  const currency = cartItems[0]?.currency ?? "USD";
  const formatTotal = (valueCents: number) => formatProductPrice({ priceCents: valueCents, currency });

  const prioritizedShippingOptions = [
    ...(["standard", "express", "pickup"]
      .map((id) => shippingOptions.find((option) => option.id === id))
      .filter(Boolean) as ShippingOption[]),
    ...shippingOptions.filter((option) => !["standard", "express", "pickup"].includes(option.id)),
  ];
  const shippingModeCopy: Record<string, string[]> = {
    standard: [
      "Flat rate for small items.",
      "Weight-based pricing for heavy materials.",
      "Doorstep delivery.",
    ],
    express: [
      "Same-day delivery within city.",
      "Next-day delivery across major towns.",
      "Higher fee for priority handling.",
    ],
    pickup: [
      "Order online and pick up at a branch/warehouse.",
      "Usually free.",
    ],
  };
  const getEstimatedShippingOptions = (city: string): ShippingOption[] => {
    const normalizedCity = city.trim().toLowerCase();
    const expressEstimate =
      normalizedCity === "nairobi"
        ? "Same-day delivery (within city)"
        : "Next-day delivery (major towns)";

    return [
      {
        id: "standard",
        label: "Standard Home Delivery",
        amountCents: 450,
        deliveryEstimate: "Delivery in 2-5 business days",
      },
      {
        id: "express",
        label: "Express Delivery",
        amountCents: 1100,
        deliveryEstimate: expressEstimate,
      },
      {
        id: "pickup",
        label: "Click & Collect (Pickup Station)",
        amountCents: 0,
        deliveryEstimate: "Pick up from store branch or warehouse",
      },
    ];
  };
  const availableShippingOptions =
    prioritizedShippingOptions.length > 0
      ? prioritizedShippingOptions
      : getEstimatedShippingOptions(shippingAddress.city);
  const enabledPaymentMethods = paymentMethods.filter((method) => method.enabled);
  const selectedPaymentMethod =
    enabledPaymentMethods.find((method) => method.id === paymentMethod) ?? enabledPaymentMethods[0];
  const selectedShipping =
    availableShippingOptions.find((option) => option.id === shippingOption) ??
    availableShippingOptions.find((option) => option.id === "standard") ??
    availableShippingOptions[0];
  const requiresShipping = (selectedShipping?.id ?? shippingOption) !== "pickup";
  const shippingCents = selectedShipping?.amountCents ?? 0;
  const taxCents = calculateTaxCents(subtotalCents);
  const discountCents = appliedPromo?.discountCents ?? 0;
  const totalCents = subtotalCents + shippingCents + taxCents - discountCents;

  const handleDiscountSubmit = async () => {
    if (!discountCode.trim()) {
      setPromoMessage("Enter a promo code first.");
      return;
    }

    try {
      const result = await validatePromoCode({
        code: discountCode.trim(),
        subtotalCents,
        accountType: currentUser?.accountType,
        userId: currentUser?.id,
      });
      if (!result.valid) {
        setAppliedPromo(null);
        setPromoMessage(result.message);
        return;
      }
      setAppliedPromo({
        code: result.code,
        discountCents: result.discountCents,
        description: result.description,
      });
      setPromoMessage(result.message);
      setShowDiscountInput(false);
      trackEvent("promo_applied", { code: result.code, discountCents: result.discountCents }, customerDetails.email || undefined);
    } catch (error) {
      setAppliedPromo(null);
      setPromoMessage(error instanceof Error ? error.message : "Unable to apply promo code.");
    }
  };

  const handleCustomerDetailsChange = (field: string, value: string) => {
    setCustomerDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleShippingAddressChange = (field: string, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleBillingDetailsChange = (field: string, value: string) => {
    setBillingDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleMpesaDetailsChange = (field: string, value: string) => {
    setMpesaDetails((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    let active = true;
    const loadStorefrontSettings = async () => {
      try {
        const settings = await getStorefrontPublicSettings();
        if (!active) return;

        if (settings.tax?.taxRatePercent >= 0) {
          setTaxRatePercent(settings.tax.taxRatePercent);
        }

        const methods =
          settings.payment?.methods?.filter(
            (method) => method && method.id && method.label && method.id !== "bank_transfer"
          ) ?? [];
        const nextMethods = methods.length > 0 ? methods : fallbackPaymentMethods;
        const enabled = nextMethods.filter((method) => method.enabled);

        setPaymentMethods(nextMethods);
        setPaymentMethod((current) => {
          if (enabled.some((method) => method.id === current)) return current;
          return enabled[0]?.id ?? nextMethods[0].id;
        });
      } catch {
        if (!active) return;
        setPaymentMethods(fallbackPaymentMethods);
      }
    };

    void loadStorefrontSettings();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (cartItems.length === 0) return;
    if (checkoutTrackedRef.current) return;
    checkoutTrackedRef.current = true;
    trackEvent(
      "checkout_start",
      {
        items: cartItems.map((item) => ({ id: item.id, quantity: item.quantity })),
        subtotalCents,
        currency,
      },
      customerDetails.email || undefined
    );
  }, [cartItems, customerDetails.email, subtotalCents, currency]);

  useEffect(() => {
    if (cartItems.length === 0) return;
    let active = true;

    if (shippingFetchTimerRef.current) {
      window.clearTimeout(shippingFetchTimerRef.current);
    }

    shippingFetchTimerRef.current = window.setTimeout(async () => {
      setShippingLoading(true);
      setShippingError("");
      const estimatedOptions = getEstimatedShippingOptions(shippingAddress.city);
      try {
        const quote = await getShippingQuote({
          currency,
          items: cartItems.map((item) => ({ productId: item.id, quantity: item.quantity })),
          destination: requiresShipping
            ? {
                country: shippingAddress.country || undefined,
                postalCode: shippingAddress.postalCode || undefined,
                city: shippingAddress.city || undefined,
              }
            : undefined,
        });
        if (!active) return;
        const liveOptions = Array.isArray(quote.options)
          ? quote.options.filter((option) => option && typeof option.id === "string")
          : [];
        const nextOptions = liveOptions.length > 0 ? liveOptions : estimatedOptions;
        setShippingOptions(nextOptions);
        if (liveOptions.length === 0) {
          setShippingError("Live shipping rates are temporarily unavailable. Showing estimated options.");
        }
        setShippingOption((currentOption) => {
          const hasCurrent = nextOptions.some((option) => option.id === currentOption);
          if (hasCurrent) return currentOption;

          return (
            nextOptions.find((option) => option.id === "standard")?.id ??
            nextOptions.find((option) => option.id === "pickup")?.id ??
            nextOptions[0]?.id ??
            "standard"
          );
        });
      } catch (err) {
        if (!active) return;
        setShippingOptions(estimatedOptions);
        setShippingError("Live shipping rates are temporarily unavailable. Showing estimated options.");
      } finally {
        if (active) setShippingLoading(false);
      }
    }, 400);

    return () => {
      active = false;
      if (shippingFetchTimerRef.current) {
        window.clearTimeout(shippingFetchTimerRef.current);
      }
    };
  }, [
    cartItems,
    currency,
    requiresShipping,
    shippingAddress.city,
    shippingAddress.country,
    shippingAddress.postalCode,
  ]);

  useEffect(() => {
    if (cartItems.length === 0) {
      lastInventorySyncKeyRef.current = "";
      inFlightInventorySyncKeyRef.current = null;
      if (inventorySyncTimerRef.current) {
        window.clearTimeout(inventorySyncTimerRef.current);
      }
      return;
    }

    const syncKey = cartItems
      .map((item) => `${item.id}:${item.quantity}`)
      .sort()
      .join("|");

    if (
      syncKey === lastInventorySyncKeyRef.current ||
      syncKey === inFlightInventorySyncKeyRef.current
    ) {
      return;
    }

    let active = true;

    if (inventorySyncTimerRef.current) {
      window.clearTimeout(inventorySyncTimerRef.current);
    }

    inventorySyncTimerRef.current = window.setTimeout(async () => {
      inFlightInventorySyncKeyRef.current = syncKey;
      try {
        const products = await getProductsBulk(cartItems.map((item) => item.id));
        if (!active) return;
        let adjusted = false;
        for (const item of cartItems) {
          const product = products.find((p) => p.id === item.id);
          if (!product) continue;
          const max = product.stock > 0 ? product.stock : product.backorderable ? 10 : 0;
          if (item.quantity > max) {
            adjusted = true;
          }
        }
        if (adjusted) {
          setValidationErrors((prev) => ({
            ...prev,
            inventory: "Some quantities were adjusted to match live stock levels.",
          }));
        }
        syncItems(products);
        lastInventorySyncKeyRef.current = syncKey;
      } catch {
        // Ignore sync errors to avoid blocking checkout.
      } finally {
        if (inFlightInventorySyncKeyRef.current === syncKey) {
          inFlightInventorySyncKeyRef.current = null;
        }
      }
    }, 250);

    return () => {
      active = false;
      if (inventorySyncTimerRef.current) {
        window.clearTimeout(inventorySyncTimerRef.current);
      }
    };
  }, [cartItems, syncItems]);

  useEffect(() => {
    if (paymentComplete) return;
    if (!customerDetails.email || cartItems.length === 0) return;

    if (abandonedCartTimerRef.current) {
      window.clearTimeout(abandonedCartTimerRef.current);
    }

    abandonedCartTimerRef.current = window.setTimeout(() => {
      upsertAbandonedCart({
        customerEmail: customerDetails.email,
        currency,
        subtotalCents,
        cartItems: cartItems.map((item) => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
        })),
      });
    }, 1200);

    return () => {
      if (abandonedCartTimerRef.current) {
        window.clearTimeout(abandonedCartTimerRef.current);
      }
    };
  }, [cartItems, currency, customerDetails.email, paymentComplete, subtotalCents]);

  const buildOrderPayload = () => ({
    customer: {
      email: customerDetails.email,
      firstName: customerDetails.firstName,
      lastName: customerDetails.lastName,
      phone: customerDetails.phone || undefined,
    },
    items: cartItems.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
    })),
    shippingMethod: selectedShipping?.id ?? shippingOption,
    shippingAddress: requiresShipping
      ? {
          address: shippingAddress.address,
          city: shippingAddress.city,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country,
        }
      : undefined,
    billingAddress: hasSeparateBilling
      ? {
          address: billingDetails.address,
          city: billingDetails.city,
          postalCode: billingDetails.postalCode,
          country: billingDetails.country,
        }
      : undefined,
    totals: {
      taxCents,
      shippingCents,
    },
    promo: appliedPromo
      ? {
          code: appliedPromo.code,
          discountCents: appliedPromo.discountCents,
        }
      : undefined,
  });

  useEffect(() => {
    let active = true;

    const query = new URLSearchParams(window.location.search);
    const txRef =
      query.get("tx_ref") ||
      query.get("merchant_reference") ||
      query.get("OrderMerchantReference");
    const transactionId =
      query.get("transaction_id") ||
      query.get("order_tracking_id") ||
      query.get("OrderTrackingId");
    const status =
      (query.get("status") || query.get("payment_status") || query.get("Status") || "").toLowerCase();
    if (!txRef && !transactionId && !status) return;

    const clearPaymentQueryParams = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("status");
      url.searchParams.delete("payment_status");
      url.searchParams.delete("Status");
      url.searchParams.delete("tx_ref");
      url.searchParams.delete("transaction_id");
      url.searchParams.delete("merchant_reference");
      url.searchParams.delete("order_tracking_id");
      url.searchParams.delete("OrderMerchantReference");
      url.searchParams.delete("OrderTrackingId");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    };

    const pendingRaw = window.sessionStorage.getItem(PENDING_CHECKOUT_KEY);
    if (!pendingRaw) {
      clearPaymentQueryParams();
      return;
    }

    const finalize = async () => {
      try {
        const pending = JSON.parse(pendingRaw) as {
          method: "card" | "mpesa";
          totalCents: number;
          currency: string;
          orderPayload: ReturnType<typeof buildOrderPayload>;
          customerEmail: string;
        };

        if (!txRef || !transactionId) {
          throw new Error("Payment callback is incomplete. Missing transaction reference.");
        }

        const explicitFailure =
          status === "failed" || status === "cancelled" || status === "canceled" || status === "invalid";
        if (explicitFailure) {
          throw new Error("Payment was cancelled or failed.");
        }

        setIsProcessing(true);
        const verification = await verifyCheckoutPayment({
          method: pending.method,
          txRef,
          transactionId,
          expectedAmountCents: pending.totalCents,
          expectedCurrency: pending.currency,
        });

        if (!verification.verified) {
          throw new Error("Payment verification failed. Please contact support if you were charged.");
        }

        const order = await createOrder({
          ...pending.orderPayload,
          payment: {
            method: pending.method,
            provider: verification.provider,
            txRef: verification.txRef,
            transactionId: verification.transactionId,
            status: verification.status,
            amountCents: verification.amountCents,
            currency: verification.currency,
            verifiedAt: new Date().toISOString(),
            metadata: {
              paymentType: verification.paymentType,
              processorResponse: verification.processorResponse,
            },
          },
        });

        if (!active) return;
        setOrderSummary(order);
        trackEvent(
          "purchase",
          {
            orderId: order.id,
            totalCents: order.totalCents,
            currency: order.currency,
            items: order.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              backordered: item.backordered,
            })),
            paymentMethod: pending.method,
          },
          pending.customerEmail
        );
        clear();
        setPaymentComplete(true);
        setValidationErrors({});
      } catch (error) {
        if (!active) return;
        setValidationErrors((prev) => ({
          ...prev,
          payment: error instanceof Error ? error.message : "Unable to verify your payment.",
        }));
      } finally {
        if (active) {
          setIsProcessing(false);
          window.sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
          clearPaymentQueryParams();
        }
      }
    };

    void finalize();

    return () => {
      active = false;
    };
  }, [PENDING_CHECKOUT_KEY, clear]);

  const validateCheckout = () => {
    const errors: Record<string, string> = {};
    const emailRegex = /\S+@\S+\.\S+/;

    if (!customerDetails.email || !emailRegex.test(customerDetails.email)) {
      errors.email = "Valid email is required.";
    }
    if (!customerDetails.firstName.trim()) {
      errors.firstName = "First name is required.";
    }
    if (!customerDetails.lastName.trim()) {
      errors.lastName = "Last name is required.";
    }

    if (requiresShipping) {
      if (!shippingAddress.address.trim()) errors.shippingAddress = "Shipping address is required.";
      if (!shippingAddress.city.trim()) errors.shippingCity = "City is required.";
      if (!shippingAddress.postalCode.trim()) errors.shippingPostalCode = "Postal code is required.";
      if (!shippingAddress.country.trim()) errors.shippingCountry = "Country is required.";
    }

    if (hasSeparateBilling) {
      if (!billingDetails.email || !emailRegex.test(billingDetails.email)) {
        errors.billingEmail = "Valid billing email is required.";
      }
      if (!billingDetails.firstName.trim()) errors.billingFirstName = "Billing first name is required.";
      if (!billingDetails.lastName.trim()) errors.billingLastName = "Billing last name is required.";
      if (!billingDetails.address.trim()) errors.billingAddress = "Billing address is required.";
      if (!billingDetails.city.trim()) errors.billingCity = "Billing city is required.";
      if (!billingDetails.postalCode.trim()) errors.billingPostalCode = "Billing postal code is required.";
      if (!billingDetails.country.trim()) errors.billingCountry = "Billing country is required.";
    }

    if (!isPaymentReady) {
      errors.payment = "Complete payment details to proceed.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCompleteOrder = async () => {
    if (!validateCheckout()) {
      return;
    }

    setIsProcessing(true);

    try {
      const orderPayload = buildOrderPayload();

      if (paymentMethod === "card") {
        const init = await initializeCheckoutPayment({
          method: "card",
          amountCents: totalCents,
          currency,
          customer: {
            email: customerDetails.email,
            fullName: `${customerDetails.firstName} ${customerDetails.lastName}`.trim(),
            phone: customerDetails.phone,
          },
          metadata: {
            source: "user-dashboard-checkout",
            cartItemCount: cartItems.length,
          },
        });

        if (!init.checkoutUrl) {
          throw new Error("Unable to initialize card checkout.");
        }

        window.sessionStorage.setItem(
          PENDING_CHECKOUT_KEY,
          JSON.stringify({
            method: "card",
            totalCents,
            currency,
            orderPayload,
            customerEmail: customerDetails.email,
          })
        );
        window.location.assign(init.checkoutUrl);
        return;
      }

      if (paymentMethod === "mpesa") {
        const init = await initializeCheckoutPayment({
          method: "mpesa",
          amountCents: totalCents,
          currency,
          customer: {
            email: customerDetails.email,
            fullName: `${customerDetails.firstName} ${customerDetails.lastName}`.trim(),
            phone: mpesaDetails.phoneNumber || customerDetails.phone,
          },
          metadata: {
            source: "user-dashboard-checkout",
            cartItemCount: cartItems.length,
          },
        });

        const maxAttempts = 5;
        const waitMs = 15000;
        let verification = null as Awaited<ReturnType<typeof verifyCheckoutPayment>> | null;
        let transientVerifyError: Error | null = null;
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          try {
            verification = await verifyCheckoutPayment({
              method: "mpesa",
              txRef: init.txRef,
              transactionId: init.transactionId,
              expectedAmountCents: totalCents,
              expectedCurrency: currency,
            });
            transientVerifyError = null;
            if (verification.verified) break;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error ?? "");
            const isTransient = /SpikeArrestViolation|rate|tempor|unavailable|timeout|gateway/i.test(message);
            if (!isTransient) {
              throw error;
            }
            transientVerifyError =
              error instanceof Error
                ? error
                : new Error("Temporary M-Pesa verification error.");
          }
          if (attempt === maxAttempts - 1) break;
          await new Promise((resolve) => window.setTimeout(resolve, waitMs));
        }

        if (!verification?.verified) {
          if (transientVerifyError) {
            throw new Error("M-Pesa verification is delayed due to provider throttling. Please retry shortly.");
          }
          throw new Error(
            "M-Pesa payment is still pending. Please complete the STK prompt on your phone, then try again."
          );
        }

        const order = await createOrder({
          ...orderPayload,
          payment: {
            method: "mpesa",
            provider: verification.provider,
            txRef: verification.txRef,
            transactionId: verification.transactionId,
            status: verification.status,
            amountCents: verification.amountCents,
            currency: verification.currency,
            verifiedAt: new Date().toISOString(),
            metadata: {
              paymentType: verification.paymentType,
              processorResponse: verification.processorResponse,
            },
          },
        });

        setOrderSummary(order);
        trackEvent(
          "purchase",
          {
            orderId: order.id,
            totalCents: order.totalCents,
            currency: order.currency,
            items: order.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              backordered: item.backordered,
            })),
            paymentMethod: "mpesa",
          },
          customerDetails.email
        );
        clear();
        setPaymentComplete(true);
        return;
      }

      const order = await createOrder({
        ...orderPayload,
        payment: {
          method: "cod",
          provider: "manual",
          txRef: `COD-${Date.now()}`,
          transactionId: `COD-${Date.now()}`,
          status: "pending",
          amountCents: totalCents,
          currency,
        },
      });

      setOrderSummary(order);
      trackEvent(
        "purchase",
        {
          orderId: order.id,
          totalCents: order.totalCents,
          currency: order.currency,
          items: order.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            backordered: item.backordered,
          })),
          paymentMethod: "cod",
        },
        customerDetails.email
      );

      clear();
      setPaymentComplete(true);
    } catch (err) {
      setValidationErrors((prev) => ({
        ...prev,
        payment: err instanceof Error ? err.message : "Unable to complete order.",
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const isCardReady = true;
  const isMpesaReady = !!mpesaDetails.phoneNumber;
  const isPaymentReady =
    paymentMethod === "card"
      ? isCardReady
      : paymentMethod === "mpesa"
        ? isMpesaReady
        : true;

  return (
    <div className="min-h-screen bg-background">
      <CheckoutHeader />

      <main className="pt-6 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Summary - First on mobile, last on desktop */}
            <div className="lg:col-span-1 lg:order-2">
              <div className="bg-muted/20 p-5 sm:p-8 rounded-none lg:sticky lg:top-6">
                <h2 className="text-lg font-light text-foreground mb-6">Order Summary</h2>

                <div className="space-y-6">
                  {cartItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Your bag is empty.</p>
                  ) : (
                    cartItems.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="w-20 h-20 bg-muted rounded-none overflow-hidden">
                          <img
                            src={item.imageUrl || "/placeholder.svg"}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-light text-foreground">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.category}</p>

                          {/* Quantity controls */}
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-8 w-8 p-0 rounded-none border-muted-foreground/20"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium text-foreground min-w-[2ch] text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-8 w-8 p-0 rounded-none border-muted-foreground/20"
                              disabled={item.stock <= 0 || item.quantity >= item.stock}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-foreground font-medium">{formatProductPrice(item)}</div>
                      </div>
                    ))
                  )}
                </div>
                {validationErrors.inventory && (
                  <p className="text-xs text-amber-600 mt-4">{validationErrors.inventory}</p>
                )}

                {/* Discount Code Section */}
                <div className="mt-8 pt-6 border-t border-muted-foreground/20">
                  {!showDiscountInput ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowDiscountInput(true)}
                        className="text-sm text-foreground underline hover:no-underline transition-all"
                      >
                        {appliedPromo ? `Promo applied: ${appliedPromo.code}` : "Discount code"}
                      </button>
                      {promoMessage && <p className="text-xs text-muted-foreground">{promoMessage}</p>}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value)}
                          placeholder="Enter discount code"
                          className="flex-1 rounded-none"
                        />
                        <button
                          onClick={handleDiscountSubmit}
                          className="text-sm text-foreground underline hover:no-underline transition-all px-2"
                        >
                          Apply
                        </button>
                      </div>
                      {promoMessage && <p className="text-xs text-muted-foreground">{promoMessage}</p>}
                    </div>
                  )}
                </div>

                <div className="border-t border-muted-foreground/20 mt-4 pt-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{formatTotal(subtotalCents)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-muted-foreground">VAT ({formatTaxRate()})</span>
                    <span className="text-foreground">{formatTotal(taxCents)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-foreground">
                      {selectedShipping
                        ? `${selectedShipping.label} (${shippingCents === 0 ? "Free" : formatTotal(shippingCents)})`
                        : "Calculated at checkout"}
                    </span>
                  </div>
                  {discountCents > 0 && (
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-muted-foreground">Promo ({appliedPromo?.code})</span>
                      <span className="text-emerald-700">- {formatTotal(discountCents)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm mt-3 border-t border-muted-foreground/20 pt-3">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-foreground">{formatTotal(totalCents)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Left Column - Forms */}
            <div className="lg:col-span-2 lg:order-1 space-y-8">
              {/* Customer Details Form */}
              <div className="bg-muted/20 p-5 sm:p-8 rounded-none">
                <h2 className="text-lg font-light text-foreground mb-6">Customer Details</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Checkout as guest — no account required.
                </p>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="email" className="text-sm font-light text-foreground">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerDetails.email}
                      onChange={(e) => handleCustomerDetailsChange("email", e.target.value)}
                      className="mt-2 rounded-none"
                      placeholder="Enter your email"
                    />
                    {validationErrors.email && (
                      <p className="text-xs text-rose-600 mt-1">{validationErrors.email}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-light text-foreground">
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={customerDetails.firstName}
                        onChange={(e) => handleCustomerDetailsChange("firstName", e.target.value)}
                        className="mt-2 rounded-none"
                        placeholder="First name"
                      />
                      {validationErrors.firstName && (
                        <p className="text-xs text-rose-600 mt-1">{validationErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-light text-foreground">
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={customerDetails.lastName}
                        onChange={(e) => handleCustomerDetailsChange("lastName", e.target.value)}
                        className="mt-2 rounded-none"
                        placeholder="Last name"
                      />
                      {validationErrors.lastName && (
                        <p className="text-xs text-rose-600 mt-1">{validationErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-light text-foreground">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerDetails.phone}
                      onChange={(e) => handleCustomerDetailsChange("phone", e.target.value)}
                      className="mt-2 rounded-none"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  {/* Shipping Address */}
                  <div className="border-t border-muted-foreground/20 pt-6 mt-8">
                    <h3 className="text-base font-light text-foreground mb-2">Delivery Address</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Required for Standard Home Delivery and Express Delivery.
                    </p>

                    {requiresShipping ? (
                      <div className="space-y-4">
                      <div>
                        <Label htmlFor="shippingAddress" className="text-sm font-light text-foreground">
                          Address
                        </Label>
                        <Input
                          id="shippingAddress"
                          type="text"
                          value={shippingAddress.address}
                          onChange={(e) => handleShippingAddressChange("address", e.target.value)}
                          className="mt-2 rounded-none"
                          placeholder="Street address"
                        />
                        {validationErrors.shippingAddress && (
                          <p className="text-xs text-rose-600 mt-1">{validationErrors.shippingAddress}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="shippingCity" className="text-sm font-light text-foreground">
                            City
                          </Label>
                          <Input
                            id="shippingCity"
                            type="text"
                            value={shippingAddress.city}
                            onChange={(e) => handleShippingAddressChange("city", e.target.value)}
                            className="mt-2 rounded-none"
                            placeholder="City"
                          />
                          {validationErrors.shippingCity && (
                            <p className="text-xs text-rose-600 mt-1">{validationErrors.shippingCity}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="shippingPostalCode" className="text-sm font-light text-foreground">
                            Postal Code
                          </Label>
                          <Input
                            id="shippingPostalCode"
                            type="text"
                            value={shippingAddress.postalCode}
                            onChange={(e) => handleShippingAddressChange("postalCode", e.target.value)}
                            className="mt-2 rounded-none"
                            placeholder="Postal code"
                          />
                          {validationErrors.shippingPostalCode && (
                            <p className="text-xs text-rose-600 mt-1">{validationErrors.shippingPostalCode}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="shippingCountry" className="text-sm font-light text-foreground">
                          Country
                        </Label>
                        <Input
                          id="shippingCountry"
                          type="text"
                          value={shippingAddress.country}
                          onChange={(e) => handleShippingAddressChange("country", e.target.value)}
                          className="mt-2 rounded-none"
                          placeholder="Country"
                        />
                        {validationErrors.shippingCountry && (
                          <p className="text-xs text-rose-600 mt-1">{validationErrors.shippingCountry}</p>
                        )}
                      </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Click & Collect selected. You can complete checkout without entering a delivery address.
                      </p>
                    )}
                  </div>

                  {/* Billing Address Checkbox */}
                  <div className="border-t border-muted-foreground/20 pt-6 mt-8">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="separateBilling"
                        checked={hasSeparateBilling}
                        onCheckedChange={(checked) => setHasSeparateBilling(checked === true)}
                      />
                      <Label htmlFor="separateBilling" className="text-sm font-light text-foreground cursor-pointer">
                        Other billing address
                      </Label>
                    </div>
                  </div>

                  {/* Billing Details - shown when checkbox is checked */}
                  {hasSeparateBilling && (
                    <div className="space-y-6 pt-4">
                      <h3 className="text-base font-light text-foreground">Billing Details</h3>

                      <div>
                        <Label htmlFor="billingEmail" className="text-sm font-light text-foreground">
                          Email Address *
                        </Label>
                      <Input
                        id="billingEmail"
                        type="email"
                        value={billingDetails.email}
                        onChange={(e) => handleBillingDetailsChange("email", e.target.value)}
                        className="mt-2 rounded-none"
                        placeholder="Enter billing email"
                      />
                      {validationErrors.billingEmail && (
                        <p className="text-xs text-rose-600 mt-1">{validationErrors.billingEmail}</p>
                      )}
                    </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="billingFirstName" className="text-sm font-light text-foreground">
                            First Name *
                          </Label>
                        <Input
                          id="billingFirstName"
                          type="text"
                          value={billingDetails.firstName}
                          onChange={(e) => handleBillingDetailsChange("firstName", e.target.value)}
                          className="mt-2 rounded-none"
                          placeholder="First name"
                        />
                        {validationErrors.billingFirstName && (
                          <p className="text-xs text-rose-600 mt-1">{validationErrors.billingFirstName}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="billingLastName" className="text-sm font-light text-foreground">
                          Last Name *
                        </Label>
                        <Input
                          id="billingLastName"
                          type="text"
                          value={billingDetails.lastName}
                          onChange={(e) => handleBillingDetailsChange("lastName", e.target.value)}
                          className="mt-2 rounded-none"
                          placeholder="Last name"
                        />
                        {validationErrors.billingLastName && (
                          <p className="text-xs text-rose-600 mt-1">{validationErrors.billingLastName}</p>
                        )}
                      </div>
                    </div>

                      <div>
                        <Label htmlFor="billingPhone" className="text-sm font-light text-foreground">
                          Phone Number
                        </Label>
                        <Input
                          id="billingPhone"
                          type="tel"
                          value={billingDetails.phone}
                          onChange={(e) => handleBillingDetailsChange("phone", e.target.value)}
                          className="mt-2 rounded-none"
                          placeholder="Enter billing phone number"
                        />
                      </div>

                      <div>
                        <Label htmlFor="billingAddress" className="text-sm font-light text-foreground">
                          Address *
                        </Label>
                        <Input
                          id="billingAddress"
                          type="text"
                          value={billingDetails.address}
                          onChange={(e) => handleBillingDetailsChange("address", e.target.value)}
                          className="mt-2 rounded-none"
                          placeholder="Street address"
                        />
                        {validationErrors.billingAddress && (
                          <p className="text-xs text-rose-600 mt-1">{validationErrors.billingAddress}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="billingCity" className="text-sm font-light text-foreground">
                            City *
                          </Label>
                          <Input
                            id="billingCity"
                            type="text"
                            value={billingDetails.city}
                            onChange={(e) => handleBillingDetailsChange("city", e.target.value)}
                            className="mt-2 rounded-none"
                            placeholder="City"
                          />
                          {validationErrors.billingCity && (
                            <p className="text-xs text-rose-600 mt-1">{validationErrors.billingCity}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="billingPostalCode" className="text-sm font-light text-foreground">
                            Postal Code *
                          </Label>
                          <Input
                            id="billingPostalCode"
                            type="text"
                            value={billingDetails.postalCode}
                            onChange={(e) => handleBillingDetailsChange("postalCode", e.target.value)}
                            className="mt-2 rounded-none"
                            placeholder="Postal code"
                          />
                          {validationErrors.billingPostalCode && (
                            <p className="text-xs text-rose-600 mt-1">{validationErrors.billingPostalCode}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="billingCountry" className="text-sm font-light text-foreground">
                          Country *
                        </Label>
                        <Input
                          id="billingCountry"
                          type="text"
                          value={billingDetails.country}
                          onChange={(e) => handleBillingDetailsChange("country", e.target.value)}
                          className="mt-2 rounded-none"
                          placeholder="Country"
                        />
                        {validationErrors.billingCountry && (
                          <p className="text-xs text-rose-600 mt-1">{validationErrors.billingCountry}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Options */}
              <div className="bg-muted/20 p-5 sm:p-8 rounded-none">
                <h2 className="text-lg font-light text-foreground mb-6">Shipping Options</h2>
                <div className="space-y-4 min-h-[170px]">
                  {shippingLoading ? (
                    <div className="space-y-3 animate-pulse">
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="h-24 bg-muted/30 rounded-none" />
                      ))}
                    </div>
                  ) : (
                    <>
                      {shippingError && (
                        <p className="text-xs text-amber-600">{shippingError}</p>
                      )}
                      <RadioGroup
                        value={selectedShipping?.id ?? shippingOption}
                        onValueChange={setShippingOption}
                        className="space-y-4"
                      >
                        {availableShippingOptions.map((option) => (
                          <div
                            key={option.id}
                            className={`p-4 border rounded-none transition-colors ${
                              (selectedShipping?.id ?? shippingOption) === option.id
                                ? "border-foreground bg-muted/30"
                                : "border-muted-foreground/20"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start space-x-3">
                                <RadioGroupItem value={option.id} id={option.id} className="mt-0.5" />
                                <div>
                                  <Label htmlFor={option.id} className="font-light text-foreground">
                                    {option.label}
                                  </Label>
                                  <p className="text-sm text-muted-foreground mt-1">{option.deliveryEstimate}</p>
                                </div>
                              </div>
                              <div className="text-sm text-foreground whitespace-nowrap">
                                {option.amountCents === 0 ? "Free" : formatTotal(option.amountCents)}
                              </div>
                            </div>
                            {shippingModeCopy[option.id] && (
                              <ul className="mt-3 ml-8 text-xs text-muted-foreground space-y-1">
                                {shippingModeCopy[option.id].map((detail) => (
                                  <li key={detail}>{detail}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </RadioGroup>
                    </>
                  )}
                </div>
              </div>

              {/* Payment Section */}
              <div className="bg-muted/20 p-5 sm:p-8 rounded-none">
                <h2 className="text-lg font-light text-foreground mb-6">Payment Details</h2>

                {!paymentComplete ? (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm font-light text-foreground">Payment Method</Label>
                      <RadioGroup
                        value={paymentMethod}
                        onValueChange={setPaymentMethod}
                        className="space-y-3 mt-3"
                      >
                        {enabledPaymentMethods.map((method) => (
                          <div
                            key={method.id}
                            className="flex items-center justify-between p-4 border border-muted-foreground/20 rounded-none"
                          >
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem
                                value={method.id}
                                id={`payment-${method.id}`}
                              />
                              <Label
                                htmlFor={`payment-${method.id}`}
                                className="font-light text-foreground"
                              >
                                {method.label}
                              </Label>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {paymentMethod === "card" ? (
                      <div className="space-y-3 rounded-none border border-muted-foreground/20 p-4">
                        <p className="text-sm font-light text-foreground">
                          You will be redirected to our secure card payment gateway to complete your credit/debit card payment.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          We do not store card numbers in this checkout form.
                        </p>
                      </div>
                    ) : paymentMethod === "mpesa" ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="mpesaPhone" className="text-sm font-light text-foreground">
                            M-Pesa Phone Number *
                          </Label>
                          <Input
                            id="mpesaPhone"
                            type="tel"
                            value={mpesaDetails.phoneNumber}
                            onChange={(e) => handleMpesaDetailsChange("phoneNumber", e.target.value)}
                            className="mt-2 rounded-none"
                            placeholder="e.g. +254 7XX XXX XXX"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          You will receive an STK push prompt on your phone. Approve it to complete payment.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {selectedPaymentMethod?.label ?? "Selected payment method"} is enabled for this checkout.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Complete the order to receive payment instructions for this method.
                        </p>
                      </div>
                    )}

                    {/* Order Total Summary */}
                    <div className="bg-muted/10 p-6 rounded-none border border-muted-foreground/20 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="text-foreground">{formatTotal(subtotalCents)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">VAT ({formatTaxRate()})</span>
                        <span className="text-foreground">{formatTotal(taxCents)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="text-foreground">
                          {selectedShipping
                            ? `${selectedShipping.label} (${shippingCents === 0 ? "Free" : formatTotal(shippingCents)})`
                            : "Calculated at checkout"}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-medium border-t border-muted-foreground/20 pt-3">
                        <span className="text-foreground">Total</span>
                        <span className="text-foreground">{formatTotal(totalCents)}</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleCompleteOrder}
                      disabled={
                        isProcessing ||
                        cartItems.length === 0 ||
                        !isPaymentReady
                      }
                      className="w-full rounded-none h-12 text-base"
                    >
                      {isProcessing
                        ? "Processing..."
                        : paymentMethod === "card" || paymentMethod === "mpesa"
                          ? `Pay Now - ${formatTotal(totalCents)}`
                          : `Complete Order - ${formatTotal(totalCents)}`}
                    </Button>
                    {validationErrors.payment && (
                      <p className="text-xs text-rose-600">{validationErrors.payment}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Return policy: {DEFAULT_RETURN_POLICY}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-light text-foreground mb-2">Order Complete!</h3>
                    <p className="text-muted-foreground">
                      Thank you for your purchase. Your order confirmation has been sent to your email.
                    </p>
                    {orderSummary && (
                      <div className="mt-4 text-sm text-muted-foreground space-y-2">
                        <p>Order ID: <span className="text-foreground">{orderSummary.id}</span></p>
                        {orderSummary.items.some((item) => item.backordered) && (
                          <p>
                            Some items are on backorder. We will notify you when they ship.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
