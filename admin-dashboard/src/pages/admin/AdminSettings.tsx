import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, Shield, Store, Trash2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  SettingsPaymentMethod,
  StorefrontSettings,
  getStorefrontSettings,
  updateStorefrontSettings,
} from "@/lib/settings";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: "Admin" | "Super Admin";
  addedDate: string;
}

const adminUsers: AdminUser[] = [];

const DEFAULT_PAYMENT_METHODS: SettingsPaymentMethod[] = [
  { id: "card", label: "Credit / Debit Card", enabled: true },
  { id: "mpesa", label: "M-Pesa", enabled: true },
  { id: "cod", label: "Cash on Delivery", enabled: true },
];

const AdminSettings = () => {
  const [tab, setTab] = useState<"users" | "store" | "payment">("users");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [settingsUpdatedAt, setSettingsUpdatedAt] = useState("");
  const [storeForm, setStoreForm] = useState({
    storeName: "",
    phone: "",
    email: "",
    address: "",
    standardHomeDeliveryCents: "450",
    expressDeliveryCents: "1100",
  });
  const [paymentMethods, setPaymentMethods] = useState<SettingsPaymentMethod[]>(
    DEFAULT_PAYMENT_METHODS
  );
  const [taxForm, setTaxForm] = useState({
    taxRatePercent: "16",
    tin: "",
  });
  const { toast } = useToast();

  const settingsTimestamp = useMemo(() => {
    if (!settingsUpdatedAt) return "";
    const parsed = new Date(settingsUpdatedAt);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleString();
  }, [settingsUpdatedAt]);

  const applySettings = (settings: StorefrontSettings) => {
    setStoreForm({
      storeName: settings.store.storeName,
      phone: settings.store.phone,
      email: settings.store.email,
      address: settings.store.address,
      standardHomeDeliveryCents: String(settings.shippingRates.standardHomeDeliveryCents),
      expressDeliveryCents: String(settings.shippingRates.expressDeliveryCents),
    });
    setPaymentMethods(settings.payment.methods.filter((method) => method.id !== "bank_transfer"));
    setTaxForm({
      taxRatePercent: String(settings.tax.taxRatePercent),
      tin: settings.tax.tin,
    });
    setSettingsUpdatedAt(settings.updatedAt);
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await getStorefrontSettings();
        if (!active) return;
        applySettings(response);
      } catch (err) {
        if (!active) return;
        toast({
          title: "Unable to load settings",
          description: err instanceof Error ? err.message : "Try again.",
          variant: "destructive",
        });
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [toast]);

  const handleInvite = () => {
    toast({
      title: "Invitation sent",
      description: "Admin invitation email has been sent.",
    });
    setIsInviteOpen(false);
  };

  const handleStoreChange = (field: keyof typeof storeForm, value: string) => {
    setStoreForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTaxChange = (field: keyof typeof taxForm, value: string) => {
    setTaxForm((prev) => ({ ...prev, [field]: value }));
  };

  const togglePaymentMethod = (id: string, enabled: boolean) => {
    setPaymentMethods((prev) =>
      prev.map((method) => (method.id === id ? { ...method, enabled } : method))
    );
  };

  const handleSaveStore = async () => {
    const standardHomeDeliveryCents = Number(storeForm.standardHomeDeliveryCents);
    const expressDeliveryCents = Number(storeForm.expressDeliveryCents);
    const numericRates = [standardHomeDeliveryCents, expressDeliveryCents];

    if (numericRates.some((value) => !Number.isFinite(value) || value < 0)) {
      toast({
        title: "Invalid shipping rates",
        description: "Shipping rates must be zero or greater.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingStore(true);
    try {
      const saved = await updateStorefrontSettings({
        store: {
          storeName: storeForm.storeName.trim(),
          phone: storeForm.phone.trim(),
          email: storeForm.email.trim(),
          address: storeForm.address.trim(),
        },
        shippingRates: {
          standardHomeDeliveryCents: Math.round(standardHomeDeliveryCents),
          expressDeliveryCents: Math.round(expressDeliveryCents),
        },
      });
      applySettings(saved);
      toast({ title: "Store settings saved" });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Unable to save settings.",
        variant: "destructive",
      });
    } finally {
      setIsSavingStore(false);
    }
  };

  const handleSavePaymentTax = async () => {
    const taxRatePercent = Number(taxForm.taxRatePercent);
    if (!Number.isFinite(taxRatePercent) || taxRatePercent < 0 || taxRatePercent > 100) {
      toast({
        title: "Invalid tax rate",
        description: "Tax rate must be between 0 and 100.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethods.length === 0) {
      toast({
        title: "No payment methods",
        description: "Add at least one payment method.",
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethods.some((method) => method.enabled)) {
      toast({
        title: "Enable a payment method",
        description: "At least one payment method must be enabled for checkout.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingPayment(true);
    try {
      const saved = await updateStorefrontSettings({
        payment: { methods: paymentMethods },
        tax: {
          taxRatePercent,
          tin: taxForm.tin.trim(),
        },
      });
      applySettings(saved);
      toast({ title: "Payment and tax settings saved" });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Unable to save settings.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPayment(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="space-y-1">
        <h1 className="text-xl font-light text-foreground sm:text-2xl">Settings</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground font-light">
          <Badge variant="outline" className="font-light text-xs rounded-none">
            Super Admin Only
          </Badge>
          <span>Manage users, store, and payment settings</span>
          {settingsTimestamp && <span>Last updated: {settingsTimestamp}</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={tab === "users" ? "default" : "outline"}
          size="sm"
          className="rounded-none font-light text-xs"
          onClick={() => setTab("users")}
        >
          <Shield className="h-3 w-3 mr-1" /> Users & Roles
        </Button>
        <Button
          variant={tab === "store" ? "default" : "outline"}
          size="sm"
          className="rounded-none font-light text-xs"
          onClick={() => setTab("store")}
        >
          <Store className="h-3 w-3 mr-1" /> Store Settings
        </Button>
        <Button
          variant={tab === "payment" ? "default" : "outline"}
          size="sm"
          className="rounded-none font-light text-xs"
          onClick={() => setTab("payment")}
        >
          <CreditCard className="h-3 w-3 mr-1" /> Payment & Tax
        </Button>
      </div>

      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="rounded-none font-light text-xs bg-foreground text-background hover:bg-foreground/90"
                >
                  <UserPlus className="h-3 w-3 mr-1" /> Invite Admin
                </Button>
              </DialogTrigger>
              <DialogContent className="!rounded-none">
                <DialogHeader>
                  <DialogTitle className="font-light text-xl">Invite Admin</DialogTitle>
                  <DialogDescription className="font-light text-sm text-muted-foreground">
                    Send an invitation and assign the admin role.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-light">Email</Label>
                    <Input
                      placeholder="admin@raphplumbing.com"
                      className="rounded-none font-light"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-light">Role</Label>
                    <Select defaultValue="Admin">
                      <SelectTrigger className="rounded-none font-light">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Super Admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    className="rounded-none font-light"
                    onClick={() => setIsInviteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="rounded-none font-light bg-foreground text-background hover:bg-foreground/90"
                    onClick={handleInvite}
                  >
                    Send Invitation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-light text-xs">Name</TableHead>
                      <TableHead className="font-light text-xs">Email</TableHead>
                      <TableHead className="font-light text-xs">Role</TableHead>
                      <TableHead className="font-light text-xs hidden sm:table-cell">
                        Added
                      </TableHead>
                      <TableHead className="font-light text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-sm font-light text-muted-foreground text-center py-10"
                        >
                          No admin users yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      adminUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="text-sm font-light">{user.name}</TableCell>
                          <TableCell className="text-sm font-light text-muted-foreground">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-light ${
                                user.role === "Super Admin"
                                  ? "bg-foreground text-background"
                                  : "bg-muted text-foreground"
                              }`}
                            >
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm font-light text-muted-foreground hidden sm:table-cell">
                            {user.addedDate}
                          </TableCell>
                          <TableCell className="text-right">
                            {user.role !== "Super Admin" && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="!rounded-none">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="font-light">
                                      Remove Admin
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="font-light">
                                      Are you sure you want to remove {user.name}&apos;s admin access?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-none font-light">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction className="rounded-none font-light bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "store" && (
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-base font-light">Store Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading store settings...</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-light">Store Name</Label>
                    <Input
                      value={storeForm.storeName}
                      onChange={(event) => handleStoreChange("storeName", event.target.value)}
                      className="rounded-none font-light"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-light">Phone</Label>
                    <Input
                      value={storeForm.phone}
                      onChange={(event) => handleStoreChange("phone", event.target.value)}
                      className="rounded-none font-light"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-light">Email</Label>
                    <Input
                      value={storeForm.email}
                      onChange={(event) => handleStoreChange("email", event.target.value)}
                      className="rounded-none font-light"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-light">Address</Label>
                    <Input
                      value={storeForm.address}
                      onChange={(event) => handleStoreChange("address", event.target.value)}
                      className="rounded-none font-light"
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-light mb-3">Shipping Rates (Cents)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-light text-xs">Standard Home Delivery</Label>
                      <Input
                        value={storeForm.standardHomeDeliveryCents}
                        onChange={(event) =>
                          handleStoreChange("standardHomeDeliveryCents", event.target.value)
                        }
                        className="rounded-none font-light"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-light text-xs">Express Delivery</Label>
                      <Input
                        value={storeForm.expressDeliveryCents}
                        onChange={(event) =>
                          handleStoreChange("expressDeliveryCents", event.target.value)
                        }
                        className="rounded-none font-light"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  className="rounded-none font-light bg-foreground text-background hover:bg-foreground/90"
                  onClick={handleSaveStore}
                  disabled={isSavingStore}
                >
                  {isSavingStore ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "payment" && (
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-base font-light">Payment & Tax Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading payment settings...</p>
            ) : (
              <>
                <div className="space-y-4">
                  <h3 className="text-sm font-light">Payment Methods</h3>
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className="flex items-center justify-between p-3 border border-border"
                      >
                        <span className="text-sm font-light">{method.label}</span>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className={`font-light text-xs rounded-none ${
                              method.enabled
                                ? "text-green-600 border-green-200"
                                : "text-muted-foreground"
                            }`}
                          >
                            {method.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                          <Checkbox
                            checked={method.enabled}
                            onCheckedChange={(checked) =>
                              togglePaymentMethod(method.id, checked === true)
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-border space-y-4">
                  <h3 className="text-sm font-light">Tax Settings</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-light">VAT Rate (%)</Label>
                      <Input
                        value={taxForm.taxRatePercent}
                        onChange={(event) =>
                          handleTaxChange("taxRatePercent", event.target.value)
                        }
                        className="rounded-none font-light"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-light">TIN</Label>
                      <Input
                        value={taxForm.tin}
                        onChange={(event) => handleTaxChange("tin", event.target.value)}
                        className="rounded-none font-light"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  className="rounded-none font-light bg-foreground text-background hover:bg-foreground/90"
                  onClick={handleSavePaymentTax}
                  disabled={isSavingPayment}
                >
                  {isSavingPayment ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminSettings;
