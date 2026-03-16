import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  changeAccountPassword,
  createPaymentMethod,
  deleteAccount,
  deletePaymentMethod,
  formatProductPrice,
  getAccountOrders,
  getPaymentMethods,
  updateAccountProfile,
  updatePaymentMethod,
  type CustomerOrderSummary,
  type PaymentMethod,
} from "@/lib/api";
import {
  User,
  Package,
  CreditCard,
  Settings,
  LogOut,
  Edit,
  Plus,
  Trash2,
  ChevronRight,
  Mail,
  Phone,
  Truck,
  Clock,
  CheckCircle,
} from "lucide-react";

const Account = () => {
  const { currentUser, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(true);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [isPaymentSaving, setIsPaymentSaving] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    label: "",
    brand: "",
    last4: "",
    expMonth: "",
    expYear: "",
    isDefault: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleteBusy, setIsDeleteBusy] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        fullName: currentUser.fullName || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    setIsOrdersLoading(true);
    getAccountOrders()
      .then((items) => {
        if (!active) return;
        setOrders(items);
      })
      .catch(() => {
        if (!active) return;
        setOrders([]);
      })
      .finally(() => {
        if (active) setIsOrdersLoading(false);
      });
    return () => {
      active = false;
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    setIsPaymentsLoading(true);
    getPaymentMethods()
      .then((methods) => {
        if (!active) return;
        setPaymentMethods(methods);
      })
      .catch(() => {
        if (!active) return;
        setPaymentMethods([]);
      })
      .finally(() => {
        if (active) setIsPaymentsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileSaving(true);
    setProfileMessage(null);
    setProfileError(null);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim() || undefined,
      };
      await updateAccountProfile(payload);
      await refreshProfile();
      setIsEditing(false);
      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Unable to update profile.");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPaymentSaving(true);
    setPaymentMessage(null);
    setPaymentError(null);
    try {
      const expMonth = paymentForm.expMonth ? Number(paymentForm.expMonth) : undefined;
      const expYear = paymentForm.expYear ? Number(paymentForm.expYear) : undefined;
      await createPaymentMethod({
        label: paymentForm.label.trim(),
        brand: paymentForm.brand.trim() || undefined,
        last4: paymentForm.last4.trim() || undefined,
        expMonth,
        expYear,
        isDefault: paymentForm.isDefault,
      });
      const methods = await getPaymentMethods();
      setPaymentMethods(methods);
      setPaymentForm({
        label: "",
        brand: "",
        last4: "",
        expMonth: "",
        expYear: "",
        isDefault: false,
      });
      setIsAddingPayment(false);
      setPaymentMessage("Payment method saved.");
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Unable to save payment method.");
    } finally {
      setIsPaymentSaving(false);
    }
  };

  const handleSetDefaultPayment = async (id: string) => {
    setIsPaymentSaving(true);
    setPaymentMessage(null);
    setPaymentError(null);
    try {
      await updatePaymentMethod(id, { isDefault: true });
      const methods = await getPaymentMethods();
      setPaymentMethods(methods);
      setPaymentMessage("Default payment updated.");
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Unable to update payment method.");
    } finally {
      setIsPaymentSaving(false);
    }
  };

  const handleRemovePayment = async (id: string) => {
    setIsPaymentSaving(true);
    setPaymentMessage(null);
    setPaymentError(null);
    try {
      await deletePaymentMethod(id);
      const methods = await getPaymentMethods();
      setPaymentMethods(methods);
      setPaymentMessage("Payment method removed.");
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Unable to remove payment method.");
    } finally {
      setIsPaymentSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPasswordSaving(true);
    setPasswordMessage(null);
    setPasswordError(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      setIsPasswordSaving(false);
      return;
    }
    try {
      await changeAccountPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordMessage("Password updated successfully.");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Unable to change password.");
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeleteBusy(true);
    setDeleteMessage(null);
    setDeleteError(null);
    try {
      await deleteAccount({ password: deletePassword });
      await logout();
      navigate("/");
      setDeleteMessage("Account deleted.");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Unable to delete account.");
    } finally {
      setIsDeleteBusy(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "processing":
      case "ready_to_ship":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-4 h-4" />;
      case "shipped":
        return <Truck className="w-4 h-4" />;
      case "processing":
      case "ready_to_ship":
        return <Clock className="w-4 h-4" />;
      case "cancelled":
        return <Trash2 className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-border/60 shadow-sm">
          <CardHeader className="text-center">
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to access your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate("/login")} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-background border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                Back
              </Button>
              <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border border-border/60">
                <AvatarImage src="" />
                <AvatarFallback>
                  {currentUser.fullName?.split(" ").map((n) => n[0]).join("").toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">
                  {currentUser.fullName}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{currentUser.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center space-x-2 w-full sm:w-auto justify-center rounded-full"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="sticky top-16 z-10 w-full grid grid-cols-2 gap-2 rounded-2xl border border-border/60 bg-background/95 p-1 shadow-sm backdrop-blur sm:static sm:grid-cols-4 sm:gap-0 sm:rounded-full">
            <TabsTrigger
              value="profile"
              className="flex min-h-[52px] flex-col items-center justify-center gap-1.5 px-3 py-2 text-[11px] leading-tight sm:min-h-0 sm:flex-row sm:items-center sm:justify-center sm:space-x-2 sm:text-sm rounded-xl data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="flex min-h-[52px] flex-col items-center justify-center gap-1.5 px-3 py-2 text-[11px] leading-tight sm:min-h-0 sm:flex-row sm:items-center sm:justify-center sm:space-x-2 sm:text-sm rounded-xl data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <Package className="w-4 h-4" />
              <span>Orders</span>
            </TabsTrigger>
            <TabsTrigger
              value="payment"
              className="flex min-h-[52px] flex-col items-center justify-center gap-1.5 px-3 py-2 text-[11px] leading-tight sm:min-h-0 sm:flex-row sm:items-center sm:justify-center sm:space-x-2 sm:text-sm rounded-xl data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <CreditCard className="w-4 h-4" />
              <span>Payment</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex min-h-[52px] flex-col items-center justify-center gap-1.5 px-3 py-2 text-[11px] leading-tight sm:min-h-0 sm:flex-row sm:items-center sm:justify-center sm:space-x-2 sm:text-sm rounded-xl data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal information and contact details</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(!isEditing);
                      setProfileMessage(null);
                      setProfileError(null);
                    }}
                    className="flex items-center space-x-2 w-full sm:w-auto justify-center rounded-full"
                  >
                    <Edit className="w-4 h-4" />
                    <span>{isEditing ? "Cancel" : "Edit"}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileMessage && <p className="text-sm text-emerald-600">{profileMessage}</p>}
                {profileError && <p className="text-sm text-red-600">{profileError}</p>}
                {isEditing ? (
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={formData.email} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+254 700 000 000"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button type="submit" className="w-full sm:w-auto rounded-full" disabled={isProfileSaving}>
                        {isProfileSaving ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="w-full sm:w-auto rounded-full"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Full Name</p>
                          <p className="text-sm text-muted-foreground">{currentUser.fullName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Email</p>
                          <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Phone</p>
                          <p className="text-sm text-muted-foreground">
                            {currentUser.phone ? currentUser.phone : "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>View and track your recent orders</CardDescription>
              </CardHeader>
              <CardContent>
                {isOrdersLoading ? (
                  <div className="border rounded-lg p-6 text-center text-sm text-muted-foreground bg-muted/20">
                    Loading your orders...
                  </div>
                ) : orders.length === 0 ? (
                  <div className="border rounded-lg p-6 text-center text-sm text-muted-foreground bg-muted/20">
                    No orders to show yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const formattedTotal = formatProductPrice({
                        priceCents: order.totalCents,
                        currency: order.currency,
                      });
                      const dateLabel = new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                      return (
                        <div key={order.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                <Package className="w-6 h-6 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">Order {order.id.slice(0, 8).toUpperCase()}</p>
                                <p className="text-sm text-muted-foreground">
                                  {dateLabel} - {order.itemCount} items
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <Badge className={getStatusColor(order.status)}>
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(order.status)}
                                  <span>{order.status.replace(/_/g, " ")}</span>
                                </div>
                              </Badge>
                              <p className="font-semibold">{formattedTotal}</p>
                              <ChevronRight className="hidden sm:block w-5 h-5 text-muted-foreground" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>Manage your saved payment options</CardDescription>
                  </div>
                  <Button
                    className="flex items-center space-x-2 w-full sm:w-auto justify-center rounded-full"
                    onClick={() => setIsAddingPayment((prev) => !prev)}
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAddingPayment ? "Close" : "Add Payment Method"}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentMessage && <p className="text-sm text-emerald-600">{paymentMessage}</p>}
                {paymentError && <p className="text-sm text-red-600">{paymentError}</p>}
                {isAddingPayment && (
                  <form onSubmit={handleAddPaymentMethod} className="border rounded-lg p-4 bg-muted/20 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="paymentLabel">Label</Label>
                        <Input
                          id="paymentLabel"
                          value={paymentForm.label}
                          onChange={(e) => setPaymentForm({ ...paymentForm, label: e.target.value })}
                          placeholder="Personal Visa"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentBrand">Brand</Label>
                        <Input
                          id="paymentBrand"
                          value={paymentForm.brand}
                          onChange={(e) => setPaymentForm({ ...paymentForm, brand: e.target.value })}
                          placeholder="Visa"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentLast4">Last 4 digits</Label>
                        <Input
                          id="paymentLast4"
                          value={paymentForm.last4}
                          onChange={(e) => setPaymentForm({ ...paymentForm, last4: e.target.value })}
                          placeholder="1234"
                          maxLength={4}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="paymentExpMonth">Exp. Month</Label>
                          <Input
                            id="paymentExpMonth"
                            value={paymentForm.expMonth}
                            onChange={(e) => setPaymentForm({ ...paymentForm, expMonth: e.target.value })}
                            placeholder="MM"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paymentExpYear">Exp. Year</Label>
                          <Input
                            id="paymentExpYear"
                            value={paymentForm.expYear}
                            onChange={(e) => setPaymentForm({ ...paymentForm, expYear: e.target.value })}
                            placeholder="YYYY"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="paymentDefault"
                        checked={paymentForm.isDefault}
                        onCheckedChange={(checked) =>
                          setPaymentForm({ ...paymentForm, isDefault: checked === true })
                        }
                      />
                      <Label htmlFor="paymentDefault">Set as default</Label>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button type="submit" className="w-full sm:w-auto rounded-full" disabled={isPaymentSaving}>
                        {isPaymentSaving ? "Saving..." : "Save Payment Method"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddingPayment(false)}
                        className="w-full sm:w-auto rounded-full"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                {isPaymentsLoading ? (
                  <div className="border rounded-lg p-6 text-center text-sm text-muted-foreground bg-muted/20">
                    Loading payment methods...
                  </div>
                ) : paymentMethods.length === 0 ? (
                  <div className="border rounded-lg p-6 text-center text-sm text-muted-foreground bg-muted/20">
                    No payment methods saved yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="border rounded-lg p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                              <CreditCard className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium">{method.label}</p>
                                {method.isDefault && (
                                  <Badge className="bg-blue-100 text-blue-800">Default</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {method.brand
                                  ? `${method.brand} .... ${method.last4 || "----"}`
                                  : `.... ${method.last4 || "----"}`}
                              </p>
                              {(method.expMonth || method.expYear) && (
                                <p className="text-xs text-muted-foreground">
                                  Expires {method.expMonth ?? "--"}/{method.expYear ?? "----"}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {!method.isDefault && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full"
                                onClick={() => handleSetDefaultPayment(method.id)}
                                disabled={isPaymentSaving}
                              >
                                Set Default
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full"
                              onClick={() => handleRemovePayment(method.id)}
                              disabled={isPaymentSaving}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
                <CardDescription>Update your password or delete your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  {passwordMessage && <p className="text-sm text-emerald-600">{passwordMessage}</p>}
                  {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
                  <Button type="submit" variant="outline" className="rounded-full" disabled={isPasswordSaving}>
                    {isPasswordSaving ? "Updating..." : "Change Password"}
                  </Button>
                </form>

                <Separator />

                <form onSubmit={handleDeleteAccount} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="deletePassword">Confirm Password to Delete Account</Label>
                    <Input
                      id="deletePassword"
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      required
                    />
                  </div>
                  {deleteMessage && <p className="text-sm text-emerald-600">{deleteMessage}</p>}
                  {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                    <div>
                      <p className="font-medium text-red-900">Delete Account</p>
                      <p className="text-sm text-red-700">Permanently delete your account and all data</p>
                    </div>
                    <Button variant="destructive" size="sm" className="w-full sm:w-auto" disabled={isDeleteBusy}>
                      {isDeleteBusy ? "Deleting..." : "Delete Account"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Account;
