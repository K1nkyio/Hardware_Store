import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Warehouse,
  BarChart3,
  Settings,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Menu,
  Wrench,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { prefetchAdminRoute } from "@/lib/prefetch";
import { logoutAdmin } from "@/lib/api";

const navItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Products", href: "/admin/products", icon: Package },
  { title: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { title: "Customers", href: "/admin/customers", icon: Users },
  { title: "Inventory", href: "/admin/inventory", icon: Warehouse },
  { title: "Feedback", href: "/admin/feedback", icon: MessageSquare },
  { title: "Reports", href: "/admin/reports", icon: BarChart3 },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      navigate("/admin/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      // Still redirect to login even if logout fails
      navigate("/admin/login", { replace: true });
    }
  };

  const isActive = (href: string) => {
    if (href === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-card px-3 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none" aria-label="Open admin navigation">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
            <SheetContent side="left" className="w-[280px] rounded-none p-0">
              <SheetHeader className="border-b border-border px-4 py-4 text-left">
                <SheetTitle className="flex items-center gap-2 text-sm font-medium">
                  <Wrench className="h-4 w-4" />
                  Raph Admin
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Admin navigation menu.
                </SheetDescription>
              </SheetHeader>
            <nav className="space-y-1 p-3">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.title}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    onMouseEnter={() => prefetchAdminRoute(item.href)}
                    className={cn(
                      "flex items-center gap-3 rounded-none px-3 py-2.5 text-sm font-light transition-colors",
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
              <div className="border-t border-border mt-4 pt-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start rounded-none px-3 py-2.5 text-sm font-light text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Logout</span>
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
        <Link to="/admin" className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-foreground" />
          <span className="text-sm font-medium text-foreground">Raph Admin</span>
        </Link>
      </div>

      <aside
        className={cn(
          "sticky top-0 hidden h-screen border-r border-border bg-card transition-all duration-300 md:flex md:flex-col",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!collapsed ? (
            <Link to="/admin" className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-foreground" />
              <span className="text-sm font-medium text-foreground">Raph Admin</span>
            </Link>
          ) : (
            <Link to="/admin" className="mx-auto">
              <Wrench className="h-5 w-5 text-foreground" />
            </Link>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const linkContent = (
              <Link
                key={item.title}
                to={item.href}
                onMouseEnter={() => prefetchAdminRoute(item.href)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-light transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.title} delayDuration={0}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>

        <div className="border-t border-border p-2 space-y-2">
          {!collapsed && (
            <Button
              variant="ghost"
              className="w-full justify-start rounded-none px-3 py-2.5 text-sm font-light text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Logout</span>
            </Button>
          )}
          {collapsed && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-center rounded-none px-3 py-2.5 text-sm font-light text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center rounded-none"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
