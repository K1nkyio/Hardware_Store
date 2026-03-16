const Footer = () => {
  return (
    <footer className="w-full bg-background text-foreground pt-8 pb-2 px-6 border-t border-border mt-48">
      <div className="">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-8">
          <div>
            <h2 className="text-xl font-medium tracking-widest uppercase mb-4">RAPH</h2>
            <p className="text-sm font-light text-muted-foreground leading-relaxed max-w-md mb-6">
              Quality hardware supplies for professionals and homeowners - electrical, safety, cleaning, paints,
              building materials & plumbing
            </p>

            <div className="space-y-2 text-sm font-light text-muted-foreground">
              <div>
                <p className="font-normal text-foreground mb-1">Visit Us</p>
                <p>123 Hardware Avenue</p>
                <p>Metro Manila, Philippines</p>
              </div>
              <div>
                <p className="font-normal text-foreground mb-1 mt-3">Contact</p>
                <p>+63 (2) 8555-0123</p>
                <p>hello@raphsupply.com</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-sm font-normal mb-4">Shop</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/category/electrical-lighting"
                    className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Electrical & Lighting
                  </a>
                </li>
                <li>
                  <a
                    href="/category/safety-equipment"
                    className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Safety Equipment
                  </a>
                </li>
                <li>
                  <a
                    href="/category/cleaning-home-maintenance"
                    className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cleaning & Home Maintenance
                  </a>
                </li>
                <li>
                  <a
                    href="/category/paints"
                    className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Paints
                  </a>
                </li>
                <li>
                  <a
                    href="/category/building-construction-materials"
                    className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Building & Construction Materials
                  </a>
                </li>
                <li>
                  <a
                    href="/category/plumbing"
                    className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Plumbing
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-normal mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/checkout"
                    className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Shipping
                  </a>
                </li>
                <li>
                  <a
                    href="/about/customer-care"
                    className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="/about/customer-care"
                    className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
                  >
                    FAQs
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-normal mb-4">Connect</h4>
              <ul className="space-y-2">
                <li>
                  <a href="https://www.facebook.com/Nklaus0/" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">
                    Facebook
                  </a>
                </li>
                <li>
                  <a href="https://www.instagram.com/nklaus0/" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">
                    Newsletter
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border -mx-6 px-6 pt-2">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm font-light text-foreground mb-1 md:mb-0">
            (c) 2025 Raph Supply. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <a href="/privacy-policy" className="text-sm font-light text-foreground hover:text-muted-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="/terms-of-service" className="text-sm font-light text-foreground hover:text-muted-foreground transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
