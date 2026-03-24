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
    accountType: "customer",
    companyName: "",
    companyRole: "",
    taxId: "",
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
        accountType: currentUser.accountType || "customer",
        companyName: currentUser.companyName || "",
        companyRole: currentUser.companyRole || "",
        taxId: currentUser.taxId || "",
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
        accountType: formData.accountType as "customer" | "contractor" | "company",
        companyName: formData.companyName.trim() || undefined,
        companyRole: formData.companyRole.trim() || undefined,
        taxId: formData.taxId.trim() || undefined,
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

  const toTitleCase = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

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

  const initials =
    currentUser.fullName
      ?.split(" ")
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const profileHighlights = [
    {
      label: "Email",
      value: currentUser.email,
      hint: "Used for sign in and order updates",
      icon: Mail,
    },
    {
      label: "Phone",
      value: currentUser.phone || "Add a phone number",
      hint: "Helpful for delivery coordination",
      icon: Phone,
    },
    {
      label: "Username",
      value: `@${currentUser.username}`,
      hint: "Public account handle",
      icon: User,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/20 via-background to-background">
      <div className="border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="w-full rounded-full sm:w-auto">
                Back
              </Button>
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-3 py-3 shadow-sm sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
                <Avatar className="h-11 w-11 border border-border/60">
                  <AvatarImage src="" />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h1 className="text-base font-semibold text-foreground truncate sm:text-lg">{currentUser.fullName}</h1>
                  <p className="text-xs text-muted-foreground truncate sm:text-sm">{currentUser.email}</p>
                </div>
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
          <TabsList className="sticky top-16 z-10 flex h-auto w-full items-stretch gap-2 overflow-x-auto rounded-2xl border border-border/60 bg-background/95 p-1 shadow-sm backdrop-blur sm:static sm:grid sm:grid-cols-4 sm:gap-0 sm:overflow-visible sm:rounded-full">
            <TabsTrigger
              value="profile"
              className="flex min-h-[52px] min-w-[96px] flex-1 flex-col items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] leading-tight data-[state=active]:bg-foreground data-[state=active]:text-background sm:min-h-0 sm:min-w-0 sm:flex-row sm:items-center sm:justify-center sm:space-x-2 sm:text-sm"
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="flex min-h-[52px] min-w-[96px] flex-1 flex-col items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] leading-tight data-[state=active]:bg-foreground data-[state=active]:text-background sm:min-h-0 sm:min-w-0 sm:flex-row sm:items-center sm:justify-center sm:space-x-2 sm:text-sm"
            >
              <Package className="w-4 h-4" />
              <span>Orders</span>
            </TabsTrigger>
            <TabsTrigger
              value="payment"
              className="flex min-h-[52px] min-w-[96px] flex-1 flex-col items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] leading-tight data-[state=active]:bg-foreground data-[state=active]:text-background sm:min-h-0 sm:min-w-0 sm:flex-row sm:items-center sm:justify-center sm:space-x-2 sm:text-sm"
            >
              <CreditCard className="w-4 h-4" />
              <span>Payment</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex min-h-[52px] min-w-[96px] flex-1 flex-col items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] leading-tight data-[state=active]:bg-foreground data-[state=active]:text-background sm:min-h-0 sm:min-w-0 sm:flex-row sm:items-center sm:justify-center sm:space-x-2 sm:text-sm"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>Update your personal information and contact details</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(!isEditing);
                        setProfileMessage(null);
                        setProfileError(null);
                        if (isEditing) {
                          setFormData({
                            fullName: currentUser.fullName || "",
                            email: currentUser.email || "",
                            phone: currentUser.phone || "",
                            accountType: currentUser.accountType || "customer",
                            companyName: currentUser.companyName || "",
                            companyRole: currentUser.companyRole || "",
                            taxId: currentUser.taxId || "",
                          });
                        }
                      }}
                      className="flex w-full items-center justify-center space-x-2 rounded-full sm:w-auto"
                    >
                      <Edit className="w-4 h-4" />
                      <span>{isEditing ? "Cancel" : "Edit"}</span>
                    </Button>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 sm:hidden">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-14 w-14 border border-border/60">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-base">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-foreground">{currentUser.fullName}</p>
                        <p className="truncate text-sm text-muted-foreground">@{currentUser.username}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="secondary">{toTitleCase(currentUser.role)}</Badge>
                      <Badge
                        variant="outline"
                        className={currentUser.isActive ? "border-emerald-200 text-emerald-700" : "border-red-200 text-red-700"}
                      >
                        {currentUser.isActive ? "Active account" : "Inactive account"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profileMessage && <p className="text-sm text-emerald-600">{profileMessage}</p>}
                  {profileError && <p className="text-sm text-red-600">{profileError}</p>}
                  {isEditing ? (
                    <form onSubmit={handleProfileUpdate} className="space-y-5">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+254 700 000 000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accountType">Account Type</Label>
                          <select
                            id="accountType"
                            value={formData.accountType}
                            onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                            className="h-10 w-full border border-input bg-background px-3 text-sm"
                          >
                            <option value="customer">Customer</option>
                            <option value="contractor">Contractor</option>
                            <option value="company">Company</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="companyName">Company Name</Label>
                          <Input
                            id="companyName"
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            placeholder="Optional"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="companyRole">Role / Department</Label>
                          <Input
                            id="companyRole"
                            value={formData.companyRole}
                            onChange={(e) => setFormData({ ...formData, companyRole: e.target.value })}
                            placeholder="Procurement, Site manager, etc."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="taxId">Tax ID</Label>
                          <Input
                            id="taxId"
                            value={formData.taxId}
                            onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button type="submit" className="w-full rounded-full sm:w-auto" disabled={isProfileSaving}>
                          {isProfileSaving ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setFormData({
                              fullName: currentUser.fullName || "",
                              email: currentUser.email || "",
                              phone: currentUser.phone || "",
                              accountType: currentUser.accountType || "customer",
                              companyName: currentUser.companyName || "",
                              companyRole: currentUser.companyRole || "",
                              taxId: currentUser.taxId || "",
                            });
                          }}
                          className="w-full rounded-full sm:w-auto"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-border/60 bg-background p-4">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <User className="h-5 w-5" />
                          </div>
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                            Full Name
                          </p>
                          <p className="mt-2 text-base font-semibold text-foreground">{currentUser.fullName}</p>
                          <p className="mt-1 text-sm text-muted-foreground">This is how your account appears across orders.</p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-background p-4">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Mail className="h-5 w-5" />
                          </div>
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Email</p>
                          <p className="mt-2 break-all text-base font-semibold text-foreground">{currentUser.email}</p>
                          <p className="mt-1 text-sm text-muted-foreground">Used for sign in, receipts, and delivery updates.</p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-background p-4">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Phone className="h-5 w-5" />
                          </div>
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Phone</p>
                          <p className="mt-2 text-base font-semibold text-foreground">
                            {currentUser.phone ? currentUser.phone : "Not provided"}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">Add one to make delivery coordination easier.</p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-background p-4">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Settings className="h-5 w-5" />
                          </div>
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Account Status</p>
                          <p className="mt-2 text-base font-semibold text-foreground">
                            {currentUser.isActive ? "Ready to shop" : "Needs attention"}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="secondary">{toTitleCase(currentUser.role)}</Badge>
                            <Badge
                              variant="outline"
                              className={currentUser.isActive ? "border-emerald-200 text-emerald-700" : "border-red-200 text-red-700"}
                            >
                              {currentUser.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-background p-4">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Package className="h-5 w-5" />
                          </div>
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Account Type</p>
                          <p className="mt-2 text-base font-semibold text-foreground">{currentUser.accountType || "customer"}</p>
                          <p className="mt-1 text-sm text-muted-foreground">Used for trade pricing, quote rules, and company workflows.</p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-background p-4">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Truck className="h-5 w-5" />
                          </div>
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Company / Trade Role</p>
                          <p className="mt-2 text-base font-semibold text-foreground">{currentUser.companyName || "Not provided"}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{currentUser.companyRole || "Add your team role to streamline trade support."}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="hidden border-border/60 bg-muted/20 shadow-sm xl:block">
                <CardHeader className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border border-border/60">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <CardTitle className="truncate text-xl">{currentUser.fullName}</CardTitle>
                      <CardDescription className="truncate">@{currentUser.username}</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{toTitleCase(currentUser.role)}</Badge>
                    <Badge
                      variant="outline"
                      className={currentUser.isActive ? "border-emerald-200 text-emerald-700" : "border-red-200 text-red-700"}
                    >
                      {currentUser.isActive ? "Active account" : "Inactive account"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profileHighlights.map(({ label, value, hint, icon: Icon }) => (
                    <div key={label} className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{label}</p>
                          <p className="break-words text-sm text-muted-foreground">{value}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
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
