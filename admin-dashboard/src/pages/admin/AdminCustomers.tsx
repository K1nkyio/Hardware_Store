import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Search, Eye, StickyNote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
  notes: string;
  orders: { id: string; total: number; date: string; status: string }[];
}

const customers: Customer[] = [];

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Processing: "bg-blue-100 text-blue-800",
  Shipped: "bg-purple-100 text-purple-800",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

const AdminCustomers = () => {
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const { toast } = useToast();

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddNote = () => {
    if (noteInput.trim()) {
      toast({ title: "Note added", description: `Note added to ${selectedCustomer?.name}'s profile.` });
      setNoteInput("");
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-light text-foreground sm:text-2xl">Customers</h1>
        <p className="text-sm text-muted-foreground font-light">{customers.length} customers total</p>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-none font-light" />
      </div>

      <Card className="border border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead className="font-light text-xs">Name</TableHead>
                <TableHead className="font-light text-xs hidden md:table-cell">Email</TableHead>
                <TableHead className="font-light text-xs hidden lg:table-cell">Phone</TableHead>
                <TableHead className="font-light text-xs">Orders</TableHead>
                <TableHead className="font-light text-xs">Total Spent</TableHead>
                <TableHead className="font-light text-xs hidden sm:table-cell">Last Order</TableHead>
                <TableHead className="font-light text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-sm font-light text-muted-foreground text-center py-10">
                    No customers yet.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="text-sm font-light">{customer.name}</TableCell>
                    <TableCell className="text-sm font-light text-muted-foreground hidden md:table-cell">{customer.email}</TableCell>
                    <TableCell className="text-sm font-light text-muted-foreground hidden lg:table-cell">{customer.phone}</TableCell>
                    <TableCell className="text-sm font-light">{customer.totalOrders}</TableCell>
                    <TableCell className="text-sm font-light">₱{customer.totalSpent.toLocaleString()}</TableCell>
                    <TableCell className="text-sm font-light text-muted-foreground hidden sm:table-cell">{customer.lastOrder}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setSelectedCustomer(customer); setNoteInput(""); }}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="!rounded-none max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-light text-xl">{selectedCustomer?.name}</DialogTitle>
            <DialogDescription className="font-light text-sm text-muted-foreground">
              View customer details, order history, and internal notes.
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 text-sm font-light sm:grid-cols-2">
                <div><p className="text-muted-foreground">Email</p><p>{selectedCustomer.email}</p></div>
                <div><p className="text-muted-foreground">Phone</p><p>{selectedCustomer.phone}</p></div>
                <div><p className="text-muted-foreground">Total Orders</p><p>{selectedCustomer.totalOrders}</p></div>
                <div><p className="text-muted-foreground">Total Spent</p><p>₱{selectedCustomer.totalSpent.toLocaleString()}</p></div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-light text-muted-foreground mb-2">Order History</p>
                {selectedCustomer.orders.map((order) => (
                  <div key={order.id} className="flex justify-between items-center text-sm font-light py-2 border-b border-border last:border-0">
                    <div>
                      <span className="text-foreground">{order.id}</span>
                      <span className="text-muted-foreground ml-2">{order.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>₱{order.total.toLocaleString()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status]}`}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-light text-muted-foreground mb-2 flex items-center gap-1">
                  <StickyNote className="h-3 w-3" /> Notes
                </p>
                {selectedCustomer.notes && (
                  <p className="text-sm font-light text-foreground bg-muted p-3 mb-3">{selectedCustomer.notes}</p>
                )}
                <div className="flex gap-2">
                  <Textarea value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder="Add a note..." className="rounded-none font-light min-h-16 resize-none" />
                </div>
                <Button size="sm" className="mt-2 rounded-none font-light bg-foreground text-background hover:bg-foreground/90" onClick={handleAddNote}>
                  Add Note
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomers;
