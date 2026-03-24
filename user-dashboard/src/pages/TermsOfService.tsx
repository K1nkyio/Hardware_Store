import { useEffect } from "react";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";

const TermsOfService = () => {
  useEffect(() => {
    document.title = "Terms of Service - Raph Supply";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-6">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <header className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-light text-foreground">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: March 23, 2026</p>
          </header>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-light text-foreground">Agreement to Terms</h2>
              <p className="leading-relaxed text-muted-foreground">
                By using the Raph Supply website, you agree to these Terms of Service. These terms govern your access to
                the site, your account, orders placed through the store, and any related support interactions.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-light text-foreground">Store Use</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                You agree to use the store only for lawful purposes. You may not misuse the site, interfere with its
                operation, or attempt unauthorized access to systems, accounts, or data.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-light text-foreground">Product Information and Availability</h2>
              <p className="leading-relaxed text-muted-foreground">
                We aim to keep product descriptions, prices, specifications, images, and stock information accurate.
                However, errors and supply changes may occur. We reserve the right to correct information, cancel affected
                orders, or limit quantities where necessary.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-light text-foreground">Orders and Payment</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-xl font-light text-foreground">Order acceptance</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    Orders are subject to review, availability, and payment verification. Confirmation of an order request
                    does not guarantee final acceptance if stock, pricing, or fraud checks fail.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-light text-foreground">Payment terms</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    Payment is due at the time of checkout unless otherwise agreed in writing. Accepted payment methods are
                    shown in the checkout flow. Prices and charges are displayed in the store currency in effect at time of purchase.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-light text-foreground">Shipping and Pickup</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Delivery windows are estimates only and may change due to stock availability, courier performance, weather,
                traffic, or operational constraints. Risk of loss may transfer in accordance with applicable law or when the
                order is received by the customer, authorized representative, or delivery point.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-light text-foreground">Returns and Warranty</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Return eligibility depends on the product type, condition, packaging, and applicable supplier terms.
                Manufacturer warranties, where available, remain subject to the issuing brand's terms and exclusions.
              </p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>Unused items may be reviewed for return eligibility within the applicable window</li>
                <li>Special-order, cut, custom, or opened consumable items may be non-returnable</li>
                <li>Installation damage, misuse, and wear are typically excluded from warranty support</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-light text-foreground">Intellectual Property</h2>
              <p className="leading-relaxed text-muted-foreground">
                Store content including branding, text, images, graphics, and software remains the property of Raph Supply
                or its licensors unless stated otherwise. Unauthorized copying or commercial reuse is prohibited.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-light text-foreground">Limitation of Liability</h2>
              <p className="leading-relaxed text-muted-foreground">
                To the maximum extent permitted by law, Raph Supply is not liable for indirect, incidental, or
                consequential losses arising from site use, delayed fulfillment, service interruptions, or product misuse.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-light text-foreground">Changes to These Terms</h2>
              <p className="leading-relaxed text-muted-foreground">
                We may revise these terms from time to time. Continued use of the site after updates means you accept the
                revised version.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-light text-foreground">Contact Information</h2>
              <div className="text-muted-foreground">
                <p>Email: hello@raphsupply.com</p>
                <p>Phone: +63 (2) 8555-0123</p>
                <p>Address: 123 Hardware Avenue, Metro Manila, Philippines</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
