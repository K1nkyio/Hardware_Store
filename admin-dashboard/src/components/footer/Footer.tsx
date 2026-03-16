const Footer = () => {
  return (
    <footer className="w-full bg-background text-foreground pt-8 pb-2 px-6 border-t border-border mt-48">
      <div className="">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-8">
          {/* Brand - Left side */}
          <div>
            <h2 className="text-lg font-medium text-foreground mb-2">Raph Plumbing Supply</h2>
            <p className="text-sm font-light text-muted-foreground leading-relaxed max-w-md mb-6">
              Your trusted source for quality plumbing supplies and fixtures since 2010.
            </p>
            
            {/* Contact Information */}
            <div className="space-y-2 text-sm font-light text-muted-foreground">
              <div>
                <p className="font-normal text-foreground mb-1">Visit Us</p>
                <p>456 Commerce Avenue</p>
                <p>Makati City, Metro Manila</p>
              </div>
              <div>
                <p className="font-normal text-foreground mb-1 mt-3">Contact</p>
                <p>+63 2 8123 4567</p>
                <p>info@raphplumbing.com</p>
              </div>
            </div>
          </div>

          {/* Link lists - Right side */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Shop */}
            <div>
              <h4 className="text-sm font-normal mb-4">Categories</h4>
              <ul className="space-y-2">
                <li><a href="/category/pipes" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Pipes & Fittings</a></li>
                <li><a href="/category/faucets" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Faucets & Taps</a></li>
                <li><a href="/category/sinks" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Sinks</a></li>
                <li><a href="/category/valves" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Valves</a></li>
                <li><a href="/category/bathroom" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Bathroom Fixtures</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-sm font-normal mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="/about/customer-care" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Customer Care</a></li>
                <li><a href="#" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Shipping Info</a></li>
                <li><a href="#" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Returns</a></li>
                <li><a href="#" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Bulk Orders</a></li>
                <li><a href="/about/store-locator" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Store Locator</a></li>
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h4 className="text-sm font-normal mb-4">Connect</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Facebook</a></li>
                <li><a href="#" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Instagram</a></li>
                <li><a href="#" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Viber</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="border-t border-border -mx-6 px-6 pt-2">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm font-light text-muted-foreground mb-1 md:mb-0">
            © 2026 Raph Plumbing Supply. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <a href="/privacy-policy" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="/terms-of-service" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
